const db = require('../models/database');
const taskModel = require('../models/taskModels');

const taskController = {
    assignTask: async (req, res) => {
        try {
            console.log("📡 正在获取任务...");

            // **🔥 获取所有 "Not Completed" 任务**
            let tasks = await taskModel.getPendingTasks();
            if (!tasks.length) return res.status(400).json({ error: "未找到待处理任务" });

            // **🔥 获取所有 "在线 & 空闲" 的 ESP 设备**
            const availableEsps = await taskModel.getAvailableESP();
            if (!availableEsps.length) return res.status(400).json({ error: "没有空闲的 ESP 设备" });

            let assignedTasks = {};
            let taskQueue = [...tasks];  // 任务队列
            let espQueue = [...availableEsps]; // ESP 设备队列

            while (taskQueue.length > 0 && espQueue.length > 0) {
                let task = taskQueue.shift();  // 取出一个任务
                let esp = espQueue.shift();    // 取出一个 ESP 设备

                await taskModel.assignTaskToESP(esp.esp_id, task.id);
                await taskModel.updateESPStatus(esp.esp_id, 'busy');

                console.log("📡 分配的任务数据:", assignedTasks);
                assignedTasks[esp.esp_id] = task;
            }

            console.log("✅ 任务分配完成:", assignedTasks);

            // **🔥 通过 Socket.IO 发送任务到前端**
            const io = req.app.get("io");
            if (io) {
                io.emit("update-task", { success: true, assignments: assignedTasks });
            }

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

            // **🔥 更新任务状态**
            await taskModel.markTaskCompleted(task_id);
            await taskModel.updateESPStatus(esp_id, 'idle');

            // **🔥 检查是否有新的任务可以分配**
            let nextTask = await taskModel.getNextPendingTask();
            if (nextTask) {
                await taskModel.assignTaskToESP(esp_id, nextTask.id);
                await taskModel.updateESPStatus(esp_id, 'busy');

                // **🔥 通知前端任务已分配**
                const io = req.app.get("io");
                if (io) {
                    io.emit("update-task", {
                        success: true,
                        newAssignment: { esp_id, task: nextTask }
                    });
                }
            } else {
                console.log(`🟢 没有新的任务分配给 ESP ${esp_id}`);
            }

            // **🔥 通过 Socket.IO 发送任务完成通知**
            const io = req.app.get("io");
            if (io) {
                io.emit("task-completed", { success: true, esp_id, task_id });
            }

            res.json({ success: true, message: "任务完成" });

        } catch (err) {
            console.error("❌ 任务完成错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    }
};

module.exports = taskController;
