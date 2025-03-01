const db = require('../models/database');

const taskModel = {
    // **🔥 获取所有 "未完成" 任务**
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

    // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备**
    // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备**
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

    // **🔥 预先分配任务到 ESP**
    assignTaskToESP: async (esp_id, task_id) => {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE task_status 
                SET esp_id = ?, start_time = CURRENT_TIMESTAMP, status = 'In Progress' 
                WHERE id = ?`, 
                [esp_id, task_id], 
                (err) => {
                    if (err) reject(err);
                    else resolve();
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
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    // **🔥 更新 ESP 设备状态**
    updateESPStatus: async (esp_id, status, socket_id = null) => {
        return new Promise((resolve, reject) => {
            let query = `UPDATE esp_status SET status = ?, work_status = ?`;
            let params = [status, status === "busy" ? "busy" : "idle"];
    
            if (status === "offline") {
                query += `, socket_id = NULL`;
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
                `UPDATE esp_status 
                 SET work_status = ?, status = ?, socket_id = NULL 
                 WHERE socket_id = ?`,
                [status === "offline" ? "idle" : "busy", status, socket_id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },
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
    // **🔥 获取任务详情**
    getTaskById: async (task_id) => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM task_status WHERE id = ?`, 
                [task_id], 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },
    
    getTaskByEsp: async (esp_id) => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM task_status WHERE esp_id = ? AND status = 'In Progress'`, 
                [esp_id], 
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    },
    getEspById: async (esp_id) => {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT esp_id, socket_id, status FROM esp_status WHERE esp_id = ?`, 
                [esp_id], 
                (err, row) => {
                    if (err) {
                        console.error("❌ 查询 ESP 设备 socket_id 失败:", err);
                        reject(err);
                    } else {
                        if (!row ) {
                            console.warn(`⚠️ ESP ${esp_id} 未在线，任务无法下发`);
                            resolve(null);
                        } else {
                            if (row.status == "offline") {
                                console.warn(`⚠️ ESP ${esp_id} 未在线，任务无法下发`);
                                resolve(null);
                            }
                            console.log(`📡 获取 ESP ${esp_id} 的 socket_id:`, row.socket_id);
                            resolve(row);
                        }
                    }
                }
            );
        });
    },
};

module.exports = taskModel;
