#include <WiFi.h>
#include <vector>
#include <esp_now.h>
#include <esp_wifi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// --- WIFI ---
const char* ssid = "Drowsy";
const char* password = "sleepyhead";

// --- ENDPOINT VERCEL ---
const char* apiHost = "https://backend-hardware-p8o9odj2v-fauzanhandoyos-projects.vercel.app"; 


#define MSG_CONFIG  1
#define MSG_REPORT  2

/*
volatile bool dataSiapDikirim = false; 
String antrianNamaAset = "";
String antrianStatus = "";
String statusTerakhir = "";
*/

struct PesanAntrian {
  String nama;
  String status;
  int rssi;
};

std::vector<PesanAntrian> antrianPengiriman;


typedef struct silabi_message {
    uint8_t msgType;
    int asset_id;        
    char asset_name[30]; 
    int status;          
    int rssi;
} silabi_message;

silabi_message dataDiterima;

#define MAX_ASSETS 20 
String assetLookupTable[MAX_ASSETS]; 

uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

void initAssetTable() {
  for(int i=0; i<MAX_ASSETS; i++) {
    assetLookupTable[i] = "UNKNOWN_ID_" + String(i);
  }
}

void broadcastAssetList() {
  Serial.println("\n[Gateway] Membagikan daftar aset ke Scanner...");
  
  silabi_message msg;
  msg.msgType = MSG_CONFIG; 
  msg.status = 0; 
  msg.rssi = 0;

  esp_now_peer_info_t peerInfo;
  
  memset(&peerInfo, 0, sizeof(peerInfo));
  
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  
  peerInfo.ifidx = WIFI_IF_STA; 
  
  peerInfo.channel = 0; 
  peerInfo.encrypt = false;

  if (!esp_now_is_peer_exist(broadcastAddress)) {
     esp_err_t addStatus = esp_now_add_peer(&peerInfo);
     if (addStatus != ESP_OK) {
        Serial.printf("[Error] Gagal add peer broadcast. Code: %d\n", addStatus);
        return;
     }
  }

  for (int i = 0; i < MAX_ASSETS; i++) {
    if (assetLookupTable[i].indexOf("UNKNOWN_ID") == -1) {
      
      msg.asset_id = i;
      assetLookupTable[i].toCharArray(msg.asset_name, 30);

      esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &msg, sizeof(msg));
      
      if (result == ESP_OK) {
        Serial.printf(" -> Mengirim Config: ID %d (%s)\n", i, msg.asset_name);
      } else {
        Serial.println(" -> Gagal kirim config.");
      }
      
      delay(100); 
    }
  }
  Serial.println("[Gateway] Selesai membagikan daftar.\n");
}

void OnDataRecv(const esp_now_recv_info_t * recv_info, const uint8_t *incomingData, int len) {
  
  memcpy(&dataDiterima, incomingData, sizeof(dataDiterima));

  if (dataDiterima.msgType == MSG_REPORT) {

      String namaAset;
      int id = dataDiterima.asset_id;

      if (id >= 0 && id < MAX_ASSETS) {
        namaAset = assetLookupTable[id]; 
      } else {
        namaAset = "ASET_TIDAK_DIKENAL"; 
      }

      String statusSekarang = (dataDiterima.status == 1) ? "DI TEMPAT" : "HILANG";
      int rssiSekarang = dataDiterima.rssi;
      
      Serial.printf("\n[ESP-NOW] Masuk ID %d: %s -> %s (RSSI: %d)\n", id, namaAset.c_str(), statusSekarang.c_str(), rssiSekarang);

      PesanAntrian pesanBaru;
      pesanBaru.nama = namaAset;
      pesanBaru.status = statusSekarang;
      pesanBaru.rssi = rssiSekarang;
  
      antrianPengiriman.push_back(pesanBaru);
  
      Serial.printf("[Queue] Ditambahkan ke antrian. Total antrian: %d\n", antrianPengiriman.size());
  } 
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
  
  /*
  Serial.println("----------------------------------------");
  Serial.println("[Sync] DUMMY DATA");
  initAssetTable();

  // Format: assetLookupTable[ID] = "NAMA_ASET";
  assetLookupTable[0] = "SILABI_reactor"; 
  Serial.println("   [+ Added] ID 0 -> SILABI_reactor");
  assetLookupTable[1] = "SILABI_osiloskop";
  Serial.println("   [+ Added] ID 1 -> SILABI_osiloskop");

  Serial.println("[Sync] Selesai. Data dummy siap disebar ke Scanner.");
  Serial.println("----------------------------------------");
  */
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway...");

  initAssetTable();

  WiFi.mode(WIFI_AP_STA);
  setupWiFi();

  Serial.print("[!!!] Gateway MAC: ");
  Serial.println(WiFi.macAddress());
  Serial.printf("[!!!] Gateway Channel: %d\n", WiFi.channel());

  fetchAssetList();

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error inisialisasi ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(OnDataRecv);

  broadcastAssetList();

  Serial.println("\n[Test] Kirim status BOOT ke Vercel...");
  kirimKeCloud("SILABI_GATEWAY_BOOT", "DI TEMPAT", -69420); 
  
  Serial.println("\n>>> GATEWAY SIAP MENERIMA DATA <<<");
}

void loop() {
  if (!antrianPengiriman.empty()) {
    
    PesanAntrian pesan = antrianPengiriman.front();
    
    Serial.printf("[Loop] Memproses antrian: %s -> %s\n", pesan.nama.c_str(), pesan.status.c_str());
    kirimKeCloud(pesan.nama, pesan.status, pesan.rssi);
    antrianPengiriman.erase(antrianPengiriman.begin());
    delay(500); 
  }
  delay(10);
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

void kirimKeCloud(String namaAset, String status, int rssi) {
  
  WiFiClientSecure client_secure; 
  HTTPClient http;
  
  String url = String(apiHost) + "/api/update-status"; 
  
  JsonDocument doc;
  doc["nama"] = namaAset;
  doc["status"] = status;
  doc["rssi"] = rssi;
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