const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./routers/app');  // 导入 app.js 中的 Express 应用

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 socket.io
const io = socketIo(server);

// 将 io 实例传递给 Express 应用
app.set('io', io);

// 启动服务器监听 5000 端口
server.listen(5000, () => {
    console.log('Server running at http://localhost:5000');
});
