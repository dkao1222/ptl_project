const db = require('../models/database');  // 依賴 database.js

function checkOfflineDevices() {
    db.run(
        `UPDATE esp_status 
         SET status = 'offline' 
         WHERE last_updated < datetime('now', '-10 seconds')`,
        [],
        (err) => {
            if (err) {
                console.error("❌ 檢查離線設備失敗:", err.message);
            } else {
                console.log("🔍 離線設備檢測完成");
            }
        }
    );
}

let timeer = 30 * 60 * 1000

// 每 10 秒執行一次
setInterval(checkOfflineDevices, timeer);

module.exports = checkOfflineDevices;
