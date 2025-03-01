#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <FastLED.h>

using namespace websockets;

#define LED_PIN 12        // WS2812 LED GPIO
#define NUM_LEDS 10       // LED 數量
#define MICROSWITCH_PIN 4 // ✅ 使用 GPIO 4，避免 GPIO 12 問題

CRGB leds[NUM_LEDS];

const char* ssid = "host-Dragon";  
const char* password = "home-share001";
const char* serverHost = "192.168.0.143";  
const int serverPort = 8080;
const char* socketPath = "/socket.io/?EIO=3&transport=websocket";
const char* heartbeatUrl = "http://192.168.0.143:8080/heartbeat_mode";

WebsocketsClient client;
String esp_id = "";
bool isConnected = false;
unsigned long lastPingTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastButtonPressTime = 0; // **去彈跳用**

/** 📡 取得 ESP32 ID **/
String getChipID() {
    uint64_t chipid = ESP.getEfuseMac();
    return String((uint32_t)(chipid >> 32), HEX) + String((uint32_t)chipid, HEX);
}

/** 🔆 LED 控制 **/
void setLEDColor(CRGB color) {
    fill_solid(leds, NUM_LEDS, color);
    FastLED.show();
}

/** 📩 處理伺服器消息 **/
void onMessageCallback(WebsocketsMessage message) {
    Serial.print("📩 收到伺服器消息: ");
    Serial.println(message.data());

    String data = message.data();
    if (!data.startsWith("42[")) {
        Serial.println("⚠️ 非 JSON 資料，忽略...");
        return;
    }
    data = data.substring(2);

    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, data);
    if (error) {
        Serial.println("❌ JSON 解析失敗: " + String(error.c_str()));
        return;
    }

    String event = doc[0].as<String>();
    if (event == "task-assigned") {
        String task_id = doc[1]["task_id"].as<String>();
        Serial.printf("📌 任務分配: %s\n", task_id.c_str());

        setLEDColor(CRGB::Green); // **綠色：任務接收**
        delay(1000);
        setLEDColor(CRGB::Yellow); // **黃色：等待完成**
    } else {
        Serial.println("⚠️ 未知事件，忽略...");
    }
}

/** 🔄 WebSocket 事件處理 **/
void onEventsCallback(WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("✅ WebSocket 連接成功！");
        setLEDColor(CRGB::Blue);
        isConnected = true;
        client.send("42[\"device-connect\", {\"esp_id\":\"" + esp_id + "\"}]");
        sendPing();
    } else if (event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("❌ WebSocket 斷開，嘗試重新連接...");
        setLEDColor(CRGB::Red);
        isConnected = false;
        reconnectWebSocket();
    }
}

/** ✅ 連接 WebSocket **/
void connectWebSocket() {
    Serial.println("🔄 連接 WebSocket 伺服器...");

    String ws_url = String("ws://") + serverHost + ":" + String(serverPort) + socketPath;
    bool connected = client.connect(ws_url);

    if (connected) {
        Serial.println("✅ WebSocket 連接成功！");
    } else {
        Serial.println("❌ WebSocket 連接失敗！");
    }
}

/** 🔄 嘗試重新連接 **/
void reconnectWebSocket() {
    while (!isConnected) {
        Serial.println("⏳ 嘗試重新連接 WebSocket...");
        connectWebSocket();
        delay(3000);
    }
}

/** 📡 送出 `ping` **/
void sendPing() {
    client.send("42[\"ping\", {\"esp_id\":\"" + esp_id + "\"}]");
    Serial.println("📡 已送出 Ping");
}

/** 📡 送出 `heartbeat` **/
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

/** 📌 處理按鈕按下事件 **/
void IRAM_ATTR handleButtonPress() {
    unsigned long currentMillis = millis();
    
    // **🔥 避免誤觸 (去彈跳)**
    if (currentMillis - lastButtonPressTime > 200) {
        lastButtonPressTime = currentMillis;
        Serial.println("✅ 按鈕按下，任務完成！");

        String completeTaskJson = "42[\"task-completed\", {\"esp_id\":\"" + esp_id + "\"}]";
        client.send(completeTaskJson);
        Serial.println("✅ 任務完成通知已發送");

        for (int i = 0; i < 3; i++) {
            setLEDColor(CRGB::White);
            delay(500);
            setLEDColor(CRGB::Black);
            delay(500);
        }
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(MICROSWITCH_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(MICROSWITCH_PIN), handleButtonPress, FALLING); // **🔥 按鈕瞬間按下時觸發**

    FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
    setLEDColor(CRGB::Black);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("🔄 連接 WiFi...");
    }
    Serial.println("✅ WiFi 連接成功：" + WiFi.localIP().toString());

    esp_id = getChipID();
    Serial.println("📡 ESP32 ID: " + esp_id);

    client.onMessage(onMessageCallback);
    client.onEvent(onEventsCallback);
    connectWebSocket();
    sendHeartbeat();
}

void loop() {
    client.poll();

    if (millis() - lastPingTime > 60000) {
        sendPing();
        lastPingTime = millis();
    }

    if (millis() - lastHeartbeatTime > 180000) {
        sendHeartbeat();
        lastHeartbeatTime = millis();
    }

    if (!client.available() && !isConnected) {
        reconnectWebSocket();
    }
}
