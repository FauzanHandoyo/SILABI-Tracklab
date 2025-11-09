// --- Library BLE & WiFi (Wajib) ---
#include "BLEDevice.h"
#include "BLEScan.h"
#include <vector>
#include <WiFi.h>

// --- Library API (Ringan, Pengganti Neon) ---
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Kredensial WiFi ---
const char* ssid = "Drowsy";
const char* password = "sleepyhead";

// --- (PLACEHOLDER) Alamat API Backend ---
// Ini server (Vercel or smth) yang kita buat nanti
const char* apiHost = "http://api-silabi-anda.vercel.app"; 

// === DAFTAR ASET ===
std::vector<String> daftarAsetMaster;
std::vector<bool> asetDitemukan;
std::vector<String> statusAsetSebelumnya;

// --- [WATCHDOG] ---
// Variabel untuk auto-restart
long siklusLoop = 0;
long siklusMaks = 100; // Restart setiap 100 siklus
// --------------------

static BLEScan* pBLEScan;
int scanTime = 12; 

// WiFI Connection
void setupWiFi() {
  Serial.println();
  Serial.print("[WiFi] Menghubungkan ke: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Berhasil terhubung!");
  Serial.print("[WiFi] Alamat IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("----------------------------------------");
}

// BLE Scanning
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    String deviceName = advertisedDevice.getName().c_str();
    if (deviceName.startsWith("SILABI_")) {
      for (int i = 0; i < daftarAsetMaster.size(); i++) {
        if (deviceName == daftarAsetMaster[i]) {
          asetDitemukan[i] = true;
        }
      }
    }
  }
};

// Ambil asset list (Placeholder)
void sinkronkanDaftarAsetDariDB() {
  Serial.println("[Debug] Masuk ke sinkronkanDaftarAsetDariDB()...");
  daftarAsetMaster.clear();
  
  // --- DATA TESTING ---
  // Menggantikan API GET for now
  daftarAsetMaster.push_back("SILABI_reactor"); 
  
  asetDitemukan.resize(daftarAsetMaster.size());
  statusAsetSebelumnya.resize(daftarAsetMaster.size(), "");
  Serial.printf("[Debug] Sinkronisasi Selesai. Jumlah aset terdaftar: %d\n", daftarAsetMaster.size());
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway Scanner...");

  // --- [DEBUG] ---
  Serial.printf("[Debug] Sisa Heap setelah boot: %u bytes\n", ESP.getFreeHeap());
  // -----------------

  setupWiFi();

  // --- [DEBUG] ---
  Serial.printf("[Debug] Sisa Heap setelah WiFi terhubung: %u bytes\n", ESP.getFreeHeap());
  // -----------------
  
  sinkronkanDaftarAsetDariDB(); // Memuat data tes "SILABI_reactor"

  Serial.println("[Debug] Inisialisasi BLE...");
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);

  // DO NOT DELETE ANY DEBUG CODE
  // IT PREVENTS MEMORY LEAK FOR SOME REASON
  // --- [DEBUG] ---
  Serial.printf("[Debug] Sisa Heap setelah BLE init: %u bytes\n", ESP.getFreeHeap());
  Serial.println("[Debug] setup() selesai. Masuk ke loop...");
  // -----------------
}

void loop() {
  // --- [DEBUG] ---
  siklusLoop++;
  Serial.println("\n--- Memulai Siklus Scan Baru ---");
  Serial.printf("[Debug] Siklus loop ke-%ld. Sisa Heap: %u bytes\n", siklusLoop, ESP.getFreeHeap());
  // -----------------

  for (int i = 0; i < daftarAsetMaster.size(); i++) {
    asetDitemukan[i] = false;
  }

  Serial.println("[Debug] Memulai BLE Scan...");
  BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
  Serial.println("[Debug] BLE Scan Selesai.");
  
  Serial.printf("Scan Selesai! Ditemukan %d perangkat BLE.\n", foundDevices->getCount());
  Serial.println("--- Laporan Status Aset ---");
  Serial.println("[Debug] Memeriksa status aset...");
  
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
    
    // Cek perubahan status
    if (status != statusAsetSebelumnya[i]) {
      Serial.printf("[Debug] Status aset %s berubah! Memanggil kirimKeCloud...\n", namaAset.c_str());
      kirimKeCloud(namaAset, status); // Panggil fungsi API
      statusAsetSebelumnya[i] = status;
    }
  }

  Serial.println("[Debug] Membersihkan hasil scan...");
  pBLEScan->clearResults();

  // --- [DEBUG] ---
  Serial.printf("[Debug] Sisa Heap setelah siklus selesai: %u bytes\n", ESP.getFreeHeap());
  Serial.println("[Debug] loop() end. Delaying 10 detik...");
  // -----------------

  delay(10000);

  // --- [WATCHDOG] for memory fix ---
  if (siklusLoop >= siklusMaks) {
    Serial.println("[Watchdog] Batas siklus tercapai. Me-restart untuk membersihkan RAM...");
    delay(1000); // Beri waktu Serial untuk mengirim pesan
    ESP.restart(); // RESTART PAKSA
  }
  // --------------------
}

// === PENGIRIMAN DATA ===
void kirimKeCloud(String namaAset, String status) {
  // Fungsi ini AKAN GAGAL for now
  // karena server di 'apiHost' nggak ada
  // WOnt crash at least.
  
  HTTPClient http;
  String url = String(apiHost) + "/api/update-status"; 

  JsonDocument doc;
  doc["nama"] = namaAset;
  doc["status"] = status;
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.printf("[API] Mencoba mengirim status untuk: %s\n", namaAset.c_str());

  if (http.begin(url)) {
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(jsonPayload);
    if (httpCode > 0) {
      Serial.printf("[API] Status terkirim, HTTP code: %d\n", httpCode);
    } else {
      Serial.printf("[API] Gagal mengirim status! Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[API] Gagal memulai koneksi HTTP.");
  }
}