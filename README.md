# ⚡ Automation VAPT - VA Infra Findings Collector

Repository ini berisi Google Apps Script (GAS) untuk mengotomatisasi proses rekapitulasi temuan (*findings*) Vulnerability Assessment (VA) Infrastructure. Script ini berfungsi untuk menarik data hasil *scan* dari berbagai *Source Sheet* klien ke dalam satu *Target Sheet* secara terpusat.

## 🚀 Fitur Utama

* **Custom Menu Integration:** Menambahkan menu kustom `⚡ VAPT TOOLS` langsung di Google Sheets untuk eksekusi script yang mudah.
* **Auto-Reset & Format:** Otomatis membersihkan data lama di *Target Sheet* dan membuat *header* baru setiap kali dijalankan.
* **Smart Column Mapping (Regex):** Mencari letak kolom `IP`, `Risk`, dan `Finding Name` di *Source Sheet* secara dinamis tanpa terikat pada urutan kolom yang kaku.
* **Smart Filtering:** Otomatis membuang baris kosong yang tidak memiliki data *IP* atau *Finding*.
* **Auto-Uncheck:** Mencegah duplikasi data dengan menghilangkan centang (*uncheck*) pada baris *task* yang sudah berhasil diproses.

## 📋 Prasyarat Struktur Data

Agar script berjalan dengan lancar, pastikan Google Sheets Anda memiliki struktur berikut:

### 1. Control Sheet (Sheet Utama)
Harus memiliki kolom dengan nama *header* persis seperti berikut:
* `Update`: Berisi teks penanda *task* (misal: `Check Finding - General VA Infra`).
* `Run`: Berisi *checkbox* (`TRUE`/`FALSE`).
* `Source Sheet`: Berisi URL lengkap Google Sheets sumber atau cukup ID-nya saja.
* `Source Tab`: Berisi nama tab spesifik di dalam file sumber tersebut.

### 2. Source Sheet (File Sumber / Hasil Scan)
Script menggunakan Regex untuk mencari kolom, sehingga *header* di baris pertama file sumber harus mengandung kata kunci berikut (tidak *case-sensitive*):
* **Kolom Scope/IP:** `scope`, `ip`, `host`, atau `target`
* **Kolom Risk:** `risk`, `severity`, atau `level`
* **Kolom Finding:** `finding`, `vulnerability`, `name`, `title`, atau `plugin name`

## 🛠️ Langkah Instalasi (Step-by-Step)

1. Buka file Google Sheets yang ingin Anda jadikan *Control Center*.
2. Pada menu atas, klik **Extensions > Apps Script** (Ekstensi > Apps Script).
3. Hapus kode bawaan `function myFunction() { ... }` yang ada di editor.
4. Buat dua file script (`.gs`) dengan struktur berikut:
   * **`menu.gs`**: Berisi fungsi `onOpen()` untuk memunculkan menu di UI Google Sheets.
   * **`RunVaInfraCheckFinding.gs`**: Berisi fungsi utama `collectVAInfraFindings()` untuk logika penarikan data.
5. *Copy-paste* kode dari *repository* ini ke dalam file masing-masing.
6. Simpan *project* dengan klik ikon **Save** (💾).
7. Kembali ke Google Sheets Anda, lalu *refresh* halaman (F5).
8. Menu `⚡ VAPT TOOLS` akan muncul di samping menu *Help* / *Bantuan*.

## 💡 Cara Penggunaan

1. Buka tab *Control Sheet*.
2. Isi data *task* Anda. Pastikan kolom **Update** diisi dengan `Check Finding - General VA Infra`.
3. Centang *checkbox* pada kolom **Run** untuk file yang datanya ingin ditarik.
4. Klik menu **⚡ VAPT TOOLS > Conversion Report - VA Infra** di Google Sheets.
5. Saat pertama kali dijalankan, Google akan meminta otorisasi. Klik **Continue > Pilih Akun > Advanced > Go to Script**.
6. Tunggu beberapa detik, *pop-up* akan muncul saat proses selesai.
7. Hasil rekapitulasi dapat dilihat pada tab **General VA Infra - Check Finding**.

## ⚠️ Troubleshooting

* **Menu tidak muncul:** Pastikan hanya ada **satu** fungsi `onOpen()` di seluruh *project* Apps Script Anda.
* **Data tidak masuk:** Periksa kembali nama *header* di file sumber. Pastikan mengandung kata kunci yang dikenali oleh Regex.
* **Error Permission:** Pastikan akun Google yang menjalankan script memiliki akses minimal *Viewer* ke URL *Source Sheet* yang diinput.

---
*Developed for Internal VAPT Automation.*
