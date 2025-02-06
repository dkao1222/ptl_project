const express = require('express')

const ptlController = require('../controllers/pickController')

const router = express.Router();


router.get('/PICK_mode', ptlController.pick_mode);

module.exports = router;