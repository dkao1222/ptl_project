//const sqlite3 = require('sqlite3').verbose();
const path = require('path')
const db = require(path.resolve(__dirname,'../models/database'))

const systemModels = {
    get_client: (callback) => {
        db.all('select * from esp_status order by last_updated desc', [], callback)
    },
    add_esp: (esp_id, enable, status, callback) => {
        db.run(`insert into esp_status (esp_id, enable, status) values (? , ?, ?)` , [esp_id, enable, status], callback)
    },
    change_esp:(esp_id, enable, status, callback) => {
        db.run(`Update esp_status
            set esp_id = ?
            , enable = ?
            , status = ?
        `, [esp_id, enable, status], callback)
    }

};

module.exports = systemModels