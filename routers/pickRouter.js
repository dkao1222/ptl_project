const express = require('express')
const path = require('path')

const ptlController = require(path.resolve(__dirname, '../controllers/pickController'))
const pickModels = require(path.resolve(__dirname,'../models/pickModels'))

const router = express.Router();


router.get('/PICK_mode', ptlController.pick_mode);
router.get('/task/Pick_order', (req, res) => {
    pickModels.pick_task((err, rows) => {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    })
})


module.exports = router;