#include "BLEDevice.h"
#include "BLEScan.h"
#include <vector>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// --- KONFIGURASI PENTING ---
// Ganti sesuai dengan "[!!!] Gateway Channel: X" di Serial Monitor Gateway
#define WIFI_CHANNEL 11 

// MAC Address Gateway (TARGET)
uint8_t gatewayAddress[] = {0x68, 0x25, 0xDD, 0x48, 0x2F, 0xD8}; 

#define MSG_CONFIG  1 
#define MSG_REPORT  2

typedef struct silabi_message {
    uint8_t msgType;      // 1=Config, 2=Report
    int asset_id;         // ID Aset
    char asset_name[30];  // Nama Aset
    int status;           // 1=Tersedia, 0=Hilang
} silabi_message;

silabi_message dataMasuk;
silabi_message dataKirim;

esp_now_peer_info_t peerInfo;

struct AsetTarget {
  int id;
  String nama;
  bool ditemukan;
  String statusTerakhir;
};

std::vector<AsetTarget> daftarAset;

static BLEScan* pBLEScan;
int scanTime = 5;

void OnDataRecv(const esp_now_recv_info_t * recv_info, const uint8_t *incomingData, int len) {
  memcpy(&dataMasuk, incomingData, sizeof(dataMasuk));

  if (dataMasuk.msgType == MSG_CONFIG) {
    String namaBaru = String(dataMasuk.asset_name);
    int idBaru = dataMasuk.asset_id;

    bool sudahAda = false;
    for (auto &aset : daftarAset) {
      if (aset.id == idBaru) {
        sudahAda = true;
        break; 
      }
    }

    if (!sudahAda) {
      AsetTarget asetBaru;
      asetBaru.id = idBaru;
      asetBaru.nama = namaBaru;
      asetBaru.ditemukan = false;
      asetBaru.statusTerakhir = ""; 
      
      daftarAset.push_back(asetBaru);
      
      Serial.printf("[ESP-NOW] Target Diterima: %s (ID: %d)\n", namaBaru.c_str(), idBaru);
    }
  }
}

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
      String deviceName = advertisedDevice.getName().c_str();
      
      for (int i = 0; i < daftarAset.size(); i++) {
        if (deviceName == daftarAset[i].nama) {
          daftarAset[i].ditemukan = true; 
          // Serial.printf("   -> Ketemu: %s\n", deviceName.c_str());
        }
      }
    }
};

void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  // Debug
  // Serial.print(status == ESP_NOW_SEND_SUCCESS ? "." : "!");
}

void setup() {
   Serial.begin(115200);
   Serial.println("\n--- SILABI Scanner (Client Mode) ---");

   WiFi.mode(WIFI_STA);
   
   esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
   Serial.printf("[Info] WiFi Channel dikunci ke: %d\n", WIFI_CHANNEL);

   // 2. Init ESP-NOW
   if (esp_now_init() != ESP_OK) {
      Serial.println("Error inisialisasi ESP-NOW");
      ESP.restart();
   }
   
   // Register Callback
   esp_now_register_recv_cb(OnDataRecv);
   esp_now_register_send_cb(OnDataSent);

   memcpy(peerInfo.peer_addr, gatewayAddress, 6);
   peerInfo.channel = WIFI_CHANNEL;
   peerInfo.encrypt = false;
   
   if (esp_now_add_peer(&peerInfo) != ESP_OK) {
      Serial.println("Gagal add peer (Mungkin sudah ada)");
   }

   BLEDevice::init("");
   pBLEScan = BLEDevice::getScan();
   pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
   pBLEScan->setActiveScan(true); 
   pBLEScan->setInterval(100);
   pBLEScan->setWindow(99);
   
   Serial.println("Scanner Siap. Menunggu Config dari Gateway...");
}


void loop() {
   if (daftarAset.empty()) {
      Serial.println("[Idle] Belum ada data aset. Menunggu Gateway mengirim Config...");
      delay(3000);
      return;
   }

   Serial.printf("\n--- Memulai Scan (%d Aset Target) ---\n", daftarAset.size());

   for (int i = 0; i < daftarAset.size(); i++) {
      daftarAset[i].ditemukan = false;
   }

   BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
   pBLEScan->clearResults();

   for (int i = 0; i < daftarAset.size(); i++) {
      
      String statusSekarang = daftarAset[i].ditemukan ? "Tersedia" : "HILANG";
      int statusCode = daftarAset[i].ditemukan ? 1 : 0;

      // Debug
      // Serial.printf("Aset: %s -> %s\n", daftarAset[i].nama.c_str(), statusSekarang.c_str());

      // Kirim HANYA jika status berubah
      if (statusSekarang != daftarAset[i].statusTerakhir) {
         Serial.printf("[UPDATE] %s berubah jadi %s. Mengirim...\n", daftarAset[i].nama.c_str(), statusSekarang.c_str());
         
         dataKirim.msgType = MSG_REPORT;
         dataKirim.asset_id = daftarAset[i].id;
         dataKirim.status = statusCode;
         
         esp_err_t result = esp_now_send(gatewayAddress, (uint8_t *) &dataKirim, sizeof(dataKirim));
         
         if (result == ESP_OK) {
            daftarAset[i].statusTerakhir = statusSekarang;
         } else {
            Serial.println("[Error] Gagal kirim ke Gateway");
         }
      }
   }
   
   delay(2000);
}