const express = require('express');
const taskController = require('../controllers/taslController');

const router = express.Router();

// **🔥 任务分配**
router.post('/task/pick_assign', taskController.assignTask);

// **🔥 任务完成**
router.post('/task/complete_task', taskController.completeTask);

module.exports = router;
