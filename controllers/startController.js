const startController = {
    pick_start: (req, res)=> {
        res.render('main.ejs', {title: 'Pick task', options: 'Pick_start'})
    }
}

module.exports = startController