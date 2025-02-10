const express = require('express');

//const systemControllers = require('../controllers/systemControllers');
//const systemModels = require('../models/systemModels');

const taskController = require('../controllers/taslController')

const router = express.Router();

router.post('/task/pick_assign', taskController.assignTask)
router.get('/task/put_mode')

module.exports = router