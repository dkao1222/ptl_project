const path = require('path');
const ExcelJS = require('exceljs');
const pickModels = require('../models/pickModels');  // 导入 pickModels
const db = require('../models/database')

const ImportController = {
    pickUploadFile: async (req, res, io) => {
        //const io = req.app.get('io');

        if (!req.file) {
            return res.status(400).json({ success: false, message: "请上传 Excel 文件！" });
        }

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const workbook = new ExcelJS.Workbook();
        


        try {
            // 读取 Excel 文件
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.worksheets[0];

            let updatedData = []; // 用于保存更新后的数据

            // 逐行处理 Excel 数据
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) { // 跳过第一行表头
                const row = worksheet.getRow(rowNumber);
                const task_id = row.getCell(1).value
                const task_type = row.getCell(2).value ?? 'PICK'
                const location_type = row.getCell(3).value
                const location_bin = row.getCell(4).value
                const order_numberlo = row.getCell(5).value
                const po_number = row.getCell(6).value
                const sku_name = row.getCell(7).value 
                const sku_description = row.getCell(8).value
                const qty = row.getCell(9).value ?? 1
                const order_createtime = row.getCell(10).value ?? new Date()
                const po_createtime = row.getCell(11).value ?? new Date()
                const order_priority = row.getCell(12).value ?? 1
                const task_priority = row.getCell(13).value ?? 1

                if (task_id) {
                    // 插入任务数据
                    db.run(
                        `INSERT INTO task_status (
                            task_id, task_type, location_type, location_bin, 
                            order_numberlo, po_number, sku_name, sku_description, qty, 
                            order_createtime, po_createtime, order_priority, task_priority
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            task_id, task_type, location_type, location_bin, 
                            order_numberlo, po_number, sku_name, sku_description, qty, 
                            order_createtime, po_createtime, order_priority, task_priority,
                        ],
                        (err) => {
                            if (err) {
                                console.error("数据库写入错误:", err);
                            } else {
                                updatedData.push({
                                    task_id, task_type, location_type, location_bin, 
                                    order_numberlo, po_number, sku_name, sku_description, qty, 
                                    order_createtime, po_createtime, order_priority, task_priority
                                    
                                });
                            }
                        }
                    );
                }
            }

            // 查询最新的任务数据（pick_task 表中的所有数据）
            pickModels.pick_task((err, tasks) => {
                if (err) {
                    console.error("查询数据失败:", err);
                    return res.status(500).json({ success: false, message: "查询数据库失败" });
                }

                // **从 req.app 获取 io**
                const io = req.app.get('io');

                // 发送成功的通知到客户端，并附带最新查询的数据
                if (io && typeof io.emit === 'function') {
                    io.emit('file-uploaded', { 
                        success: true, 
                        message: "Excel(io) 数据导入成功！", 
                        data: tasks // 将查询到的数据发送给客户端
                    });
                }

                // 返回 API 响应，包括导入成功的消息和最新数据
                res.json({ success: true, message: "Excel(res) 数据导入成功！", data: tasks });
            });
        } catch (err) {
            console.error("解析 Excel 失败:", err);
            res.status(500).json({ success: false, message: "文件解析失败" });
        }
    }
};

module.exports = ImportController;
