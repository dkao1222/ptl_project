const connectDB = require('../models/database');

const taskController = {
    assignTask: async (req, res) => {
        try {
            const db = await connectDB();

            // 取出一个未完成的任务
            const task = await db.get(`
                SELECT * FROM task_status 
                WHERE status = 'Not Completed' 
                ORDER BY task_priority DESC, order_priority DESC, order_createtime ASC 
                LIMIT 1
            `);

            if (!task) return res.status(400).send({ error: "没有待处理任务" });

            let conditionColumn = null;
            let conditionValue = null;

            // 选择唯一的匹配条件
            if (task.order_numberlo) {
                conditionColumn = "order_numberlo";
                conditionValue = task.order_numberlo;
            } else if (task.po_number) {
                conditionColumn = "po_number";
                conditionValue = task.po_number;
            } else if (task.sku_name) {
                conditionColumn = "sku_name";
                conditionValue = task.sku_name;
            } else if (task.location_type) {
                conditionColumn = "location_type";
                conditionValue = task.location_type;
            }

            if (!conditionColumn || !conditionValue) {
                return res.status(400).send({ error: "任务缺少匹配条件" });
            }

            // 查找是否有 ESP 已经在处理相同条件的任务
            let assignedEsp = await db.get(`
                SELECT esp_id FROM task_status 
                WHERE status = 'In Progress' 
                AND ${conditionColumn} = ? 
                LIMIT 1
            `, [conditionValue]);

            let esp_id = assignedEsp ? assignedEsp.esp_id : null;

            // 如果没有找到匹配的 ESP32，就找一个空闲的
            if (!esp_id) {
                let newEsp = await db.get("SELECT esp_id FROM esp_status WHERE status = 'idle' ORDER BY last_seen DESC");
                if (!newEsp) return res.status(400).send({ error: "没有可用的 ESP32 设备" });

                esp_id = newEsp.esp_id;
            }

            // 将该任务分配给该 ESP
            await db.run(`
                UPDATE task_status 
                SET esp_id = ?, start_time = CURRENT_TIMESTAMP, status = 'In Progress' 
                WHERE id = ?
            `, [esp_id, task.id]);

            // 更新 ESP 设备状态
            await db.run("UPDATE esp_status SET status = 'busy' WHERE esp_id = ?", [esp_id]);

            console.log(`✅ 任务 ${task.task_id} 分配给 ESP: ${esp_id}`);
            res.send({ success: true, esp_id, assigned_task: task });

        } catch (err) {
            console.error("❌ 任务分配错误:", err);
            res.status(500).send({ error: "服务器错误" });
        }
    }
};
