// taskModel.js - 任务模型

const db = require('../models/database')

// taskModel.js - 任务模型
const taskModel = {
    getMultiplePendingTasks: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM task_status WHERE status = 'Not Completed' ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC`,
                [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });
    },

    getOnlineESP: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT esp_id FROM esp_status WHERE status = 'online' ORDER BY last_updated DESC`,
                [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.esp_id));
                });
        });
    },

    assignTaskToESP: (esp_id, task_id) => {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE task_status SET esp_id = ?, start_time = CURRENT_TIMESTAMP, status = 'In Progress' WHERE id = ?`,
                [esp_id, task_id], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });
    },

    updateESPStatus: (esp_id, status) => {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE esp_status SET status = ? WHERE esp_id = ?`,
                [status, esp_id], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });
    },

    listenForTaskCompletion: (callback) => {
        setInterval(() => {
            db.all(`SELECT esp_id FROM esp_status WHERE status = 'busy'`, [], (err, rows) => {
                if (err) {
                    console.error("❌ 任务完成状态检查错误:", err);
                    return;
                }
                rows.forEach(row => {
                    let esp_id = row.esp_id;
                    db.get(`SELECT COUNT(*) AS pending FROM task_status WHERE esp_id = ? AND status = 'In Progress'`, [esp_id], (err, result) => {
                        if (!err && result.pending === 0) {
                            callback(esp_id);
                        }
                    });
                });
            });
        }, 5000); // 每 5 秒检查一次任务完成情况
    }
};

module.exports = taskModel;