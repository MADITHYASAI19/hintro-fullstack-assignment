const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const { getActivities } = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.post('/', auth, boardController.createBoard);
router.get('/', auth, boardController.getBoards);
router.get('/:id', auth, boardController.getBoardById);
router.get('/:boardId/tasks', auth, boardController.getBoardTasks);
router.get('/:boardId/activity', auth, getActivities);

module.exports = router;
