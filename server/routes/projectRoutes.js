const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const {
  getProjectMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// Project member management
router.get('/:id/members', getProjectMembers);
router.post('/:id/invitations', inviteMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId/role', updateMemberRole);

module.exports = router;
