const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// Search needs to be before /:id to avoid conflict if we had /:id, but here it's clean.
// However, best practice: put specific static routes before parameterized ones.
router.get('/search', auth, taskController.searchTasks);
router.get('/', auth, taskController.getTasks);
router.post('/', auth, taskController.createTask);
router.put('/:id', auth, taskController.updateTask);
router.delete('/:id', auth, taskController.deleteTask);

module.exports = router;
