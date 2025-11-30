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
const char* apiHost = "https://backend-hardware-fwqz47bm3-fauzanhandoyos-projects.vercel.app"; 

// --- KONFIGURASI TIPE PESAN ---
#define MSG_CONFIG  1  // Gateway -> Scanner (Kirim Nama Aset)
#define MSG_REPORT  2  // Scanner -> Gateway (Lapor Status)

volatile bool dataSiapDikirim = false; 
String antrianNamaAset = "";
String antrianStatus = "";
String statusTerakhir = "";

// --- STRUKTUR DATA BARU (WAJIB SAMA DENGAN SCANNER) ---
typedef struct silabi_message {
    uint8_t msgType;      // 1=Config, 2=Report
    int asset_id;         // ID Aset
    char asset_name[30];  // Nama Aset
    int status;           // 1=Di Tempat, 0=Hilang
} silabi_message;

silabi_message dataDiterima;

// --- MEMORY ---
#define MAX_ASSETS 20 
String assetLookupTable[MAX_ASSETS]; 

// Broadcast Address (FF:FF:FF:FF:FF:FF)
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

void initAssetTable() {
  for(int i=0; i<MAX_ASSETS; i++) {
    assetLookupTable[i] = "UNKNOWN_ID_" + String(i);
  }
}

// --- FUNGSI BARU: Broadcast Daftar Aset ke Scanner ---
void broadcastAssetList() {
  Serial.println("\n[Gateway] Membagikan daftar aset ke Scanner...");
  
  silabi_message msg;
  msg.msgType = MSG_CONFIG; // Tipe: KONFIGURASI
  msg.status = 0;           // Diabaikan oleh scanner

  esp_now_peer_info_t peerInfo;
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;
  
  // Cek apakah peer broadcast sudah ada, kalau belum add dulu
  if (!esp_now_is_peer_exist(broadcastAddress)) {
     esp_now_add_peer(&peerInfo);
  }

  // Loop array lookup table kita
  for (int i = 0; i < MAX_ASSETS; i++) {
    // Cek apakah slot ini ada isinya (bukan default)
    if (assetLookupTable[i].indexOf("UNKNOWN_ID") == -1) {
      
      // Siapkan Paket
      msg.asset_id = i;
      // Copy string ke char array dengan aman
      assetLookupTable[i].toCharArray(msg.asset_name, 30);

      // Kirim Broadcast
      esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &msg, sizeof(msg));
      
      if (result == ESP_OK) {
        Serial.printf(" -> Mengirim Config: ID %d (%s)\n", i, msg.asset_name);
      } else {
        Serial.println(" -> Gagal kirim config.");
      }
      
      // Beri jeda sedikit agar Scanner tidak buffer overflow
      delay(100); 
    }
  }
  Serial.println("[Gateway] Selesai membagikan daftar.\n");
}

void OnDataRecv(const esp_now_recv_info_t * recv_info, const uint8_t *incomingData, int len) {
  
  memcpy(&dataDiterima, incomingData, sizeof(dataDiterima));

  // FILTER: Hanya proses jika tipe pesannya adalah REPORT (Laporan)
  if (dataDiterima.msgType == MSG_REPORT) {

      String namaAset;
      int id = dataDiterima.asset_id;

      // Lookup Nama (Validasi ID)
      if (id >= 0 && id < MAX_ASSETS) {
        namaAset = assetLookupTable[id]; 
      } else {
        namaAset = "ASET_TIDAK_DIKENAL"; 
      }

      String statusSekarang = (dataDiterima.status == 1) ? "DI TEMPAT" : "HILANG/PINDAH";
      
      Serial.printf("\n[ESP-NOW] Masuk ID %d: %s -> %s\n", id, namaAset.c_str(), statusSekarang.c_str());

      // Logika Antrian
      if (statusSekarang != statusTerakhir) {
        antrianNamaAset = namaAset;    
        antrianStatus = statusSekarang;
        dataSiapDikirim = true; 
        statusTerakhir = statusSekarang; 
      } else {
        Serial.println("[ESP-NOW] Status sama. Diabaikan.");
      }
  } 
  // Jika msgType == MSG_CONFIG, diabaikan (karena itu broadcast kita sendiri)
}

void fetchAssetList() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Sync] WiFi not connected. Skipping sync.");
    return;
  }

  HTTPClient http;
  WiFiClientSecure client;
  client.setInsecure(); 

  String url = String(apiHost) + "/api/get-asset";

  Serial.println("----------------------------------------");
  Serial.print("[Sync] Downloading assets from: ");
  Serial.println(url);

  http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);

  if (http.begin(client, url)) {
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("[Sync] Success! Parsing JSON...");

      JsonDocument doc; 
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        initAssetTable();

        JsonArray arr = doc.as<JsonArray>();
        int count = 0;

        for (JsonObject item : arr) {
          int id = item["id"];                  
          const char* name = item["nama_aset"]; 
          
          if (id >= 0 && id < MAX_ASSETS) {
            assetLookupTable[id] = String(name);
            Serial.printf("   [%d] -> %s\n", id, name);
            count++;
          }
        }
        Serial.printf("[Sync] Complete. Loaded %d assets.\n", count);
      } else {
        Serial.print("[Sync] JSON Error: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.printf("[Sync] HTTP Error: %d\n", httpCode);
      String response = http.getString();
      Serial.println(response);
    }
    http.end();
  } else {
    Serial.println("[Sync] Unable to connect to server.");
  }
  Serial.println("----------------------------------------");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway...");

  initAssetTable();

  // 1. Set Mode WiFi Dulu (Best Practice)
  WiFi.mode(WIFI_AP_STA);

  // 2. Connect WiFi
  setupWiFi();

  Serial.print("[!!!] Gateway MAC: ");
  Serial.println(WiFi.macAddress());
  Serial.printf("[!!!] Gateway Channel: %d\n", WiFi.channel());

  // 3. Download List dari Database
  fetchAssetList();

  // 4. Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error inisialisasi ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(OnDataRecv);

  // 5. BROADCAST LIST KE SCANNER
  // Scanner akan menerima list ini dan mulai bekerja otomatis
  broadcastAssetList();

  Serial.println("\n[Test] Kirim status BOOT ke Vercel...");
  // Gunakan "DI TEMPAT" agar DB mencatat "Tersedia"
  kirimKeCloud("SILABI_GATEWAY_BOOT", "DI TEMPAT"); 
  
  Serial.println("\n>>> GATEWAY SIAP MENERIMA DATA <<<");
}

void loop() {
  if (dataSiapDikirim == true) {
    dataSiapDikirim = false;
    Serial.println("[Loop] Menemukan antrian data. Memproses...");

    // Cek lagi untuk memastikan (Debounce sederhana)
    // Tapi karena logika antrian sudah ada di OnDataRecv, ini aman.
    if (true) { 
       Serial.printf("[Loop] Mengirim perubahan: %s -> %s\n", antrianNamaAset.c_str(), antrianStatus.c_str());
       kirimKeCloud(antrianNamaAset, antrianStatus);
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
  
  // Pastikan URL API sudah benar
  String url = String(apiHost) + "/api/update-status"; 
  
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
      // String payload = http.getString(); 
      // Serial.println(payload);
    } else {
      Serial.printf("[HTTPS] GAGAL! Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTPS] Gagal membuka koneksi.");
  }
}