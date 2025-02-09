const express = require('express')

const startController = require('../controllers/startController')

const router = express.Router();

router.get('/task/pick_start', startController.pick_start);

module.exports = router