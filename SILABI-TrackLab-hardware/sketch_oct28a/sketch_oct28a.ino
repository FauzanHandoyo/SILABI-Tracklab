// DISCLAIMER
// KODE NYA MOSTLY THEORITICAL/UNTESTED KARENA HARDWARENYA BLOM ADA

#include "BLEDevice.h"
#include <vector> // Buat list dinamis

// === DAFTAR ASET ===
std::vector<String> daftarAsetMaster;
std::vector<bool> asetDitemukan;
// =============================

// Variabel untuk proses scanning
static BLEScan* pBLEScan;
int scanTime = 5; // Durasi scan dalam detik

// Fungsi ini akan dipanggil setiap kali ada perangkat BLE ditemukan
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

// === FUNGSI PLACEHOLDER DATABASE BARU ===
/*
 * Placeholder untuk sinkronisasi daftar aset dari Database
 * Kurang kode:
 * - Menghubungi Firebase/MySQL
 * - Mengambil daftar aset
 * - Memasukkannya ke dalam std::vector 'daftarAsetMaster'
 */
void sinkronkanDaftarAsetDariDB() {
  Serial.println("[DB] Memulai sinkronisasi daftar aset dari database...");
  // My thought process so far
  // 1. Bersihkan daftar lama
  daftarAsetMaster.clear();
  // 2. Tambahkan data dari database
  // Insert database logic here

  // 3. Sesuaikan array 'asetDitemukan'
  asetDitemukan.resize(daftarAsetMaster.size());
  
  Serial.printf("[DB] Sinkronisasi Selesai. Jumlah aset terdaftar: %d\n", daftarAsetMaster.size());
  Serial.println("----------------------------------------");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai SILABI Gateway Scanner...");

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

  // Reset status penemuan (sekarang menggunakan .size())
  for (int i = 0; i < daftarAsetMaster.size(); i++) {
    asetDitemukan[i] = false;
  }

  // Mulai scan BLE selama 'scanTime' detik
  BLEScanResults foundDevices = pBLEScan->start(scanTime, false);
  
  Serial.printf("Scan Selesai! Ditemukan %d perangkat BLE.\n", foundDevices.getCount());
  Serial.println("--- Laporan Status Aset ---");

  // Cek array asetDitemukan (sekarang menggunakan .size())
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

    // Panggil fungsi placeholder untuk kirim data ke cloud
    kirimKeCloud(namaAset, status);
  }

  pBLEScan->clearResults(); // Bersihkan hasil scan sebelumnya
  delay(10000); // Tunggu 10 detik sebelum memulai siklus scan baru
  
  // Opsional: Anda bisa memanggil sinkronkanDaftarAsetDariDB()
  // di sini secara periodik (misal, setiap jam) jika perlu.
}


// === FUNGSI PLACEHOLDER PENGIRIMAN DATA ===
void kirimKeCloud(String namaAset, String status) {
  // Hanya cetak ke Serial untuk menunjukkan fungsi ini dipanggil
  // (Dibiarkan non-aktif agar tidak terlalu ramai di serial monitor)
  // Serial.printf("   -> [CLOUD] Mengirim data '%s' untuk '%s'...\n", status.c_str(), namaAset.c_str());
}