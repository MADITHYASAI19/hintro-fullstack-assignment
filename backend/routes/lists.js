const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const auth = require('../middleware/auth');

router.post('/', auth, listController.createList);
router.put('/:id', auth, listController.updateList);

module.exports = router;
