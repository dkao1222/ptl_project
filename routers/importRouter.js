const express = require('express');
const multer = require('multer');
const path = require('path')

const ImportController = require(path.resolve(__dirname, '../controllers/importController'));

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // 上传文件存放目录

router.post('/pick/import_file', upload.single('file'), ImportController.pickUploadFile);

module.exports = router;