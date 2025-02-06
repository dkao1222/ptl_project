const express = require('express');

const systemControllers = require('../controllers/systemControllers');
const systemModels = require('../models/systemModels');

const router = express.Router();

router.get('/System_mode', systemControllers.System_mode);
router.get('/System/client_inform', (req, res)=> {
    systemModels.get_client((err, rows) => {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    })
});

module.exports = router;
