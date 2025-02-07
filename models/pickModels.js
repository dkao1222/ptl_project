const path = require('path')
const db = require(path.resolve(__dirname,'./database'))

const pickModels = {
    pick_task: (callback) => {
        db.all(`select * from task_status order by Import_datetime desc`,[] ,callback)
    },
    
    
}

module.exports = pickModels