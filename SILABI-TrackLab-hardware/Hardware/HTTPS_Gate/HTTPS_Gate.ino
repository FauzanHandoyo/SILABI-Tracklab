#include <WiFi.h>
#include <vector>
#include <esp_now.h>
#include <esp_wifi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

// --- WIFI CRED ---
const char* ssid = "Drowsy";
const char* password = "sleepyhead";

// --- ENDPOINT VERCEL ---
const char* apiHost = "https://backend-hardware-mzpxid42t-fauzanhandoyos-projects.vercel.app"; 

// --- KONFIGURASI TIPE PESAN ---
#define MSG_CONFIG  1  // Gateway -> Scanner (Kirim Nama Aset)
#define MSG_REPORT  2  // Scanner -> Gateway (Lapor Status)

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

// --- STRUKTUR DATA BARU (WAJIB SAMA DENGAN SCANNER) ---
typedef struct silabi_message {
    uint8_t msgType;      // 1=Config, 2=Report
    int asset_id;         // ID Aset
    char asset_name[30];  // Nama Aset
    int status;           // 1=Di Tempat, 0=Hilang
    int rssi;
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
  msg.msgType = MSG_CONFIG; 
  msg.status = 0; 
  msg.rssi = 0;

  esp_now_peer_info_t peerInfo;
  
  // --- [PERBAIKAN PENTING] ---
  // 1. Bersihkan memory dulu (agar tidak ada data sampah)
  memset(&peerInfo, 0, sizeof(peerInfo));
  
  // 2. Set Alamat Broadcast
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  
  // 3. Tentukan Interface: Gunakan WIFI_IF_STA (Station/WiFi)
  // Karena Gateway terhubung ke Router, kita kirim lewat channel Router.
  peerInfo.ifidx = WIFI_IF_STA; 
  
  peerInfo.channel = 0; // 0 artinya ikut channel WiFi saat ini
  peerInfo.encrypt = false;
  // ---------------------------
  
  // Cek apakah peer broadcast sudah ada
  if (!esp_now_is_peer_exist(broadcastAddress)) {
     esp_err_t addStatus = esp_now_add_peer(&peerInfo);
     if (addStatus != ESP_OK) {
        Serial.printf("[Error] Gagal add peer broadcast. Code: %d\n", addStatus);
        return;
     }
  }

  // Loop array lookup table kita
  for (int i = 0; i < MAX_ASSETS; i++) {
    if (assetLookupTable[i].indexOf("UNKNOWN_ID") == -1) {
      
      msg.asset_id = i;
      assetLookupTable[i].toCharArray(msg.asset_name, 30);

      esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &msg, sizeof(msg));
      
      if (result == ESP_OK) {
        Serial.printf(" -> Mengirim Config: ID %d (%s)\n", i, msg.asset_name);
      } else {
        // Jika masih gagal, coba print errornya
        Serial.println(" -> Gagal kirim config.");
      }
      
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

      String statusSekarang = (dataDiterima.status == 1) ? "DI TEMPAT" : "HILANG";
      int rssiSekarang = dataDiterima.rssi;
      
      Serial.printf("\n[ESP-NOW] Masuk ID %d: %s -> %s (RSSI: %d)\n", id, namaAset.c_str(), statusSekarang.c_str(), rssiSekarang);

      // Logika Antrian
      PesanAntrian pesanBaru;
      pesanBaru.nama = namaAset;
      pesanBaru.status = statusSekarang;
      pesanBaru.rssi = rssiSekarang;
  
      antrianPengiriman.push_back(pesanBaru); // Masukkan ke belakang antrian
  
      Serial.printf("[Queue] Ditambahkan ke antrian. Total antrian: %d\n", antrianPengiriman.size());
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
  
  /*
  Serial.println("----------------------------------------");
  Serial.println("[Sync] DUMMY DATA");
  
  // 1. Reset tabel aset
  initAssetTable();

  // 2. Masukkan Data Dummy secara Manual
  // Format: assetLookupTable[ID] = "NAMA_ASET";
  
  assetLookupTable[0] = "SILABI_reactor"; 
  Serial.println("   [+ Added] ID 0 -> SILABI_reactor");

  // Jika Anda punya tag kedua, bisa tambahkan di sini:
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
  kirimKeCloud("SILABI_GATEWAY_BOOT", "DI TEMPAT", -69420); 
  
  Serial.println("\n>>> GATEWAY SIAP MENERIMA DATA <<<");
}

void loop() {
  // Cek apakah ada antrian
  if (!antrianPengiriman.empty()) {
    
    // Ambil pesan paling depan (indeks 0)
    PesanAntrian pesan = antrianPengiriman.front();
    
    Serial.printf("[Loop] Memproses antrian: %s -> %s\n", pesan.nama.c_str(), pesan.status.c_str());
    
    // Kirim ke Cloud
    kirimKeCloud(pesan.nama, pesan.status, pesan.rssi);
    
    // Hapus pesan dari antrian setelah dikirim
    antrianPengiriman.erase(antrianPengiriman.begin());
    
    // Delay kecil agar tidak membanjiri server
    delay(500); 
  }
  
  // Tidak perlu delay(2000) yang besar di sini, biarkan loop berjalan cepat
  // untuk mengecek antrian baru.
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
  
  // Pastikan URL API sudah benar
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