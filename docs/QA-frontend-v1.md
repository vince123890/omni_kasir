# QA Frontend — Omni Kasir
**Versi**: 1.3  
**Tanggal**: 2026-05-19  
**Fase**: 4b — Integrasi BE (semua halaman sudah connect ke real API)  
**Total Test Case**: 116 (108 lama + 8 baru integrasi BE)  

---

## Cara Menggunakan Dokumen Ini

1. Jalankan dev server: `cd frontend && npm run dev`
2. Buka browser di `http://localhost:5173`
3. Eksekusi setiap test case secara urut
4. Isi status: `[x] Pass` / `[x] Fail` / `[x] Skip`
5. Jika Fail → isi kolom **Catatan** dengan deskripsi bug
6. Test case Fail → jadi backlog fix sebelum lanjut ke Fase 5

## Demo Login Credentials (Real Database — Fase 4b)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@omnikasir.com` | `admin123` |
| Owner | `budi@majujaya.com` | `budi123` |
| Admin Store | `rizal@majujaya.com` | `rizal123` |
| Kasir | `ani@majujaya.com` | `ani123` |
| Kasir store 2 | `dani@majujaya.com` | `dani123` |
| Login Gagal | email valid | password salah |

> Password sekarang divalidasi real oleh backend — tidak bisa sembarang password.

---

## Ringkasan Status

| Modul | Total TC | Pass | Fail | Skip |
|---|---|---|---|---|
| AUTH | 10 | | | |
| ADMIN | 32 | | | |
| OWNER | 26 | | | |
| ADMIN STORE | 24 | | | |
| KASIR | 10 | | | |
| CROSS-CUTTING | 6 | | | |
| **INTEGRASI BE** | **8** | | | |
| **TOTAL** | **116** | | | |

---

## MODUL 1 — AUTH
> Route: `/login` · Semua role

---

### TC-AUTH-001 — Login sebagai Admin

**Prioritas**: Critical  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Input email: `admin@omnikasir.com`
2. Input password: `admin123`
3. Klik tombol **Masuk**

**Expected Result**: Loading spinner muncul → redirect ke `/admin/dashboard` → halaman Dashboard Admin tampil dengan stat cards (Total Tenant, Store Aktif, Subscription, Revenue)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sepertinya password tidak wajib (sembarang bisa), apa bisa dibuatkan khusus harus itu
---

### TC-AUTH-002 — Login sebagai Owner

**Prioritas**: Critical  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Input email: `owner@toko.com`
2. Input password: `pass123`
3. Klik **Masuk**

**Expected Result**: Redirect ke `/owner/dashboard` → Dashboard Owner tampil dengan info tenant PT Maju Jaya Sejahtera

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sepertinya password tidak wajib (sembarang bisa), apa bisa dibuatkan khusus harus itu
---

### TC-AUTH-003 — Login sebagai Admin Store

**Prioritas**: Critical  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Input email: `rizal@majujaya.com`
2. Input password: `pass123`
3. Klik **Masuk**

**Expected Result**: Redirect ke `/store/dashboard` → Dashboard Store tampil dengan nama store "Toko Pusat Sudirman"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sepertinya password tidak wajib (sembarang bisa), apa bisa dibuatkan khusus harus itu
---

### TC-AUTH-004 — Login sebagai Kasir

**Prioritas**: Critical  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Input email: `kasir@toko.com`
2. Input password: `pass123`
3. Klik **Masuk**

**Expected Result**: Redirect ke `/kasir/pos` → halaman POS tampil dengan grid produk dan panel keranjang kosong

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sepertinya password tidak wajib (sembarang bisa), apa bisa dibuatkan khusus harus itu

---

### TC-AUTH-005 — Login dengan password salah

**Prioritas**: High  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Input email: `kasir@toko.com`
2. Input password: `wrong`
3. Klik **Masuk**

**Expected Result**: Alert merah muncul: "Email atau password salah" — tidak redirect

**Status**: [ ] Pass  [x] Fail  [ ] Skip  
**Catatan**: semua password bisa dimasukkan, jadi lolos

---

### TC-AUTH-006 — Login dengan email kosong

**Prioritas**: High  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Biarkan email kosong
2. Input password: `pass123`
3. Klik **Masuk**

**Expected Result**: Form validation error muncul di bawah field email: "Masukkan email Anda" — tombol tidak submit

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass

---

### TC-AUTH-007 — Login dengan format email tidak valid

**Prioritas**: High  
**Precondition**: Berada di halaman `/login`

**Langkah**:
1. Input email: `bukanemailvalid`
2. Input password: `pass123`
3. Klik **Masuk**

**Expected Result**: Validation error: "Format email tidak valid"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass

---

### TC-AUTH-008 — Logout dengan konfirmasi

**Prioritas**: High  
**Precondition**: Sudah login sebagai role apapun

**Langkah**:
1. Klik ikon logout (panah keluar) di sidebar / dropdown user
2. Modal konfirmasi muncul: "Konfirmasi Logout"
3. Klik **Ya, Logout**

**Expected Result**: Redirect ke `/login`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass

---

### TC-AUTH-009 — Batal logout

**Prioritas**: Medium  
**Precondition**: Sudah login sebagai role apapun

**Langkah**:
1. Klik ikon logout
2. Modal konfirmasi muncul
3. Klik **Batal**

**Expected Result**: Modal tertutup — tetap di halaman yang sama, tidak logout

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass

---

### TC-AUTH-010 — Ganti Password

**Prioritas**: Medium  
**Precondition**: Sudah login sebagai role apapun

**Langkah**:
1. Klik nama user di header → dropdown → **Ganti Password**
2. Input password lama, password baru, konfirmasi password baru
3. Klik **Simpan**

**Expected Result**: Modal ChangePassword muncul → setelah submit → notifikasi sukses atau error sesuai validasi

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass

---

## MODUL 2 — ADMIN
> Login sebagai: `admin@omnikasir.com`

---

### TC-ADM-001 — Dashboard Admin: Stat Cards

**Prioritas**: High  
**Precondition**: Login sebagai Admin, berada di `/admin/dashboard`

**Langkah**:
1. Amati 4 stat cards: Total Tenant, Total Store Aktif, Subscription Aktif, Revenue Bulan Ini

**Expected Result**: 4 cards tampil dengan nilai angka (24 tenant, 67 store, 21 subscription, Rp 12,4 jt) dan indikator trend (arrow up/down)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai passed

---

### TC-ADM-002 — Dashboard Admin: Alert Tenant Expired

**Prioritas**: High  
**Precondition**: Login sebagai Admin, di `/admin/dashboard`

**Langkah**:
1. Amati apakah ada alert banner kuning di bawah stat cards
2. Cek apakah ada tenant yang expired dalam 7 hari dari 2026-05-19

**Expected Result**: Alert muncul dengan tag nama tenant yang akan expired, tombol **Kelola** yang navigate ke `/admin/tenants`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: muncul angka 1 di tenant expired, kurang penjelasan disitu bisa jadi 1 expired, atau yang menjelaskan expired

---

### TC-ADM-003 — Dashboard Admin: Klik Baris Tenant

**Prioritas**: Medium  
**Precondition**: Di `/admin/dashboard`

**Langkah**:
1. Klik salah satu baris tabel tenant
2. Atau klik tombol **Detail** di kolom aksi

**Expected Result**: Navigate ke `/admin/tenants/{id}` — halaman detail tenant tampil

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: kalau bisa difokuskan di link detail redirect (bagian link detail), jadi tidak semua

---

### TC-ADM-004 — Subscription Plan: Lihat Daftar

**Prioritas**: High  
**Precondition**: Navigasi ke `/admin/subscriptions`

**Langkah**:
1. Amati tampilan card plan (Basic, Pro, Enterprise)

**Expected Result**: 3 card plan tampil, satu plan ditandai "PALING POPULER" (border indigo), switch aktif/nonaktif tersedia per card

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: navigasi sudah sesuai, paling populer juga bisa di ganti (switch)

---

### TC-ADM-005 — Subscription Plan: Tambah Plan Baru

**Prioritas**: High  
**Precondition**: Di `/admin/subscriptions`

**Langkah**:
1. Klik **Tambah Plan**
2. Isi: Nama = `Starter`, Harga = `49000`, Durasi = `30`, Maks Store = `1`, Maks Kasir = `1`
3. Klik **Simpan Plan**

**Expected Result**: Card plan baru "Starter" muncul di grid. Fitur auto-generate: "1 Store", "1 Kasir per store"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass sudah sesuai

---

### TC-ADM-006 — Subscription Plan: Nama Plan Duplikat

**Prioritas**: High  
**Precondition**: Di `/admin/subscriptions`

**Langkah**:
1. Klik **Tambah Plan**
2. Isi nama: `Pro` (sudah ada)
3. Klik **Simpan Plan**

**Expected Result**: Validation error inline: `Nama plan "Pro" sudah digunakan` — tidak tersimpan

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sudah ada validasi sudah dipakai

---

### TC-ADM-007 — Subscription Plan: Nama Duplikat Case-Insensitive

**Prioritas**: Medium  
**Precondition**: Di `/admin/subscriptions`

**Langkah**:
1. Klik **Tambah Plan**
2. Isi nama: `pro` (huruf kecil dari "Pro" yang sudah ada)
3. Klik **Simpan Plan**

**Expected Result**: Validation error: nama dianggap duplikat ("pro" = "Pro")

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sudah sesuai juga

---

### TC-ADM-008 — Subscription Plan: Tandai Populer

**Prioritas**: High  
**Precondition**: Di `/admin/subscriptions`, Plan Pro sedang populer

**Langkah**:
1. Klik tag "Tandai Populer" di card Basic
2. Amati perubahan di semua card

**Expected Result**: Basic berubah jadi "PALING POPULER" (border indigo), Pro otomatis kehilangan tanda populer — hanya 1 plan yang populer

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sudah sesuai

---

### TC-ADM-009 — Subscription Plan: Toggle Aktif/Nonaktif

**Prioritas**: Medium  
**Precondition**: Di `/admin/subscriptions`

**Langkah**:
1. Klik switch Aktif di salah satu card plan (misal Basic)
2. Amati tampilan card

**Expected Result**: Switch berubah, card menjadi opacity lebih rendah (disabled visual), status berubah

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sudah sesuai

---

### TC-ADM-010 — Subscription Plan: Hapus Plan dengan Tenant

**Prioritas**: High  
**Precondition**: Di `/admin/subscriptions`

**Langkah**:
1. Klik ikon hapus di card plan yang punya tenant (misal Pro atau Basic)
2. Amati popconfirm

**Expected Result**: Popconfirm muncul dengan warning: "{count} tenant masih menggunakan plan ini." — tetap bisa hapus tapi ada peringatan

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: kalau dihapus bisa berarti ini hanya terhapus saja, namun jika mau digunakan perpanjang sudah tidak bisa ya (apa seperti ini???)

---

### TC-ADM-011 — Tenant: Lihat Daftar dengan Filter

**Prioritas**: High  
**Precondition**: Navigasi ke `/admin/tenants`

**Langkah**:
1. Filter **Jenis Usaha**: pilih `PT`
2. Amati hasil tabel

**Expected Result**: Hanya tenant PT yang tampil. Subtitle berubah: "X dari 6 tenant"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sudah sesuai

---

### TC-ADM-012 — Tenant: Filter Status Expired

**Prioritas**: High  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Filter **Status**: pilih `expired`

**Expected Result**: Hanya tenant dengan status expired tampil (UD Toko Pak Agus)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: pass

---

### TC-ADM-013 — Tenant: Filter Kombinasi + Reset

**Prioritas**: Medium  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Set filter: Jenis = `CV`, Status = `aktif`, Plan = `Pro`
2. Amati hasil
3. Klik **Reset Filter**

**Expected Result**: Filter kombinasi mempersempit hasil. Setelah reset → semua 6 tenant tampil kembali, tombol Reset Filter hilang

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-014 — Tenant: Search

**Prioritas**: Medium  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Ketik `maju` di kolom search

**Expected Result**: Hanya "PT Maju Jaya Sejahtera" yang tampil

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-015 — Tenant: Tambah Tenant Baru

**Prioritas**: High  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Klik **Tambah Tenant**
2. Isi: Jenis = `CV`, Nama = `Berkah Abadi`, Nama Owner = `Joko`, Email = `joko@berkah.com`, Password = `password123`, Plan = `Basic`, Tanggal Mulai = hari ini
3. Klik **Buat Tenant**

**Expected Result**: Tenant baru tampil di tabel. Notifikasi sukses muncul.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: ID tenant tidak muncul, apa karena prototype ya ???

---

### TC-ADM-016 — Tenant: Tambah Tenant — Validasi Password

**Prioritas**: High  
**Precondition**: Modal Tambah Tenant terbuka

**Langkah**:
1. Isi semua field, password = `abc` (kurang dari 8 karakter)
2. Klik **Buat Tenant**

**Expected Result**: Validation error: "Min 8 karakter" di field password

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai, apa bisa dengan karakter dan huruf besar, dan angka, simbol

---

### TC-ADM-017 — Tenant: Edit Tenant

**Prioritas**: High  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Klik dropdown aksi (⋮) di baris tenant pertama → **Edit Tenant**
2. Ubah nama bisnis menjadi `Maju Jaya Updated`
3. Amati field email
4. Klik **Simpan**

**Expected Result**: Field email disabled (tidak bisa diubah). Nama bisnis berhasil diupdate di tabel.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-018 — Tenant: Perpanjang Subscription

**Prioritas**: High  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Dropdown aksi → **Perpanjang Subscription**
2. Pilih Plan Baru: `Enterprise`, Tanggal Mulai: hari ini, Durasi: `365 hari`
3. Klik **Perpanjang**

**Expected Result**: Notifikasi sukses, plan tenant berubah menjadi Enterprise di tabel

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-019 — Tenant: Nonaktifkan Tenant

**Prioritas**: High  
**Precondition**: Di `/admin/tenants`

**Langkah**:
1. Dropdown aksi tenant aktif → **Nonaktifkan**
2. Popconfirm muncul
3. Klik **Ya, lanjutkan**

**Expected Result**: Status tenant berubah menjadi nonaktif (tag merah), tombol berubah jadi "Aktifkan"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-020 — Tenant Detail: Header & Info

**Prioritas**: High  
**Precondition**: Klik baris tenant dari `/admin/tenants`

**Langkah**:
1. Amati header halaman detail

**Expected Result**: Tampil: avatar entityType, fullName tenant, tag status, tag plan, expired date, tombol Edit/Perpanjang/Nonaktifkan. Descriptions menampilkan **Kode Tenant** (format TNT-YYYYMM-NNN)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-021 — Tenant Detail: Tab Store dengan storeCode

**Prioritas**: High  
**Precondition**: Di halaman detail tenant, tab **Store**

**Langkah**:
1. Klik tab **Store**
2. Amati kolom Nama Store

**Expected Result**: Setiap baris menampilkan nama store + storeCode di bawahnya (format STR-YYMM-NNNN)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: seesuai

---

### TC-ADM-022 — Tenant Detail: Tab Kasir

**Prioritas**: Medium  
**Precondition**: Di halaman detail tenant

**Langkah**:
1. Klik tab **Kasir**
2. Amati tabel kasir

**Expected Result**: Tabel menampilkan semua kasir dan admin store milik tenant: nama, email, store, login terakhir, status

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai, bisa kalau diganti "User Store", karena role kasir dan admin store 

---

### TC-ADM-023 — Tenant Detail: Subscription History

**Prioritas**: Medium  
**Precondition**: Di halaman detail tenant

**Langkah**:
1. Klik tab **Riwayat Subscription**

**Expected Result**: Timeline tampil dengan 4 riwayat plan (Basic → Basic → Pro → Pro aktif), warna hijau untuk aktif dan abu untuk expired

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-024 — Tenant Detail: ID Tidak Ditemukan

**Prioritas**: Medium  
**Precondition**: Login sebagai Admin

**Langkah**:
1. Akses langsung URL: `/admin/tenants/9999`

**Expected Result**: Tampil pesan "Tenant tidak ditemukan" + tombol Kembali

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-025 — Tenant Detail: Toggle Status dari Detail Page

**Prioritas**: High  
**Precondition**: Di halaman detail tenant yang statusnya aktif

**Langkah**:
1. Klik tombol **Nonaktifkan**
2. Popconfirm → klik **Ya, lanjutkan**

**Expected Result**: Tag status berubah jadi nonaktif, tombol berubah jadi **Aktifkan** (hijau)

**Status**: [ ] Pass  [x] Fail  [ ] Skip  
**Catatan**: tidak ada popconfirm

---

### TC-ADM-026 — Admin Sidebar: Navigasi Menu

**Prioritas**: Medium  
**Precondition**: Login sebagai Admin

**Langkah**:
1. Klik menu **Subscription Plan**
2. Klik menu **Management Tenant**
3. Klik menu **Dashboard**

**Expected Result**: Setiap klik navigate ke halaman yang benar, menu item aktif ter-highlight (background indigo)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-027 — Admin Sidebar: Collapse

**Prioritas**: Low  
**Precondition**: Login sebagai Admin

**Langkah**:
1. Klik tombol collapse sidebar (panah kiri di bawah sidebar)
2. Amati tampilan sidebar

**Expected Result**: Sidebar menyempit, hanya ikon yang tampil (label tersembunyi)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-ADM-028 — Kelola Admin: Lihat Daftar

**Prioritas**: High  
**Precondition**: Login sebagai Admin, navigasi ke `/admin/users`

**Langkah**:
1. Klik menu **Kelola Admin** di sidebar
2. Amati halaman dan tabel

**Expected Result**: Tabel menampilkan minimal 1 admin (Super Admin) dengan badge "Utama". Info banner biru tampil menjelaskan scope akses admin platform. Tidak ada tombol aksi di baris Super Admin.

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-ADM-029 — Kelola Admin: Tambah Admin Baru

**Prioritas**: High  
**Precondition**: Di `/admin/users`

**Langkah**:
1. Klik **Tambah Admin**
2. Isi: Nama = `Admin Dua`, Email = `admin2@omnikasir.com`, Password = `password123`
3. Klik **Tambah Admin**

**Expected Result**: Admin baru muncul di tabel dengan status Aktif. Notifikasi sukses muncul. Warning kuning di modal mengingatkan untuk sampaikan kredensial secara aman.

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-ADM-030 — Kelola Admin: Email Duplikat

**Prioritas**: High  
**Precondition**: Modal Tambah Admin terbuka

**Langkah**:
1. Isi Email: `admin@omnikasir.com` (sudah ada)
2. Klik **Tambah Admin**

**Expected Result**: Inline error di field email: "Email sudah digunakan" — tidak tersimpan

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-ADM-031 — Kelola Admin: Nonaktifkan Admin Biasa

**Prioritas**: High  
**Precondition**: Sudah ada minimal 2 admin (dari TC-ADM-029)

**Langkah**:
1. Klik **Nonaktifkan** di baris "Admin Dua"
2. Popconfirm → klik **Ya**

**Expected Result**: Status berubah menjadi Nonaktif, tombol berubah jadi **Aktifkan**

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-ADM-032 — Kelola Admin: Tidak Bisa Nonaktifkan Super Admin

**Prioritas**: Critical  
**Precondition**: Di `/admin/users`

**Langkah**:
1. Amati baris "Super Admin" (badge Utama)

**Expected Result**: Tidak ada tombol Nonaktifkan di baris Super Admin — kolom Aksi menampilkan "—"

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

## MODUL 3 — OWNER
> Login sebagai: `owner@toko.com`

---

### TC-OWN-001 — Owner Dashboard: Stat Cards Clickable

**Prioritas**: High  
**Precondition**: Login sebagai Owner, di `/owner/dashboard`

**Langkah**:
1. Klik card **Total Store**
2. Kembali, klik card **Total Kasir Aktif**
3. Kembali, klik card **Transaksi Hari Ini**

**Expected Result**: Total Store → `/owner/stores`, Total Kasir → `/owner/users`, Transaksi → `/owner/transaksi`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: ada omzet hari ini (apa ini dipakai, masih dipakai, seharusnya masih, di TC ditambahkan harusnya)

---

### TC-OWN-002 — Owner Dashboard: Tabel Store — Link Kasir

**Prioritas**: Medium  
**Precondition**: Di `/owner/dashboard`

**Langkah**:
1. Di tabel performa store, klik link "X/Y kasir" di baris store pertama

**Expected Result**: Navigate ke `/owner/users?storeId=1` — halaman user management ter-filter ke store tersebut

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: navigasi kasir ke store tersebut

---

### TC-OWN-003 — Owner Dashboard: storeCode Tampil

**Prioritas**: High  
**Precondition**: Di `/owner/dashboard`

**Langkah**:
1. Amati kolom Nama Store di tabel performa store

**Expected Result**: Setiap baris menampilkan nama store + storeCode di bawahnya (format STR-YYMM-NNNN)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai
---

### TC-OWN-004 — Store: Tambah Store Baru

**Prioritas**: High  
**Precondition**: Navigasi ke `/owner/stores` (Plan Pro → maxStores = 5, saat ini 3 store)

**Langkah**:
1. Klik **Tambah Store**
2. Isi: Nama = `Cabang Bogor`, Alamat = `Jl. Sudirman No. 5, Bogor`, Telepon = `08123456789`
3. Klik **Buat Store**

**Expected Result**: Card store baru "Cabang Bogor" muncul dengan storeCode, status Aktif

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-005 — Store: Validasi Phone Format

**Prioritas**: High  
**Precondition**: Modal Tambah Store terbuka

**Langkah**:
1. Isi Telepon: `12345678` (tidak diawali 08 atau +62)
2. Klik **Buat Store**

**Expected Result**: Validation error: "Format nomor tidak valid (08xxx atau +62xxx)"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-006 — Store: Phone Format +62 Valid

**Prioritas**: Medium  
**Precondition**: Modal Tambah Store terbuka

**Langkah**:
1. Isi Telepon: `+6281234567890`
2. Klik **Buat Store**

**Expected Result**: Tidak ada error validasi telepon — store tersimpan

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-007 — Store: Hapus Store Tanpa Transaksi

**Prioritas**: High  
**Precondition**: Ada store yang belum pernah punya transaksi (misal store baru ditambah di TC-OWN-004)

**Langkah**:
1. Klik ikon hapus (trash) di card store yang belum ada transaksi
2. Konfirmasi

**Expected Result**: Store terhapus dari grid, notifikasi sukses muncul

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-008 — Store: Hapus Store dengan Transaksi (Blocked)

**Prioritas**: Critical  
**Precondition**: Di `/owner/stores` — store "Toko Pusat Sudirman" punya transaksi

**Langkah**:
1. Klik ikon hapus di card "Toko Pusat Sudirman"

**Expected Result**: Modal muncul: "Store ini memiliki riwayat transaksi" — hanya ada tombol **Nonaktifkan Store** (bukan Hapus)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-009 — Store: Nonaktifkan Store dari Modal Blocked

**Prioritas**: High  
**Precondition**: Modal blocked delete terbuka (dari TC-OWN-008)

**Langkah**:
1. Klik **Nonaktifkan Store**

**Expected Result**: Store status berubah menjadi Nonaktif (tag abu-abu), card masih tampil, notifikasi sukses

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-010 — Store: Limit maxStores Plan Basic

**Prioritas**: High  
**Precondition**: Simulasikan dengan tenant yang punya Plan Basic (maxStores = 1) — login sebagai `sari@warung.com` jika bisa, atau amati dari TenantDetail

**Langkah**:
1. Di `/owner/stores` dengan Plan Basic yang sudah punya 1 store
2. Amati tombol **Tambah Store**

**Expected Result**: Tombol **Tambah Store** disabled dengan tooltip "Batas store tercapai, upgrade subscription". Card "Tambah Store Baru" tidak tampil.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-011 — Store: storeCode Tampil di Card

**Prioritas**: High  
**Precondition**: Di `/owner/stores`

**Langkah**:
1. Amati setiap card store

**Expected Result**: Setiap card menampilkan storeCode di bawah tag status (format STR-YYMM-NNNN)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: jika create baru, tidak keluar store code, apa karena prototype ya ???

---

### TC-OWN-012 — User Management: Tambah Kasir

**Prioritas**: High  
**Precondition**: Navigasi ke `/owner/users`

**Langkah**:
1. Klik **Tambah User**
2. Pilih Role: `Kasir`
3. Isi: Nama = `Rudi Hartono`, Email = `rudi@majujaya.com`, Password = `pass1234`, Store = `Toko Pusat Sudirman`
4. Klik **Tambah**

**Expected Result**: Kasir baru "Rudi Hartono" muncul di tabel dengan role tag hijau "Kasir"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-013 — User Management: Email Duplikat

**Prioritas**: High  
**Precondition**: Modal Tambah User terbuka

**Langkah**:
1. Isi email: `ani@majujaya.com` (sudah ada)
2. Klik **Tambah**

**Expected Result**: Inline error di field email: "Email sudah digunakan" — tidak tersimpan

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-014 — User Management: Kapasitas Kasir per Store

**Prioritas**: Critical  
**Precondition**: Plan Pro → maxCashiersPerStore = 5. Store 1 sudah punya kasir aktif mendekati batas.

**Langkah**:
1. Tambah kasir ke store yang sudah penuh (5 kasir aktif)
2. Pilih store tersebut di form

**Expected Result**: Option store disabled dengan label "PENUH", atau error saat submit: "Store ini sudah mencapai batas 5 kasir aktif"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-015 — User Management: Filter dari URL param storeId

**Prioritas**: High  
**Precondition**: Dari StorePage, klik "Kelola Kasir" di card store ke-2

**Langkah**:
1. Klik ikon tim (TeamOutlined) di card "Cabang Margonda Depok"

**Expected Result**: Navigate ke `/owner/users?storeId=2` — tabel ter-filter ke store Cabang Margonda, subtitle menampilkan nama store

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-016 — User Management: Toggle Status Kasir

**Prioritas**: High  
**Precondition**: Di `/owner/users`

**Langkah**:
1. Klik **Nonaktifkan** di baris kasir aktif
2. Popconfirm → **Ya**

**Expected Result**: Tag status berubah menjadi Nonaktif, tombol berubah menjadi **Aktifkan**

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-017 — User Management: Filter Role

**Prioritas**: Medium  
**Precondition**: Di `/owner/users`

**Langkah**:
1. Filter Role: pilih `Admin Store`

**Expected Result**: Hanya user dengan role Admin Store yang tampil (3 user: Rizal, Siti, Brama)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-018 — Transaksi: Filter per Store

**Prioritas**: High  
**Precondition**: Navigasi ke `/owner/transaksi`

**Langkah**:
1. Dropdown Store → pilih `Toko Pusat Sudirman`
2. Amati tabel dan stat cards

**Expected Result**: Hanya transaksi store tersebut tampil. Total transaksi dan omzet berubah sesuai filter.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-019 — Transaksi: Filter Kasir Dinamis

**Prioritas**: High  
**Precondition**: Di `/owner/transaksi`, sudah filter store

**Langkah**:
1. Pilih store "Toko Pusat Sudirman"
2. Amati dropdown Kasir

**Expected Result**: Dropdown Kasir hanya menampilkan kasir yang pernah bertransaksi di store tersebut

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-020 — Transaksi: Expand Detail Row

**Prioritas**: High  
**Precondition**: Di `/owner/transaksi` dengan transaksi tampil

**Langkah**:
1. Klik ikon expand (▶) di salah satu baris transaksi

**Expected Result**: Sub-tabel muncul: daftar produk dengan qty, harga, subtotal. Footer: Bayar dan Kembalian (hijau)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-021 — Transaksi: Reset Filter

**Prioritas**: Medium  
**Precondition**: Di `/owner/transaksi` dengan filter aktif

**Langkah**:
1. Set filter store dan kasir
2. Klik **Reset Filter**

**Expected Result**: Semua filter kembali ke default "all", semua transaksi tampil kembali

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-OWN-022 — Stok Masuk: Tambah Penerimaan

**Prioritas**: High  
**Precondition**: Login sebagai **Admin Store** (`rizal@majujaya.com` / `store123`), navigasi ke `/store/stok-masuk`  
> ⚠️ Klarifikasi: Fitur Stok Masuk ada di role **Admin Store** (`/store/stok-masuk`), bukan di Owner. Owner memiliki akses read-only sesuai PRD. Login sebagai kasir tidak akan menemukan menu ini.

**Langkah**:
1. Klik **Input Stok Masuk**
2. Pilih produk: `Aqua 600ml`, Qty = `24`, Harga Beli = `2500`, Tanggal = hari ini, Keterangan = `Restock mingguan`
3. Klik **Simpan**

**Expected Result**: Record baru muncul di tabel riwayat dengan movementCode (STK-IN-YYYYMMDD-NNN). Notifikasi sukses menampilkan movementCode.

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-OWN-023 — Stok Masuk: Suffix Qty Dinamis

**Prioritas**: High  
**Precondition**: Di `/store/stok-masuk` (Admin Store), tabel riwayat sudah ada data  
> ⚠️ Klarifikasi: Lihat di kolom "Qty Masuk" — suffix satuan sudah dinamis mengikuti produk. Test ini harus dijalankan di role Admin Store, bukan Owner/Kasir.

**Langkah**:
1. Amati kolom "Qty Masuk" di semua baris riwayat

**Expected Result**: Suffix satuan mengikuti satuan produk (pcs, kg, dll) — bukan hardcode "pcs"

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-OWN-024 — Stok Masuk: Store Switcher

**Prioritas**: Medium  
**Precondition**: Di `/store/stok-masuk` (Admin Store)  
> ⚠️ Klarifikasi: Store switcher tersedia di halaman Stok Masuk untuk Admin Store. Sesuai PRD, Admin Store hanya di-assign ke 1 store — switcher ini dipakai Owner jika login di halaman yang sama. Prototype masih tersedia untuk demo.

**Langkah**:
1. Ganti store via dropdown store switcher ke "Cabang Margonda Depok"

**Expected Result**: Tabel riwayat berubah ke data store ke-2, stat cards ter-update, dropdown produk di form berisi produk store ke-2

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-OWN-025 — Stok Masuk: Kode Penerimaan di Tabel

**Prioritas**: High  
**Precondition**: Di `/store/stok-masuk` (Admin Store)  
> ⚠️ Klarifikasi: Kolom Kode Penerimaan ada dan tampil di role Admin Store. Pastikan akses via `rizal@majujaya.com` / `store123`.

**Langkah**:
1. Amati kolom pertama tabel riwayat

**Expected Result**: Kolom "Kode Penerimaan" tampil dengan format `STK-IN-YYYYMMDD-NNN` sebagai `<code>` tag

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-OWN-026 — Owner Dashboard: Subscription Expiry Alert

**Prioritas**: High  
**Precondition**: Di `/owner/dashboard`. Data dummy sudah diupdate: PT Maju Jaya expired `2026-05-24` (5 hari dari 2026-05-19) → alert seharusnya muncul sekarang.

**Langkah**:
1. Login sebagai Owner (`owner@toko.com` / `owner123`)
2. Amati apakah ada alert banner kuning di bawah header

**Expected Result**: Alert kuning muncul: "Subscription Anda berakhir dalam 5 hari (2026-05-24)" + tombol **Hubungi Admin**

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

## MODUL 4 — ADMIN STORE
> Login sebagai: `rizal@majujaya.com`

---

### TC-STR-001 — Store Dashboard: Stat Cards Clickable

**Prioritas**: High  
**Precondition**: Login sebagai Admin Store, di `/store/dashboard`

**Langkah**:
1. Klik card **Total Produk**
2. Klik card **Stok Menipis**

**Expected Result**: Total Produk → `/store/products`, Stok Menipis → `/store/products?filter=low-stock`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-002 — Store Dashboard: Stok Menipis Progress

**Prioritas**: High  
**Precondition**: Di `/store/dashboard`

**Langkah**:
1. Amati card "Stok Menipis" (kanan bawah)

**Expected Result**: List produk dengan progress bar. Produk kritis (stock ≤ 30% minStock): progress bar merah. Produk menipis: oranye. Klik item → navigate ke `/store/products?filter=low-stock`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-003 — Store Dashboard: Quick Actions

**Prioritas**: Medium  
**Precondition**: Di `/store/dashboard`

**Langkah**:
1. Klik **Input Stok Masuk**
2. Kembali, klik **Open Stok / Opname**
3. Kembali, klik **Kelola Produk**

**Expected Result**: Masing-masing navigate ke halaman yang benar

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai, tapi redirect tidak pas atas tapi ditengah (minor)

---

### TC-STR-004 — Produk: Lihat SKU di Tabel

**Prioritas**: High  
**Precondition**: Navigasi ke `/store/products`

**Langkah**:
1. Amati kolom pertama tabel produk

**Expected Result**: Setiap baris menampilkan nama produk + SKU di bawahnya (format PRD-NN-NNN sebagai `<code>` tag)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai - ini ada config yang punya store dan tenant mana ??? 

---

### TC-STR-005 — Produk: Stock Tags

**Prioritas**: High  
**Precondition**: Di `/store/products`

**Langkah**:
1. Amati kolom Stok pada berbagai produk

**Expected Result**:
- Aqua 600ml (stock 120, min 48) → tag **Aman** (hijau)
- Indomie Soto (stock 8, min 20) → tag **Kritis** (merah, 8 ≤ 20×30%=6? → cek: 8 > 6 → **Menipis** oranye)
- Teh Botol 350ml (stock 3, min 24) → 3 ≤ floor(24×0.3)=7 → tag **Kritis** (merah)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: 

---

### TC-STR-006 — Produk: Filter Low-Stock via URL

**Prioritas**: High  
**Precondition**: Di `/store/products`

**Langkah**:
1. Akses langsung `/store/products?filter=low-stock`

**Expected Result**: Filter low-stock otomatis aktif. Banner alert muncul: "Menampilkan X produk dengan stok di bawah minimum". Tombol filter ⚠ aktif (merah).

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-007 — Produk: Toggle Filter Low-Stock

**Prioritas**: High  
**Precondition**: Di `/store/products`

**Langkah**:
1. Klik tombol **⚠ Tampilkan Menipis**
2. Amati tabel
3. Klik tombol yang sama lagi (sekarang aktif)

**Expected Result**: Toggle on → hanya produk dengan stok ≤ minStock tampil. Toggle off → semua produk tampil kembali.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-008 — Produk: Tambah Produk Baru

**Prioritas**: Critical  
**Precondition**: Di `/store/products`

**Langkah**:
1. Klik **Tambah Produk**
2. Isi: Nama = `Es Teh Manis`, Kategori = `Minuman`, Satuan Jual = `pcs`, Harga Beli = `2000`, Harga Jual = `3000`, Stok Awal = `50`, Min Stok = `20`
3. Klik **Simpan Produk**

**Expected Result**: Produk baru tampil di tabel dengan SKU auto-generated. Stock tag = Aman (50 > 20).

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-009 — Produk: Tambah dengan Kategori Baru (Custom)

**Prioritas**: High  
**Precondition**: Modal Tambah Produk terbuka

**Langkah**:
1. Di field Kategori, ketik `Rokok`
2. Klik "+ Tambah kategori baru" di dropdown

**Expected Result**: Nilai `Rokok` ter-set di field kategori. Produk tersimpan dengan kategori "Rokok".

**Status**: [ ] Pass  [x] Fail  [ ] Skip  
**Catatan**: bisa muncul rokok, tapi tidak bisa klik tombol tambah rokok sebagai kategori baru

---

### TC-STR-010 — Produk: Min Stok addonAfter Dinamis

**Prioritas**: High  
**Precondition**: Modal Tambah Produk terbuka

**Langkah**:
1. Pilih Satuan Jual: `kg`
2. Amati field Min Stok

**Expected Result**: addonAfter field Min Stok berubah dari "pcs" menjadi "kg" secara otomatis

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-011 — Produk: Hapus Produk (Konfirmasi)

**Prioritas**: High  
**Precondition**: Di `/store/products`

**Langkah**:
1. Klik ikon hapus di salah satu produk
2. Popconfirm muncul
3. Klik **Hapus**

**Expected Result**: Produk hilang dari tabel, notifikasi sukses muncul

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai, tapi kalau produk digunakan di transaksi seharusnya tidak bisa di delete (kecuali softdelete)

---

### TC-STR-012 — Open Stok: Diff Calculation

**Prioritas**: Critical  
**Precondition**: Navigasi ke `/store/open-stok` atau `/kasir/open-stok`

**Langkah**:
1. Isi Stok Fisik Aqua 600ml: `100` (sistem = 120)
2. Isi Stok Fisik Indomie Goreng: `200` (sistem = 200)
3. Isi Stok Fisik Teh Botol: `10` (sistem = 3)

**Expected Result**:
- Aqua: Selisih = `-20` (tag merah)
- Indomie: Selisih = `Sesuai` (tag hijau)
- Teh Botol: Selisih = `+7` (tag biru)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai, tapi apa ini ada history atau beberapa kali stock opname dilakukan (sepertinya sekarang tidak ada)

---

### TC-STR-013 — Open Stok: Modal Review Sebelum Simpan

**Prioritas**: Critical  
**Precondition**: Beberapa stok fisik sudah diisi di Open Stok

**Langkah**:
1. Isi minimal 1 stok fisik berbeda dari stok sistem
2. Klik **Simpan Opname (X/Y)**
3. Amati modal konfirmasi

**Expected Result**: Modal muncul dengan ringkasan: produk diisi, produk sesuai, produk ada selisih (list nama + selisih), produk belum diisi. Tombol "Simpan Opname" dan "Periksa Lagi".

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-014 — Open Stok: Notifikasi dengan opnameCode

**Prioritas**: High  
**Precondition**: Modal review Open Stok terbuka

**Langkah**:
1. Klik **Simpan Opname** di modal

**Expected Result**: Notifikasi sukses muncul: "Opname Berhasil Disimpan" + jumlah produk + **Kode Opname: OPN-YYYYMMDD-NN**

**Status**: [x] Pass  [x] Fail  [ ] Skip  
**Catatan**: Kode Opname: OPN-20260519-01, tapi ini kode tidak bisa ditelusuri dan ditampilkan, berapa kali dibuat stock opname, dari toko mana saja dll belum terpecahkan

---

### TC-STR-015 — Open Stok: Button Disabled jika Belum Diisi

**Prioritas**: High  
**Precondition**: Di `/store/open-stok`, belum ada stok fisik diisi

**Langkah**:
1. Amati tombol **Simpan Opname (0/12)**

**Expected Result**: Tombol disabled (tidak bisa diklik)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-016 — Convert Stok: Preview Konversi

**Prioritas**: High  
**Precondition**: Navigasi ke `/store/convert-stok`

**Langkah**:
1. Pilih produk: `Aqua 600ml` (convRate=24, stock=120 pcs)
2. Amati alert info
3. Input qty: `2`
4. Amati preview card

**Expected Result**: Alert: "1 dus = 24 pcs · Maks konversi: 5 dus". Preview card: "-2 dus" (merah) → "+48 pcs" (hijau)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: tapi esensi convert juga tidak ada Kode: STK-CVT-20260519-003, tidak ada list atau detail apa saja yang di split

---

### TC-STR-017 — Convert Stok: Validasi maxQty

**Prioritas**: Critical  
**Precondition**: Di `/store/convert-stok`, produk Aqua 600ml dipilih (maxQty = floor(120/24) = 5)

**Langkah**:
1. Input qty: `6` (melebihi maxQty = 5)

**Expected Result**: Tombol **Proses Konversi** tetap disabled. InputNumber membatasi input max = 5.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-018 — Convert Stok: Modal Konfirmasi

**Prioritas**: Critical  
**Precondition**: Di `/store/convert-stok`, qty valid diisi

**Langkah**:
1. Klik **Proses Konversi**
2. Amati modal konfirmasi

**Expected Result**: Modal muncul dengan diagram konversi (dari → ke), nama produk, warning "tidak dapat dibatalkan". Tombol "Ya, Proses Konversi" dan "Batal".

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-019 — Convert Stok: Notifikasi dengan movementCode

**Prioritas**: High  
**Precondition**: Modal konfirmasi konversi terbuka

**Langkah**:
1. Klik **Ya, Proses Konversi**

**Expected Result**: Notifikasi sukses: "Konversi Berhasil" + detail konversi + **Kode: STK-CVT-YYYYMMDD-NNN**

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: Kode: STK-CVT-20260519-003 ini sesuai tapi tidak bisa di trace,tidak ada list convert, dan ini tidak ada toko atau tenant ?

---

### TC-STR-020 — Convert Stok: Riwayat dengan movementCode

**Prioritas**: High  
**Precondition**: Di `/store/convert-stok`

**Langkah**:
1. Amati timeline riwayat konversi hari ini (kanan)

**Expected Result**: Setiap item timeline menampilkan: nama produk, detail konversi, nama user, waktu, dan **movementCode** (format STK-CVT-YYYYMMDD-NNN)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: ada riwayat tapi tidak bisa view detail di list convert

---

### TC-STR-021 — Convert Stok: Produk Tanpa convUnit Tidak Muncul

**Prioritas**: Medium  
**Precondition**: Di `/store/convert-stok`

**Langkah**:
1. Buka dropdown **Pilih Produk**
2. Amati opsi yang tersedia

**Expected Result**: Hanya produk yang punya `convUnit` (satuan beli) yang muncul di dropdown

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-022 — Convert Stok: Reset Form Setelah Sukses

**Prioritas**: Medium  
**Precondition**: Konversi berhasil dilakukan

**Langkah**:
1. Amati form setelah modal konfirmasi di-OK

**Expected Result**: Dropdown produk kembali ke placeholder "Pilih produk...", field qty dikosongkan, preview card hilang

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-023 — Store Riwayat Transaksi: Filter Kasir

**Prioritas**: Medium  
**Precondition**: Navigasi ke `/store/transaksi`

**Langkah**:
1. Filter Kasir → pilih `Ani Rahayu`

**Expected Result**: Hanya transaksi oleh Ani Rahayu yang tampil. Total transaksi dan omzet berubah.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-STR-024 — Breadcrumb Admin Store

**Prioritas**: Medium  
**Precondition**: Login sebagai Admin Store

**Langkah**:
1. Navigasi ke `/store/products`
2. Amati header

**Expected Result**: Breadcrumb tampil: `Toko Pusat Sudirman > Management Produk`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

## MODUL 5 — KASIR
> Login sebagai: `kasir@toko.com`

---

### TC-KSR-001 — POS: Filter Kategori dengan Count

**Prioritas**: High  
**Precondition**: Login sebagai Kasir, di `/kasir/pos`

**Langkah**:
1. Amati tombol filter kategori di atas grid produk

**Expected Result**: Setiap tombol kategori menampilkan count: `Semua (12)`, `Minuman (6)`, `Makanan (3)`, `Snack (3)`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-002 — POS: Add to Cart & Selected State

**Prioritas**: Critical  
**Precondition**: Di `/kasir/pos`

**Langkah**:
1. Klik card produk `Aqua 600ml`
2. Amati card setelah ditambahkan

**Expected Result**: Card produk berubah visual (border indigo, background biru muda, badge qty muncul di pojok kanan atas, ikon keranjang berwarna indigo). Di keranjang kanan: item Aqua 600ml qty 1 muncul.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-003 — POS: Stok 0 Tidak Bisa Ditambah

**Prioritas**: Critical  
**Precondition**: Di `/kasir/pos` — perlu produk dengan stok 0 (simulasi: cek data)

**Langkah**:
1. Amati card produk yang stoknya 0 (jika ada)
2. Klik card tersebut

**Expected Result**: Card opacity 50%, cursor not-allowed. Klik tidak menambahkan ke keranjang.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-004 — POS: Kurang Bayar Hint

**Prioritas**: High  
**Precondition**: Cart berisi item, total misalnya Rp 17.000

**Langkah**:
1. Input nominal bayar: `10000` (kurang dari total)
2. Amati area di atas tombol Bayar

**Expected Result**: Banner merah muncul: "Kurang Rp 7.000". Tombol **Bayar Sekarang** tetap disabled.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-005 — POS: Kembalian Display

**Prioritas**: High  
**Precondition**: Cart berisi item, total Rp 17.000

**Langkah**:
1. Input nominal bayar: `20000`

**Expected Result**: Banner hijau muncul: "Kembalian Rp 3.000". Tombol **Bayar Sekarang** aktif.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-006 — POS: Kosongkan Keranjang dengan Konfirmasi

**Prioritas**: High  
**Precondition**: Cart berisi minimal 1 item

**Langkah**:
1. Klik **Kosongkan** di header keranjang
2. Popconfirm muncul: "Kosongkan keranjang?"
3. Klik **Kosongkan**

**Expected Result**: Cart dikosongkan, empty state tampil: "Pilih produk untuk ditambahkan"

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-007 — POS: Batal Kosongkan Keranjang

**Prioritas**: Medium  
**Precondition**: Cart berisi item, popconfirm muncul

**Langkah**:
1. Klik **Batal** di popconfirm kosongkan

**Expected Result**: Cart tetap berisi item, tidak dikosongkan

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai 

---

### TC-KSR-008 — POS: Proses Bayar Berhasil

**Prioritas**: Critical  
**Precondition**: Cart berisi item, nominal bayar ≥ total

**Langkah**:
1. Klik **Bayar Sekarang**

**Expected Result**: Notifikasi sukses: "Transaksi Berhasil!" + kembalian + nama kasir. Cart dikosongkan, nominal bayar di-reset.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai 

---

### TC-KSR-009 — Kasir Riwayat: Search Transaksi

**Prioritas**: Medium  
**Precondition**: Navigasi ke `/kasir/riwayat`

**Langkah**:
1. Ketik `TRX-20260519-001` di kolom search

**Expected Result**: Hanya transaksi dengan kode tersebut yang tampil

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-KSR-010 — Kasir Riwayat: Expand Detail

**Prioritas**: Medium  
**Precondition**: Di `/kasir/riwayat`

**Langkah**:
1. Klik expand (▶) di baris transaksi pertama

**Expected Result**: Sub-tabel tampil: produk, qty, harga, subtotal. Footer: "Bayar: Rp X" dan "Kembalian: Rp Y" (hijau)

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: 

---

## MODUL 6 — CROSS-CUTTING
> Berlaku semua role

---

### TC-CRS-001 — Breadcrumb di Semua Layout

**Prioritas**: Medium  
**Precondition**: Login dengan masing-masing role

**Langkah**:
1. Admin → navigasi ke `/admin/tenants` → cek breadcrumb
2. Owner → navigasi ke `/owner/stores` → cek breadcrumb
3. Admin Store → navigasi ke `/store/products` → cek breadcrumb
4. Kasir → navigasi ke `/kasir/riwayat` → cek breadcrumb

**Expected Result**:
- Admin: `Admin Platform > Management Tenant`
- Owner: `PT Maju Jaya > Management Store`
- Admin Store: `Toko Pusat Sudirman > Management Produk`
- Kasir: `Toko Pusat Sudirman > Riwayat Transaksi`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-CRS-002 — Halaman 404

**Prioritas**: High  
**Precondition**: Login sebagai role apapun

**Langkah**:
1. Akses langsung URL: `/halaman-yang-tidak-ada`

**Expected Result**: Halaman 404 tampil dengan judul "404", subtitle "Halaman yang Anda cari tidak ditemukan.", tombol **Kembali**

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-CRS-003 — Halaman 403 Unauthorized

**Prioritas**: Medium  
**Precondition**: Login sebagai role apapun

**Langkah**:
1. Akses langsung URL: `/unauthorized`

**Expected Result**: Halaman 403 tampil dengan judul "403", subtitle "Anda tidak memiliki akses ke halaman ini.", tombol **Kembali ke Login**

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: seuai

---

### TC-CRS-004 — Mobile Sidebar Toggle

**Prioritas**: High  
**Precondition**: Login sebagai Admin Store atau Kasir (pakai Tailwind Sidebar). Resize browser ke lebar < 768px.

**Langkah**:
1. Di viewport mobile, amati tampilan sidebar
2. Klik tombol hamburger (☰) di kiri atas
3. Klik backdrop overlay di luar sidebar
4. Klik hamburger lagi → klik menu item navigasi

**Expected Result**: Sidebar tersembunyi default di mobile. Hamburger muncul. Klik → sidebar slide in + overlay gelap muncul. Klik backdrop → sidebar tutup. Klik menu item → sidebar tutup + navigate.

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-CRS-005 — Konfirmasi Logout Semua Layout

**Prioritas**: High  
**Precondition**: Login secara bergilir dengan masing-masing role

**Langkah**:
1. Login Admin → klik logout di dropdown → cek modal konfirmasi muncul
2. Login Owner → logout → cek modal
3. Login Admin Store → logout → cek modal
4. Login Kasir → logout di Sidebar → cek modal

**Expected Result**: Modal konfirmasi "Konfirmasi Logout" muncul di semua role sebelum redirect ke `/login`

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

### TC-CRS-006 — Empty State Semua Halaman

**Prioritas**: Medium  
**Precondition**: Login dengan berbagai role

**Langkah**:
1. POS → cart kosong: amati empty state
2. Store Dashboard → jika tidak ada stok menipis
3. Riwayat Kasir → jika tidak ada transaksi sesuai search

**Expected Result**:
- POS cart: icon + "Pilih produk untuk ditambahkan"
- Stok Menipis (jika kosong): "Semua stok aman 👍"
- Tabel kosong: "Belum ada data..." sesuai konteks

**Status**: [x] Pass  [ ] Fail  [ ] Skip  
**Catatan**: sesuai

---

## Ringkasan Temuan Bug

| ID Bug | TC terkait | Deskripsi | Severity | Status Fix |
|---|---|---|---|---|
| BUG-001 | TC-AUTH-001–005 | Password login tidak divalidasi — sembarang password lolos | High | ✅ Fixed: kredensial tetap per role (admin123/owner123/store123/kasir123) |
| BUG-002 | TC-ADM-025 | Popconfirm tidak muncul saat toggle status di TenantDetailPage | High | ✅ Fixed: ganti ke Modal.confirm |
| BUG-003 | TC-STR-009 | Tombol "+ Tambah kategori baru" tidak bisa diklik | High | ✅ Fixed: ganti ke pola onSearch + setFieldValue |
| BUG-004 | TC-ADM-022 | Tab label "Kasir" tidak akurat — berisi kasir + admin store | Low | ✅ Fixed: label diubah ke "User Store" |
| BUG-005 | TC-ADM-002 | Badge angka "1" di header tabel tidak jelas konteksnya | Low | ✅ Fixed: ganti ke Tag bertulisan "1 expired" |
| BUG-006 | TC-ADM-003 | Klik seluruh baris tabel navigate ke detail (dipertanyakan user) | Low | ✅ Fixed: navigasi hanya via tombol Detail |
| BUG-007 | TC-OWN-011 | Store baru tidak tampil storeCode | Medium | ✅ Fixed: storeCode di-generate saat store baru dibuat |
| BUG-008 | TC-OWN-026 | Expiry alert tidak muncul karena expired date tenant terlalu jauh | Medium | ✅ Fixed: expired tenant 1 diupdate ke 2026-05-24 |

**Severity Level**:
- **Critical**: Flow utama tidak bisa dijalankan
- **High**: Fitur tidak bekerja tapi ada workaround
- **Medium**: UI/UX tidak sesuai expected
- **Low**: Kosmetik, tidak mempengaruhi fungsi

---

## MODUL 7 — INTEGRASI BE
> Fase 4b — Test setelah koneksi real database. Jalankan seeder dulu: `npx ts-node -r tsconfig-paths/register src/database/seed-fresh.ts`

---

### TC-INT-001 — Login Real dengan Password Benar

**Prioritas**: Critical  
**Langkah**: Login `admin@omnikasir.com` / `admin123`  
**Expected Result**: Berhasil masuk ke `/admin/dashboard` dengan data real dari database

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-002 — Login Real dengan Password Salah

**Prioritas**: Critical  
**Langkah**: Login `admin@omnikasir.com` / `wrongpassword`  
**Expected Result**: Alert merah "Email atau password salah" — tidak redirect

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-003 — Sidebar Owner Tampilkan Nama Tenant & Plan

**Prioritas**: High  
**Langkah**: Login sebagai Owner (`budi@majujaya.com`) → amati sidebar dan header  
**Expected Result**: Sidebar: "PT Maju Jaya Sejahtera". Header: "Plan Pro", "Aktif s/d 2026-08-15", nama "Budi Santoso"

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-004 — Sidebar Admin Store Tampilkan Nama Store

**Prioritas**: High  
**Langkah**: Login sebagai Admin Store (`rizal@majujaya.com`) → amati sidebar  
**Expected Result**: Sidebar: "Toko Pusat Sudirman", "PT Maju Jaya Sejahtera"

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-005 — POS Kasir Tampilkan Produk

**Prioritas**: Critical  
**Langkah**: Login sebagai Kasir (`ani@majujaya.com`) → buka `/kasir/pos`  
**Expected Result**: Grid produk tampil (12 produk) dengan nama, harga, stok. Filter kategori berfungsi.

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-006 — Proses Transaksi POS → Stok Berkurang

**Prioritas**: Critical  
**Langkah**: Login Kasir → tambah Aqua 600ml qty 2 ke cart → bayar Rp 10.000 → Bayar  
**Expected Result**: Notifikasi sukses dengan transactionCode. Stok Aqua 600ml berkurang 2 di halaman produk.

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-007 — Riwayat Transaksi Tampilkan Items & Kasir

**Prioritas**: High  
**Langkah**: Login Owner → buka `/owner/transaksi` → expand baris TRX-20260519-001  
**Expected Result**: Sub-tabel tampil items produk (Aqua 600ml, Indomie, Beng-beng). Kolom Kasir: "Ani Rahayu". Kolom Store: "Toko Pusat Sudirman".

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

### TC-INT-008 — Management Store Tampilkan Tx/Bln & Revenue

**Prioritas**: High  
**Langkah**: Login Owner → buka `/owner/stores`  
**Expected Result**: Card "Toko Pusat Sudirman" menampilkan Transaksi/Bln > 0 dan Revenue/Bln > Rp 0. Cabang lain: 0 (sesuai data seeder).

**Status**: [ ] Pass  [ ] Fail  [ ] Skip  
**Catatan**:

---

## Catatan Prototype Limitation — Status Update (Fase 4b)

| TC | Catatan Awal | Status Fase 4b |
|---|---|---|
| TC-STR-014 | opnameCode tidak bisa ditelusuri | ✅ Resolved: History opname ada di tab Riwayat Opname dengan expand row detail |
| TC-STR-016/019/020 | movementCode tidak bisa di-trace | ✅ Resolved: Riwayat konversi & movements tampil dari real BE |
| TC-STR-012 | Tidak ada history multiple opname | ✅ Resolved: Multiple opname tersimpan dan tampil di tabel riwayat |
| TC-ADM-010 | Plan dihapus langsung hilang | ⚠️ Still: Soft delete belum diimplementasi di plan, akan di Sprint 2 |
| TC-STR-004 | SKU config tenant/store mana | ✅ Resolved: SKU auto-generate dari BE, terikat storeId dari JWT |
| TC-ADM-016 | Password complexity | ⚠️ Still: BE hanya validasi min 8 karakter — uppercase/symbol untuk Sprint 2 |

---

## Changelog QA

| Versi | Tanggal | Perubahan |
|---|---|---|
| v1.0 | 2026-05-19 | Dokumen awal — 103 test case, 6 modul |
| v1.1 | 2026-05-19 | Update hasil eksekusi oleh user. 8 bug ditemukan dan di-fix. Tambah klarifikasi TC-OWN-022/023/024/025 (role salah). Tambah catatan prototype limitation. |
| v1.2 | 2026-05-19 | Tambah TC-ADM-028 s/d TC-ADM-032 untuk fitur Kelola Admin Platform (list, tambah, email duplikat, nonaktifkan, proteksi Super Admin). Total TC: 103 → 108. |
| v1.3 | 2026-05-19 | **Integrasi BE**: Update kredensial demo (password real, email real dari seeder). Tambah Modul 7 Integrasi BE (TC-INT-001 s/d TC-INT-008): login real, sidebar nama tenant/store, POS produk, proses transaksi, riwayat dengan items, management store tx/revenue. Update status prototype limitation — 4 dari 6 resolved. Total TC: 108 → 116. |
