#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>  // WebSocket 客戶端
#include <FastLED.h>  // WS2812 LED 控制

// **📡 WiFi & 伺服器配置**
const char* ssid = "host-Dragon";  
const char* password = "home-share001";
const char* serverUrl = "http://192.168.0.143:5000";  
const char* socketServer = "192.168.0.143";  
const int socketPort = 5000;

// **🔵 WS2812 LED 設置**
#define LED_PIN 12
#define NUM_LEDS 10  
CRGB leds[NUM_LEDS];

// **🟡 微動開關**
#define BUTTON_PIN 4  

// **WebSocket 客戶端**
WebSocketsClient webSocket;

// **ESP 設備 ID**
String esp_id = "";
bool webSocketConnected = false;  // 追蹤 WebSocket 連線狀態

// **📡 獲取 ESP32 唯一序列號**
String getChipID() {
    uint64_t chipid = ESP.getEfuseMac();
    return String((uint32_t)(chipid >> 32), HEX) + String((uint32_t)chipid, HEX);
}

void setup() {
    Serial.begin(115200);
    
    // **WiFi 連接**
    connectWiFi();

    esp_id = getChipID();  // 設置 ESP ID

    // **LED 初始化**
    FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
    FastLED.clear();
    FastLED.show();

    // **微動開關初始化**
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    // **WebSocket 初始化**
    connectWebSocket();
}

// **📡 連接 WiFi**
void connectWiFi() {
    Serial.println("🔄 正在連接 WiFi...");
    WiFi.begin(ssid, password);
    int retries = 0;
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
        retries++;
        if (retries > 20) {
            Serial.println("\n❌ 無法連接 WiFi，重啟 ESP32");
            ESP.restart();
        }
    }

    Serial.println("\n✅ WiFi 連接成功");
}

// **📡 連接 WebSocket**
void connectWebSocket() {
    Serial.println("🔄 連接 WebSocket...");

    webSocket.begin(socketServer, socketPort, "/socket.io/?EIO=4&transport=websocket");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);  // 每 5 秒自動重連
}

// **📩 WebSocket 任務處理**
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
    switch (type) {
        case WStype_TEXT: {
            Serial.println("📩 收到任務: " + String((char *)payload));

            DynamicJsonDocument doc(1024);
            DeserializationError error = deserializeJson(doc, payload, length);
            if (error) {
                Serial.print("❌ JSON 解析失敗: ");
                Serial.println(error.f_str());
                return;
            }

            JsonObject assignments = doc["assignments"].as<JsonObject>();

            // 檢查任務是否匹配 ESP32
            if (assignments.containsKey(esp_id)) {
                JsonObject task = assignments[esp_id];
                String task_id = task["task_id"].as<String>();

                Serial.println("✅ 任務匹配: " + task_id);
                Serial.println("🔵 亮燈提示");
                lightUpLEDs();

                // 等待用戶按下按鈕
                while (digitalRead(BUTTON_PIN) == HIGH) {
                    delay(100);
                }

                Serial.println("🟢 任務完成，通知伺服器");
                completeTask(task_id);
            } else {
                Serial.println("🚫 任務與當前 ESP 不匹配，忽略");
            }
            break;
        }

        case WStype_CONNECTED:
            Serial.println("✅ WebSocket 已連接");
            webSocketConnected = true;
            webSocket.sendTXT("{\"event\":\"connected\", \"esp_id\":\"" + esp_id + "\"}");
            break;

        case WStype_DISCONNECTED:
            Serial.println("❌ WebSocket 連接斷開, 嘗試重連...");
            webSocketConnected = false;
            connectWebSocket();
            break;

        case WStype_ERROR:
            Serial.println("❌ WebSocket 發生錯誤，斷開連接...");
            webSocketConnected = false;
            connectWebSocket();
            break;

        default:
            Serial.println("⚠️ 收到未知 WebSocket 事件");
            break;
    }
}

// **🔵 亮燈，指示任務位置**
void lightUpLEDs() {
    for (int i = 0; i < NUM_LEDS; i++) {
        leds[i] = CRGB::Blue;
    }
    FastLED.show();
}

// **🟢 任務完成，通知伺服器**
void completeTask(String task_id) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl + String("/task/complete_task"));  
        http.addHeader("Content-Type", "application/json");

        String payload = "{\"esp_id\":\"" + esp_id + "\", \"task_id\":\"" + task_id + "\"}";
        int httpResponseCode = http.POST(payload);
        Serial.println("📡 任務完成回傳: " + String(httpResponseCode));

        http.end();
    }
}

// **📡 發送心跳**
void sendHeartbeat() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl + String("/heartbeat_mode"));
        http.addHeader("Content-Type", "application/json");

        String payload = "{\"esp_id\":\"" + esp_id + "\"}";
        int httpResponseCode = http.POST(payload);
        Serial.println("📡 心跳回應: " + String(httpResponseCode));
        http.end();
    }
}

// **🔄 監測 WebSocket 連線**
void checkWebSocketConnection() {
    if (!webSocketConnected) {
        Serial.println("❌ WebSocket 斷開連接，嘗試重新連接...");
        connectWebSocket();
    }
}

// **🔄 主迴圈**
void loop() {
    sendHeartbeat();
    webSocket.loop();
    
    checkWebSocketConnection();

    // **🔥 發送 Ping**
    static unsigned long lastPingTime = 0;
    if (millis() - lastPingTime > 30000) {
        Serial.println("📡 發送 Ping 到伺服器...");
        webSocket.sendTXT("{\"event\":\"ping\"}");
        lastPingTime = millis();
    }

    delay(5000);
}
