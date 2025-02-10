

// taskController.js - 任务控制器，按照 MVC 结构优化

const db = require('../models/database');
const taskModel = require('../models/taskModels');

const taskController = {
    assignTask: async (req, res) => {
        try {
            // 获取所有在线的 ESP 设备
            const onlineEspIds = await taskModel.getOnlineESP();
            if (!onlineEspIds.length) return res.status(400).json({ error: "没有在线的 ESP 设备" });

            // 获取所有未完成任务
            let pendingTasks = await taskModel.getMultiplePendingTasks();
            if (!pendingTasks.length) return res.status(400).json({ error: "没有待处理任务" });

            // 任务分配队列，只有 ESP 设备完成任务后才会分配新任务
            let assignedTasks = {};
            let availableEsps = [...onlineEspIds];

            for (let task of pendingTasks) {
                if (availableEsps.length === 0) break; // 等待 ESP 设备完成任务后再分配
                
                let esp_id = availableEsps.shift(); // 取出空闲的 ESP 设备
                assignedTasks[esp_id] = task;

                await taskModel.assignTaskToESP(esp_id, task.id);
                await taskModel.updateESPStatus(esp_id, 'busy');
                console.log(`✅ 任务 ${task.task_id} 分配给 ESP: ${esp_id}`);
            }

            // 监听 ESP 任务完成状态
            taskModel.listenForTaskCompletion(async (esp_id) => {
                if (pendingTasks.length > 0) {
                    let nextTask = pendingTasks.shift();
                    await taskModel.assignTaskToESP(esp_id, nextTask.id);
                    await taskModel.updateESPStatus(esp_id, 'busy');
                    console.log(`✅ 任务 ${nextTask.task_id} 重新分配给 ESP: ${esp_id}`);
                } else {
                    await taskModel.updateESPStatus(esp_id, 'idle');
                }
            });

            // 触发 WebSocket 事件，通知前端更新
            const io = req.app.get('io');
            if (io) {
                io.emit('update-task', { success: true, assignments: assignedTasks });
            }

            res.json({ success: true, assignments: assignedTasks });

        } catch (err) {
            console.error("❌ 任务分配错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    }
};

module.exports = taskController;