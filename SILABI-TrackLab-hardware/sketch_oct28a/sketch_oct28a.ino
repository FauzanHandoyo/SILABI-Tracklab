#include "BLEDevice.h"
#include "BLEScan.h"
#include <vector> // Buat list dinamis
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Help me figure out biar bisa dinamis ges
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";
const char* apiHost = "http://api.proyek-silabi.com"; // PLACEHOLDER

// === DAFTAR ASET ===
std::vector<String> daftarAsetMaster;
std::vector<bool> asetDitemukan;
// =============================

// Variabel untuk proses scanning
static BLEScan* pBLEScan;
int scanTime = 12; // Durasi scan dalam detik

// WiFI Connection
void setupWiFi() {
  Serial.println();
  Serial.print("[WiFi] Menghubungkan ke: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  // Tunggu sampai WiFi terhubung
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Berhasil terhubung!");
  Serial.print("[WiFi] Alamat IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("----------------------------------------");
}

// Fungsi ini akan dipanggil setiap kali ada BLE ditemukan
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
      String deviceName = advertisedDevice.getName().c_str();

      // Cek apakah nama perangkat diawali dengan prefix kita
      if (deviceName.startsWith("SILABI_")) {
        
        // Tandai aset ini sebagai "ditemukan"
        // Loop sekarang menggunakan .size() dari vector
        for (int i = 0; i < daftarAsetMaster.size(); i++) {
          if (deviceName == daftarAsetMaster[i]) {
            asetDitemukan[i] = true;
          }
        }
      }
    }
};

void sinkronkanDaftarAsetDariDB() {
  Serial.println("[API] Memulai sinkronisasi daftar aset dari server...");
  daftarAsetMaster.clear();

  HTTPClient http;
  String url = String(apiHost) + "/daftar_aset"; // Endpoint GET

  Serial.print("[API] Melakukan GET request ke: ");
  Serial.println(url);

  if (http.begin(url)) { // Mulai koneksi
    int httpCode = http.GET(); // Kirim request

    if (httpCode == HTTP_CODE_OK) { // Koneksi sukses
      String payload = http.getString();
      Serial.println("[API] Respon diterima:");
      Serial.println(payload);
      
      // --- PLACEHOLDER UNTUK PARSING JSON ---
      // Gw gak tau array-nya kek mana. So, asumsikan array: ["aset1", "aset2"]
      DynamicJsonDocument doc(1024);
      deserializeJson(doc, payload);
      JsonArray array = doc.as<JsonArray>();
      
      for(JsonVariant v : array) {
        String namaAset = v.as<String>();
        daftarAsetMaster.push_back(namaAset);
      }
      // ----------------------------------------

    } else {
      Serial.printf("[API] Gagal! HTTP code: %d\n", httpCode);
    }
    http.end(); // Tutup koneksi
  } else {
    Serial.println("[API] Gagal memulai koneksi HTTP.");
  }

  asetDitemukan.resize(daftarAsetMaster.size());
  Serial.printf("[API] Sinkronisasi Selesai. Jumlah aset terdaftar: %d\n", daftarAsetMaster.size());
  Serial.println("----------------------------------------");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway Scanner...");

  // Coonect to WiFi
  setupWiFi();
  // PANGGIL FUNGSI SINKRONISASI DATABASE SAAT BOOTING
  sinkronkanDaftarAsetDariDB();

  BLEDevice::init(""); // Inisialisasi BLE
  pBLEScan = BLEDevice::getScan(); // Buat objek scan baru
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true); // Scan aktif untuk mendapatkan nama
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99); // Scan hampir terus-menerus
}

void loop() {
  Serial.println("\n--- Memulai Siklus Scan Baru ---");

  // Reset status penemuan
  for (int i = 0; i < daftarAsetMaster.size(); i++) {
    asetDitemukan[i] = false;
  }

  // Mulai scan BLE selama 'scanTime' detik
  BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
  
  Serial.printf("Scan Selesai! Ditemukan %d perangkat BLE.\n", foundDevices->getCount());
  Serial.println("--- Laporan Status Aset ---");

  // Cek array asetDitemukan
  for (int i = 0; i < daftarAsetMaster.size(); i++) {
    String namaAset = daftarAsetMaster[i];
    String status;

    if (asetDitemukan[i]) {
      status = "DI TEMPAT";
      Serial.printf("[OK] %s \t | Status: %s\n", namaAset.c_str(), status.c_str());
    } else {
      status = "HILANG/PINDAH";
      Serial.printf("[!!] %s \t | Status: %s\n", namaAset.c_str(), status.c_str());
    }

    kirimKeCloud(namaAset, status);
  }

  pBLEScan->clearResults(); // Bersihkan hasil scan sebelumnya
  delay(10000); // Tunggu 10 detik sebelum memulai siklus scan baru
  
  // Ini bisa keep begini aja atau panggil sinkronkanDaftarAsetDariDB()
  // di sini periodik (Ex. setiap jam) kalau mau
}


// === FUNGSI PENGIRIMAN DATA ===
void kirimKeCloud(String namaAset, String status) {
  
  // Hanya kirim kalau status berubah? (Optimasi, klo mau gw coba-coba)
  // For now, kita kirim semua
  
  HTTPClient http;
  String url = String(apiHost) + "/update_status"; // Endpoint POST

  // --- PLACEHOLDER JSON PAYLOAD ---
  // Ide nya kirim JSON: {"nama": "SILABI_osilos", "status": "DI TEMPAT"}
  DynamicJsonDocument doc(256);
  doc["nama"] = namaAset;
  doc["status"] = status;
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  // ---------------------------------------------

  Serial.printf("[API] Melakukan POST ke %s ... Payload: %s\n", url.c_str(), jsonPayload.c_str());

  if (http.begin(url)) {
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(jsonPayload);

    if (httpCode > 0) {
      Serial.printf("[API] Status update terkirim, HTTP code: %d\n", httpCode);
    } else {
      Serial.printf("[API] Gagal mengirim status! Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[API] Gagal memulai koneksi POST.");
  }
}