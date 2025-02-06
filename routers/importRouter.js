const express = require('express');
const multer = require('multer');
const ImportController = require('../controllers/importController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // 上传文件存放目录

router.post('/import_file', upload.single('file'), ImportController.uploadFile);

module.exports = router;