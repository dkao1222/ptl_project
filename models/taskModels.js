const db = require('../models/database');

const taskModel = {
    // **🔥 获取所有 "Not Completed" 任务**
    getPendingTasks: async () => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM task_status 
                WHERE status = 'Not Completed' 
                ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC`, 
                [], 
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    },
    getTaskById: async (task_id) => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM task_status 
                WHERE task_id = ?
                ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC`, 
                [task_id], 
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    },
    // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备（包含 socket_id）**
    getAvailableESP: async () => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT esp_id, socket_id FROM esp_status 
                WHERE status = 'online' AND work_status = 'idle'`, 
                [], 
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    },

    // **🔥 分配任务到 ESP**
    assignTaskToESP: async (esp_id, task_id) => {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE task_status 
                SET esp_id = ?, start_time = CURRENT_TIMESTAMP, status = 'In Progress' 
                WHERE id = ?`, 
                [esp_id, task_id], 
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // ✅ 任务分配成功后，更新 ESP `work_status` 为 `busy`
                        db.run(
                            `UPDATE esp_status SET work_status = 'busy' WHERE esp_id = ?`, 
                            [esp_id], 
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    }
                }
            );
        });
    },

    // **🔥 标记任务完成**
    markTaskCompleted: async (task_id) => {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE task_status 
                SET status = 'Completed', end_time = CURRENT_TIMESTAMP 
                WHERE task_id = ?`, 
                [task_id], 
                function (err) {
                    if (err) {
                        console.error("❌ 任务完成更新失败:", err);
                        reject(err);
                    } else if (this.changes === 0) {
                        console.warn(`⚠️ 任务 ID ${task_id} 不存在或已完成`);
                        reject(new Error(`任务 ID ${task_id} 不存在`));
                    } else {
                        console.log(`✅ 任务 ${task_id} 已成功完成`);
                        resolve();
                    }
                }
            );
        });
    },

    updateESPStatus: async (esp_id, status, socket_id = null) => {
        return new Promise((resolve, reject) => {
            let query = `UPDATE esp_status SET status = ?`;
            let params = [status];
    
            if (status === "offline") {
                query += `, socket_id = NULL, work_status = 'idle'`;
            } else if (socket_id !== null) {
                query += `, socket_id = ?`;
                params.push(socket_id);
            }
    
            query += ` WHERE esp_id = ?`;
            params.push(esp_id);
    
            db.run(query, params, (err) => {
                if (err) {
                    console.error("❌ 更新 ESP 设备状态失败:", err);
                    reject(err);
                } else {
                    console.log(`✅ ESP ${esp_id} 状态更新成功: status=${status}, socket_id=${socket_id}`);
                    resolve();
                }
            });
        });
    },
    
    
    updateESPStatusBySocketId: async (socket_id, status) => {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE esp_status SET work_status = ?, status = ?, socket_id = NULL WHERE socket_id = ?`,
                [status, "offline", socket_id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    // **🔥 获取下一个待处理任务**
    getNextPendingTask: async () => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM task_status 
                WHERE status = 'Not Completed' 
                ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC 
                LIMIT 1`, 
                [], 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    // **🔥 获取 ESP 的 socket_id**
    getEspById: async (esp_id) => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT esp_id, socket_id FROM esp_status WHERE esp_id = ?`, 
                [esp_id], 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
};

module.exports = taskModel;
