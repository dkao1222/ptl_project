const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();

// **🔥 任务分配**
router.post('/task/pick_assign', taskController.assignTask);

// **🔥 任务完成**
router.post('/task/complete_task', taskController.completeTask);

router.post('/task/validate_task', taskController.validateTask);

module.exports = router;
