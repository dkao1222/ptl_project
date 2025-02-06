const path = require('path');
const ExcelJS = require('exceljs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const ImportController = {
    uploadFile: async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "请上传 Excel 文件！" });
        }

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const workbook = new ExcelJS.Workbook();

        try {
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.worksheets[0];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // 跳过表头

                const task_id = row.getCell(2).value;
                const task_type = row.getCell(3).value;
                const location_type = row.getCell(4).value;
                const location_bin = row.getCell(5).value;
                const order_numberlo = row.getCell(6).value;
                const po_number = row.getCell(7).value;
                const sku_name = row.getCell(8).value;
                const sku_description = row.getCell(9).value;
                const qty = row.getCell(10).value;
                const order_createtime = row.getCell(11).value;
                const po_createtime = row.getCell(12).value;
                const order_priority = row.getCell(13).value;
                const task_priority = row.getCell(14).value;
                const esp_id = row.getCell(15).value;
                const start_time = row.getCell(16).value;
                const end_time = row.getCell(17).value;
                const status = row.getCell(18).value;

                if (task_id) {
                    db.run(
                        `INSERT INTO task_temp (
                            task_id, task_type, location_type, location_bin, 
                            order_numberlo, po_number, sku_name, sku_description, qty, 
                            order_createtime, po_createtime, order_priority, task_priority, 
                            esp_id, start_time, end_time, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            task_id, task_type, location_type, location_bin, 
                            order_numberlo, po_number, sku_name, sku_description, qty, 
                            order_createtime, po_createtime, order_priority, task_priority, 
                            esp_id, start_time, end_time, status
                        ],
                        (err) => {
                            if (err) console.error("数据库写入错误:", err);
                        }
                    );
                }
            });

            res.json({ success: true, message: "Excel 数据导入成功！" });
        } catch (err) {
            console.error("解析 Excel 失败:", err);
            res.status(500).json({ success: false, message: "文件解析失败" });
        }
    }
};

module.exports = ImportController;
