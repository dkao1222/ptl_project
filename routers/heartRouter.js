const express = require('express')
const db = require('../models/database')

const router = express.Router()

router.post('/heartbeat_mode', (req, res) => {
    console.log(req.body)
    const { esp_id } = req.body
    if(!esp_id) return res.status(500).status(400).json({ error: '缺少 esp_id' });

    db.run(
        `INSERT INTO esp_status (esp_id, status, last_updated)
         VALUES (?, 'online', CURRENT_TIMESTAMP)
         ON CONFLICT(esp_id) 
         DO UPDATE SET status = 'online', last_updated = CURRENT_TIMESTAMP`,
        [esp_id],
        (err) => {
            if (err) {
                console.error("❌ 更新心跳失敗:", err.message);
                return res.status(500).json({ error: "無法更新心跳" });
            }
            res.status(200).json({ message: "✅ 心跳更新成功" });
        }
    );
})

module.exports = router