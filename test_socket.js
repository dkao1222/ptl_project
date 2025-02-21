const io = require("socket.io-client");
const socket = io("http://192.168.0.143:5000");
socket.on("connect", () => {
    console.log("✅ 成功连接服务器");
    socket.emit("ping", { esp_id: "test_device" });
});
