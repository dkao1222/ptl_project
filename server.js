const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./routers/app');  // 导入 Express 应用

const server = http.createServer(app);
const io = socketIo(server, {
    pingInterval: 25000,  // 每 25 秒发送一次 ping
    pingTimeout: 60000,   // 60 秒未收到 pong 才断开连接
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// **🔥 监听 WebSocket 连接**
io.on('connection', (socket) => {
    console.log(`✅ ESP 设备连接成功: ${socket.id}`);
    socket.on("message", (data) => {
        console.log(`📡 收到 ESP32 的 Ping:`, data);
        socket.emit("pong", { success: true, message: "Pong received" });
    });
    // **🔥 监听 ESP32 发送的 Ping**
    socket.on("event", (data) => {
        console.log(`📡 收到 ESP32 的 Ping:`, data);
        socket.emit("pong", { success: true, message: "Pong received" });
    });
    socket.on('ping', (reason) => {
        console.log(`❌ ESP ping: ${socket.id} - ${reason}`);
    });

    // **🔥 监听任务完成**
    socket.on('task-completed', (data) => {
        console.log(`✅ 任务完成: ESP ${data.esp_id}, 任务 ${data.task_id}`);
        io.emit('update-task', { success: true, task_id: data.task_id, esp_id: data.esp_id });
    });

    // **🔥 监听 ESP 断开连接**
    socket.on('disconnect', (reason) => {
        console.log(`❌ ESP 设备断开连接: ${socket.id} - ${reason}`);
    });

    socket.onAny((reason)=>{
        console.log(reason)
    })
});

server.listen(5000, '0.0.0.0', () => {
    console.log('✅ Server running at http://192.168.0.143:5000');
});
