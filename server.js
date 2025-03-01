const express = require("express");

const http = require("http");
const app = require('./routers/app')
const taskModel = require('./models/taskModels')

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

app.set('io', io);

// **🟢 监听 ESP32 连接**
io.on("connection", (socket) => {
    console.log(`✅ ESP 设备连接成功: ${socket.id}`);

    // **🔥 确保 ESP 发送 `device-connect` 事件**
    // **🔥 监听 ESP 发送的 `device-connect`**
    socket.on("device-connect", async (data) => {
        const { esp_id } = data;
        console.log(`📡 设备 ${esp_id} 连接成功，Socket ID: ${socket.id}`);

        try {
            await taskModel.updateESPStatus(esp_id, "online", socket.id);
            console.log(`✅ ESP ${esp_id} 状态更新成功: status=online, socket_id=${socket.id}`);
        } catch (err) {
            console.error(`❌ 更新 ESP 设备状态失败:`, err);
        }
    });
    socket.on("register", async (data) => {
        console.log(`📡 ESP 注册: ${data.esp_id}, Socket ID: ${socket.id}`);
        await taskModel.updateESPStatus(data.esp_id, "online", socket.id);
    });

    // **🔥 监听 ESP32 的 `ping` 事件**
    socket.on("ping", (data) => {
        console.log(`📡 收到 ESP 的 Ping: ${JSON.stringify(data)}`);
        socket.emit("pong", { success: true, message: "Pong received" });
    });

    socket.on("task-assigned", (data) => {
        console.log(`📡 任务已分配至 ESP:`, data);
        socket.emit("new-task", data);  // 確保 ESP 端可以收到這個訊息
    });

    // **🔥 监听任务完成**
    // **🔥 监听任务完成**
    socket.on("task-completed", async (data) => {
        const { esp_id, task_id } = data;
        console.log(`✅ 任务 ${task_id} 由 ESP ${esp_id} 完成`);

        try {
            // **🔥 更新任务状态**
            await taskModel.markTaskCompleted(task_id);
            
            // **🔥 任务完成后，更新 ESP 设备为 `"idle"`**
            await taskModel.updateESPStatus(esp_id, "idle");

            // **🔥 通过 WebSocket 通知所有客户端**
            io.emit("task-completed", { success: true, esp_id, task_id });

            console.log(`✅ 任务 ${task_id} 完成，ESP ${esp_id} 设为 idle`);
        } catch (err) {
            console.error(`❌ 任务完成更新失败:`, err);
        }
    });


    // **🔥 监听 ESP 断开连接**
    socket.on("disconnect", async (reason) => {
        console.log(`❌ ESP 设备断开连接: ${socket.id} - ${reason}`);

        try {
            await taskModel.updateESPStatusBySocketId(socket.id, "offline");
            console.log(`📡 ESP 设备 ${socket.id} 已设为离线`);
        } catch (err) {
            console.error(`❌ 无法更新 ESP 设备状态:`, err);
        }
    });

    //socket.on('file-uploaded')
});

// **✅ 监听 8080 端口**
sappServer.listen(8080, () => {
    console.log("✅ Server running at http://192.168.0.143:8080");
});
