const db = require('../models/database');
const taskModel = require('../models/taskModels');

const taskController = {
    assignTask: async (req, res) => {
        try {
            console.log("📡 正在获取任务...");

            // **🔥 获取所有 "未完成" 任务**
            let tasks = await taskModel.getPendingTasks();
            if (!tasks.length) return res.status(400).json({ error: "未找到待处理任务" });

            // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备**
            let availableEsps = await taskModel.getAvailableESP();
            if (!availableEsps.length) return res.status(400).json({ error: "没有空闲的 ESP 设备" });

            let assignedTasks = {};
            let taskQueue = [...tasks];
            let espQueue = [...availableEsps];

            console.log("📡 可用 ESP 设备:", availableEsps.map(e => e.esp_id));

            while (taskQueue.length > 0 && espQueue.length > 0) {
                let task = taskQueue.shift();  // 取出一个任务
                let esp = espQueue.shift();    // 取出一个 ESP 设备

                // **🔥 在数据库中更新任务的 esp_id**
                await taskModel.assignTaskToESP(esp.esp_id, task.id);
                await taskModel.updateESPStatus(esp.esp_id, 'busy');

                assignedTasks[esp.esp_id] = task;

                console.log(`📡 任务 ${task.task_id} 分配至 ESP ${esp.esp_id}`);

                // **🔥 通过 WebSocket 发送任务**
                const io = req.app.get("io");
                if (io && esp.socket_id) {
                    console.log(`📡 发送任务到 ESP ${esp.esp_id} - Socket ID: ${esp.socket_id}`);
                    io.to(esp.socket_id).emit("task-assigned", { success: true, task });
                }
            }

            console.log("✅ 任务预分配完成:", assignedTasks);
            res.json({ success: true, assignments: assignedTasks });

        } catch (err) {
            console.error("❌ 任务分配错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    },

    completeTask: async (req, res) => {
        try {
            const { esp_id, task_id } = req.body;
            if (!esp_id || !task_id) return res.status(400).json({ error: "缺少 esp_id 或 task_id" });
    
            console.log(`✅ 任务 ${task_id} 由 ESP ${esp_id} 完成`);
    
            let task = await taskModel.getTaskById(task_id);
            if (!task || task.esp_id !== esp_id) {
                return res.status(403).json({ error: "该任务未分配给当前 ESP，无法完成" });
            }
    
            await taskModel.markTaskCompleted(task_id);
            await taskModel.updateESPStatus(esp_id, 'idle');
    
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

    validateTask: async (req, res) => {
        try {
            const { esp_id, task_id, taskInput } = req.body;
    
            console.log(`📡 验证任务: ESP ${esp_id} 任务 ${task_id} 输入: ${taskInput}`);
    
            let task = await taskModel.getTaskByEsp(esp_id);
            console.log(`📡 任务详情:`, task);
    
            if (!task) {
                return res.status(400).json({ success: false, error: "当前 ESP 没有进行中的任务！" });
            }
    
            if (task.task_id !== task_id) {
                console.warn(`⚠️ 任务 ID 不匹配！服务器任务 ID: ${task.task_id}, 输入任务 ID: ${task_id}`);
                return res.status(400).json({ success: false, error: "任务 ID 不匹配！" });
            }
    
            let esp = await taskModel.getEspById(esp_id);
            console.log(`📡 ESP 设备详情:`, esp);
    
            if (!esp || !esp.socket_id) {
                console.warn(`⚠️ ESP ${esp_id} 未在线或 Socket ID 无效`);
                return res.status(400).json({ success: false, error: "ESP 未连接或 Socket ID 无效" });
            }
    
            console.log(`📡 任务匹配成功，通知 ESP ${esp_id} 按下按钮`);
            const io = req.app.get("io");
            io.to(esp.socket_id).emit("task-confirmation", { success: true, esp_id, task_id });
    
            return res.json({ success: true, message: "任务匹配成功！请按下 ESP 上的确认按钮。" });
    
        } catch (err) {
            console.error("❌ 任务验证错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    }
    
    
};

module.exports = taskController;
