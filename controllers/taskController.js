const db = require('../models/database');
const taskModel = require('../models/taskModels');

const taskController = {
    assignTask: async (req, res) => {
        try {
            console.log("📡 正在获取任务...");

            // **🔥 获取所有 "未完成" 任务**
            let tasks = await taskModel.getPendingTasks();
            if (!tasks.length) return res.status(400).json({ error: "未找到待处理任务" });

            // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备（包含 socket_id）**
            const availableEsps = await taskModel.getAvailableESP();
            if (!availableEsps.length) return res.status(400).json({ error: "没有空闲的 ESP 设备" });

            let assignedTasks = {};
            let taskQueue = [...tasks];
            let espQueue = [...availableEsps];

            while (taskQueue.length > 0 && espQueue.length > 0) {
                let task = taskQueue.shift();
                let esp = espQueue.shift();

                // **🔥 分配任务到 ESP**
                await taskModel.assignTaskToESP(esp.esp_id, task.id);
                await taskModel.updateESPStatus(esp.esp_id, 'busy');

                assignedTasks[esp.esp_id] = task;

                // **🔥 透過 WebSocket 發送任務**
                const io = req.app.get("io");
                if (esp.socket_id) {
                    console.log(`📡 发送任务到 ESP ${esp.esp_id} - Socket ID: ${esp.socket_id}`);
                    io.to(esp.socket_id).emit("task-assigned", { success: true, task });
                } else {
                    console.log(`⚠️ ESP ${esp.esp_id} 没有有效的 socket_id，无法推送任务`);
                }
            }

            console.log("✅ 任务分配完成:", assignedTasks);
            res.json({ success: true, assignments: assignedTasks });

        } catch (err) {
            console.error("❌ 任务分配错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    },

    completeTask: async (req, res) => {
        try {
            const { esp_id, task_id } = req.body;
            if (!esp_id || !task_id) {
                return res.status(400).json({ error: "缺少 esp_id 或 task_id" });
            }
    
            console.log(`✅ 任务 ${task_id} 由 ESP ${esp_id} 完成`);
    
            // **🔥 確保 `task_id` 真的存在**
            let taskExists = await taskModel.getTaskById(task_id);
            if (!taskExists) {
                return res.status(404).json({ error: `任务 ID ${task_id} 不存在` });
            }
    
            // **🔥 更新任务状态**
            await taskModel.markTaskCompleted(task_id);
            await taskModel.updateESPStatus(esp_id, 'idle');
    
            // **🔥 通知 WebSocket**
            const io = req.app.get("io");
            if (io) {
                io.emit("task-completed", { success: true, esp_id, task_id });
            }
    
            res.json({ success: true, message: "任务完成" });
    
        } catch (err) {
            console.error("❌ 任务完成错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    },

    // **🔥 标记任务完成**
    markTaskCompleted: async (req, res) => {
        try {
            const { esp_id, task_id } = req.body;
            if (!esp_id || !task_id) return res.status(400).json({ error: "缺少 esp_id 或 task_id" });
    
            console.log(`✅ 任务 ${task_id} 由 ESP ${esp_id} 完成`);
    
            // **🔥 更新任务状态**
            await taskModel.markTaskCompleted(task_id);
    
            // **🔥 任务完成后，更新 ESP 设备为 `"idle"`**
            await taskModel.updateESPStatus(esp_id, "online");
    
            // **🔥 通过 WebSocket 通知任务完成**
            const io = req.app.get("io");
            if (io) {
                io.emit("task-completed", { success: true, esp_id, task_id });
            }
    
            res.json({ success: true, message: "任务完成" });
    
        } catch (err) {
            console.error("❌ 任务完成错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    },
    
};

module.exports = taskController;
