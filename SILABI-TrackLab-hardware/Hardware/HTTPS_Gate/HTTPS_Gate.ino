#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// --- WIFI CRED ---
const char* ssid = "Drowsy";
const char* password = "sleepyhead";

// --- ENDPOINT VERCEL ---
const char* apiHost = "https://backend-hardware-2zwlwl93w-fauzanhandoyos-projects.vercel.app"; 

volatile bool dataSiapDikirim = false; 
String antrianNamaAset = "";
String antrianStatus = "";
String statusTerakhir = "";

typedef struct silabi_message {
    int asset_id;
    int status;
} silabi_message;

silabi_message dataDiterima;

void OnDataRecv(const esp_now_recv_info_t * recv_info, const uint8_t *incomingData, int len) {
  
  memcpy(&dataDiterima, incomingData, sizeof(dataDiterima));
  String namaAset = (dataDiterima.asset_id == 0) ? "SILABI_reactor" : "ASET_TIDAK_DIKENAL";
  String statusSekarang = (dataDiterima.status == 1) ? "DI TEMPAT" : "HILANG/PINDAH";
  
  Serial.printf("\n[ESP-NOW] Masuk: %s -> %s\n", namaAset.c_str(), statusSekarang.c_str());

  if (statusSekarang != statusTerakhir) {
    antrianNamaAset = namaAset;
    antrianStatus = statusSekarang;
    dataSiapDikirim = true; 
    
  } else {
    Serial.println("[ESP-NOW] Status sama. Diabaikan.");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway...");

  setupWiFi();
  WiFi.mode(WIFI_AP_STA);

  Serial.print("[!!!] Gateway MAC: ");
  Serial.println(WiFi.macAddress());
  Serial.printf("[!!!] Gateway Channel: %d\n", WiFi.channel());

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error inisialisasi ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(OnDataRecv);

  Serial.println("\n[Test] Kirim status BOOT ke Vercel...");
  kirimKeCloud("SILABI_GATEWAY_BOOT", "ONLINE");
  
  Serial.println("\n>>> GATEWAY SIAP MENERIMA DATA <<<");
}

void loop() {
  if (dataSiapDikirim == true) {
    dataSiapDikirim = false;
    Serial.println("[Loop] Menemukan antrian data. Memproses...");

    if (antrianStatus != statusTerakhir) {
       Serial.printf("[Loop] Mengirim perubahan: %s -> %s\n", statusTerakhir.c_str(), antrianStatus.c_str());
       kirimKeCloud(antrianNamaAset, antrianStatus);
       statusTerakhir = antrianStatus;
    } else {
       Serial.println("[Loop] Data duplikat terdeteksi. Batal kirim.");
    }
  }

  delay(100);
}

void setupWiFi() {
  Serial.print("[WiFi] Menghubungkan ke ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n[WiFi] Terhubung!");
  Serial.print("[WiFi] IP: ");
  Serial.println(WiFi.localIP());
}

void kirimKeCloud(String namaAset, String status) {
  
  WiFiClientSecure client_secure; 
  HTTPClient http;
  
  String url = String(apiHost) + "/api/update-status"; 
  
  // JSON Payload
  JsonDocument doc;
  doc["nama"] = namaAset;
  doc["status"] = status;
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.printf("[HTTPS] POST ke: %s\n", url.c_str());
  
  client_secure.setInsecure();

  if (http.begin(client_secure, url)) {
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(jsonPayload);
    
    if (httpCode > 0) {
      Serial.printf("[HTTPS] SUKSES! Kode: %d\n", httpCode);
      String payload = http.getString(); // Opsional: baca balasan server
      Serial.println(payload);
    } else {
      Serial.printf("[HTTPS] GAGAL! Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTPS] Gagal membuka koneksi.");
  }
}