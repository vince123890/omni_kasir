# PRD: Omni Kasir

## 1. Overview
- **Nama Produk**: Omni Kasir
- **Versi**: 1.6
- **Tanggal**: 2026-05-19
- **Deskripsi**: Aplikasi kasir multi-tenant berbasis SaaS. Satu platform untuk banyak bisnis (tenant), setiap tenant bisa memiliki lebih dari satu toko (store), setiap toko memiliki kasir dan produknya sendiri.

---

## 2. Problem Statement
Pemilik bisnis ritel/warung membutuhkan sistem kasir yang:
- Bisa dikelola secara terpusat oleh admin platform
- Mendukung multi-store dalam satu akun bisnis
- Kasir bisa bertransaksi secara real-time
- Stok bisa dikelola per store

---

## 3. Goals & Objectives
- Membangun platform SaaS kasir yang bisa digunakan banyak tenant
- Admin bisa mengelola subscription dan mengaktifkan/menonaktifkan tenant
- Owner bisa mendaftarkan banyak store dan mengelola operasional
- Kasir bisa melakukan transaksi penjualan dengan mudah

---

## 4. User Roles

| Role | Deskripsi | Scope |
|------|-----------|-------|
| Admin | Pengelola platform Omni Kasir | Global — semua tenant |
| Owner | Pemilik bisnis — **view only** operasional. Kelola store, kasir, dan admin store. Lihat dashboard & laporan. | Tenant miliknya + semua store-nya |
| Admin Store | Pengelola operasional satu store — manage produk, stok, pembelian | Satu store yang ditugaskan |
| Kasir | Operator transaksi di store | Satu store yang ditugaskan |

> **Keputusan desain**:
> - Role `Admin Store` ditambahkan kembali (sebelumnya disebut Store Manager, lalu dihapus di v1.1).
> - Owner **tidak ikut campur operasional harian** (produk, stok, pembelian) — hanya view dashboard, laporan, dan master data.
> - Admin Store bertanggung jawab atas operasional per store yang ditugaskan.
> - 1 Admin Store hanya bisa di-assign ke 1 store (terikat `storeId`, sama seperti kasir).
> - Produk bersifat **per-store** — Store A dan Store B punya master produk masing-masing.

---

## 5. Feature List

### MVP (Must Have — Sprint 1)

#### Admin
- [ ] Login admin
- [ ] Management subscription plan (buat/edit/hapus plan, tandai "Paling Populer", aktifkan/nonaktifkan)
- [ ] Management tenant (daftar + filter by jenis/status/plan, detail tenant, aktifkan/nonaktifkan, perpanjang subscription)
- [ ] **Kelola Admin** — list semua akun admin platform, tambah admin baru (nama, email, password awal), nonaktifkan admin (kecuali admin utama). Role admin bersifat tetap, tidak bisa diubah.

#### Owner
- [ ] Login owner
- [ ] Dashboard tenant (info subscription + alert expired, ringkasan semua store — **view only, tidak ada stok menipis**)
- [ ] Lihat riwayat transaksi semua store (filter per store, per kasir, per tanggal)
- [ ] Management store (tambah/edit store; hapus hanya jika tidak ada transaksi, nonaktifkan jika ada transaksi)
- [ ] Management user per store (tambah kasir & admin store, nonaktifkan; **tidak ada reset password**)

#### Admin Store
- [ ] Login admin store
- [ ] Management produk store (tambah/edit/hapus produk)
  - Kategori: pilih dari suggestions atau ketik baru (tidak ada master data kategori)
  - Satuan jual & satuan beli: pilih dari suggestions atau ketik baru (tidak ada master data satuan)
  - Min Stok: wajib diisi per produk — menentukan threshold alert stok menipis
- [ ] Alert stok menipis di dashboard (berdasarkan `minStock` per produk)
- [ ] Filter produk menipis di halaman produk
- [ ] Input stok masuk (pembelian barang dari supplier)
- [ ] Open stok / opname
  - **Input manual per produk** — cari produk via search, tambahkan yang perlu diopname saja (tidak load semua produk, scalable untuk toko ribuan produk)
  - Hitung selisih otomatis (stok sistem vs stok fisik) per produk
  - Isi **alasan selisih** per produk yang berbeda (wajib jika ada selisih)
  - Modal review ringkasan sebelum simpan (jumlah sesuai, jumlah selisih, daftar selisih + alasan)
  - **Lihat riwayat opname** — tabel history dengan expand row detail per produk (qtySystem, qtyActual, selisih, alasan)
- [ ] Convert stok (konversi satuan, misal: dus → pcs)
  - Preview konversi sebelum proses (konfirmasi modal)
  - **Lihat riwayat konversi** — tabel history: kode, produk, konversi (dari → ke), stok sebelum, stok sesudah, operator, waktu
- [ ] Lihat riwayat transaksi store sendiri (filter per kasir & tanggal)

#### Kasir
- [ ] Transaksi penjualan (POS: pilih produk, hitung total, bayar)
- [ ] Open stok / opname (sama seperti Admin Store — dengan riwayat & alasan selisih)
- [ ] Convert stok (sama seperti Admin Store — dengan riwayat & stok before/after)
- [ ] Riwayat transaksi hari ini (store sendiri)

### Nice to Have (Sprint 2+)
- [ ] Laporan penjualan (harian, bulanan, per store)
- [ ] Cetak struk
- [ ] Notifikasi stok menipis
- [ ] Dashboard analytics owner
- [ ] Multiple payment method (cash, QRIS, transfer)

---

## 6. Arsitektur Multi-Tenant

```
Platform (Admin)
    └── Tenant A (Owner A) — punya subscription aktif
    │       ├── Store A1
    │       │     ├── Produk, Stok
    │       │     └── Kasir A1
    │       └── Store A2
    │             ├── Produk, Stok
    │             └── Kasir A2
    └── Tenant B (Owner B)
            └── Store B1
                  ├── Produk, Stok
                  └── Kasir B1
```

Data tenant terisolasi — satu tenant tidak bisa melihat data tenant lain.

---

## 7. Non-Functional Requirements
- **Performance**: Response time < 2 detik
- **Security**: JWT Authentication, role-based access control (RBAC)
- **Isolation**: Data per tenant harus terisolasi (row-level via tenantId)
- **Availability**: 99% uptime target

---

## 8. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | ReactJS + TypeScript + Vite |
| Backend | NestJS + TypeScript |
| Database | MySQL |
| ORM | TypeORM |
| Auth | JWT + Role Guard |
| Styling | Ant Design (antd) |
| Deploy | VPS (Docker + Nginx) |

---

## 9. Timeline (MVP)

| Fase | Estimasi |
|------|----------|
| Fase 1: System Analysis (PRD + FSD) | Hari ini |
| Fase 2: Prototype / Wireframe | 1–2 hari |
| Fase 3: Frontend (React) | 3–5 hari |
| Fase 4: Backend (NestJS) | 3–5 hari |
| Fase 5: Integrasi & Testing | 2 hari |
| Deploy ke VPS | 1 hari |

---

## 10. Batasan MVP
- Tidak ada payment gateway eksternal
- Tidak ada notifikasi email/WhatsApp
- Multi-tenancy via row-level isolation (bukan schema-per-tenant)
- Role Admin Store ditambahkan — mengelola operasional per store (produk, stok, pembelian)
- Owner hanya view dashboard & laporan, tidak ikut campur operasional store
- Owner **tidak bisa reset password** kasir/admin store (tidak ada email service di MVP — prosedur manual)
- Store hanya bisa dihapus jika belum ada transaksi; jika sudah ada transaksi, hanya bisa dinonaktifkan
- Dashboard owner **tidak menampilkan stok menipis** — itu tanggung jawab Admin Store
- 1 Admin Store hanya untuk 1 store (tidak bisa multi-store dalam satu akun)
- Produk bersifat per-store — tidak shared antar store dalam tenant yang sama
- Convert stok menggunakan model satu produk dengan field konversi (bukan dua produk terpisah)
- Tidak ada master data Kategori atau Satuan — nilai bebas dengan suggestions dari produk yang sudah ada
- Setiap produk wajib punya `minStock` — threshold stok menipis ditentukan per produk, bukan global

---

## 11. Asumsi & Ketergantungan

| Item | Asumsi |
|------|--------|
| Database | MySQL 8.0+ sudah terinstall di VPS |
| VPS | Sudah ada akses SSH, minimal 2GB RAM |
| Domain | Opsional untuk MVP, bisa pakai IP langsung |
| Docker | Docker & Docker Compose sudah terinstall di VPS |
| Node.js | v18+ di mesin developer |
| Browser | Chrome/Firefox modern (tidak support IE) |

---

## 12. Environment Variables

Semua konfigurasi via environment variables, tidak ada hardcode di kode:

```env
# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://your-vps-ip

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=omnikasir
DB_PASS=secret
DB_NAME=omnikasir_db

# JWT
JWT_SECRET=random-64-char-string
JWT_EXPIRY=8h
JWT_REFRESH_SECRET=another-random-64-char-string
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=600
RATE_LIMIT_MAX=5
```

---

## 13. Database Migration & Seeder Strategy

- **TypeORM Migrations** — wajib pakai migration files, **tidak boleh** `synchronize: true` di production
- Setiap migration punya `up()` dan `down()` method untuk rollback
- **Seeder wajib** saat fresh install:
  - 3 default `SubscriptionPlan`: Basic (Rp 99.000), Pro (Rp 299.000), Enterprise (Rp 699.000)
  - 1 default `Admin` user (email + password dari env var)
- **Migration order**: SubscriptionPlan → Tenant → User → Store → Product → StockMovement → StockOpname → Transaction → TransactionItem

### Seeder Demo Data (Development)

File `src/database/seed-fresh.ts` — reset semua tabel dan isi ulang dengan data demo:
```bash
npx ts-node -r tsconfig-paths/register src/database/seed-fresh.ts
```

**Akun login demo:**
| Role | Email | Password |
|---|---|---|
| Super Admin | admin@omnikasir.com | admin123 |
| Owner | budi@majujaya.com | budi123 |
| Admin Store | rizal@majujaya.com | rizal123 |
| Kasir | ani@majujaya.com | ani123 |

Data demo mencakup: 6 tenant, 3 store, 12 produk, 5 transaksi, 2 opname, movements seeder.

---

## 14. Changelog PRD

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| v1.0 | 2026-05-19 | Dokumen awal |
| v1.1 | 2026-05-19 | Hapus role Store Manager · Fix tech stack (Ant Design) · Tambah Input Stok Masuk di MVP · Tambah Asumsi & Ketergantungan |
| v1.2 | 2026-05-19 | Tambah section Environment Variables · Tambah Migration & Seeder Strategy · Update feature list kasir (tambah UC logout/refresh/ganti password) |
| v1.3 | 2026-05-19 | Update feature list admin: subscription plan tambah "tandai populer", tenant tambah filter & detail view |
| v1.4 | 2026-05-19 | Tambah role Admin Store — operasional per store. Owner jadi view-only untuk operasional. Update feature list Owner & Admin Store. Update batasan MVP. |
| v1.5 | 2026-05-19 | Update feature list Owner: tambah alert expired, filter transaksi per kasir/tanggal, hapus reset password, klarifikasi hapus vs nonaktifkan store. Update batasan MVP: tidak ada stok menipis di owner dashboard, tidak ada reset password owner. |
| v1.6 | 2026-05-19 | Tambah `minStock` per produk sebagai threshold stok menipis. Update feature list Admin Store: detail kategori/satuan bebas dengan suggestions, minStock wajib, alert & filter stok menipis. Update batasan MVP: tidak ada master kategori/satuan. |
| v1.7 | 2026-05-19 | Update feature list Admin Store & Kasir: tambah detail sub-fitur open stok (alasan selisih, riwayat expand row) dan convert stok (riwayat tabel dengan stok before/after, konfirmasi modal). Sinkronisasi dengan hasil QA Fase 4a. |
| v1.8 | 2026-05-19 | Update desain Open Stok: dari tampilkan semua produk menjadi input manual per produk via search (scalable untuk toko ribuan produk). Update batasan MVP: opname tidak wajib semua produk, user pilih sendiri produk yang perlu diopname. |
| v1.9 | 2026-05-19 | Tambah fitur "Kelola Admin" untuk Super Admin: list + tambah + nonaktifkan akun admin platform. Role admin fixed, tidak ada role management atau menu permission. User management per role tetap di scope masing-masing (Owner kelola kasir/admin store). |
| v2.0 | 2026-05-19 | **Integrasi BE selesai**: Semua 19 halaman FE sudah terhubung ke real API (tidak ada dummies). Tambah seeder demo data lengkap (6 tenant, 3 store, 12 produk, 5 transaksi, dll). Tambah tabel akun login demo. Vite proxy dikonfigurasi untuk dev. |
