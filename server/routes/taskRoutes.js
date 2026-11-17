const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  reorderTask,
  deleteTask,
} = require('../controllers/taskController');
const {
  getTaskComments,
  createComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.put('/:id/reorder', reorderTask);

// Comments for task
router.route('/:id/comments')
  .get(getTaskComments)
  .post(createComment);

module.exports = router;
