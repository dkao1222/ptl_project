const express = require("express");

const http = require("http");
const app = require('./routers/app')
const { Server } = require("socket.io");

//const app = express();
const sappServer = http.createServer(app);

let pingIntervalTime = 5 * 60 * 1000
let pingTimeoutTime = 10 * 60 * 1000

// **🔥 强制使用 WebSocket，避免 `Not authorized` 问题**
const io = new Server(sappServer, {
    transports: ["websocket"],  // ✅ 只允许 WebSocket 连接，禁用 `polling`
    pingInterval: pingIntervalTime,  // ✅ 每 5 分钟 (300,000 毫秒) 发送一次 ping
    pingTimeout: pingTimeoutTime,   // ✅ 10 分钟 (600,000 毫秒) 内无 pong 断开连接
    cors: { origin: "*" },  // ✅ 允许所有来源连接
    allowEIO3: true  // ✅ 兼容 Engine.IO v3（防止 `Not Authorized`）
});

// **🟢 监听 ESP32 连接**
io.on("connection", (socket) => {
    console.log(`✅ ESP 设备连接成功: ${socket.id}`);

    // **🔥 确保 ESP 发送 `device-connect` 事件**
    socket.on("device-connect", (data) => {
        console.log(`📡 ESP 连接: ${JSON.stringify(data)}`);
        socket.emit("ack", { success: true, message: "ESP 连接成功" });
    });

    // **🔥 监听 ESP32 的 `ping` 事件**
    socket.on("ping", (data) => {
        console.log(`📡 收到 ESP 的 Ping: ${JSON.stringify(data)}`);
        socket.emit("pong", { success: true, message: "Pong received" });
    });

    // **🔥 监听任务完成**
    socket.on("complete-task", (data) => {
        console.log(`✅ 任务完成: ESP ${data.esp_id}, 任务 ${data.task_id}`);
        io.emit("task-completed", { success: true, esp_id: data.esp_id, task_id: data.task_id });
    });

    // **🔥 监听断开连接**
    socket.on("disconnect", (reason) => {
        console.log(`❌ ESP 设备断开连接: ${socket.id} - ${reason}`);
    });
});

// **✅ 监听 8080 端口**
sappServer.listen(8080, () => {
    console.log("✅ Server running at http://192.168.0.143:8080");
});
