// taskController.js - 任务控制器，按照 MVC 结构优化

const db = require('../models/database');
const taskModel = require('../models/taskModels');

const taskController = {
    assignTask: async (req, res) => {
        try {
            const { taskInput } = req.body;
            if (!taskInput) return res.status(400).json({ error: "未输入 Task ID 或 SKU" });

            // 获取在线 ESP 设备
            const onlineEspIds = await taskModel.getOnlineESP();
            if (!onlineEspIds.length) return res.status(400).json({ error: "没有在线的 ESP 设备" });

            // 获取所有符合条件的任务，并按照优先级排序
            let tasks = await taskModel.getTasksByInput(taskInput);
            if (!tasks.length) return res.status(400).json({ error: "未找到匹配任务" });

            let assignedTasks = {};
            let availableEsps = [...onlineEspIds];

            for (let task of tasks) {
                if (availableEsps.length === 0) break; // 如果没有可用 ESP，停止分配
                let esp_id = availableEsps.shift(); // 取一个空闲 ESP

                await taskModel.assignTaskToESP(esp_id, task.id);
                await taskModel.updateESPStatus(esp_id, 'busy');
                assignedTasks[esp_id] = task;
            }

            console.log("✅ 任务分配完成:", assignedTasks);

            const io = req.app.get("io");
            if (io) {
                io.emit("update-task", { success: true, assignments: assignedTasks });
            }

            res.json({ success: true, assignments: assignedTasks });

        } catch (err) {
            console.error("❌ 任务分配错误:", err);
            res.status(500).json({ error: "服务器错误" });
        }
    }
};

module.exports = taskController;