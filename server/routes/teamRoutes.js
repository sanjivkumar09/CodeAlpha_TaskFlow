const express = require('express');
const router = express.Router();
const { acceptInvitation, searchUsers } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/invitations/:token/accept', acceptInvitation);
router.get('/users/search', searchUsers);

module.exports = router;
