const express = require('express');
const multer = require('multer');
const path = require('path')

const ImportController = require(path.resolve(__dirname, '../controllers/importController'));

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // 上传文件存放目录

router.post('/pick/import_file', upload.single('file'), ImportController.pickUploadFile);


// 文件上传处理路由
router.post('/upload', (req, res) => {
    // 引入 ImportController 并传递 io 参数
    require('./controllers/ImportController').pickUploadFile(req, res, io);
});

module.exports = router;