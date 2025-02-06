const pickController = {
    pick_mode: async(req, res) => {
        res.render('main.ejs', {title: 'PICK options', options: 'pick'})
    }
}

module.exports = pickController;