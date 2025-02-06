const systemControllers = {
    System_mode: async(req, res) => {
        res.render('main.ejs', {title: 'System options', options: 'system'})
    }
    
}

module.exports = systemControllers