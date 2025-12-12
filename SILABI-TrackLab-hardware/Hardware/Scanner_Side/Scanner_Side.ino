#include <vector>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include "BLEDevice.h"
#include "BLEScan.h"

// --- KONFIGURASI ---
#define WIFI_CHANNEL 5
uint8_t gatewayAddress[] = {0x68, 0x25, 0xDD, 0x48, 0x2F, 0xD8}; 

// --- TIMEOUT ---
const unsigned long TIMEOUT_HILANG = 300000; // 60 Detik

typedef struct silabi_message {
    uint8_t msgType; int asset_id; char asset_name[30]; int status; int rssi;
} silabi_message;

struct AsetTarget {
  int id; String nama; 
  unsigned long lastSeen; 
  String statusTerakhir;
  int rssi;
};

std::vector<AsetTarget> daftarAset;
silabi_message dataKirim;
silabi_message dataMasuk;
esp_now_peer_info_t peerInfo;
static BLEScan* pBLEScan;
int scanTime = 5; 

// --- ESP-NOW RECV ---
void OnDataRecv(const esp_now_recv_info_t * recv_info, const uint8_t *incomingData, int len) {
  memcpy(&dataMasuk, incomingData, sizeof(dataMasuk));
  if (dataMasuk.msgType == 1) { 
    String nama = String(dataMasuk.asset_name);
    bool exists = false;
    for (auto &a : daftarAset) if (a.id == dataMasuk.asset_id) exists = true;
    
    if (!exists) {
      AsetTarget t;
      t.id = dataMasuk.asset_id; t.nama = nama; 
      
      // --- [FIX 1] STARTUP CHEAT ---
      // Pura-pura kita baru saja melihatnya agar status awal "DI TEMPAT"
      t.lastSeen = millis(); 
      t.statusTerakhir = "DI TEMPAT"; 
      t.rssi = -50; // RSSI palsu untuk awal
      
      daftarAset.push_back(t);
      Serial.printf("[Config] Target Diterima: %s (Auto-Set: DI TEMPAT)\n", nama.c_str());
    }
  }
}
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {}

// --- BLE CALLBACK ---
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
      String name = advertisedDevice.getName().c_str();
      
      // --- [DEBUG] Print APA SAJA yang dilihat scanner ---
      if (name.length() > 0) Serial.printf("   > Terdeteksi: %s (%d dBm)\n", name.c_str(), advertisedDevice.getRSSI());
      
      for (int i = 0; i < daftarAset.size(); i++) {
        if (name == daftarAset[i].nama) {
          // KETEMU!
          daftarAset[i].lastSeen = millis();
          daftarAset[i].rssi = advertisedDevice.getRSSI();
          Serial.println("   >>> MATCH FOUND! <<<");
        }
      }
    }
};

void setup() {
   Serial.begin(115200);
   Serial.println("\n--- SILABI Scanner (Video Ready) ---");

   WiFi.mode(WIFI_STA);
   esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
   if (esp_now_init() != ESP_OK) ESP.restart();
   
   esp_now_register_recv_cb(OnDataRecv);
   esp_now_register_send_cb(OnDataSent);

   memcpy(peerInfo.peer_addr, gatewayAddress, 6);
   peerInfo.channel = WIFI_CHANNEL; peerInfo.encrypt = false;
   esp_now_add_peer(&peerInfo);

   BLEDevice::init("");
   pBLEScan = BLEDevice::getScan();
   pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
   
   // --- [FIX 2] RADIO SETTINGS ---
   pBLEScan->setActiveScan(true); // Active scan lebih 'agresif' mencari nama
   pBLEScan->setInterval(100);     
   pBLEScan->setWindow(99);       
}

void loop() {
   if (daftarAset.empty()) {
      Serial.println("Waiting for config...");
      delay(2000); return;
   }

   Serial.println("Scanning...");
   pBLEScan->start(scanTime, false);
   pBLEScan->clearResults();

   unsigned long now = millis();
   
   for (int i = 0; i < daftarAset.size(); i++) {
      String statusLogika;
      
      // Hitung sisa waktu hidup
      long timeSinceSeen = now - daftarAset[i].lastSeen;
      
      if (timeSinceSeen < TIMEOUT_HILANG) {
         statusLogika = "DI TEMPAT";
      } else {
         statusLogika = "HILANG/PINDAH";
         daftarAset[i].rssi = 0;
      }

      // Debug Timer
      Serial.printf("[Status] %s: %s (Seen: %ld sec ago)\n", 
                    daftarAset[i].nama.c_str(), statusLogika.c_str(), timeSinceSeen/1000);

      // Kirim Jika Berubah
      if (statusLogika != daftarAset[i].statusTerakhir) {
         Serial.printf("[UPDATE] Sending change to Gateway...\n");
         
         dataKirim.msgType = 2; // Report
         dataKirim.asset_id = daftarAset[i].id;
         dataKirim.status = (statusLogika == "DI TEMPAT") ? 1 : 0;
         dataKirim.rssi = daftarAset[i].rssi;
         
         esp_now_send(gatewayAddress, (uint8_t *) &dataKirim, sizeof(dataKirim));
         daftarAset[i].statusTerakhir = statusLogika;
      }
   }
}