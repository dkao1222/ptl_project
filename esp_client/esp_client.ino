#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <FastLED.h>

using namespace websockets;

#define LED_PIN 12       // WS2812 数据引脚
#define NUM_LEDS 10      // LED 数量
#define MICROSWITCH_PIN 12  // 定义微动开关 GPIO

CRGB leds[NUM_LEDS];

const char* ssid = "host-Dragon";  
const char* password = "home-share001";
const char* serverHost = "192.168.0.143";  
const int serverPort = 8080;
const char* socketPath = "/socket.io/?EIO=3&transport=websocket";
const char* heartbeatUrl = "http://192.168.0.143:8080/heartbeat_mode";

WebsocketsClient client;
String esp_id = "";
unsigned long lastReconnectAttempt = 0;

/** 📡 获取 ESP32 唯一 ID **/
String getChipID() {
    uint64_t chipid = ESP.getEfuseMac();
    return String((uint32_t)(chipid >> 32), HEX) + String((uint32_t)chipid, HEX);
}

/** 🔆 LED 控制 **/
void setLEDColor(CRGB color) {
    fill_solid(leds, NUM_LEDS, color);
    FastLED.show();
}

/** 📩 处理服务器消息 **/
void onMessageCallback(WebsocketsMessage message) {
    Serial.print("📩 收到服务器消息: ");
    Serial.println(message.data());

    String data = message.data();

    // **🔥 过滤非 JSON 数据**
    if (!data.startsWith("42[")) {
        Serial.println("⚠️ 非任务相关消息，跳过...");
        return;
    }

    // **🔥 去除 Socket.IO 前缀 `42`**
    data = data.substring(2);

    // **🔥 解析 JSON**
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, data);
    if (error) {
        Serial.println("❌ JSON 解析失败: " + String(error.c_str()));
        return;
    }

    // **🔥 解析事件**
    String event = doc[0].as<String>();
    if (event == "task-assigned") {
        String task_id = doc[1]["task_id"].as<String>();
        Serial.printf("📌 任务分配: %s\n", task_id.c_str());

        // **🔥 任务状态指示**
        setLEDColor(CRGB::Green);  // **任务分配 → 绿色**
        delay(1000);
        setLEDColor(CRGB::Yellow); // **任务执行中 → 黄色**
        //delay(5000); // **模拟任务执行**

        Serial.println("🔄 等待微动开关按下确认任务完成...");
        while (digitalRead(MICROSWITCH_PIN) == HIGH) {
            delay(100);  // 持续检查
        }

        Serial.println("✅ 微动开关触发，任务完成！");

        // **🔥 发送任务完成通知**
        String completeTaskJson = "42[\"task-completed\", {\"esp_id\":\"" + esp_id + "\", \"task_id\":\"" + task_id + "\"}]";
        client.send(completeTaskJson);
        Serial.println("✅ 任务完成通知已发送");

        // **🔥 任务完成 → 白色闪烁**
        for (int i = 0; i < 3; i++) {
            setLEDColor(CRGB::White);
            delay(500);
            setLEDColor(CRGB::Black);
            delay(500);
        }
    } else {
        Serial.println("⚠️ 未知事件，跳过...");
    }
}

/** 🔄 处理 WebSocket 事件 **/
void onEventsCallback(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("✅ WebSocket 连接成功！");
        setLEDColor(CRGB::Blue); // **连接成功 → 蓝色**

        // 🔥 **发送 `device-connect` 事件，确保服务器正确识别**
        client.send("42[\"device-connect\", {\"esp_id\":\"" + esp_id + "\"}]");
        sendPing();
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("❌ WebSocket 断开连接，尝试重新连接...");
        setLEDColor(CRGB::Red); // **断开连接 → 红色**
    }
}


/** ✅ 连接 WebSocket **/
bool connectWebSocket() {
    Serial.println("🔄 连接 WebSocket 服务器...");

    String ws_url = String("ws://") + serverHost + ":" + String(serverPort) + socketPath;
    bool connected = client.connect(ws_url);

    if (connected) {
        Serial.println("✅ WebSocket 已成功连接！");
    } else {
        Serial.println("❌ WebSocket 连接失败！");
    }

    return connected;
}

/** 📡 发送 Ping **/
void sendPing() {
    client.send("42[\"ping\", {\"esp_id\":\"" + esp_id + "\"}]");
    Serial.println("📡 已发送 Ping");
}

/** 📡 发送 HTTP 心跳 **/
void sendHeartbeat() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(heartbeatUrl);
        http.addHeader("Content-Type", "application/json");

        String payload = "{\"esp_id\":\"" + esp_id + "\"}";
        int httpResponseCode = http.POST(payload);
        Serial.println("📡 心跳回應: " + String(httpResponseCode));
        http.end();
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(MICROSWITCH_PIN, INPUT_PULLUP);  // 微动开关默认 HIGH
    // **🔆 初始化 LED**
    FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
    setLEDColor(CRGB::Black); // **🔥 设备启动，LED 关闭**
    
    // **📶 连接 WiFi**
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("🔄 连接 WiFi 中...");
    }
    Serial.print("✅ WiFi 连接成功，ESP32 IP 地址：");
    Serial.println(WiFi.localIP());

    // **📡 获取 ESP32 唯一 ID**
    esp_id = getChipID();
    Serial.print("📡 设备 ID: ");
    Serial.println(esp_id);

    // **📡 WebSocket 初始化**
    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);

    // **🔄 连接 WebSocket**
    connectWebSocket();
}

void loop() {
    client.poll();  // ✅ 持续监听 WebSocket 消息

    static unsigned long lastPingTime = 0;
    static unsigned long lastHeartbeatTime = 0;

    if (millis() - lastPingTime > 600000) {  // ✅ 10分钟发送 `ping`
        sendPing();
        lastPingTime = millis();
    }

    if (millis() - lastHeartbeatTime > 300000) {  // ✅ 5分钟发送 `HTTP 心跳`
        sendHeartbeat();
        lastHeartbeatTime = millis();
    }

    // **🔥 断线后，每 5 秒尝试重新连接**
    if (!client.available() && millis() - lastReconnectAttempt > 5000) {
        Serial.println("❌ WebSocket 未连接，5 秒后尝试重新连接...");
        delay(5000);
        connectWebSocket();
    }
}
