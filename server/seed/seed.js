const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Invitation = require('../models/Invitation');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    await Invitation.deleteMany({});

    console.log('[Seed] Creating 5 realistic users...');

    const users = await User.create([
      {
        name: 'Alex Rivera',
        email: 'alex@taskflow.dev',
        password: 'password123',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Lead Architect & Engineering Manager. Passionate about distributed systems, resilient architectures, and team velocity.',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@taskflow.dev',
        password: 'password123',
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'Senior Frontend Engineer specializing in React, TypeScript, and high-performance WebGL animations.',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@taskflow.dev',
        password: 'password123',
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Senior Backend Engineer. Expert in Node.js, GraphQL, Redis, and high-throughput real-time message brokers.',
      },
      {
        name: 'Elena Rostova',
        email: 'elena@taskflow.dev',
        password: 'password123',
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        bio: 'Principal Product & Design Lead. Obsessed with micro-interactions, typography, and human-centric workflows.',
      },
      {
        name: 'David Kim',
        email: 'david@taskflow.dev',
        password: 'password123',
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'DevOps & Quality Assurance Lead. Focus on CI/CD pipelines, Kubernetes autoscaling, and end-to-end test reliability.',
      },
    ]);

    const [alex, sarah, marcus, elena, david] = users;

    console.log('[Seed] Creating 3 realistic projects...');
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const project1 = await Project.create({
      name: 'CloudScale NextGen Platform',
      description: 'Next-generation microservices architecture migration, distributed caching layer, and real-time collaboration pipeline.',
      owner: alex._id,
      status: 'active',
      color: '#3b82f6', // Indigo Blue
      startDate: new Date(now.getTime() - 14 * day),
      dueDate: new Date(now.getTime() + 30 * day),
      members: [
        { user: alex._id, role: 'admin' },
        { user: sarah._id, role: 'member' },
        { user: marcus._id, role: 'member' },
        { user: david._id, role: 'member' },
      ],
    });

    const project2 = await Project.create({
      name: 'Mobile App Redesign v2.0',
      description: 'Complete UI/UX overhaul for iOS & Android apps featuring an offline-first sync engine and streamlined checkout flow.',
      owner: alex._id,
      status: 'active',
      color: '#8b5cf6', // Violet
      startDate: new Date(now.getTime() - 7 * day),
      dueDate: new Date(now.getTime() + 45 * day),
      members: [
        { user: alex._id, role: 'admin' },
        { user: elena._id, role: 'admin' },
        { user: sarah._id, role: 'member' },
      ],
    });

    const project3 = await Project.create({
      name: 'Enterprise Security Compliance (SOC2)',
      description: 'Comprehensive security audit, zero-trust RBAC access controls, end-to-end payload encryption and SIEM automated audit log pipeline.',
      owner: marcus._id,
      status: 'planning',
      color: '#10b981', // Emerald
      startDate: new Date(now.getTime() - 2 * day),
      dueDate: new Date(now.getTime() + 60 * day),
      members: [
        { user: marcus._id, role: 'admin' },
        { user: alex._id, role: 'member' },
        { user: david._id, role: 'member' },
      ],
    });

    console.log('[Seed] Creating 18 tasks across columns and priorities...');
    const tasksData = [
      // Project 1 Tasks
      {
        title: 'Architect Distributed Caching with Redis Cluster',
        description: 'Design and benchmark multi-node Redis cluster with consistent hashing to eliminate API bottlenecks on heavy search endpoints.',
        project: project1._id,
        assignedTo: marcus._id,
        createdBy: alex._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date(now.getTime() - 3 * day),
        position: 0,
        labels: ['Backend', 'Performance', 'Redis'],
      },
      {
        title: 'Implement JWT Refresh Token Rotation Middleware',
        description: 'Secure HTTP-only cookies with refresh token rotation and blacklisting in Redis upon logout or suspicious device detection.',
        project: project1._id,
        assignedTo: marcus._id,
        createdBy: alex._id,
        status: 'done',
        priority: 'urgent',
        dueDate: new Date(now.getTime() - 1 * day),
        position: 1,
        labels: ['Security', 'Auth', 'API'],
      },
      {
        title: 'Optimize Real-Time WebSocket Channel Multiplexing',
        description: 'Tune Socket.IO heartbeat intervals and add channel room pruning for inactive project workspaces.',
        project: project1._id,
        assignedTo: marcus._id,
        createdBy: alex._id,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(now.getTime() + 2 * day),
        position: 0,
        labels: ['WebSockets', 'RealTime', 'Backend'],
      },
      {
        title: 'Implement Virtualized List for Massive Task Boards',
        description: 'Use windowing technique to render 1000+ cards seamlessly at 60fps without DOM thrashing.',
        project: project1._id,
        assignedTo: sarah._id,
        createdBy: alex._id,
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 4 * day),
        position: 1,
        labels: ['Frontend', 'React', 'Performance'],
      },
      {
        title: 'Build Automated Multi-Stage Dockerfile for Production',
        description: 'Configure lightweight Alpine Node container with non-root user and automated security vulnerability scanning in CI.',
        project: project1._id,
        assignedTo: david._id,
        createdBy: alex._id,
        status: 'in_review',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 1 * day),
        position: 0,
        labels: ['DevOps', 'Docker', 'CI/CD'],
      },
      {
        title: 'Conduct Load Testing with k6 (10,000 Concurrent Users)',
        description: 'Simulate concurrent task reordering and real-time comment bursts to identify potential database connection pool saturation.',
        project: project1._id,
        assignedTo: david._id,
        createdBy: alex._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date(now.getTime() + 7 * day),
        position: 0,
        labels: ['QA', 'Testing', 'Benchmark'],
      },
      {
        title: 'Setup Kubernetes Horizontal Pod Autoscaler (HPA)',
        description: 'Define CPU and memory metric triggers for automatic scaling between 2 to 10 pods during traffic spikes.',
        project: project1._id,
        assignedTo: david._id,
        createdBy: alex._id,
        status: 'todo',
        priority: 'low',
        dueDate: new Date(now.getTime() + 14 * day),
        position: 1,
        labels: ['DevOps', 'Kubernetes'],
      },

      // Project 2 Tasks (Mobile App Redesign)
      {
        title: 'Conduct User Journey Interviews & Usability Audit',
        description: 'Interview 12 enterprise project managers to map current friction points in task triage and notifications.',
        project: project2._id,
        assignedTo: elena._id,
        createdBy: alex._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date(now.getTime() - 5 * day),
        position: 0,
        labels: ['UX Research', 'Design'],
      },
      {
        title: 'Design Dark Mode Color Tokens & Elevation System',
        description: 'Establish WCAG AAA accessible high-contrast palette with subtle borders and clear visual hierarchy for night shifts.',
        project: project2._id,
        assignedTo: elena._id,
        createdBy: alex._id,
        status: 'in_progress',
        priority: 'urgent',
        dueDate: new Date(now.getTime() + 3 * day),
        position: 0,
        labels: ['Design System', 'Accessibility', 'Figma'],
      },
      {
        title: 'Prototype Gesture-Driven Drag & Drop on Mobile Viewports',
        description: 'Test touch gesture responsiveness for moving cards between columns on 375px screens with haptic feedback.',
        project: project2._id,
        assignedTo: sarah._id,
        createdBy: elena._id,
        status: 'in_review',
        priority: 'high',
        dueDate: new Date(now.getTime() + 2 * day),
        position: 0,
        labels: ['Mobile', 'Gestures', 'Frontend'],
      },
      {
        title: 'Implement Offline Storage with WatermelonDB',
        description: 'Store local task drafts and sync state changes bidirectionally upon network reconnection.',
        project: project2._id,
        assignedTo: sarah._id,
        createdBy: elena._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 10 * day),
        position: 0,
        labels: ['OfflineFirst', 'Sync'],
      },
      {
        title: 'Build Push Notification Payloads with Rich Actions',
        description: 'Allow users to mark tasks done directly from native mobile push notification banner without opening full app.',
        project: project2._id,
        assignedTo: sarah._id,
        createdBy: alex._id,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 12 * day),
        position: 1,
        labels: ['Notifications', 'Mobile'],
      },

      // Project 3 Tasks (Enterprise SOC2 Compliance)
      {
        title: 'Audit All API Endpoints for Strict Role-Based Access Control',
        description: 'Verify that non-admin members cannot delete projects, alter workspace billing or access unassigned private tasks.',
        project: project3._id,
        assignedTo: alex._id,
        createdBy: marcus._id,
        status: 'in_progress',
        priority: 'urgent',
        dueDate: new Date(now.getTime() - 2 * day), // OVERDUE for testing overdue badges
        position: 0,
        labels: ['Security', 'Audit', 'RBAC'],
      },
      {
        title: 'Implement AES-256 Envelope Encryption for Sensitive Attachments',
        description: 'Generate per-file data keys and rotate master KMS key automatically every 90 days.',
        project: project3._id,
        assignedTo: marcus._id,
        createdBy: marcus._id,
        status: 'todo',
        priority: 'high',
        dueDate: new Date(now.getTime() + 6 * day),
        position: 0,
        labels: ['Cryptography', 'Compliance'],
      },
      {
        title: 'Configure Immutable SIEM Audit Trail Logs with OpenTelemetry',
        description: 'Stream structured JSON logs of all project membership changes and permission grants to centralized security lake.',
        project: project3._id,
        assignedTo: david._id,
        createdBy: marcus._id,
        status: 'in_review',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 5 * day),
        position: 0,
        labels: ['Logging', 'DevOps', 'Compliance'],
      },
      {
        title: 'Document Disaster Recovery & Multi-Region Failover Runbook',
        description: 'Step-by-step verified guide to restore MongoDB replica set and application state within 15-minute RTO target.',
        project: project3._id,
        assignedTo: david._id,
        createdBy: marcus._id,
        status: 'todo',
        priority: 'low',
        dueDate: new Date(now.getTime() + 20 * day),
        position: 1,
        labels: ['Documentation', 'DR'],
      },
      {
        title: 'Prepare Vulnerability Penetration Test Scope & White-Hat Engagement',
        description: 'Coordinate with third-party cybersecurity auditors for greylist penetration testing and OWASP Top 10 verification.',
        project: project3._id,
        assignedTo: alex._id,
        createdBy: marcus._id,
        status: 'done',
        priority: 'high',
        dueDate: new Date(now.getTime() - 6 * day),
        position: 0,
        labels: ['Security', 'PenTest'],
      },
      {
        title: 'Implement Rate Limiting & Distributed DDoS Protection Headers',
        description: 'Apply express-rate-limit and Helmet security headers with strict Content-Security-Policy across all public gateway routes.',
        project: project3._id,
        assignedTo: marcus._id,
        createdBy: marcus._id,
        status: 'done',
        priority: 'medium',
        dueDate: new Date(now.getTime() - 4 * day),
        position: 1,
        labels: ['Security', 'Infra'],
      },
    ];

    const tasks = await Task.create(tasksData);
    console.log(`[Seed] Seeded ${tasks.length} tasks successfully.`);

    console.log('[Seed] Creating realistic task comments...');
    await Comment.create([
      {
        task: tasks[0]._id,
        user: marcus._id,
        content: 'Benchmarked the cluster on 3 nodes: p99 latency dropped from 142ms down to 18ms under 5k req/s load. Pull request is ready for review!',
        createdAt: new Date(now.getTime() - 2 * day),
      },
      {
        task: tasks[0]._id,
        user: alex._id,
        content: 'Outstanding work Marcus. Tested failover when dropping node 2; seamless reelection in under 600ms.',
        createdAt: new Date(now.getTime() - 1 * day),
      },
      {
        task: tasks[3]._id,
        user: sarah._id,
        content: 'Working on column virtualization now. Will ensure smooth drag transitions without layout reflows.',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        task: tasks[8]._id,
        user: elena._id,
        content: 'Uploaded Figma tokens v2.4 with the updated slate/zinc elevation layers and 14px base typography system.',
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      {
        task: tasks[12]._id,
        user: david._id,
        content: 'Flagged 2 endpoints in the team route that needed an extra admin verification check. Patch submitted.',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ]);

    console.log('[Seed] Creating sample notifications...');
    await Notification.create([
      {
        recipient: alex._id,
        sender: marcus._id,
        type: 'task_assigned',
        message: 'Marcus assigned you to "Audit All API Endpoints for Strict Role-Based Access Control"',
        relatedProject: project3._id,
        relatedTask: tasks[12]._id,
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        recipient: alex._id,
        sender: elena._id,
        type: 'new_comment',
        message: 'Elena commented on "Design Dark Mode Color Tokens & Elevation System"',
        relatedProject: project2._id,
        relatedTask: tasks[8]._id,
        isRead: false,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
      {
        recipient: alex._id,
        sender: david._id,
        type: 'status_changed',
        message: 'David moved "Build Automated Multi-Stage Dockerfile for Production" to IN REVIEW',
        relatedProject: project1._id,
        relatedTask: tasks[4]._id,
        isRead: true,
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      {
        recipient: sarah._id,
        sender: alex._id,
        type: 'task_assigned',
        message: 'Alex assigned you to "Implement Virtualized List for Massive Task Boards"',
        relatedProject: project1._id,
        relatedTask: tasks[3]._id,
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * day),
      },
    ]);

    console.log('----------------------------------------------------');
    console.log('[Seed] TASKFLOW DATABASE SEEDED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials for testing:');
    console.log('1. Alex Rivera   (Admin/Lead)    : alex@taskflow.dev   / password123');
    console.log('2. Sarah Chen    (Frontend Lead) : sarah@taskflow.dev  / password123');
    console.log('3. Marcus Johnson(Backend Lead)  : marcus@taskflow.dev / password123');
    console.log('4. Elena Rostova (Product/UX)    : elena@taskflow.dev  / password123');
    console.log('5. David Kim     (DevOps/QA)     : david@taskflow.dev  / password123');
    console.log('----------------------------------------------------');

    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
