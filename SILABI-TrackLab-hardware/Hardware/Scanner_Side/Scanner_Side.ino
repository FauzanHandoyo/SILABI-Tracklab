#include "BLEDevice.h"
#include "BLEScan.h"
#include <vector>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

std::vector<String> daftarAsetMaster;
std::vector<bool> asetDitemukan;
std::vector<String> statusAsetSebelumnya;

static BLEScan* pBLEScan;
int scanTime = 12;

// Ganti sesuai sama MAC Address dari ESP32_Gateway
uint8_t gatewayAddress[] = {0x68, 0x25, 0xDD, 0x48, 0x2F, 0xD8};

typedef struct silabi_message {
      int asset_id;
      int status;
} silabi_message;

silabi_message dataToSend;
esp_now_peer_info_t peerInfo;

// --- [FIX 1] DEFINISI CALLBACK DIPINDAH KE ATAS ---
// (Class ini harus didefinisikan SEBELUM setup() menggunakannya)
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

// --- [FIX 2] DEFINISI FUNGSI DIPERBARUI ---
// Library baru (v3.3.3) mengharapkan signature ini
void OnDataSent(const wifi_tx_info_t *tx_info, const esp_now_send_status_t status) {
  Serial.print("\r\n[ESP-NOW] Status Pengiriman: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Sukses" : "Gagal");
}

void setup() {
   Serial.begin(115200);
   Serial.println("Memulai SILABI Scanner (Hanya BLE + ESP-NOW)...");

   WiFi.mode(WIFI_STA);
   Serial.printf("[Debug] Sisa Heap setelah boot: %u bytes\n", ESP.getFreeHeap());

   int channel = 11; 
   esp_wifi_set_channel(channel, WIFI_SECOND_CHAN_NONE);
   Serial.printf("[Debug] Channel WiFi DIKUNCI ke: %d\n", channel);

   if (esp_now_init() != ESP_OK) {
      Serial.println("Error inisialisasi ESP-NOW");
      return;
   }
   esp_now_register_send_cb(OnDataSent); // Sekarang ini akan berhasil

   memcpy(peerInfo.peer_addr, gatewayAddress, 6);
   peerInfo.channel = channel;
   peerInfo.encrypt = false;
   if (esp_now_add_peer(&peerInfo) != ESP_OK) {
      Serial.println("Gagal menambahkan Peer (Gateway)");
      return;
   }
   Serial.println("ESP-NOW Siap. Peer Gateway ditambahkan.");

   // Aset Placeholder
   daftarAsetMaster.push_back("SILABI_reactor");
   asetDitemukan.resize(daftarAsetMaster.size());
   statusAsetSebelumnya.resize(daftarAsetMaster.size(), "");
   Serial.printf("Sinkronisasi Selesai. Aset dilacak: %d\n", daftarAsetMaster.size());

   Serial.println("[Debug] Inisialisasi BLE...");
   BLEDevice::init("");
   pBLEScan = BLEDevice::getScan();
  
  // Baris ini sekarang akan berhasil karena class-nya sudah didefinisikan
   pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
   
  pBLEScan->setActiveScan(true);
   pBLEScan->setInterval(100);
   pBLEScan->setWindow(99);
   
   Serial.printf("[Debug] Sisa Heap setelah BLE init: %u bytes\n", ESP.getFreeHeap());
   Serial.println("Scanner BLE Aktif. Memulai loop...");
}

// (Class MyAdvertisedDeviceCallbacks sudah dipindah ke atas)

void loop() {
   Serial.println("\n--- Memulai Siklus Scan Baru (Scanner) ---");
   Serial.printf("[Debug] Sisa Heap: %u bytes\n", ESP.getFreeHeap());

   for (int i = 0; i < daftarAsetMaster.size(); i++) {
      asetDitemukan[i] = false;
   }

   Serial.println("[Debug] Memulai BLE Scan...");
   BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
   Serial.println("[Debug] BLE Scan Selesai.");
   pBLEScan->clearResults();

   String status;
   if (asetDitemukan[0]) {
      status = "DI TEMPAT";
   } else {
      status = "HILANG/PINDAH";
   }
   Serial.printf("Laporan Status: %s\n", status.c_str());

   // Hanya kirim kalau status berubah
   if (status != statusAsetSebelumnya[0]) {
      Serial.printf("[Scanner] Status berubah! Mengirim ke Gateway...\n");
      
      dataToSend.asset_id = 0;
      dataToSend.status = (status == "DI TEMPAT") ? 1 : 0;
      
      esp_now_send(gatewayAddress, (uint8_t *) &dataToSend, sizeof(dataToSend));
      
      statusAsetSebelumnya[0] = status;
   } else {
      Serial.println("[Scanner] Status tidak berubah. Idle.");
   }
   
   delay(10000);
}