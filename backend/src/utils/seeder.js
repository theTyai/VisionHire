/**
 * VisionHire Database Seeder
 * Run: node src/utils/seeder.js
 * Creates: 1 admin, 5 candidates, 1 assessment, 20 questions
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Assessment, Question } = require('../models');
const logger = require('./logger');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding...');

    // ── Cleanup existing seed data ─────────────────────────
    await User.deleteMany({ email: /@visionhire\.demo$/ });
    logger.info('Cleaned up old seed data.');

    // ── Admin ─────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@visionhire.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
    });
    logger.info(`✅ Admin created: ${admin.email}`);

    // ── Candidates ────────────────────────────────────────
    const candidateData = [
      { name: 'Alice Johnson', email: 'alice@visionhire.demo' },
      { name: 'Bob Smith',     email: 'bob@visionhire.demo' },
      { name: 'Carol White',   email: 'carol@visionhire.demo' },
      { name: 'Dave Brown',    email: 'dave@visionhire.demo' },
      { name: 'Eve Davis',     email: 'eve@visionhire.demo' },
    ];

    const candidates = await User.insertMany(
      candidateData.map(c => ({ ...c, password: 'password123', role: 'candidate', isActive: true }))
    );
    logger.info(`✅ ${candidates.length} candidates created`);

    // ── Assessment ────────────────────────────────────────
    const assessment = await Assessment.create({
      title: 'Full Stack Developer — MCQ Round',
      description: 'Assess your knowledge of web development fundamentals including JavaScript, React, Node.js, and databases.',
      slug: 'fullstack-dev-mcq-' + Date.now(),
      createdBy: admin._id,
      category: 'Engineering',
      status: 'published',
      config: {
        totalQuestions: 20,
        duration: 45,
        passingScore: 60,
        maxAttempts: 1,
        shuffleQuestions: true,
        shuffleOptions: true,
        negativeMarking: true,
        negativeMarkValue: 0.25,
        tabSwitchLimit: 3,
        fullScreenRequired: true,
      },
      sections: [
        { name: 'JavaScript', description: 'Core JS concepts', questionCount: 8, order: 1 },
        { name: 'React',      description: 'React fundamentals', questionCount: 6, order: 2 },
        { name: 'Node.js',    description: 'Backend basics', questionCount: 6, order: 3 },
      ],
    });
    logger.info(`✅ Assessment created: ${assessment.title}`);

    // ── Questions ─────────────────────────────────────────
    const questions = [
      // JavaScript
      { text: 'What is the output of `typeof null` in JavaScript?', type: 'single', difficulty: 'easy', section: 'JavaScript', topic: 'Data Types', marks: 1, options: [{ id: 'A', text: '"null"', isCorrect: false }, { id: 'B', text: '"object"', isCorrect: true }, { id: 'C', text: '"undefined"', isCorrect: false }, { id: 'D', text: '"string"', isCorrect: false }], explanation: 'typeof null returns "object" — a known JavaScript quirk.' },
      { text: 'Which of the following is NOT a JavaScript primitive type?', type: 'single', difficulty: 'easy', section: 'JavaScript', topic: 'Data Types', marks: 1, options: [{ id: 'A', text: 'Symbol', isCorrect: false }, { id: 'B', text: 'Array', isCorrect: true }, { id: 'C', text: 'BigInt', isCorrect: false }, { id: 'D', text: 'Boolean', isCorrect: false }] },
      { text: 'What does the `===` operator check in JavaScript?', type: 'single', difficulty: 'easy', section: 'JavaScript', topic: 'Operators', marks: 1, options: [{ id: 'A', text: 'Value only', isCorrect: false }, { id: 'B', text: 'Type only', isCorrect: false }, { id: 'C', text: 'Value and type', isCorrect: true }, { id: 'D', text: 'Reference', isCorrect: false }] },
      { text: 'Which of the following creates a closure in JavaScript?', type: 'single', difficulty: 'medium', section: 'JavaScript', topic: 'Closures', marks: 1, options: [{ id: 'A', text: 'A function defined inside another function', isCorrect: true }, { id: 'B', text: 'A class definition', isCorrect: false }, { id: 'C', text: 'An arrow function at module level', isCorrect: false }, { id: 'D', text: 'An IIFE without inner functions', isCorrect: false }] },
      { text: 'What is event bubbling in JavaScript?', type: 'single', difficulty: 'medium', section: 'JavaScript', topic: 'Events', marks: 1, options: [{ id: 'A', text: 'Events propagate from child to parent elements', isCorrect: true }, { id: 'B', text: 'Events propagate from parent to child', isCorrect: false }, { id: 'C', text: 'Events fire only on the target element', isCorrect: false }, { id: 'D', text: 'None of the above', isCorrect: false }] },
      { text: 'Which methods can be used to flatten a nested array? (Select all that apply)', type: 'multiple', difficulty: 'medium', section: 'JavaScript', topic: 'Arrays', marks: 2, options: [{ id: 'A', text: 'Array.flat()', isCorrect: true }, { id: 'B', text: 'Array.flatMap()', isCorrect: true }, { id: 'C', text: 'Array.reduce() with concat', isCorrect: true }, { id: 'D', text: 'Array.filter()', isCorrect: false }] },
      { text: 'What is the purpose of `Promise.all()`?', type: 'single', difficulty: 'medium', section: 'JavaScript', topic: 'Async', marks: 1, options: [{ id: 'A', text: 'Runs promises sequentially', isCorrect: false }, { id: 'B', text: 'Resolves when ALL promises resolve, rejects if any fail', isCorrect: true }, { id: 'C', text: 'Resolves with the first promise that settles', isCorrect: false }, { id: 'D', text: 'Ignores rejected promises', isCorrect: false }] },
      { text: 'What is the difference between `var`, `let`, and `const`?', type: 'single', difficulty: 'hard', section: 'JavaScript', topic: 'Scoping', marks: 1.5, options: [{ id: 'A', text: 'var is function-scoped; let and const are block-scoped', isCorrect: true }, { id: 'B', text: 'All three are block-scoped', isCorrect: false }, { id: 'C', text: 'const cannot be reassigned; let and var can', isCorrect: false }, { id: 'D', text: 'A and C are both correct', isCorrect: false }] },

      // React
      { text: 'What hook is used to run side effects in functional React components?', type: 'single', difficulty: 'easy', section: 'React', topic: 'Hooks', marks: 1, options: [{ id: 'A', text: 'useState', isCorrect: false }, { id: 'B', text: 'useEffect', isCorrect: true }, { id: 'C', text: 'useMemo', isCorrect: false }, { id: 'D', text: 'useRef', isCorrect: false }] },
      { text: 'What is the virtual DOM in React?', type: 'single', difficulty: 'easy', section: 'React', topic: 'Core Concepts', marks: 1, options: [{ id: 'A', text: 'A direct copy of the browser DOM', isCorrect: false }, { id: 'B', text: 'A JavaScript representation of the real DOM used for diffing', isCorrect: true }, { id: 'C', text: 'A server-side DOM renderer', isCorrect: false }, { id: 'D', text: 'A shadow DOM API', isCorrect: false }] },
      { text: 'Which of the following correctly describes React keys?', type: 'single', difficulty: 'medium', section: 'React', topic: 'Lists', marks: 1, options: [{ id: 'A', text: 'Keys help React identify which items changed in lists', isCorrect: true }, { id: 'B', text: 'Keys must be globally unique across the app', isCorrect: false }, { id: 'C', text: 'Index as key is always safe', isCorrect: false }, { id: 'D', text: 'Keys are passed as props to child components', isCorrect: false }] },
      { text: 'What does Redux Toolkit\'s `createSlice` do?', type: 'single', difficulty: 'medium', section: 'React', topic: 'State Management', marks: 1, options: [{ id: 'A', text: 'Creates reducers and action creators automatically', isCorrect: true }, { id: 'B', text: 'Only creates action types', isCorrect: false }, { id: 'C', text: 'Connects React components to the Redux store', isCorrect: false }, { id: 'D', text: 'Handles async thunks only', isCorrect: false }] },
      { text: 'In which lifecycle phase does useEffect with an empty dependency array run?', type: 'single', difficulty: 'medium', section: 'React', topic: 'Hooks', marks: 1, options: [{ id: 'A', text: 'After every render', isCorrect: false }, { id: 'B', text: 'Before first render', isCorrect: false }, { id: 'C', text: 'Once after the initial render (componentDidMount equivalent)', isCorrect: true }, { id: 'D', text: 'Before component unmounts', isCorrect: false }] },
      { text: 'Which performance optimization hooks does React provide? (Select all that apply)', type: 'multiple', difficulty: 'hard', section: 'React', topic: 'Performance', marks: 2, options: [{ id: 'A', text: 'useMemo', isCorrect: true }, { id: 'B', text: 'useCallback', isCorrect: true }, { id: 'C', text: 'React.memo', isCorrect: true }, { id: 'D', text: 'useOptimize', isCorrect: false }] },

      // Node.js
      { text: 'What is the event loop in Node.js?', type: 'single', difficulty: 'easy', section: 'Node.js', topic: 'Architecture', marks: 1, options: [{ id: 'A', text: 'A loop that processes events and callbacks asynchronously', isCorrect: true }, { id: 'B', text: 'A thread pool for CPU tasks', isCorrect: false }, { id: 'C', text: 'A middleware queue in Express', isCorrect: false }, { id: 'D', text: 'A database connection pool', isCorrect: false }] },
      { text: 'Which of the following is correct about `require()` vs `import` in Node.js?', type: 'single', difficulty: 'medium', section: 'Node.js', topic: 'Modules', marks: 1, options: [{ id: 'A', text: 'require() is synchronous; import is asynchronous', isCorrect: true }, { id: 'B', text: 'import can be called conditionally without async/dynamic syntax', isCorrect: false }, { id: 'C', text: 'Both are identical in behavior', isCorrect: false }, { id: 'D', text: 'require() only works in browsers', isCorrect: false }] },
      { text: 'What is middleware in Express.js?', type: 'single', difficulty: 'easy', section: 'Node.js', topic: 'Express', marks: 1, options: [{ id: 'A', text: 'A function with access to req, res, and next', isCorrect: true }, { id: 'B', text: 'A database connector', isCorrect: false }, { id: 'C', text: 'A templating engine', isCorrect: false }, { id: 'D', text: 'A WebSocket handler', isCorrect: false }] },
      { text: 'Which HTTP status codes indicate a successful request? (Select all that apply)', type: 'multiple', difficulty: 'easy', section: 'Node.js', topic: 'HTTP', marks: 1.5, options: [{ id: 'A', text: '200 OK', isCorrect: true }, { id: 'B', text: '201 Created', isCorrect: true }, { id: 'C', text: '204 No Content', isCorrect: true }, { id: 'D', text: '301 Moved Permanently', isCorrect: false }] },
      { text: 'What does MongoDB\'s compound index help with?', type: 'single', difficulty: 'hard', section: 'Node.js', topic: 'Databases', marks: 2, options: [{ id: 'A', text: 'Speeds up queries filtering or sorting on multiple fields', isCorrect: true }, { id: 'B', text: 'Replaces the need for any other index', isCorrect: false }, { id: 'C', text: 'Automatically normalizes data', isCorrect: false }, { id: 'D', text: 'Only useful for text search', isCorrect: false }] },
      { text: 'Which BullMQ feature prevents duplicate job processing?', type: 'single', difficulty: 'hard', section: 'Node.js', topic: 'Queues', marks: 2, options: [{ id: 'A', text: 'Job ID deduplication with NX (only add if not exists)', isCorrect: true }, { id: 'B', text: 'Setting priority=0', isCorrect: false }, { id: 'C', text: 'removeOnComplete flag', isCorrect: false }, { id: 'D', text: 'Setting concurrency=1 globally', isCorrect: false }] },
    ];

    const preparedQuestions = questions.map((q, i) => ({
      ...q,
      assessmentId: assessment._id,
      order: i,
      isActive: true,
    }));

    await Question.insertMany(preparedQuestions);
    logger.info(`✅ ${questions.length} questions created`);

    logger.info('\n🎉 Seeding complete!');
    logger.info('─────────────────────────────────────');
    logger.info('Admin:     admin@visionhire.com  / password123');
    logger.info('Candidate: alice@visionhire.demo / password123');
    logger.info('─────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
