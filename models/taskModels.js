// taskModel.js - 任务模型

const db = require('../models/database')

// taskModel.js - 任务模型
const taskModel = {
    getTasksByInput: (taskInput) => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT *, DENSE_RANK() OVER (ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC) as rank 
                 FROM task_status 
                 WHERE (task_id = ? OR sku_name = ?) 
                 AND status = 'Not Completed' 
                 ORDER BY rank`,
                [taskInput, taskInput],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    },

    getOnlineESP: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT esp_id FROM esp_status WHERE status = 'online' AND work_status = 'idle' ORDER BY last_updated DESC`,
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
            db.run(`UPDATE esp_status SET work_status = ? WHERE esp_id = ?`,
                [status, esp_id], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }
};

module.exports = taskModel;