#include <WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <FastLED.h>

using namespace websockets;

#define LED_PIN 12          // WS2812 LED 数据引脚
#define NUM_LEDS 10         // LED 數量
#define BUTTON_PIN 14       // 自動復位開關（任務完成確認）

CRGB leds[NUM_LEDS];

const char* ssid = "host-Dragon";  
const char* password = "home-share001";
const char* serverHost = "192.168.0.143";  
const int serverPort = 8080;
const char* socketPath = "/socket.io/?EIO=3&transport=websocket";
const char* heartbeatUrl = "http://192.168.0.143:8080/heartbeat_mode";

WebsocketsClient client;
String esp_id = "";

/** 📡 获取 ESP32 唯一 ID **/
String getChipID() {
    uint64_t chipid = ESP.getEfuseMac();
    return String((uint32_t)(chipid >> 32), HEX) + String((uint32_t)chipid, HEX);
}

/** 🔆 LED 狀態控制 **/
void setLEDColor(CRGB color) {
    fill_solid(leds, NUM_LEDS, color);
    FastLED.show();
}

/** 📡 發送 HTTP 心跳 **/
void sendHeartbeat() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(heartbeatUrl);
        http.addHeader("Content-Type", "application/json");

        String payload = "{\"esp_id\":\"" + esp_id + "\"}";
        Serial.println("📡 正在发送 HTTP 心跳: " + payload);

        int httpResponseCode = http.POST(payload);
        Serial.println("📡 HTTP 心跳回應: " + String(httpResponseCode));

        if (httpResponseCode > 0) {
            Serial.println("✅ 心跳成功发送");
        } else {
            Serial.println("❌ 心跳发送失败: " + String(httpResponseCode));
        }

        http.end();
    } else {
        Serial.println("❌ WiFi 断开，无法发送 HTTP 心跳");
    }
}

/** 📩 处理服务器消息 **/
void onMessageCallback(WebsocketsMessage message) {
    Serial.print("📩 收到服务器消息: ");
    Serial.println(message.data());

    String data = message.data();

    if (!data.startsWith("42[")) {
        Serial.println("⚠️ 非任务相关消息，跳过...");
        return;
    }

    data = data.substring(2);

    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, data);

    if (error) {
        Serial.print("❌ JSON 解析失败: ");
        Serial.println(error.f_str());
        return;
    }

    String event = doc[0].as<String>();
    if (event == "task-confirmation") {
        String received_task_id = doc[1]["task_id"].as<String>();

        Serial.printf("📌 任务 %s 需要确认，等待按鈕按下...\n", received_task_id.c_str());

        setLEDColor(CRGB::Yellow);  // 🔥 提示需要確認，黃燈閃爍
        while (digitalRead(BUTTON_PIN) == HIGH) { 
            delay(100);  // 等待按鈕被按下
        }

        Serial.println("✅ 按钮按下，任务完成！");

        // **🔥 发送任务完成通知**
        String completeTaskJson = "42[\"task-completed\", {\"esp_id\":\"" + esp_id + "\", \"task_id\":\"" + received_task_id + "\"}]";
        client.send(completeTaskJson);
        Serial.println("✅ 任务完成通知已发送");

        // **🔥 任务完成 → 綠燈**
        setLEDColor(CRGB::Green);
        delay(2000);
        setLEDColor(CRGB::Black);  // 熄滅燈光
    } else {
        Serial.println("⚠️ 未知事件，跳过...");
    }
}

/** 🔄 处理 WebSocket 事件 **/
void onEventsCallback(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("✅ WebSocket 连接成功！");
        setLEDColor(CRGB::Blue); // **待機（藍燈）**
        client.send("42[\"device-connect\", {\"esp_id\":\"" + esp_id + "\"}]");
        sendPing();
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("❌ WebSocket 断开连接，尝试重新连接...");
        setLEDColor(CRGB::Red); // **異常（紅燈閃爍）**
    }
}

/** ✅ 连接 WebSocket **/
bool connectWebSocket() {
    Serial.println("🔄 连接 WebSocket 服务器...");

    if (client.available()) {
        Serial.println("✅ WebSocket 仍然连接中，跳过重连...");
        return true;
    }

    String ws_url = String("ws://") + serverHost + ":" + String(serverPort) + socketPath;
    bool connected = client.connect(ws_url);

    if (connected) {
        Serial.println("✅ WebSocket 已成功连接！");
        sendPing();
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

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);  // **自動復位開關**
    
    // **🔆 初始化 LED**
    FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
    setLEDColor(CRGB::Black); // **設備啟動，LED 关闭**
    
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

    // **发送 HTTP 心跳**
    sendHeartbeat();
}

void loop() {
    static unsigned long lastPingTime = 0;
    static unsigned long lastHeartbeatTime = 0;
    static unsigned long lastReconnectAttempt = 0;

    if (millis() - lastPingTime > 600000) {  // **10 分钟发送 `ping`**
        sendPing();
        lastPingTime = millis();
    }

    if (millis() - lastHeartbeatTime > 300000) {  // **5 分钟发送 HTTP 心跳**
        sendHeartbeat();
        lastHeartbeatTime = millis();
    }

    if (!client.available() && millis() - lastReconnectAttempt > 10000) {  
        Serial.println("❌ WebSocket 未连接，10 秒后尝试重新连接...");
        lastReconnectAttempt = millis();
        connectWebSocket();
    }

    if (client.available()) {
        client.poll();
    }

    delay(100);
}
