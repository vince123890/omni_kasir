# FSD: Omni Kasir — Functional Specification Document

---

## MODUL 1: AUTHENTICATION

### UC-001 — Login (Semua Role)

**Actor**: Admin, Owner, Kasir  
**Pre-condition**: User sudah terdaftar di sistem  
**Post-condition**: User mendapat JWT token, diarahkan ke dashboard sesuai role

**Basic Flow**:
1. User buka halaman login
2. Input email + password
3. Sistem validasi format
4. Sistem cek email di database
5. Sistem verifikasi password (bcrypt)
6. Sistem generate JWT dengan payload: `{ userId, role, tenantId, storeId }`
7. Frontend simpan token di localStorage
8. Redirect berdasarkan role:
   - `admin` → `/admin/dashboard`
   - `owner` → `/owner/dashboard`
   - `admin_store` → `/store/dashboard`
   - `kasir` → `/kasir/pos`

**Alternative Flow**:
- Email tidak ditemukan → "Email atau password salah"
- Password salah → "Email atau password salah"
- Akun nonaktif → "Akun Anda dinonaktifkan, hubungi admin"
- Tenant subscription expired → "Subscription Anda telah berakhir"

**Business Rules**:
- BR-001: JWT expired 8 jam
- BR-002: Password min 8 karakter

---

### UC-021 — Logout

**Actor**: Admin, Owner, Kasir
**Basic Flow**:
1. User klik tombol "Logout"
2. Frontend hapus access token dan refresh token dari localStorage
3. Redirect ke halaman `/login`

**Business Rules**:
- Token tidak di-blacklist di server (stateless JWT) — cukup hapus di client
- Jika refresh token diimplementasi via HttpOnly cookie, server wajib clear cookie saat logout

---

### UC-022 — Refresh Token

**Actor**: Admin, Owner, Kasir (otomatis via frontend)
**Basic Flow**:
1. Frontend detect access token expired (response 401)
2. Frontend kirim request `POST /auth/refresh-token` dengan refresh token
3. Server validasi refresh token
4. Server kembalikan access token baru
5. Frontend ulangi request original

**Alternative Flow**:
- Refresh token expired/invalid → redirect ke `/login`

**Business Rules**:
- Refresh token masa berlaku 7 hari
- Satu user hanya punya satu refresh token aktif (rotate on use)

---

### UC-023 — Ganti Password

**Actor**: Admin, Owner, Kasir
**Basic Flow**:
1. User buka menu "Ganti Password"
2. Input password lama, password baru, konfirmasi password baru
3. Sistem verifikasi password lama (bcrypt compare)
4. Sistem update password baru (bcrypt hash)
5. Sistem update field `passwordChangedAt`
6. Semua session lain dianggap invalid (perlu login ulang)

**Alternative Flow**:
- Password lama salah → "Password lama tidak sesuai"
- Password baru tidak match → "Konfirmasi password tidak sesuai"
- Password baru sama dengan lama → "Password baru harus berbeda"

---

### UC-024 — Reset Password via Email (Sprint 2)

**Actor**: Admin (trigger), Owner/Kasir (eksekusi)
**Status**: ⏳ Ditunda ke Sprint 2 — membutuhkan email service

**Basic Flow (Sprint 2)**:
1. Admin atau Owner klik "Kirim Link Reset Password"
2. Sistem generate token reset (expire 1 jam)
3. Sistem kirim email ke user berisi link reset
4. User klik link → input password baru sendiri
5. Sistem update password (bcrypt hash) + invalidate token

**Business Rules**:
- Admin tidak pernah tahu password user → keamanan terjaga
- Token reset hanya berlaku 1 jam dan sekali pakai
- MVP: jika user lupa password, admin reset langsung via database (prosedur manual, tidak ada UI)

**Catatan MVP**: Tombol "Reset Password" tidak ditampilkan di UI karena tidak ada email service. Owner/kasir lupa password → hubungi admin via WhatsApp/telepon → admin update langsung di database.

---

### UC-025 — Deactivate / Reaktifkan Kasir atau Admin Store

**Actor**: Owner
**Basic Flow (Deactivate)**:
1. Owner pilih kasir atau admin store → klik "Nonaktifkan"
2. Sistem set `user.isActive = false` dan `user.deletedAt = now()` (soft delete)
3. User tersebut tidak bisa login

**Basic Flow (Reaktifkan)**:
1. Owner pilih user nonaktif → klik "Aktifkan"
2. Sistem set `user.isActive = true` dan `user.deletedAt = null`
3. User bisa login kembali

**Business Rules**:
- Riwayat transaksi user yang dinonaktifkan tetap tersimpan dan bisa diakses owner
- User yang sedang login tidak langsung terlogout — hanya tidak bisa refresh token setelah expired

---

### UC-029 — Dashboard Owner

**Actor**: Owner
**Basic Flow**:
1. Owner login → diarahkan ke `/owner/dashboard`
2. Sistem tampilkan:
   - Info tenant: nama bisnis, plan aktif, tanggal expired
   - **Alert subscription** jika expired ≤ 7 hari: "Subscription Anda berakhir dalam X hari, hubungi admin untuk perpanjang"
   - Stat cards: Total Store, Total Kasir aktif, Transaksi Hari Ini, Omzet Hari Ini
   - Tabel performa store (semua store): kasir aktif, transaksi/bulan, revenue
   - Kolom di tabel store: klik "X/Y kasir" → langsung ke halaman Kasir & Admin Store filter store itu
   - Kolom di tabel store: klik "Transaksi" → ke riwayat transaksi filter store itu

**Business Rules**:
- Semua data adalah **view only** — tidak ada tombol edit/hapus di dashboard
- Stat "Transaksi Hari Ini" dan "Omzet Hari Ini" dihitung dari semua store milik tenant
- Tidak ada card "Stok Menipis" — stok adalah tanggung jawab Admin Store, bukan Owner

---

### UC-026 — Dashboard Admin

**Actor**: Admin
**Basic Flow**:
1. Admin login → diarahkan ke `/admin/dashboard`
2. Sistem tampilkan:
   - Total tenant aktif / expired / nonaktif
   - Total store di semua tenant
   - Tenant yang akan expired dalam 7 hari (alert)
   - Daftar tenant terbaru (5 terakhir)

---

### UC-027 — Lihat Detail Tenant (Admin)

**Actor**: Admin
**Basic Flow**:
1. Admin klik baris tenant di daftar → navigasi ke `/admin/tenants/:id`
2. Sistem tampilkan header dengan:
   - Avatar entityType (PT/CV/UD) + nama lengkap tenant
   - Tag status, tag plan, tanggal expired
3. Info cards:
   - Informasi Tenant: entityType, nama bisnis, nama owner, email, tanggal bergabung, expired
   - Statistik: total store, total kasir, kasir aktif, kasir nonaktif
4. Tab content:
   - **Store** — tabel semua store milik tenant (nama, alamat, kasir, transaksi/bln, revenue, status)
   - **Kasir** — tabel semua kasir di semua store tenant (nama, email, store, login terakhir, status)
   - **Riwayat Subscription** — timeline perubahan plan dari waktu ke waktu

**Action buttons di header**:
- **Edit** → modal edit tenant (entityType, nama, owner; email disabled karena kredensial login)
- **Perpanjang** → modal perpanjang subscription (plan, tanggal mulai, durasi)
- **Aktifkan / Nonaktifkan** → Popconfirm → toggle status, tombol berganti label sesuai kondisi

**Catatan**: Tombol "Reset Password" **tidak ada** di halaman ini (MVP — tidak ada email service). Owner lupa password → prosedur manual via admin.

---

### UC-028 — Tambah Admin Store (by Owner)

**Actor**: Owner
**Basic Flow**:
1. Owner buka menu "Management Kasir & Admin Store"
2. Klik "Tambah Admin Store"
3. Isi form: nama, email, password awal
4. Pilih store yang akan di-assign (hanya store milik tenant ini)
5. Sistem buat `User` dengan role `admin_store`, dikaitkan ke `storeId` dan `tenantId`
6. Admin Store bisa langsung login dan mengelola store yang ditugaskan

**Pre-condition**: Owner sudah punya minimal 1 store aktif

**Business Rules**:
- 1 Admin Store hanya bisa di-assign ke 1 store (field `storeId` wajib)
- Tidak ada batas jumlah Admin Store per store (berbeda dengan kasir yang dibatasi `maxCashiersPerStore`)
- Owner bisa nonaktifkan Admin Store kapan saja (UC-025)
- Admin Store tidak bisa membuat atau menghapus store — hanya Owner yang bisa

---

### UC-030 — Kelola Admin Platform

**Actor**: Admin  
**Basic Flow (Lihat Daftar Admin)**:
1. Admin buka menu "Kelola Admin" di sidebar
2. Sistem tampilkan tabel semua akun admin: nama, email, status, tanggal bergabung, login terakhir
3. Admin utama (id=1 / seeder) ditandai badge "Utama" dan tidak bisa dinonaktifkan

**Basic Flow (Tambah Admin Baru)**:
1. Admin klik "Tambah Admin"
2. Isi form: nama, email, password awal
3. Sistem buat user baru dengan role `admin`, tanpa tenantId dan storeId
4. Admin baru langsung bisa login ke platform

**Basic Flow (Nonaktifkan Admin)**:
1. Admin klik "Nonaktifkan" di baris admin yang dipilih
2. Popconfirm → konfirmasi
3. Sistem set `user.isActive = false`
4. Admin yang dinonaktifkan tidak bisa login

**Business Rules**:
- Role admin bersifat **tetap** — tidak ada UI untuk ganti role
- Admin utama (dari seeder, id=1) tidak bisa dinonaktifkan dari UI
- Email admin harus unique di seluruh tabel `users`
- Tidak ada Role Management atau Menu Permission terpisah — akses dikontrol oleh role yang sudah fixed per desain BL-010
- Scope user management per role: Admin → kelola admin platform; Owner → kelola kasir & admin store milik tenant-nya

---

## MODUL 2: ADMIN — MANAGEMENT SUBSCRIPTION

### UC-002 — Lihat Daftar Subscription Plan

**Actor**: Admin  
**Basic Flow**:
1. Admin buka menu "Subscription Plans"
2. Sistem tampilkan daftar plan (nama, harga, durasi, fitur, status aktif)

### UC-003 — Buat Subscription Plan

**Actor**: Admin  
**Basic Flow**:
1. Admin klik "Tambah Plan"
2. Isi form: nama plan, harga/bulan, durasi (bulan), deskripsi fitur, maks store, maks kasir per store
3. Simpan → plan tersedia untuk di-assign ke tenant

**Field Plan**:
- `name`: string (contoh: "Basic", "Pro", "Enterprise") — **harus unique, case-insensitive**
- `price`: decimal
- `durationDays`: integer
- `maxStores`: integer
- `maxCashiersPerStore`: integer
- `isActive`: boolean
- `isPopular`: boolean — hanya **satu plan** yang boleh `true` di waktu bersamaan

**Fitur checklist di card plan** di-generate otomatis dari `maxStores` dan `maxCashiersPerStore`:
- `maxStores = 1` → "1 Store"
- `maxStores >= 999` → "Unlimited store"
- `maxCashiersPerStore = 5` → "5 Kasir per store"
- `maxCashiersPerStore >= 999` → "Unlimited kasir per store"

### UC-004 — Edit / Nonaktifkan / Tandai Populer Plan

**Actor**: Admin  
**Basic Flow (Edit)**:
1. Admin klik ikon Edit di card plan → modal edit muncul dengan nilai pre-filled
2. Update field yang diinginkan → simpan

**Basic Flow (Nonaktifkan)**:
1. Admin toggle Switch "Aktif/Nonaktif" di card plan
2. Nonaktifkan plan tidak menghapus subscription tenant yang sedang berjalan

**Basic Flow (Tandai Populer)**:
1. Admin klik tag "Tandai Populer" di card plan
2. Sistem set `isPopular = true` untuk plan tersebut
3. Sistem otomatis set `isPopular = false` untuk semua plan lain (hanya 1 boleh aktif)
4. Tag berubah menjadi "PALING POPULER" berwarna biru, border card jadi indigo

---

## MODUL 3: ADMIN — MANAGEMENT TENANT

### UC-005 — Lihat & Filter Daftar Tenant

**Actor**: Admin  
**Basic Flow**:
1. Admin buka menu "Tenants"
2. Tampil tabel: entityType (PT/CV/UD) + nama bisnis, owner + email, plan, tanggal bergabung, expired, status
3. Admin bisa filter kombinasi:
   - **Jenis Usaha**: Semua / PT / CV / UD
   - **Status**: Semua / Aktif / Expired / Nonaktif
   - **Plan**: Semua / Basic / Pro / Enterprise
   - **Search**: by nama bisnis, nama owner, atau jenis usaha
4. Subtitle menampilkan "X dari Y tenant" sesuai filter aktif
5. Tombol "Reset Filter" muncul saat ada filter aktif
6. Klik baris → navigasi ke halaman detail tenant

**Action per baris (dropdown)**:
- Lihat Detail → `/admin/tenants/:id`
- Edit Tenant → modal edit (entityType, nama, owner — email disabled)
- Perpanjang Subscription → modal pilih plan + durasi
- Aktifkan / Nonaktifkan → toggle status dengan konfirmasi

### UC-006 — Buat Tenant Baru (Daftarkan Owner)

**Actor**: Admin  
**Basic Flow**:
1. Admin klik "Tambah Tenant"
2. Isi form:
   - Nama bisnis (tenant name)
   - Nama owner
   - Email owner
   - Password awal
   - Pilih subscription plan
   - Tanggal mulai
3. Sistem buat:
   - Record `Tenant` baru
   - Record `User` dengan role `owner`, dikaitkan ke tenant
   - Record `Subscription` aktif
4. Owner bisa langsung login

### UC-007 — Aktifkan / Nonaktifkan Tenant

**Actor**: Admin  
**Basic Flow**:
1. Admin pilih tenant → toggle aktif/nonaktif
2. Jika dinonaktifkan: semua user tenant tidak bisa login (cek status saat auth)

### UC-008 — Perpanjang Subscription Tenant

**Actor**: Admin  
**Basic Flow**:
1. Admin pilih tenant → klik "Perpanjang"
2. Pilih plan baru (atau sama) + durasi
3. Sistem update `expiredAt` pada subscription

---

## MODUL 4: OWNER — MANAGEMENT STORE

### UC-009 — Lihat Daftar Store

**Actor**: Owner  
**Basic Flow**:
1. Owner buka dashboard
2. Tampil semua store milik tenant-nya (nama store, alamat, jumlah kasir, status)

### UC-010 — Tambah Store

**Actor**: Owner  
**Pre-condition**: Jumlah store belum mencapai batas `maxStores` dari subscription  
**Basic Flow**:
1. Owner klik "Tambah Store"
2. Isi: nama store, alamat, nomor telepon
3. Sistem buat record `Store` dengan `tenantId` owner
4. Store siap digunakan

**Alternative Flow**:
- Sudah mencapai batas maxStores → "Upgrade subscription untuk menambah store"

### UC-011 — Edit / Hapus Store

**Actor**: Owner
**Basic Flow (Edit)**:
1. Owner klik Edit di card store → modal edit (nama, alamat, phone)
2. Simpan → data store terupdate

**Basic Flow (Hapus)**:
1. Owner klik Hapus di card store → Popconfirm muncul
2. Sistem cek: apakah store memiliki riwayat transaksi?
   - Jika YA → tolak dengan pesan "Store tidak dapat dihapus karena memiliki riwayat transaksi"
   - Jika TIDAK → lanjut soft delete
3. Sistem set `store.deletedAt = now()`, `store.isActive = false`
4. Semua kasir dan admin store di store tersebut otomatis nonaktif

**Business Rules**:
- Store hanya bisa dihapus (soft delete) jika **tidak ada transaksi sama sekali** di store tersebut
- Jika store punya transaksi, owner hanya bisa nonaktifkan (bukan hapus)
- Data transaksi historis tetap tersimpan meski store dinonaktifkan

### UC-012 — Management User Store (Tambah Kasir / Admin Store)

**Actor**: Owner
**Basic Flow**:
1. Owner buka menu "Management Kasir & Admin Store"
2. Pilih tab: Kasir atau Admin Store
3. Klik "Tambah Kasir" atau "Tambah Admin Store"
4. Isi: nama, email, password, pilih store
5. Sistem buat `User` dengan role `kasir` atau `admin_store`, dikaitkan ke `storeId` dan `tenantId`

**Business Rules**:
- Kasir dibatasi oleh `maxCashiersPerStore` dari subscription plan
- Admin Store tidak dibatasi jumlahnya
- Owner tidak bisa login sebagai kasir/admin store — role terpisah

---

## MODUL 5: STORE — MANAGEMENT PRODUK

### UC-013 — Lihat Daftar Produk

**Actor**: Admin Store
**Basic Flow**:
1. Admin Store buka menu "Produk"
2. Sistem tampilkan produk milik store yang ditugaskan saja
3. Tampil tabel: nama, kategori, satuan, harga jual, stok saat ini

**Business Rules**:
- Admin Store hanya bisa lihat produk store-nya sendiri (`storeId` dari JWT)
- Owner bisa lihat produk semua store (view only, tidak bisa edit)

### UC-014 — Tambah Produk

**Actor**: Admin Store
**Basic Flow**:
1. Admin Store klik "Tambah Produk"
2. Isi form:
   - Nama produk
   - Kategori — pilih dari daftar atau ketik untuk tambah kategori baru
   - Satuan jual (`unit`) — pilih dari suggestions atau ketik baru (pcs, kg, gram, liter, dll)
   - Satuan beli/besar (`convUnit`) — opsional, pilih dari suggestions atau ketik baru (dus, karton, box, dll)
   - Rate konversi (`convRate`) — wajib jika `convUnit` diisi (integer > 0)
   - Harga beli
   - Harga jual
   - Stok awal
   - **Min Stok** — batas minimum stok sebelum alert "stok menipis" muncul (wajib)
3. Sistem simpan produk dengan `storeId` dari JWT dan `tenantId`

**Business Rules**:
- Kategori dan satuan **tidak dikelola sebagai master data terpisah** — cukup suggestions dari produk yang sudah ada + default umum
- Jika Admin Store mengetik kategori/satuan baru yang belum ada, sistem menerima dan menyimpan nilai tersebut
- `minStock` menentukan threshold "stok menipis" per produk — tidak ada nilai global
- Stok menipis = `product.stock <= product.minStock`
- Stok kritis = `product.stock <= 30% dari product.minStock`

### UC-015 — Edit / Hapus Produk

**Actor**: Admin Store
**Business Rules**:
- Produk tidak bisa dihapus jika sudah ada di transaksi (soft delete)
- Admin Store hanya bisa edit/hapus produk store-nya sendiri

---

## MODUL 6: STORE — MANAGEMENT STOK

### UC-016 — Open Stok / Opname

**Actor**: Admin Store, Kasir  
**Deskripsi**: Pengecekan dan pencatatan stok fisik vs stok sistem. Bisa dilakukan kapan saja, tidak harus awal hari.

**Basic Flow (Input Opname)**:
1. Buka menu "Open Stok" → tab **Form Opname**
2. Halaman terbuka **kosong** — tidak menampilkan semua produk (tidak scalable untuk toko ribuan produk)
3. User **cari produk** via search bar: ketik nama → pilih dari dropdown → produk ditambahkan ke tabel
4. Ulangi untuk setiap produk yang perlu diopname (hanya produk yang dipilih)
5. Per produk di tabel: input **Stok Fisik** aktual. Tombol hapus (×) tersedia untuk keluarkan produk
6. Sistem hitung selisih otomatis: `difference = qtyActual - qtySystem`
   - Positif (+): tag biru | Negatif (−): tag merah | Nol: tag hijau "Sesuai"
7. Klik "Simpan Opname (N produk)" → modal review muncul:
   - Ringkasan: produk ditambahkan, diisi, sesuai, ada selisih
   - Untuk setiap produk yang ada selisih: **dropdown wajib pilih alasan selisih**
   - Pilihan alasan: Barang rusak/tidak layak jual, Kehilangan/dicuri, Kesalahan input stok sebelumnya, Selisih penghitungan manual, Stok bonus dari supplier, Pengembalian barang dari pelanggan, Lainnya (bisa ketik custom)
   - Warning: "Aksi ini tidak dapat dibatalkan"
8. Konfirmasi → sistem simpan `StockOpname` + `StockOpnameItem` per produk yang diisi stok fisiknya
9. Notifikasi sukses dengan `opnameCode`. Form direset, pindah ke tab Riwayat Opname

**Alasan Desain — Input Manual**:
- Toko dengan ribuan produk: tidak perlu load semua untuk opname 5–10 item
- User hanya opname produk yang memang perlu dicek (tidak setiap sesi harus semua produk)
- Backend: search endpoint, bukan load all products

**Basic Flow (Lihat Riwayat Opname)**:
1. Klik tab **Riwayat Opname**
2. Tabel menampilkan: Kode Opname, Tanggal, Dibuat Oleh, Produk Diisi (X/Y + jumlah selisih), Status
3. Klik expand (▶) di baris opname → sub-tabel detail muncul:
   - Kolom: Nama Produk, Satuan, Stok Sistem, Stok Fisik, Selisih (tag), Alasan Selisih
   - Footer: Total diisi / Sesuai / Ada selisih
4. Hanya produk yang diisi stok fisiknya yang tampil di detail

**Business Rules**:
- Tombol "Simpan Opname" disabled jika tidak ada produk yang sudah diisi stok fisiknya
- Alasan selisih **wajib diisi** untuk setiap produk dengan `difference ≠ 0` sebelum bisa konfirmasi
- Produk yang ditambahkan tapi belum diisi stok fisik tidak masuk ke `StockOpnameItem`
- Satu produk tidak bisa ditambahkan dua kali dalam satu sesi opname
- Stok sistem diupdate mengikuti stok fisik setelah opname tersimpan
- Setelah tersimpan, data opname tidak bisa diedit (immutable)

### UC-017 — Input Stok Masuk (Pembelian Barang)

**Actor**: Admin Store  
**Basic Flow**:
1. Buka menu "Stok Masuk"
2. Pilih produk, input jumlah, harga beli, tanggal
3. Sistem tambahkan ke stok produk
4. Catat di `StockMovement` dengan type `IN`

### UC-018 — Convert Stok (Konversi Satuan)

**Actor**: Admin Store, Kasir  
**Deskripsi**: Mengkonversi stok dari satuan besar ke kecil, contoh: 1 dus = 24 pcs.

**Basic Flow (Proses Konversi)**:
1. Buka menu "Convert Stok" → kolom kiri Form Konversi
2. Pilih produk (hanya produk yang punya `conversionUnit` yang muncul di dropdown)
3. Sistem tampilkan info: `1 {convUnit} = {convRate} {unit}` · Maks konversi: `floor(stock / convRate) convUnit`
4. Input jumlah dalam satuan besar (min 1, max = maks konversi)
5. Sistem tampilkan preview: `-{qty} {convUnit}` (merah) → `+{resultQty} {unit}` (hijau)
6. Klik "Proses Konversi" → modal konfirmasi muncul dengan diagram konversi + warning tidak dapat dibatalkan
7. Konfirmasi → sistem update stok: `stock += qty × convRate`
8. Sistem catat `StockMovement` type `CONVERT` dengan `qtyBefore`, `qtyAfter`
9. Notifikasi sukses dengan `movementCode` (STK-CVT-YYYYMMDD-NNN)
10. Form direset, record baru muncul di riwayat

**Basic Flow (Lihat Riwayat Konversi)**:
1. Kolom kanan halaman menampilkan tabel riwayat semua konversi store ini
2. Kolom tabel: Kode (STK-CVT-...), Produk, Konversi (`-{from} {fromUnit}` → `+{to} {toUnit}` + `Stok: {before} → {after} {unit}`), Operator, Waktu
3. Tabel paginasi (5 per halaman), sortable by waktu
4. Record baru dari konversi terkini langsung muncul di atas tabel

**Pre-condition**: Relasi konversi sudah didefinisikan di master produk (`conversionUnit` dan `conversionRate` tidak null)

**Business Rules**:
- Tombol "Proses Konversi" disabled jika qty kosong, 0, atau melebihi maks konversi
- Stok tidak boleh negatif setelah konversi — validasi di frontend dan backend
- `qtyBefore` dan `qtyAfter` di `StockMovement` mencerminkan stok dalam satuan jual (`unit`), bukan satuan besar

---

## MODUL 7: KASIR — TRANSAKSI PENJUALAN (POS)

### UC-019 — Transaksi Penjualan

**Actor**: Kasir  
**Basic Flow**:
1. Kasir buka halaman POS
2. Cari/pilih produk (search atau scan barcode — sprint 2)
3. Produk masuk keranjang, kasir bisa ubah qty
4. Sistem hitung total otomatis
5. Kasir input nominal bayar
6. Sistem hitung kembalian
7. Kasir klik "Bayar" → transaksi tersimpan
8. Sistem kurangi stok produk yang terjual (atomik dalam satu DB transaction)
9. Sistem catat `StockMovement` type `OUT` untuk setiap item yang terjual
10. Tampil struk (on-screen)

**Data Transaksi**:
- `transactionCode`: auto-generated
- `storeId`, `tenantId`, `cashierId`
- `items`: [ { productId, productName, qty, price, subtotal } ]
- `totalAmount`, `paidAmount`, `changeAmount`
- `paymentMethod`: cash (default MVP)
- `createdAt`

**Alternative Flow**:
- Stok produk tidak cukup → warning "Stok [produk] tidak mencukupi"
- Nominal bayar kurang dari total → tombol "Bayar" disabled

**Business Rules**:
- BR-001: Transaksi tidak bisa diedit setelah tersimpan
- BR-002: Kasir hanya bisa lihat transaksi di store-nya sendiri

### UC-020 — Riwayat Transaksi

**Actor**: Owner (semua store), Admin Store (store sendiri), Kasir (store sendiri)
**Basic Flow**:
1. Buka menu "Riwayat Transaksi"
2. Sistem filter transaksi sesuai scope role:
   - **Owner** → semua transaksi semua store milik tenant
   - **Admin Store** → transaksi store yang ditugaskan saja
   - **Kasir** → transaksi store sendiri
3. Filter yang tersedia:
   - Filter **Store** (Owner only — dropdown pilih store atau "Semua Store")
   - Filter **Kasir** (Owner & Admin Store — dropdown pilih nama kasir)
   - Filter **Tanggal** — date picker single date
4. Summary stats: total transaksi, total omzet (terupdate sesuai filter aktif)
5. Tampil tabel transaksi dengan expandable row untuk detail item
6. Klik baris → expand detail: daftar item, total bayar, kembalian

**Business Rules**:
- Owner tidak bisa edit atau hapus transaksi (BL-006)
- Filter kasir hanya menampilkan kasir yang pernah bertransaksi di store yang dipilih
- Tanggal filter wajib dalam format yang jelas (DD/MM/YYYY)

---

## STRUKTUR DATA (Entity Overview)

```
User
  - id, name, email, password (bcrypt), role (admin|owner|admin_store|kasir)
  - tenantId (null jika admin)
  - storeId (null jika admin/owner; wajib ada jika admin_store/kasir)
  - isActive
  - passwordChangedAt (nullable)
  - createdAt, updatedAt, deletedAt (soft delete)
  — JWT payload: { userId, role, tenantId, storeId }

Tenant
  - id, tenantCode (unique), entityType (PT|CV|UD), name, fullName
  - phone (nullable)
  - isActive
  - createdAt, updatedAt
  — tenantCode format: TNT-{YYYYMM joinDate}-{NNN} (auto-generated saat tenant dibuat)
    contoh: TNT-202508-001

Subscription
  - id, tenantId, planId
  - startAt, expiredAt, isActive
  - createdAt, updatedAt

SubscriptionPlan
  - id, name (unique, case-insensitive), price, durationDays
  - maxStores, maxCashiersPerStore
  - isActive, isPopular (hanya satu yang true)
  - createdAt, updatedAt

Store
  - id, tenantId, storeCode (unique), name, address, phone
  - isActive
  - createdAt, updatedAt, deletedAt (soft delete)
  — storeCode format: STR-{YYMM createdAt}-{tenantNN}{storeNN} (auto-generated saat store dibuat)
    contoh: STR-2508-0101 (tenant ke-1, store ke-1, dibuat Agustus 2025)

Product
  - id, storeId, tenantId, name, category
  - sku (auto-generated: PRD-{storeNN}-{productNNN}), barcode (nullable — persiapan sprint 2)
  - unit (satuan jual: pcs/kg/gram/dll), conversionUnit (nullable, satuan beli: dus/karton/dll), conversionRate (nullable, integer > 0)
  - buyPrice, sellPrice, stock (integer)
  - minStock (integer > 0) — batas minimum stok per produk untuk alert menipis
  - isActive
  - createdAt, updatedAt, deletedAt (soft delete)
  — sku format: PRD-{storeNN}-{productNNN}, contoh: PRD-01-001
  — Tidak ada tabel master kategori/satuan — kategori & satuan adalah string bebas dengan suggestions

StockMovement
  - id, movementCode (unique), productId, storeId, tenantId
  - type (IN | OUT | CONVERT | OPNAME)
  - qty (integer), qtyBefore (integer), qtyAfter (integer)
  - referenceId (nullable — transactionId atau opnameId)
  - note, createdBy (userId), createdAt
  — movementCode format per type:
    IN:      STK-IN-{YYYYMMDD}-{NNN},  contoh: STK-IN-20260519-001
    OUT:     mengacu ke transactionCode (tidak generate kode baru)
    CONVERT: STK-CVT-{YYYYMMDD}-{NNN}, contoh: STK-CVT-20260519-001
    OPNAME:  mengacu ke opnameCode (tidak generate kode baru)
  — IN: stok masuk dari supplier (UC-017)
  — OUT: dikurangi otomatis saat transaksi penjualan berhasil (UC-019)
  — CONVERT: hasil convert satuan (UC-018)
  — OPNAME: koreksi stok dari open stok (UC-016)

StockOpname
  - id, opnameCode (unique), storeId, tenantId
  - opnameDate, createdBy (userId)
  - status (DRAFT | COMPLETED)
  - createdAt, updatedAt
  — opnameCode format: OPN-{YYYYMMDD}-{NN} (auto-generated, reset per hari per store)
    contoh: OPN-20260519-01

StockOpnameItem
  - id, opnameId, productId
  - qtySystem, qtyActual, difference (qtyActual - qtySystem)
  - reason (nullable string) — alasan selisih, **wajib diisi jika difference ≠ 0**
    nilai valid: 'Barang rusak / tidak layak jual' | 'Kehilangan / dicuri' |
    'Kesalahan input stok sebelumnya' | 'Selisih penghitungan manual' |
    'Stok bonus dari supplier' | 'Pengembalian barang dari pelanggan' | 'Lainnya' | custom string

Transaction
  - id, transactionCode, storeId, tenantId, cashierId
  - totalAmount, paidAmount, changeAmount
  - paymentMethod (CASH — default MVP)
  - status (COMPLETED | VOIDED)
  - note (nullable — catatan kasir)
  - createdAt
  — transactionCode format: TRX-{YYYYMMDD}-{NNN} (auto-generated, reset per hari per store)
    contoh: TRX-20260519-001

TransactionItem
  - id, transactionId, productId
  - productName (snapshot), qty, price, subtotal
```

---

## BUSINESS LOGIC

### BL-001: Isolasi Data Tenant
- Setiap query ke tabel `Product`, `Store`, `Transaction`, `StockMovement` **wajib** difilter dengan `tenantId`
- Backend mengambil `tenantId` dari JWT payload, bukan dari request body
- Admin tidak terikat `tenantId` — bisa akses semua data

### BL-002: Validasi Subscription Saat Login
- Saat login, sistem cek: `Subscription.isActive === true` dan `expiredAt > now()`
- Jika subscription expired → tolak login dengan pesan "Subscription Anda telah berakhir"
- Jika tenant `isActive === false` → tolak login dengan pesan "Akun dinonaktifkan"

### BL-003: Batas Jumlah Store per Tenant
- Saat owner tambah store, sistem hitung jumlah store aktif milik tenant
- Jika `count(store) >= SubscriptionPlan.maxStores` → tolak dengan pesan "Upgrade subscription"

### BL-004: Batas Jumlah Kasir per Store
- Saat owner tambah kasir di store, sistem hitung kasir aktif di store tersebut
- Jika `count(kasir) >= SubscriptionPlan.maxCashiersPerStore` → tolak

### BL-005: Stok Tidak Boleh Negatif
- Saat transaksi penjualan, sistem cek stok sebelum menyimpan transaksi
- Jika stok produk < qty yang dibeli → transaksi ditolak per item
- Stok dikurangi **setelah** transaksi berhasil disimpan (atomik)
- Untuk mencegah race condition (2 kasir beli produk terakhir bersamaan), gunakan **database transaction dengan pessimistic row lock** (`SELECT ... FOR UPDATE`) saat cek dan kurangi stok

### BL-006: Transaksi Tidak Bisa Diedit/Dihapus
- Setelah transaksi tersimpan, tidak ada endpoint edit/delete transaksi
- Koreksi dilakukan via transaksi retur (fitur sprint 2)

### BL-007: Snapshot Harga di TransactionItem
- `TransactionItem.productName` dan `TransactionItem.price` disimpan sebagai snapshot saat transaksi terjadi
- Jika harga produk berubah di kemudian hari, riwayat transaksi lama tidak terpengaruh

### BL-008: Convert Stok
- Model yang digunakan: **satu produk dengan field konversi sendiri** (bukan dua produk terpisah)
- Field di `Product`: `conversionUnit` (string, misal "dus") dan `conversionRate` (integer, misal 24)
- Artinya: produk "Aqua 600ml" punya unit jual `pcs`, tapi bisa dibeli per `dus` (1 dus = 24 pcs)
- Saat convert N dus: `product.stock += N × conversionRate`, catat `StockMovement` type `CONVERT` qty `N × conversionRate`
- Kedua operasi harus **atomik** (dalam satu database transaction)
- Stok tidak boleh negatif setelah konversi — cek dulu sebelum proses

### BL-009: Open Stok / Opname
- Open stok bisa dilakukan kapan saja, tidak harus awal hari
- Selisih antara stok sistem dan stok fisik dicatat sebagai `StockMovement` type `OPNAME`
- Stok sistem diupdate mengikuti stok fisik yang diinput
- Produk yang tidak diisi (`qtyActual = null`) tidak masuk ke `StockOpnameItem` dan stoknya tidak berubah
- Setiap `StockOpnameItem` dengan `difference ≠ 0` **wajib punya `reason`** — backend validasi sebelum simpan

### BL-020: Alasan Selisih Opname

- `StockOpnameItem.reason` wajib diisi jika `difference ≠ 0`
- Backend reject `POST /stocks/opname` jika ada item dengan `difference ≠ 0` tapi `reason` kosong/null
- Nilai yang diizinkan (tidak strict enum — bisa custom string, min 3 karakter):
  - `Barang rusak / tidak layak jual`
  - `Kehilangan / dicuri`
  - `Kesalahan input stok sebelumnya`
  - `Selisih penghitungan manual`
  - `Stok bonus dari supplier`
  - `Pengembalian barang dari pelanggan`
  - `Lainnya` (atau custom text)
- `reason` disimpan as-is (string, tidak dinormalisasi)
- Di riwayat opname, `reason` tampil di kolom "Alasan Selisih" pada expanded row detail

### BL-010: Role & Akses

> Role yang berlaku: **Admin**, **Owner**, **Admin Store**, **Kasir**.
> - Admin Store menggantikan fungsi operasional yang sebelumnya dipegang Owner.
> - Owner hanya view — tidak ikut campur operasional harian store.

| Aksi | Admin | Owner | Admin Store | Kasir |
|------|:-----:|:-----:|:-----------:|:-----:|
| Kelola subscription plan | ✅ | ❌ | ❌ | ❌ |
| Kelola tenant | ✅ | ❌ | ❌ | ❌ |
| Kelola store (tambah/edit/hapus) | ❌ | ✅ | ❌ | ❌ |
| Tambah / kelola kasir & admin store | ❌ | ✅ | ❌ | ❌ |
| Lihat dashboard & laporan semua store | ❌ | ✅ | ❌ | ❌ |
| Kelola produk (store sendiri) | ❌ | ❌ | ✅ | ❌ |
| Input stok masuk (supplier) | ❌ | ❌ | ✅ | ❌ |
| Open stok / opname | ❌ | ❌ | ✅ | ✅ |
| Convert stok | ❌ | ❌ | ✅ | ✅ |
| Transaksi penjualan (POS) | ❌ | ❌ | ❌ | ✅ |
| Lihat riwayat transaksi | ❌ | ✅ (semua store) | ✅ (store sendiri) | ✅ (store sendiri) |

### BL-011: Soft Delete

- `Product`, `User`, `Store` tidak dihapus permanen dari database
- Hapus = set `deletedAt = now()`, data tetap ada untuk referensi historis transaksi
- Semua query default harus filter `WHERE deletedAt IS NULL`
- TypeORM: gunakan `@DeleteDateColumn()` dan `softRemove()`

### BL-012: Validasi Input

| Field | Aturan |
|-------|--------|
| Email | Format valid, unique di seluruh tabel `users` |
| Password | Min 8 karakter |
| Phone | Format Indonesia: diawali `08` atau `+62`, 10–13 digit |
| Name (tenant/store/user/product) | Min 2, maks 100 karakter, tidak boleh hanya spasi |
| `SubscriptionPlan.name` | **Unique, case-insensitive** — "Pro" dan "pro" dianggap duplikat |
| `product.category` | String bebas, min 2 karakter — suggestions dari produk store + default (Minuman/Makanan/Snack) |
| `product.unit` | String bebas, min 1 karakter — suggestions: pcs, kg, gram, liter, ml, lusin, pak |
| `product.conversionUnit` | String bebas, opsional — suggestions: dus, karton, box, slop, bal, karung, galon |
| `conversionRate` | Integer, harus > 0 jika `conversionUnit` diisi |
| `buyPrice`, `sellPrice` | Integer >= 0, `sellPrice` tidak harus > `buyPrice` (bisa promo) |
| `stock` (initialStock) | Integer >= 0 |
| `minStock` | Integer >= 1 — wajib diisi saat tambah/edit produk |

### BL-018: Kategori dan Satuan Produk (Tidak Ada Master Data)

- Kategori dan satuan (`unit`, `convUnit`) **tidak dikelola sebagai tabel master terpisah**
- Nilai disimpan langsung di kolom produk sebagai string bebas
- UI memberikan **suggestions** dari:
  - Default bawaan sistem (Minuman, Makanan, Snack untuk kategori; pcs, kg, dll untuk satuan)
  - Nilai yang sudah dipakai di produk store tersebut (dinamis)
- Admin Store bisa mengetik nilai baru yang belum ada di suggestions — sistem menerima dan menyimpan
- Konsekuensi: tidak ada centralized management, tapi cukup untuk MVP

### BL-019: Minimum Stok per Produk (`minStock`)

- Setiap produk wajib memiliki field `minStock` (integer >= 1)
- **Stok Aman**: `stock > minStock`
- **Stok Menipis**: `stock <= minStock`
- **Stok Kritis**: `stock <= floor(minStock × 30%)`
- Alert "Stok Menipis" di dashboard Admin Store menampilkan produk yang `stock <= minStock`
- Tidak ada global threshold — setiap produk punya batasnya sendiri
- Tombol "Lihat Produk →" di card stok menipis navigasi ke `/store/products?filter=low-stock`

### BL-017: SubscriptionPlan isPopular

- Hanya **satu** SubscriptionPlan yang boleh `isPopular = true` di waktu bersamaan
- Saat admin set plan X sebagai populer, semua plan lain otomatis `isPopular = false`
- Backend: `UPDATE subscription_plans SET is_popular = false WHERE id != :id` sebelum set plan baru
- `isPopular` tidak mempengaruhi fungsionalitas plan — hanya penanda visual di halaman marketing/admin

### BL-013: Stok Awal Produk Otomatis Jadi StockMovement

- Saat produk baru dibuat (UC-014) dengan `initialStock > 0`:
  - `product.stock = initialStock`
  - Otomatis buat `StockMovement` type `IN`, qty = initialStock, note = "Stok awal", qtyBefore = 0, qtyAfter = initialStock
- Jika `initialStock = 0`, tidak buat StockMovement

### BL-014: Timezone

- Semua `createdAt`, `updatedAt`, `opnameDate` disimpan dalam **UTC** di database
- Frontend menampilkan waktu dalam **WIB (UTC+7)**
- Backend tidak perlu konversi — kirim ISO string, frontend yang konversi dengan `dayjs` atau `date-fns-tz`

### BL-015: Qty Stok Harus Integer

- Stok produk menggunakan **integer** (tidak ada desimal)
- Untuk produk dengan satuan berat (kg, gram) atau volume (liter, ml): gunakan satuan terkecil
  - Contoh: jika jual per gram, `stock = 1000` artinya 1 kg
- `conversionRate` juga harus integer

### BL-016: Rate Limiting Login

- Maksimal **5 kali login gagal** dalam **10 menit** dari IP yang sama
- Setelah limit tercapai: block selama **30 menit**, response `429 Too Many Requests`
- Implementasi: gunakan NestJS `@nestjs/throttler` dengan store in-memory (MVP) atau Redis (production)
- Counter di-reset jika login berhasil

---

## DAFTAR API ENDPOINT

### Auth
```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
PATCH  /auth/change-password
```
> `POST /auth/reset-password` ditunda ke Sprint 2 (membutuhkan email service — lihat UC-024)

### Admin — Subscription Plan
```
GET    /admin/subscription-plans
POST   /admin/subscription-plans
PATCH  /admin/subscription-plans/:id
DELETE /admin/subscription-plans/:id
```

### Admin — Tenant
```
GET    /admin/tenants                 (list + filter + search)
GET    /admin/tenants/:id             (detail tenant + stores)
POST   /admin/tenants                 (buat tenant + owner user + subscription)
PATCH  /admin/tenants/:id             (edit info tenant)
PATCH  /admin/tenants/:id/status      (aktifkan/nonaktifkan)
PATCH  /admin/tenants/:id/subscription (perpanjang/ganti plan)
```

### Owner — Store
```
GET    /owner/stores
POST   /owner/stores
PATCH  /owner/stores/:id
DELETE /owner/stores/:id              (soft delete — hanya jika tidak ada transaksi)
PATCH  /owner/stores/:id/status       (nonaktifkan jika ada transaksi)
```

### Owner — User Management (Kasir & Admin Store)
```
GET    /owner/stores/:storeId/users          (list kasir + admin store per store)
GET    /owner/users                          (list semua user semua store tenant ini)
POST   /owner/stores/:storeId/users          (buat kasir atau admin_store)
PATCH  /owner/users/:id                      (edit nama/email)
PATCH  /owner/users/:id/status               (aktifkan/nonaktifkan)
```
> Reset password user: tidak ada endpoint di MVP — prosedur manual via admin (UC-024)

### Admin Store — Produk
```
GET    /admin-store/products                  (produk store sendiri — storeId dari JWT)
POST   /admin-store/products                  (tambah produk)
PATCH  /admin-store/products/:id              (edit produk)
DELETE /admin-store/products/:id              (soft delete)
```

### Admin Store — Stok
```
POST   /admin-store/stocks/in                 (UC-017: stok masuk dari supplier)
POST   /admin-store/stocks/convert            (UC-018: convert satuan)
GET    /admin-store/stocks/convert            (riwayat konversi store sendiri)
POST   /admin-store/stocks/opname             (UC-016: simpan opname + items + reason)
GET    /admin-store/stocks/opname             (riwayat opname store sendiri)
GET    /admin-store/stocks/opname/:id/items   (detail item per opname — untuk expand row)
GET    /admin-store/stocks/movements          (riwayat semua StockMovement)
```

### Kasir — Stok & Transaksi
```
GET    /kasir/products                        (list produk untuk POS — scope per store dari JWT)
POST   /kasir/stocks/convert                  (UC-018: convert satuan)
GET    /kasir/stocks/convert                  (riwayat konversi store sendiri)
POST   /kasir/stocks/opname                   (UC-016: simpan opname + items + reason)
GET    /kasir/stocks/opname                   (riwayat opname store sendiri)
GET    /kasir/stocks/opname/:id/items         (detail item per opname)
POST   /kasir/transactions                    (UC-019: POS bayar)
GET    /kasir/transactions                    (riwayat transaksi store sendiri)
```

### Auth — Profil
```
GET    /auth/me                               (profil user: nama, tenantName, storeName, planName, expiredAt)
```

### Transaksi (Owner — view semua store)
```
GET    /owner/transactions                    (riwayat semua store milik tenant)
GET    /owner/transactions?storeId=X          (filter per store)
GET    /owner/transactions/summary            (ringkasan omzet per store per hari)
```

### Admin Store — Transaksi (view store sendiri)
```
GET    /admin-store/transactions              (riwayat transaksi store sendiri)
```

---

## CATATAN IMPLEMENTASI BACKEND

### TypeORM Dual-Column Issue
TypeORM membuat 2 kolom untuk setiap relasi: `transactionId` (camelCase, dari `@Column()`) dan `transaction_id` (snake_case, dari `@JoinColumn({ name: 'transaction_id' })`). Data diinsert ke camelCase tapi JOIN menggunakan snake_case → relasi selalu null jika tidak di-sync.

**Workaround**: Setelah seeder, jalankan script SQL sync FK:
```sql
UPDATE transaction_items SET transaction_id=transactionId, product_id=productId WHERE transaction_id IS NULL;
UPDATE stock_movements SET product_id=productId, store_id=storeId, tenant_id=tenantId, created_by=createdBy WHERE product_id IS NULL;
-- dan tabel lain yang punya relasi
```
Script ini terintegrasi di `seed-fresh.ts`.

### Relasi dengan `relations: ['plan']` tidak bekerja
TypeORM `findOne({ relations: ['plan'] })` gagal untuk tabel `subscriptions` karena dual-column (`plan_id` vs `planId`). **Fix**: ganti dengan 2 query terpisah:
```typescript
const sub = await this.subRepo.findOne({ where: { tenantId, isActive: true } })
const plan = sub ? await this.planRepo.findOne({ where: { id: sub.planId } }) : undefined
```

### Enrich Pattern untuk Nested Names
`ClassSerializerInterceptor` di-remove karena menyebabkan nested entities ter-strip. Gantinya gunakan enrich pattern — query names secara terpisah setelah query utama:
```typescript
const cashierIds = [...new Set(txs.map(t => t.cashierId))]
const cashiers = await this.userRepo.find({ where: cashierIds.map(id => ({ id })) as any })
const cashierMap = new Map(cashiers.map(u => [u.id, u.name]))
```

---

## CHANGELOG

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| v1.0 | 2026-05-19 | Dokumen awal dibuat |
| v1.1 | 2026-05-19 | Hapus role Store Manager · Tambah entityType di Tenant · Perjelas model convert stok (1 produk) · Tambah format transactionCode · Tambah StockMovement OUT di UC-019 · Perjelas race condition di BL-005 · Update semua actor dari Store Manager → Owner/Kasir |
| v1.2 | 2026-05-19 | Tambah UC-021–027 (Logout, Refresh Token, Ganti Password, Reset Password, Deactivate Kasir, Dashboard Admin, Detail Tenant) · Tambah field entity: deletedAt, passwordChangedAt, qtyBefore/After, barcode, sku, status, note · Tambah entity StockOpname + StockOpnameItem · Tambah BL-011–016 (soft delete, validasi, stok awal, timezone, integer qty, rate limiting) · Tambah daftar API endpoint lengkap |
| v1.3 | 2026-05-19 | Tambah field `isPopular` di SubscriptionPlan entity + BL-017 · Update UC-003 tambah spec fitur checklist auto-generate + validasi unique name · Update UC-004 tambah flow "Tandai Populer" · Update UC-005 tambah detail filter (entity/status/plan/search) + dropdown action per baris · Update UC-027 hapus referensi reset password, tambah detail tombol action + tab content (Store/Kasir/History) · Tambah BL-012 validasi unique plan name |
| v1.4 | 2026-05-19 | Tambah role `admin_store` di entity User · Update UC-012 (tambah Admin Store), UC-013–015 (actor → Admin Store), UC-016–018 (actor → Admin Store/Kasir), UC-020 (scope riwayat per role), UC-025 (deactivate Admin Store) · Tambah UC-028 (tambah Admin Store by Owner) · Update BL-010 RBAC 4 role · Update API endpoint: pisah `/admin-store/*` dari `/owner/*` |
| v1.5 | 2026-05-19 | Tambah UC-029 (Owner Dashboard — view only, alert subscription expired, tidak ada card Stok Menipis) · Update UC-001 redirect flow tambah `admin_store → /store/dashboard` · Update UC-011 (detail flow hapus store + validasi cek transaksi) · Update UC-020 (tambah detail filter kasir & tanggal, business rules) · Hapus `POST /auth/reset-password` dari endpoint MVP · Hapus endpoint reset-password dari owner user management · Tambah `PATCH /owner/stores/:id/status` (nonaktifkan store yang punya transaksi) |
| v1.6 | 2026-05-19 | Tambah field `minStock` di entity Product · Update UC-014 (tambah minStock wajib, kategori & satuan bebas dengan suggestions) · Update BL-012 validasi kategori/satuan/minStock · Tambah BL-018 (kategori & satuan tidak ada master data) · Tambah BL-019 (logika minStock: aman/menipis/kritis) |
| v1.7 | 2026-05-19 | Tambah field `tenantCode` di entity Tenant (format TNT-{YYYYMM}-{NNN}) · Tambah field `storeCode` di entity Store (format STR-{YYMM}-{tenantNN}{storeNN}) · Update field `sku` di Product dari nullable menjadi auto-generated (format PRD-{storeNN}-{productNNN}) · Tambah field `movementCode` di StockMovement (format STK-IN/CVT-{YYYYMMDD}-{NNN}) · Tambah field `opnameCode` di StockOpname (format OPN-{YYYYMMDD}-{NN}) · Tambah entity StockConversion (dummy) dan StockOpname history |
| v1.8 | 2026-05-19 | Update UC-016 (Open Stok): tambah tab Riwayat Opname dengan expand row detail per produk, alasan selisih wajib diisi jika ada selisih, modal review sebelum simpan, flow riwayat dengan detail item · Update UC-018 (Convert Stok): tambah flow lihat riwayat konversi (tabel dengan kolom stok before/after), detail modal konfirmasi, business rules validasi · Tambah field `reason` di entity StockOpnameItem · Tambah BL-020 (validasi alasan selisih opname) · Update API endpoint: tambah GET riwayat konversi dan GET detail item opname untuk admin-store dan kasir |
| v1.9 | 2026-05-19 | Update UC-016 Basic Flow Input Opname: ubah desain dari "tampilkan semua produk" menjadi "input manual per produk via search" — scalable untuk toko dengan ribuan produk. Tambah alasan desain di UC-016. Update Business Rules: satu produk tidak bisa ditambahkan dua kali, produk tanpa stok fisik tidak masuk StockOpnameItem. |
| v2.0 | 2026-05-19 | Tambah UC-030 (Kelola Admin Platform): list + tambah + nonaktifkan akun admin. Klarifikasi keputusan desain: tidak ada Role Management, tidak ada Menu Permission — RBAC fixed per BL-010. Update endpoint `GET/POST /admin/users` dan `PATCH /admin/users/:id/status`. |
| v2.1 | 2026-05-19 | **Integrasi BE**: Tambah endpoint `GET /auth/me` dan `GET /kasir/products`. Tambah seksi Catatan Implementasi Backend (TypeORM dual-column issue, relasi plan workaround, enrich pattern untuk nested names). Update daftar API endpoint kasir + auth. |

## CHECKLIST FASE 1

- [x] PRD sudah dibuat dan direvisi (v1.1)
- [x] Semua modul MVP terdaftar dan konsisten antara PRD ↔ FSD
- [x] FSD dibuat untuk semua use case MVP
- [x] Role disederhanakan: Admin / Owner / Kasir
- [x] Model convert stok sudah diputuskan (1 produk dengan field konversi)
- [x] Tech stack disepakati (Ant Design, bukan Tailwind)
- [x] Format transactionCode didokumentasikan
- [x] Timeline kasar ada
- [x] UC-021–027 ditambahkan (auth flows + admin dashboard + detail tenant)
- [x] Semua entity punya `createdAt` dan soft delete (`deletedAt`) di entity yang relevan
- [x] StockOpname sebagai entity terpisah
- [x] BL-011–016 ditambahkan (soft delete, validasi, stok awal, timezone, integer, rate limiting)
- [x] Daftar API endpoint lengkap didokumentasikan

- [x] Role Admin Store ditambahkan (v1.4) — operasional per store
- [x] Owner diubah menjadi view-only untuk operasional
- [x] BL-010 RBAC diupdate untuk 4 role
- [x] UC-028 ditambahkan (Owner tambah Admin Store)
- [x] API endpoint dipisah `/admin-store/*` dari `/owner/*`

**→ Lanjut ke Fase 6: Database Schema MySQL**
