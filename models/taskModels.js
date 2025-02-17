const db = require('../models/database');

const taskModel = {
    // **🔥 获取所有 "Not Completed" 任务**
    getPendingTasks: async () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM task_status WHERE status = 'Not Completed' ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备**
    getAvailableESP: async () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM esp_status WHERE status = 'online' AND work_status = 'idle'`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // **🔥 分配任务到 ESP**
    assignTaskToESP: async (esp_id, task_id) => {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE task_status SET esp_id = ?, start_time = CURRENT_TIMESTAMP, status = 'In Progress' WHERE id = ?`, [esp_id, task_id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // **🔥 标记任务完成**
    markTaskCompleted: async (task_id) => {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE task_status SET status = 'Completed', end_time = CURRENT_TIMESTAMP WHERE id = ?`, [task_id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // **🔥 更新 ESP 设备状态**
    updateESPStatus: async (esp_id, status) => {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE esp_status SET work_status = ? WHERE esp_id = ?`, [status, esp_id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // **🔥 获取下一个待处理任务**
    getNextPendingTask: async () => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM task_status WHERE status = 'Not Completed' ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC LIMIT 1`, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
};

module.exports = taskModel;
