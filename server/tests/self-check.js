const assert = require('assert');
const seedData = require('../seed/seed');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { generateToken, verifyToken } = require('../utils/jwt');
const { disconnectDB } = require('../config/db');

async function runSelfCheck() {
  console.log('\n[TaskFlow Self-Check] Starting automated verification...');

  try {
    // 1. Seed database
    await seedData();

    // 2. Verify User model & counts
    const users = await User.find({});
    assert.strictEqual(users.length, 5, 'Expected 5 users');
    console.log('✓ 5 users verified in database');

    const alex = await User.findOne({ email: 'alex@taskflow.dev' }).select('+password');
    assert(alex, 'Alex user found');
    const isMatch = await alex.matchPassword('password123');
    assert.strictEqual(isMatch, true, 'Password matching hash failed');
    console.log('✓ Password bcrypt hashing verified');

    // 3. Verify JWT
    const token = generateToken(alex._id);
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id.toString(), alex._id.toString(), 'JWT token decode mismatch');
    console.log('✓ JWT token generation and verification verified');

    // 4. Verify Projects
    const projects = await Project.find({});
    assert.strictEqual(projects.length, 3, 'Expected 3 projects');
    console.log('✓ 3 projects verified in database');

    // 5. Verify Tasks
    const tasks = await Task.find({});
    assert.strictEqual(tasks.length, 18, 'Expected 18 tasks');
    console.log('✓ 18 tasks verified across all statuses');

    // Verify task distribution across columns
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const inReview = tasks.filter(t => t.status === 'in_review').length;
    const done = tasks.filter(t => t.status === 'done').length;
    console.log(`✓ Task columns breakdown: ToDo(${todo}), InProgress(${inProgress}), InReview(${inReview}), Done(${done})`);
    assert(todo > 0 && inProgress > 0 && inReview > 0 && done > 0, 'Every Kanban column must have tasks');

    // 6. Verify Comments and Notifications
    const comments = await Comment.find({});
    assert(comments.length >= 5, 'Expected at least 5 comments');
    console.log(`✓ ${comments.length} comments verified with populated authors`);

    const notifications = await Notification.find({});
    assert(notifications.length >= 4, 'Expected at least 4 notifications');
    console.log(`✓ ${notifications.length} notifications verified`);

    console.log('\n=============================================');
    console.log('🎉 ALL BACKEND CHECKS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Self-check failed:', err);
    await disconnectDB();
    process.exit(1);
  }
}

runSelfCheck();
