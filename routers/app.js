const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require("ejs");

require('../models/database')
const checkOfflineDevices = require('../util/checkOffline')

const systemRouter = require('../routers/systemRouter')
const ptlRoter = require('../routers/ptlRouter')
const pickRouter = require('../routers/pickRouter')

const heartRouter = require('../routers/heartRouter')

const app = express();

app.use(express.json());  // ✅ 確保 Express 可以解析 JSON
app.use(express.urlencoded({ extended: true }));  // ✅ 允許解析 URL-encoded 格式

app.engine('ejs', ejs.__express);
app.set('views', path.resolve(__dirname, '../views'))



app.use('/d3', express.static(path.join(__dirname, '../node_modules/d3/dist')))
app.use('/jquery', express.static(path.join(__dirname, '../node_modules/jquery')))
app.use('/public', express.static(path.join(__dirname, '../public')))

app.use('/',heartRouter)
app.use('/',systemRouter)
app.use('/',ptlRoter)
app.use('/',pickRouter)

app.get('/', function(req, res) {
    res.render('main.ejs', {title: 'SmartView', options: 'home'})

})



module.exports = app;