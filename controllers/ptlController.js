const ptlController = {
    PTL_mode: async(req, res) => {
        res.render('main.ejs', {title: 'PTL options', options: 'ptl'})
    }
}

module.exports = ptlController;