const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================
// USER MODEL
// ============================================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false, minlength: 6 },
  role: { type: String, enum: ['candidate', 'admin', 'superadmin'], default: 'candidate' },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  loginHistory: [{ ip: String, userAgent: String, timestamp: Date }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

const User = mongoose.model('User', userSchema);

// ============================================================
// ASSESSMENT MODEL
// ============================================================
const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  slug: { type: String, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  config: {
    totalQuestions: { type: Number, default: 0 },
    duration: { type: Number, required: true }, // in minutes
    passingScore: { type: Number, default: 50 }, // percentage
    maxAttempts: { type: Number, default: 1 },
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    showResult: { type: Boolean, default: true },
    showAnswers: { type: Boolean, default: false },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0.25 },
    fullScreenRequired: { type: Boolean, default: true },
    tabSwitchLimit: { type: Number, default: 3 },
    webcamRequired: { type: Boolean, default: false },
  },

  sections: [{
    name: { type: String, required: true },
    description: String,
    questionCount: Number,
    timeLimit: Number, // section-wise timer (minutes)
    order: Number,
  }],

  scheduling: {
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    timezone: { type: String, default: 'UTC' },
  },

  status: { type: String, enum: ['draft', 'published', 'archived', 'paused'], default: 'draft' },
  accessCode: { type: String, default: null }, // optional access restriction
  invitedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [String],
  category: { type: String, default: 'General' },
}, { timestamps: true });

assessmentSchema.index({ status: 1, 'scheduling.startTime': 1, 'scheduling.endTime': 1 });
assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ slug: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

// ============================================================
// QUESTION MODEL
// ============================================================
const questionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  section: { type: String, default: 'General' },
  
  text: { type: String, required: true },
  type: { type: String, enum: ['single', 'multiple'], default: 'single' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  
  options: [{
    id: { type: String, required: true }, // 'A', 'B', 'C', 'D'
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  }],

  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  explanation: { type: String, default: '' },
  topic: { type: String, default: '' },
  tags: [String],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

questionSchema.index({ assessmentId: 1, isActive: 1 });
questionSchema.index({ assessmentId: 1, section: 1 });
questionSchema.index({ assessmentId: 1, difficulty: 1 });
questionSchema.index({ topic: 1 });

const Question = mongoose.model('Question', questionSchema);

// ============================================================
// CANDIDATE ATTEMPT MODEL
// ============================================================
const candidateAttemptSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },

  questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // randomized order
  optionShuffleMap: { type: Map, of: [String] }, // questionId -> shuffled option IDs

  status: {
    type: String,
    enum: ['started', 'in-progress', 'submitted', 'auto-submitted', 'expired', 'disqualified'],
    default: 'started',
  },

  startTime: { type: Date, default: Date.now },
  submitTime: { type: Date, default: null },
  serverEndTime: { type: Date, required: true }, // startTime + duration → server-authoritative

  currentQuestionIndex: { type: Number, default: 0 },
  
  score: { type: Number, default: null },
  totalMarks: { type: Number, default: null },
  percentage: { type: Number, default: null },
  rank: { type: Number, default: null },
  isPassed: { type: Boolean, default: null },
  
  isEvaluated: { type: Boolean, default: false },
  evaluatedAt: { type: Date, default: null },
  
  isLocked: { type: Boolean, default: false }, // locked after final submit
  submissionJobId: { type: String, default: null }, // BullMQ job ID
  
  tabSwitchCount: { type: Number, default: 0 },
  fullscreenExitCount: { type: Number, default: 0 },
  copyPasteCount: { type: Number, default: 0 },
  isDisqualified: { type: Boolean, default: false },
  
  metadata: {
    ipAddress: String,
    userAgent: String,
    browser: String,
    os: String,
  },
}, { timestamps: true });

candidateAttemptSchema.index({ candidateId: 1, assessmentId: 1 }, { unique: true });
candidateAttemptSchema.index({ assessmentId: 1, status: 1 });
candidateAttemptSchema.index({ candidateId: 1 });
candidateAttemptSchema.index({ assessmentId: 1, score: -1 }); // for leaderboard
candidateAttemptSchema.index({ serverEndTime: 1, status: 1 }); // for auto-submit cron
candidateAttemptSchema.index({ isEvaluated: 1 });

const CandidateAttempt = mongoose.model('CandidateAttempt', candidateAttemptSchema);

// ============================================================
// CANDIDATE ANSWER MODEL (Separate collection for scalability)
// ============================================================
const candidateAnswerSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateAttempt', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },

  selectedOptions: [{ type: String }], // option IDs selected
  isMarkedForReview: { type: Boolean, default: false },
  isVisited: { type: Boolean, default: false },
  
  timeSpent: { type: Number, default: 0 }, // seconds spent on question
  savedAt: { type: Date, default: Date.now },
  
  // Populated after evaluation
  isCorrect: { type: Boolean, default: null },
  marksAwarded: { type: Number, default: null },
}, { timestamps: true });

// CRITICAL: Compound unique index prevents duplicate answers
candidateAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });
candidateAnswerSchema.index({ attemptId: 1 });
candidateAnswerSchema.index({ candidateId: 1, assessmentId: 1 });
candidateAnswerSchema.index({ questionId: 1 }); // for analytics

const CandidateAnswer = mongoose.model('CandidateAnswer', candidateAnswerSchema);

// ============================================================
// VIOLATION MODEL
// ============================================================
const violationSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateAttempt', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },

  type: {
    type: String,
    enum: [
      'tab_switch',
      'fullscreen_exit',
      'copy_paste',
      'right_click',
      'keyboard_shortcut',
      'window_blur',
      'multiple_login',
      'suspicious_navigation',
      'screen_capture_attempt',
    ],
    required: true,
  },
  
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  description: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

violationSchema.index({ attemptId: 1 });
violationSchema.index({ candidateId: 1, assessmentId: 1 });
violationSchema.index({ timestamp: -1 });

const Violation = mongoose.model('Violation', violationSchema);

// ============================================================
// RESULT MODEL (Denormalized for fast reads)
// ============================================================
const resultSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateAttempt', required: true, unique: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  rank: { type: Number, default: null },
  isPassed: { type: Boolean, required: true },
  
  totalQuestions: { type: Number },
  attempted: { type: Number },
  correct: { type: Number },
  wrong: { type: Number },
  skipped: { type: Number },
  
  sectionWise: [{
    section: String,
    score: Number,
    totalMarks: Number,
    correct: Number,
    wrong: Number,
    skipped: Number,
  }],
  
  topicWise: [{
    topic: String,
    correct: Number,
    total: Number,
    accuracy: Number,
  }],
  
  difficultyWise: {
    easy: { correct: Number, total: Number },
    medium: { correct: Number, total: Number },
    hard: { correct: Number, total: Number },
  },
  
  timeTaken: { type: Number }, // seconds
  evaluatedAt: { type: Date, default: Date.now },
  
  shortlistedStatus: {
    type: String,
    enum: ['pending', 'shortlisted', 'rejected', 'on_hold'],
    default: 'pending',
  },
}, { timestamps: true });

resultSchema.index({ assessmentId: 1, score: -1 }); // leaderboard
resultSchema.index({ candidateId: 1 });
resultSchema.index({ assessmentId: 1, shortlistedStatus: 1 });
resultSchema.index({ attemptId: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

module.exports = { User, Assessment, Question, CandidateAttempt, CandidateAnswer, Violation, Result };
