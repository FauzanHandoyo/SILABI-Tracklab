Berikut adalah versi `README.md` yang telah diperbarui dan diperlengkap berdasarkan dokumen laporan proyek, manual pengguna, dan presentasi yang Anda unggah. Dokumen ini mencakup detail teknis yang lebih spesifik, daftar fitur yang akurat, serta kredit pengembang.

# SILABI Tracklab (Sistem Pelacakan Aset Laboratorium Terpadu Berbasis IoT)

SILABI Tracklab adalah sistem otomatisasi manajemen aset yang dirancang untuk memodernisasi laboratorium universitas. Sistem ini menggantikan pencatatan manual dengan jaringan sensor terdistribusi yang memungkinkan pelacakan real-time, deteksi kehilangan otomatis, dan manajemen peminjaman alat.

Proyek ini dibangun untuk mengatasi masalah inefisiensi inventaris manual menggunakan teknologi Internet of Things (IoT) yang terintegrasi dengan dasbor berbasis web.

## Tim Pengembang (Kelompok 12)

* Salim
* Mirza Adi Raffiansyah
* Fauzan Farras Hakim

## Arsitektur Sistem

Sistem SILABI menggunakan arsitektur berlapis (Layered Architecture) yang terdiri dari:

1. **Physical Layer (Aset & Tag):** Menggunakan modul BLE Beacon (HM-10/AT-09) yang dipasang pada aset. Tag ini memancarkan sinyal identifikasi unik setiap interval tertentu.
2. **Hardware Layer (Scanner & Gateway):** Menggunakan dua unit mikrokontroler ESP32 yang berkomunikasi via ESP-NOW.
* *Scanner Unit:* Bertugas memindai sinyal BLE dan menyaring data (logic anti-flicker).
* *Gateway Unit:* Menerima data dari Scanner dan mengirimkannya ke cloud server melalui HTTPS.


3. **Backend Layer:**
* *Main API (Node.js/Express):* Menangani logika bisnis, manajemen user, dan data aset.
* *Hardware Microservice (Next.js):* Menangani request berkecepatan tinggi dari perangkat keras IoT.
* *Database (PostgreSQL/NeonDB):* Menyimpan inventaris, riwayat, dan log aktivitas.


4. **Presentation Layer (Frontend):** Aplikasi web berbasis React yang menampilkan status aset secara real-time kepada pengguna.

## Fitur Utama

* **Pelacakan Real-time:** Memantau keberadaan aset dengan status "DI TEMPAT" atau "HILANG/PINDAH".
* **Deteksi Kehilangan Otomatis:** Sistem menggunakan algoritma timer (Grace Period 300 detik) untuk mencegah alarm palsu akibat gangguan sinyal sesaat. Jika aset tidak terdeteksi selama periode tersebut, status otomatis berubah menjadi "Missing".
* **Manajemen Inventaris:** CRUD (Create, Read, Update, Delete) data aset lengkap dengan kategori dan lokasi.
* **Sistem Peminjaman:** Alur kerja digital untuk peminjaman aset yang mencakup pengajuan oleh user dan persetujuan (Approve/Deny) oleh admin/laboran.
* **Riwayat & Log (Audit Trail):** Mencatat setiap perpindahan aset, perubahan status, dan aktivitas pengguna secara detail.
* **Notifikasi:** Memberikan peringatan dini kepada laboran jika ada aset yang keluar dari jangkauan tanpa izin atau gateway terputus.
* **Role-Based Access Control:** Hak akses berbeda untuk Admin, Teknisi, dan User biasa.

## Teknologi yang Digunakan

* **Frontend:** React, Vite, Tailwind CSS, Axios.
* **Backend:** Node.js, Express.js, Next.js (Microservice).
* **Database:** PostgreSQL (Cloud hosting via NeonDB).
* **Autentikasi:** Supabase / JWT.
* **Firmware Hardware:** C++ (Arduino IDE) untuk ESP32.
* **Komunikasi Hardware:** BLE 4.0, ESP-NOW, HTTPS, JSON.


## Cara Penggunaan Singkat

1. **Login:** Masuk menggunakan akun yang sudah terdaftar (Admin/Teknisi/User).
2. **Registrasi Aset:** Buka halaman 'Assets', klik 'Add Asset', masukkan detail nama, kategori, dan ID aset (MAC Address).
3. **Monitoring:** Pantau Dashboard utama. Status hijau menandakan aset aman ("Available"), merah menandakan aset hilang ("Missing").
4. **Peminjaman:** User dapat memilih aset yang tersedia dan klik "Request to Borrow". Admin akan menyetujui melalui halaman "Requests".

## Lisensi dan Hak Cipta

Proyek ini dikembangkan sebagai bagian dari tugas Rekayasa Perangkat Lunak 2025, Universitas Indonesia. Hak cipta milik Tim TrackLab (Kelompok 12).
