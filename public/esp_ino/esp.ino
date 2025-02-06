#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "host-Dragon";  // 你的Raspberry Pi WiFi
const char* password = "home-share001";
const char* serverUrl = "http://192.168.0.70:5000";  // Web Server API

String getChipID() {
    uint64_t chipid = ESP.getEfuseMac();  // 取得ESP32唯一ID
    return String((uint32_t)(chipid >> 32), HEX) + String((uint32_t)chipid, HEX);
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("🔄 正在連接 WiFi...");
    }
    Serial.println("✅ WiFi 連接成功");
}

void loop() {
    sendHeartbeat();
}

// **📡 發送心跳**
void sendHeartbeat() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl + String("/heartbeat_mode"));
        http.addHeader("Content-Type", "application/json");

        String esp_id = getChipID();  // 取得唯一序號
        String payload = "{\"esp_id\":\"" + esp_id + "\"}";
        int httpResponseCode = http.POST(payload);
        Serial.println("📡 心跳回應: " + String(httpResponseCode));
        http.end();
    }
    delay(5000);
}

