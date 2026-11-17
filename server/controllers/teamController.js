const crypto = require('crypto');
const Project = require('../models/Project');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');

// @desc    Get members of a project
// @route   GET /api/projects/:id/members
// @access  Private
const getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members.user', 'name email avatar role bio');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({
      success: true,
      owner: project.owner,
      members: project.members,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Invite or add member to project
// @route   POST /api/projects/:id/invitations
// @access  Private (Owner or Admin)
const inviteMember = async (req, res, next) => {
  try {
    const { email, role, directAdd } = req.body;
    const projectId = req.params.id;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if requester has admin/owner rights
    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const memberEntry = project.members.find((m) => m.user.toString() === userId);
    const isAdmin = memberEntry && memberEntry.role === 'admin';

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owners or admins can invite members' });
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const alreadyMember = project.members.some(
        (m) => m.user.toString() === existingUser._id.toString()
      );
      if (alreadyMember) {
        return res.status(400).json({ success: false, message: 'This user is already a member of this project' });
      }

      // If directAdd is requested or user exists, we add them right away for frictionless team building
      project.members.push({
        user: existingUser._id,
        role: role === 'admin' ? 'admin' : 'member',
        joinedAt: new Date(),
      });
      await project.save();

      // Create notification
      await Notification.create({
        recipient: existingUser._id,
        sender: req.user._id,
        type: 'project_invitation',
        message: `${req.user.name} added you to the project "${project.name}"`,
        relatedProject: project._id,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${existingUser._id}`).emit('notification:new', {
          message: `Added to project "${project.name}"`,
        });
      }

      const updatedProject = await Project.findById(projectId)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar role');

      return res.status(201).json({
        success: true,
        message: `${existingUser.name} added to the project`,
        project: updatedProject,
        addedDirectly: true,
      });
    }

    // User is not yet registered: generate invite token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      project: projectId,
      invitedBy: req.user._id,
      email: email.toLowerCase(),
      token,
      role: role === 'admin' ? 'admin' : 'member',
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: `Invitation generated for ${email}`,
      invitationToken: token,
      invitationUrl: `/invite/${token}`,
      expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept invitation link
// @route   POST /api/invitations/:token/accept
// @access  Private
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: Date.now() },
    });

    if (!invitation) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation token' });
    }

    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project no longer exists' });
    }

    const userId = req.user._id;
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId.toString()
    );

    if (!alreadyMember) {
      project.members.push({
        user: userId,
        role: invitation.role,
        joinedAt: new Date(),
      });
      await project.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    res.json({
      success: true,
      message: `Successfully joined "${project.name}"!`,
      project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Owner or Admin)
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
    }

    const currentUserId = req.user._id.toString();
    const isOwner = project.owner.toString() === currentUserId;
    const memberEntry = project.members.find((m) => m.user.toString() === currentUserId);
    const isAdmin = memberEntry && memberEntry.role === 'admin';

    // Users can remove themselves, or owner/admin can remove others
    if (!isOwner && !isAdmin && currentUserId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this member' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.json({
      success: true,
      message: 'Member removed from project',
      project: updatedProject,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a member's role
// @route   PUT /api/projects/:id/members/:userId/role
// @access  Private (Owner only)
const updateMemberRole = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or member' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owner can alter member roles' });
    }

    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'User is not a member of this project' });
    }

    member.role = role;
    await project.save();

    res.json({
      success: true,
      message: `Role updated to ${role}`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search users for task assignment or project invitations
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .limit(10)
      .select('name email avatar role bio');

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjectMembers,
  inviteMember,
  acceptInvitation,
  removeMember,
  updateMemberRole,
  searchUsers,
};
