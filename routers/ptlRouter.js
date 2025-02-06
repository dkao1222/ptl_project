const express = require('express')

const ptlController = require('../controllers/ptlController')

const router = express.Router();


router.get('/PTL_mode', ptlController.PTL_mode);

module.exports = router;