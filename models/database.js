const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./DB/main.db', (err) => {
    if (err) {
        console.error('SQLite Connection Error:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});


// 创建表（如果不存在）
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS esp_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        esp_id TEXT unique,
        enable text CHECK(enable IN ('ON', 'OFF')),
        status TEXT DEFAULT 'offline',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE table if not exists button_press (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        esp_id TEXT,
        status TEXT CHECK(status IN ('ON', 'OFF')),
        press_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE if not exists "task_status" (
        "id"	INTEGER UNIQUE,
        "task_id"	TEXT,
        "task_type"	TEXT,
        "location_type"	TEXT,
        "location_bin"	TEXT,
        "order_numberlo"	TEXT,
        "po_number"	TEXT,
        "sku_name"	TEXT,
        "sku_description"	TEXT,
        "qty"	NUMERIC(18,4),
        "order_createtime"	TIMESTAMP,
        "po_createtime"	TIMESTAMP,
        "order_priority"	INTEGER ,
        "task_priority"	INTEGER ,
        "esp_id"	TEXT,
        "start_time"	TIMESTAMP,
        "end_time"	TIMESTAMP,
        "status"	TEXT DEFAULT 'Not Completed' CHECK(status IN ('Completed', 'Not Completed')),
        Import_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY("id" AUTOINCREMENT)
    );`)

});


module.exports = db;