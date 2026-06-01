const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { protect, authorize } = require('../middleware/auth');
const { Question, Assessment } = require('../models');
const logger = require('../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
    else cb(new Error('Only CSV files allowed'), false);
  },
});

router.use(protect, authorize('admin', 'superadmin'));

router.post('/questions-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required.' });
    const { assessmentId } = req.body;
    if (!assessmentId) return res.status(400).json({ success: false, message: 'assessmentId required.' });

    const results = [];
    const stream = Readable.from(req.file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream.pipe(csv())
        .on('data', (row) => {
          // Expected CSV columns: text,type,difficulty,section,topic,marks,optionA,optionB,optionC,optionD,correct
          const options = [
            { id: 'A', text: row.optionA || '', isCorrect: row.correct?.includes('A') || false },
            { id: 'B', text: row.optionB || '', isCorrect: row.correct?.includes('B') || false },
            { id: 'C', text: row.optionC || '', isCorrect: row.correct?.includes('C') || false },
            { id: 'D', text: row.optionD || '', isCorrect: row.correct?.includes('D') || false },
          ].filter(o => o.text);

          if (row.text && options.length >= 2) {
            results.push({
              assessmentId,
              text: row.text,
              type: row.type || 'single',
              difficulty: row.difficulty || 'medium',
              section: row.section || 'General',
              topic: row.topic || '',
              marks: parseFloat(row.marks) || 1,
              options,
              isActive: true,
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) return res.status(400).json({ success: false, message: 'No valid questions found in CSV.' });

    const inserted = await Question.insertMany(results, { ordered: false });
    await Assessment.findByIdAndUpdate(assessmentId, { $set: { 'config.totalQuestions': inserted.length } });

    logger.info(`CSV upload: ${inserted.length} questions inserted for assessment ${assessmentId}`);
    res.json({ success: true, data: { inserted: inserted.length, total: results.length } });
  } catch (error) {
    logger.error('CSV upload error:', error);
    res.status(500).json({ success: false, message: 'CSV upload failed.' });
  }
});

module.exports = router;
