#include "BLEDevice.h"
#include "BLEScan.h"
#include <vector> // Buat list dinamis
#include <WiFi.h>
#include <NeonPostgresOverHTTP.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";
const char* neonUser = "neondb_owner";
const char* neonPassword = "npg_x0vSCIQ9meRs";
const char* neonHost = "ep-plain-butterfly-a190b73m-pooler.ap-southeast-1.aws.neon.tech";
const char* neonDb = "neondb";

// === DAFTAR ASET ===
std::vector<String> daftarAsetMaster;
std::vector<bool> asetDitemukan;
std::vector<String> statusAsetSebelumnya;

WiFiClientSecure client;
NeonPostgresOverHTTP neon(client);

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
  Serial.println("[Neon] Memulai sinkronisasi daftar aset...");
  daftarAsetMaster.clear();

  const char* query = "SELECT nama_aset FROM daftar_aset";

  JsonDocument doc;
  
  bool success = neon.exec(doc, query);
  
  if (success) {
    Serial.println("[Neon] Respon diterima:");
    serializeJsonPretty(doc, Serial);
    Serial.println();

    for (JsonObject row : doc.as<JsonArray>()) {
      String namaAset = row["nama_aset"].as<String>();
      daftarAsetMaster.push_back(namaAset);
    }
  } else {
    Serial.println("[Neon] Gagal mengeksekusi query SELECT!");
    Serial.println(neon.getErrorMessage());
  }
  
  asetDitemukan.resize(daftarAsetMaster.size());
  Serial.printf("[Neon] Sinkronisasi Selesai. Jumlah aset terdaftar: %d\n", daftarAsetMaster.size());
  Serial.println("----------------------------------------");

  asetDitemukan.resize(daftarAsetMaster.size());
  statusAsetSebelumnya.resize(daftarAsetMaster.size(), "");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway Scanner...");

  setupWiFi();
  neon.setConnection(neonHost, 443, neonUser, neonPassword, neonDb);
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
    if (status != statusAsetSebelumnya[i]) {
    kirimKeCloud(namaAset, status);
    statusAsetSebelumnya[i] = status; // Simpan status baru ke memori
    }
  }

  pBLEScan->clearResults(); // Bersihkan hasil scan sebelumnya
  delay(10000); // Tunggu 10 detik sebelum memulai siklus scan baru
  
  // Ini bisa keep begini aja atau panggil sinkronkanDaftarAsetDariDB()
  // di sini periodik (Ex. setiap jam) kalau mau
}


// === FUNGSI PENGIRIMAN DATA ===
void kirimKeCloud(String namaAset, String status) {
  
  const char* query = 
    "INSERT INTO status_aset (nama, status, timestamp) "
    "VALUES (?, ?, NOW()) "
    "ON CONFLICT (nama) DO UPDATE SET status = EXCLUDED.status, timestamp = NOW()";

  // Siapkan parameter (Anti SQL Injection)
  JsonDocument params;
  params.add(namaAset);
  params.add(status);

  Serial.printf("[Neon] Mengirim status untuk: %s\n", namaAset.c_str());
  
  // Eksekusi query dengan parameter
  if (neon.execParams(query, params.as<JsonArray>())) {
    // Serial.println("[Neon] Status update terkirim.");
  } else {
    Serial.println("[Neon] GAGAL mengirim status!");
    Serial.println(neon.getErrorMessage());
  }
}