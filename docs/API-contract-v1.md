# API Contract — Omni Kasir
**Versi**: 1.2  
**Tanggal**: 2026-05-19  
**Base URL**: `http://localhost:3000/api`  
**Proxy FE**: Vite dev server proxy `/api` → `http://localhost:3000` (tidak ada CORS issue)  
**Format**: JSON  
**Auth**: Bearer Token (JWT)

---

## Konvensi

### Authentication Header
```
Authorization: Bearer <accessToken>
```

### Role Guard
| Simbol | Artinya |
|---|---|
| `[PUBLIC]` | Tidak perlu login |
| `[AUTH]` | Perlu login (role apapun) |
| `[ADMIN]` | Role `admin` saja |
| `[OWNER]` | Role `owner` saja |
| `[STORE]` | Role `admin_store` saja |
| `[KASIR]` | Role `kasir` saja |
| `[STORE\|KASIR]` | Role `admin_store` atau `kasir` |

### Standard Response Format

**Sukses tunggal:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": { }
}
```

**Sukses list dengan pagination:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": {
    "data": [ ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

> **Catatan implementasi**: `ResponseInterceptor` di BE membungkus semua response dalam `{ statusCode, message, data }`. Untuk paginated response, `data` berisi `{ data: [], meta: {} }` — sehingga akses di FE adalah `res.data.data.data` (array) dan `res.data.data.meta`. Gunakan helper API function yang sudah meng-handle ini.

**Error:**
```json
{
  "statusCode": 400,
  "message": "Pesan error yang jelas",
  "errors": [ ]
}
```

### Query Params Umum (untuk endpoint list)
| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | 1 | Halaman |
| `limit` | number | 10 | Item per halaman |
| `search` | string | — | Pencarian |

---

## MODULE 1 — AUTHENTICATION

### POST /auth/login `[PUBLIC]`

Login semua role. Redirect tujuan ditentukan dari field `role` di response.

**Request Body:**
```json
{
  "email": "admin@omnikasir.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@omnikasir.com",
      "role": "admin",
      "tenantId": null,
      "storeId": null
    }
  }
}
```

**Response 401:**
```json
{ "statusCode": 401, "message": "Email atau password salah" }
```

**Response 401 (akun nonaktif):**
```json
{ "statusCode": 401, "message": "Akun Anda dinonaktifkan, hubungi admin" }
```

**Response 401 (subscription expired):**
```json
{ "statusCode": 401, "message": "Subscription Anda telah berakhir" }
```

**Response 429 (rate limit):**
```json
{ "statusCode": 429, "message": "Terlalu banyak percobaan login. Coba lagi dalam 30 menit." }
```

> **BL-002**: Validasi subscription aktif saat login  
> **BL-016**: Rate limit 5 gagal / 10 menit → block 30 menit

---

### GET /auth/me `[AUTH]`

Ambil profil lengkap user yang sedang login, termasuk nama tenant, store, dan plan.

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": {
    "id": 1,
    "name": "Muhammad Rizal",
    "email": "rizal@majujaya.com",
    "role": "admin_store",
    "tenantId": 1,
    "storeId": 1,
    "tenantName": "Maju Jaya Sejahtera",
    "tenantEntityType": "PT",
    "storeName": "Toko Pusat Sudirman",
    "planName": "Pro",
    "expiredAt": "2026-08-15"
  }
}
```

> Digunakan oleh layout (sidebar) untuk menampilkan nama tenant/store/plan dari token JWT tanpa menyimpan data di JWT payload.

---

### POST /auth/logout `[AUTH]`

**Request Body:** *(kosong)*

**Response 200:**
```json
{ "statusCode": 200, "message": "Logout berhasil" }
```

---

### POST /auth/refresh-token `[PUBLIC]`

**Request Body:**
```json
{ "refreshToken": "eyJhbGci..." }
```

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Token diperbarui",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Response 401:**
```json
{ "statusCode": 401, "message": "Refresh token tidak valid atau sudah expired" }
```

---

### PATCH /auth/change-password `[AUTH]`

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Password berhasil diubah" }
```

**Response 400:**
```json
{ "statusCode": 400, "message": "Password lama tidak sesuai" }
```
```json
{ "statusCode": 400, "message": "Konfirmasi password tidak sesuai" }
```
```json
{ "statusCode": 400, "message": "Password baru harus berbeda dari password lama" }
```

---

## MODULE 2 — ADMIN: KELOLA ADMIN PLATFORM

### GET /admin/users `[ADMIN]`

Lihat semua akun admin platform.

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@omnikasir.com",
      "isActive": true,
      "createdAt": "2025-01-01",
      "lastLogin": "2026-05-19T07:00:00.000Z"
    }
  ]
}
```

---

### POST /admin/users `[ADMIN]`

Tambah akun admin baru. Role otomatis = `admin`.

**Request Body:**
```json
{
  "name": "Admin Dua",
  "email": "admin2@omnikasir.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Admin berhasil ditambahkan",
  "data": {
    "id": 2,
    "name": "Admin Dua",
    "email": "admin2@omnikasir.com",
    "isActive": true,
    "createdAt": "2026-05-19"
  }
}
```

**Response 409 (email duplikat):**
```json
{ "statusCode": 409, "message": "Email sudah digunakan" }
```

---

### PATCH /admin/users/:id/status `[ADMIN]`

Aktifkan atau nonaktifkan akun admin. Admin utama (id=1) tidak bisa dinonaktifkan.

**Request Body:**
```json
{ "isActive": false }
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Admin berhasil dinonaktifkan" }
```

**Response 403 (admin utama):**
```json
{ "statusCode": 403, "message": "Admin utama tidak bisa dinonaktifkan" }
```

---

## MODULE 3 — ADMIN: SUBSCRIPTION PLAN

### GET /admin/subscription-plans `[ADMIN]`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "name": "Basic",
      "price": 99000,
      "durationDays": 30,
      "maxStores": 1,
      "maxCashiersPerStore": 2,
      "isActive": true,
      "isPopular": false,
      "tenantCount": 3,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /admin/subscription-plans `[ADMIN]`

**Request Body:**
```json
{
  "name": "Starter",
  "price": 49000,
  "durationDays": 30,
  "maxStores": 1,
  "maxCashiersPerStore": 1
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Subscription plan berhasil dibuat",
  "data": { "id": 4, "name": "Starter", "price": 49000, "..." }
}
```

**Response 409 (nama duplikat):**
```json
{ "statusCode": 409, "message": "Nama plan \"Starter\" sudah digunakan" }
```

> **BL-017**: Nama plan unique, case-insensitive

---

### PATCH /admin/subscription-plans/:id `[ADMIN]`

**Request Body** *(semua opsional)*:
```json
{
  "name": "Starter Pro",
  "price": 59000,
  "durationDays": 30,
  "maxStores": 2,
  "maxCashiersPerStore": 2,
  "isActive": true,
  "isPopular": true
}
```

> Jika `isPopular: true` → sistem otomatis set semua plan lain `isPopular: false` (**BL-017**)

**Response 200:**
```json
{ "statusCode": 200, "message": "Plan berhasil diupdate", "data": { "..." } }
```

---

### DELETE /admin/subscription-plans/:id `[ADMIN]`

**Response 200:**
```json
{ "statusCode": 200, "message": "Plan berhasil dihapus" }
```

**Response 400 (masih ada tenant aktif):**
```json
{ "statusCode": 400, "message": "Plan tidak bisa dihapus. 3 tenant masih menggunakan plan ini." }
```

---

## MODULE 3 — ADMIN: TENANT

### GET /admin/tenants `[ADMIN]`

**Query Params:**
| Param | Tipe | Contoh | Keterangan |
|---|---|---|---|
| `search` | string | `maju` | Cari by nama bisnis, nama owner, atau entityType |
| `entityType` | string | `PT` | Filter: PT / CV / UD |
| `status` | string | `aktif` | Filter: aktif / expired / nonaktif |
| `plan` | string | `Pro` | Filter: Basic / Pro / Enterprise |
| `page` | number | `1` | — |
| `limit` | number | `10` | — |

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "tenantCode": "TNT-202508-001",
      "entityType": "PT",
      "name": "Maju Jaya Sejahtera",
      "fullName": "PT Maju Jaya Sejahtera",
      "owner": "Budi Santoso",
      "email": "budi@majujaya.com",
      "plan": "Pro",
      "status": "aktif",
      "expired": "2026-08-15",
      "joinDate": "2025-08-15",
      "storeCount": 3
    }
  ],
  "meta": { "total": 6, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### GET /admin/tenants/:id `[ADMIN]`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": {
    "id": 1,
    "tenantCode": "TNT-202508-001",
    "entityType": "PT",
    "name": "Maju Jaya Sejahtera",
    "fullName": "PT Maju Jaya Sejahtera",
    "owner": "Budi Santoso",
    "email": "budi@majujaya.com",
    "phone": null,
    "plan": "Pro",
    "status": "aktif",
    "expired": "2026-08-15",
    "joinDate": "2025-08-15",
    "stores": [
      {
        "id": 1,
        "storeCode": "STR-2508-0101",
        "name": "Toko Pusat Sudirman",
        "address": "Jl. Sudirman No. 10",
        "kasirCount": 3,
        "maxKasir": 5,
        "txMonth": 1240,
        "status": true
      }
    ],
    "users": [
      {
        "id": 1,
        "name": "Ani Rahayu",
        "email": "ani@majujaya.com",
        "role": "kasir",
        "store": "Toko Pusat Sudirman",
        "lastLogin": "2026-05-19T08:23:00.000Z",
        "isActive": true
      }
    ],
    "subscriptionHistory": [
      {
        "plan": "Basic",
        "startAt": "2025-08-15",
        "expiredAt": "2025-09-15",
        "status": "expired"
      }
    ],
    "stats": {
      "totalStores": 3,
      "totalUsers": 7,
      "activeUsers": 6,
      "inactiveUsers": 1
    }
  }
}
```

**Response 404:**
```json
{ "statusCode": 404, "message": "Tenant tidak ditemukan" }
```

---

### POST /admin/tenants `[ADMIN]`

**Request Body:**
```json
{
  "entityType": "CV",
  "name": "Berkah Abadi",
  "ownerName": "Joko Widodo",
  "email": "joko@berkah.com",
  "password": "password123",
  "planId": 1,
  "startDate": "2026-05-19"
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Tenant berhasil dibuat",
  "data": {
    "tenantId": 7,
    "tenantCode": "TNT-202605-007",
    "ownerId": 20,
    "subscriptionId": 7
  }
}
```

---

### PATCH /admin/tenants/:id `[ADMIN]`

**Request Body** *(semua opsional, email tidak bisa diubah)*:
```json
{
  "entityType": "PT",
  "name": "Maju Jaya Updated",
  "ownerName": "Budi Santoso Baru"
}
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Tenant berhasil diupdate", "data": { "..." } }
```

---

### PATCH /admin/tenants/:id/status `[ADMIN]`

**Request Body:**
```json
{ "isActive": false }
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Tenant berhasil dinonaktifkan" }
```

---

### PATCH /admin/tenants/:id/subscription `[ADMIN]`

**Request Body:**
```json
{
  "planId": 3,
  "startDate": "2026-05-19",
  "durationDays": 365
}
```

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Subscription berhasil diperpanjang",
  "data": {
    "newExpiredAt": "2027-05-19",
    "plan": "Enterprise"
  }
}
```

---

## MODULE 4 — OWNER: STORE

### GET /owner/stores `[OWNER]`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "storeCode": "STR-2508-0101",
      "name": "Toko Pusat Sudirman",
      "address": "Jl. Sudirman No. 10, Jakarta Pusat",
      "phone": "021-12345678",
      "kasirCount": 3,
      "maxKasir": 5,
      "txMonth": 1240,
      "revenue": "Rp 38,2 jt",
      "isActive": true,
      "createdAt": "2025-08-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "totalStores": 3,
    "maxStores": 5,
    "planName": "Pro"
  }
}
```

---

### POST /owner/stores `[OWNER]`

**Request Body:**
```json
{
  "name": "Cabang Bogor",
  "address": "Jl. Sudirman No. 5, Bogor",
  "phone": "08123456789"
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Store berhasil ditambahkan",
  "data": {
    "id": 4,
    "storeCode": "STR-2605-0104",
    "name": "Cabang Bogor"
  }
}
```

**Response 403 (limit tercapai):**
```json
{ "statusCode": 403, "message": "Batas store telah tercapai (5/5). Upgrade subscription untuk menambah store." }
```

> **BL-003**: Validasi batas maxStores dari plan

---

### PATCH /owner/stores/:id `[OWNER]`

**Request Body** *(semua opsional)*:
```json
{
  "name": "Toko Pusat Sudirman Updated",
  "address": "Jl. Sudirman No. 12",
  "phone": "021-99999999"
}
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Store berhasil diupdate", "data": { "..." } }
```

---

### DELETE /owner/stores/:id `[OWNER]`

**Response 200 (sukses hapus):**
```json
{ "statusCode": 200, "message": "Store berhasil dihapus" }
```

**Response 400 (ada transaksi):**
```json
{
  "statusCode": 400,
  "message": "Store tidak dapat dihapus karena memiliki riwayat transaksi. Gunakan nonaktifkan jika ingin menonaktifkan store."
}
```

> **BL-011**: Soft delete, cek ada transaksi sebelum hapus

---

### PATCH /owner/stores/:id/status `[OWNER]`

**Request Body:**
```json
{ "isActive": false }
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Store berhasil dinonaktifkan" }
```

---

## MODULE 5 — OWNER: USER MANAGEMENT

### GET /owner/users `[OWNER]`

**Query Params:**
| Param | Tipe | Keterangan |
|---|---|---|
| `storeId` | number | Filter per store |
| `role` | string | `kasir` / `admin_store` |
| `search` | string | Cari by nama |

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "name": "Ani Rahayu",
      "email": "ani@majujaya.com",
      "role": "kasir",
      "storeId": 1,
      "storeName": "Toko Pusat Sudirman",
      "isActive": true,
      "lastLogin": "2026-05-19T08:23:00.000Z"
    }
  ],
  "meta": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### GET /owner/stores/:storeId/users `[OWNER]`

Sama dengan `GET /owner/users?storeId=X`.

---

### POST /owner/stores/:storeId/users `[OWNER]`

**Request Body:**
```json
{
  "name": "Rudi Hartono",
  "email": "rudi@majujaya.com",
  "password": "password123",
  "role": "kasir"
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Kasir berhasil ditambahkan",
  "data": { "id": 11, "name": "Rudi Hartono", "email": "rudi@majujaya.com", "role": "kasir" }
}
```

**Response 409 (email duplikat):**
```json
{ "statusCode": 409, "message": "Email sudah digunakan" }
```

**Response 403 (kasir limit):**
```json
{ "statusCode": 403, "message": "Store ini sudah mencapai batas 5 kasir aktif" }
```

> **BL-004**: Validasi maxCashiersPerStore (hanya berlaku untuk role kasir)

---

### PATCH /owner/users/:id `[OWNER]`

**Request Body** *(semua opsional)*:
```json
{
  "name": "Ani Rahayu Updated",
  "email": "ani.new@majujaya.com"
}
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Data user berhasil diupdate" }
```

---

### PATCH /owner/users/:id/status `[OWNER]`

**Request Body:**
```json
{ "isActive": false }
```

**Response 200:**
```json
{ "statusCode": 200, "message": "User berhasil dinonaktifkan" }
```

---

## MODULE 6 — ADMIN STORE: PRODUK

### GET /admin-store/products `[STORE]`

**Query Params:**
| Param | Tipe | Keterangan |
|---|---|---|
| `search` | string | Cari by nama produk |
| `category` | string | Filter by kategori |
| `filter` | string | `low-stock` = tampilkan stok ≤ minStock |
| `page` | number | — |
| `limit` | number | — |

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "sku": "PRD-01-001",
      "name": "Aqua 600ml",
      "category": "Minuman",
      "unit": "pcs",
      "conversionUnit": "dus",
      "conversionRate": 24,
      "buyPrice": 2500,
      "sellPrice": 3500,
      "stock": 120,
      "minStock": 48,
      "stockStatus": "aman",
      "isActive": true
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }
}
```

> `stockStatus`: `"aman"` | `"menipis"` | `"kritis"` | `"habis"` — dihitung dari **BL-019**

---

### POST /admin-store/products `[STORE]`

**Request Body:**
```json
{
  "name": "Es Teh Manis",
  "category": "Minuman",
  "unit": "pcs",
  "conversionUnit": "dus",
  "conversionRate": 24,
  "buyPrice": 2000,
  "sellPrice": 3000,
  "initialStock": 50,
  "minStock": 20
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Produk berhasil ditambahkan",
  "data": {
    "id": 13,
    "sku": "PRD-01-013",
    "name": "Es Teh Manis",
    "stock": 50
  }
}
```

> Jika `initialStock > 0` → otomatis buat `StockMovement` type `IN` (**BL-013**)

---

### PATCH /admin-store/products/:id `[STORE]`

**Request Body** *(semua opsional)*:
```json
{
  "name": "Es Teh Manis Premium",
  "sellPrice": 3500,
  "minStock": 24
}
```

**Response 200:**
```json
{ "statusCode": 200, "message": "Produk berhasil diupdate", "data": { "..." } }
```

---

### DELETE /admin-store/products/:id `[STORE]`

**Response 200:**
```json
{ "statusCode": 200, "message": "Produk berhasil dihapus" }
```

**Response 400 (ada di transaksi):**
```json
{ "statusCode": 400, "message": "Produk tidak dapat dihapus karena sudah pernah ada di transaksi penjualan." }
```

---

## MODULE 7 — ADMIN STORE: STOK MASUK

### POST /admin-store/stocks/in `[STORE]`

**Request Body:**
```json
{
  "productId": 1,
  "qty": 48,
  "buyPrice": 2500,
  "date": "2026-05-19",
  "note": "Restock mingguan"
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Stok masuk berhasil dicatat",
  "data": {
    "movementCode": "STK-IN-20260519-003",
    "productName": "Aqua 600ml",
    "qty": 48,
    "stockBefore": 72,
    "stockAfter": 120
  }
}
```

---

## MODULE 8 — ADMIN STORE & KASIR: OPNAME

### POST /admin-store/stocks/opname `[STORE]`
### POST /kasir/stocks/opname `[KASIR]`

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "qtyActual": 118,
      "reason": "Barang rusak / tidak layak jual"
    },
    {
      "productId": 2,
      "qtyActual": 60
    }
  ]
}
```

> `reason` wajib diisi jika `qtyActual ≠ qtySystem` (**BL-020**)

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Opname berhasil disimpan",
  "data": {
    "opnameCode": "OPN-20260519-01",
    "filledCount": 2,
    "adjustedCount": 1,
    "items": [
      {
        "productId": 1,
        "productName": "Aqua 600ml",
        "qtySystem": 120,
        "qtyActual": 118,
        "difference": -2,
        "reason": "Barang rusak / tidak layak jual"
      }
    ]
  }
}
```

**Response 400 (reason tidak diisi):**
```json
{
  "statusCode": 400,
  "message": "Alasan selisih wajib diisi untuk produk yang memiliki selisih",
  "errors": [
    { "productId": 1, "productName": "Aqua 600ml", "difference": -2 }
  ]
}
```

---

### GET /admin-store/stocks/opname `[STORE]`
### GET /kasir/stocks/opname `[KASIR]`

**Query Params:** `page`, `limit`, `dateFrom`, `dateTo`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "opnameCode": "OPN-20260519-01",
      "opnameDate": "2026-05-19",
      "createdByName": "Muhammad Rizal",
      "status": "COMPLETED",
      "filledCount": 12,
      "totalCount": 12,
      "selisihCount": 4
    }
  ],
  "meta": { "total": 2, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### GET /admin-store/stocks/opname/:id/items `[STORE]`
### GET /kasir/stocks/opname/:id/items `[KASIR]`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": {
    "opnameCode": "OPN-20260519-01",
    "opnameDate": "2026-05-19",
    "createdByName": "Muhammad Rizal",
    "status": "COMPLETED",
    "items": [
      {
        "productId": 1,
        "productName": "Aqua 600ml",
        "unit": "pcs",
        "qtySystem": 120,
        "qtyActual": 118,
        "difference": -2,
        "reason": "Barang rusak / tidak layak jual"
      }
    ],
    "summary": {
      "totalFilled": 12,
      "sesuai": 8,
      "selisih": 4
    }
  }
}
```

---

## MODULE 9 — ADMIN STORE & KASIR: CONVERT STOK

### POST /admin-store/stocks/convert `[STORE]`
### POST /kasir/stocks/convert `[KASIR]`

**Request Body:**
```json
{
  "productId": 1,
  "qty": 2
}
```

> `qty` = jumlah dalam satuan besar (conversionUnit). Misal: 2 dus.  
> Hasil: `product.stock += 2 × 24 = +48 pcs`  
> **BL-008**: Atomik, stok tidak boleh negatif

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Konversi berhasil",
  "data": {
    "movementCode": "STK-CVT-20260519-003",
    "productName": "Aqua 600ml",
    "fromQty": 2,
    "fromUnit": "dus",
    "toQty": 48,
    "toUnit": "pcs",
    "stockBefore": 72,
    "stockAfter": 120
  }
}
```

**Response 400 (stok tidak cukup):**
```json
{ "statusCode": 400, "message": "Stok tidak mencukupi untuk konversi. Maks: 5 dus." }
```

---

### GET /admin-store/stocks/convert `[STORE]`
### GET /kasir/stocks/convert `[KASIR]`

**Query Params:** `page`, `limit`, `dateFrom`, `dateTo`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "movementCode": "STK-CVT-20260519-001",
      "productId": 1,
      "productName": "Aqua 600ml",
      "fromQty": 2,
      "fromUnit": "dus",
      "toQty": 48,
      "toUnit": "pcs",
      "stockBefore": 72,
      "stockAfter": 120,
      "createdByName": "Ani Rahayu",
      "createdAt": "2026-05-19T08:30:00.000Z"
    }
  ],
  "meta": { "total": 2, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

## MODULE 10 — KASIR: PRODUK & TRANSAKSI POS

### GET /kasir/products `[KASIR]`

List produk untuk keperluan POS kasir. Scope otomatis ke store kasir dari JWT.

**Query Params:** `search`, `category`, `limit`, `page`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": {
    "data": [
      {
        "id": 1,
        "sku": "PRD-01-001",
        "name": "Aqua 600ml",
        "category": "Minuman",
        "unit": "pcs",
        "sellPrice": 3500,
        "stock": 120,
        "minStock": 48,
        "stockStatus": "aman"
      }
    ],
    "meta": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }
  }
}
```

> Role `kasir` tidak bisa akses `/admin-store/products` — wajib pakai endpoint ini.

---

### POST /kasir/transactions `[KASIR]`

**Request Body:**
```json
{
  "items": [
    { "productId": 1, "qty": 2 },
    { "productId": 3, "qty": 1 }
  ],
  "paidAmount": 20000,
  "paymentMethod": "CASH",
  "note": null
}
```

> **BL-005**: Cek stok dengan `SELECT ... FOR UPDATE` sebelum simpan (race condition prevention)  
> **BL-007**: Snapshot `productName` dan `price` saat transaksi  
> Otomatis buat `StockMovement` type `OUT` per item

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Transaksi berhasil",
  "data": {
    "transactionCode": "TRX-20260519-006",
    "totalAmount": 10500,
    "paidAmount": 20000,
    "changeAmount": 9500,
    "paymentMethod": "CASH",
    "items": [
      {
        "productId": 1,
        "productName": "Aqua 600ml",
        "qty": 2,
        "price": 3500,
        "subtotal": 7000
      },
      {
        "productId": 3,
        "productName": "Indomie Goreng",
        "qty": 1,
        "price": 3500,
        "subtotal": 3500
      }
    ]
  }
}
```

**Response 400 (stok tidak cukup):**
```json
{
  "statusCode": 400,
  "message": "Stok tidak mencukupi",
  "errors": [
    { "productId": 1, "productName": "Aqua 600ml", "requested": 5, "available": 3 }
  ]
}
```

**Response 400 (bayar kurang):**
```json
{ "statusCode": 400, "message": "Nominal bayar kurang dari total transaksi" }
```

---

## MODULE 11 — RIWAYAT TRANSAKSI

### GET /kasir/transactions `[KASIR]`

**Query Params:** `page`, `limit`, `search` (kode/kasir), `date` (YYYY-MM-DD)

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "transactionCode": "TRX-20260519-001",
      "cashierName": "Ani Rahayu",
      "totalAmount": 17000,
      "paidAmount": 20000,
      "changeAmount": 3000,
      "paymentMethod": "CASH",
      "itemCount": 3,
      "createdAt": "2026-05-19T08:45:00.000Z",
      "items": [
        {
          "productId": 1,
          "productName": "Aqua 600ml",
          "qty": 2,
          "price": 3500,
          "subtotal": 7000
        }
      ]
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### GET /admin-store/transactions `[STORE]`

Sama dengan `GET /kasir/transactions` tapi scope Admin Store.

**Query Params tambahan:** `cashierId` — filter per kasir

---

### GET /owner/transactions `[OWNER]`

**Query Params:** `page`, `limit`, `search`, `date`, `storeId`, `cashierId`

**Response 200:** Sama dengan struktur di atas + field `storeName`.

---

### GET /owner/transactions/summary `[OWNER]`

**Query Params:** `dateFrom`, `dateTo`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "storeId": 1,
      "storeName": "Toko Pusat Sudirman",
      "totalTransactions": 5,
      "totalRevenue": 105000,
      "date": "2026-05-19"
    }
  ]
}
```

---

## MODULE 12 — STOCK MOVEMENTS

### GET /admin-store/stocks/movements `[STORE]`

**Query Params:** `page`, `limit`, `type` (IN/OUT/CONVERT/OPNAME), `productId`, `dateFrom`, `dateTo`

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Berhasil",
  "data": [
    {
      "id": 1,
      "movementCode": "STK-IN-20260518-001",
      "type": "IN",
      "productId": 1,
      "productName": "Aqua 600ml",
      "qty": 48,
      "qtyBefore": 72,
      "qtyAfter": 120,
      "note": "Restock mingguan",
      "createdByName": "Muhammad Rizal",
      "createdAt": "2026-05-18T09:00:00.000Z"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

## Error Codes Referensi

| HTTP Code | Keterangan | Kapan dipakai |
|---|---|---|
| `200` | OK | GET, PATCH, DELETE sukses |
| `201` | Created | POST sukses buat data baru |
| `400` | Bad Request | Validasi gagal, business rule violated |
| `401` | Unauthorized | Token tidak ada / invalid / expired |
| `403` | Forbidden | Role tidak punya akses ke resource |
| `404` | Not Found | Resource dengan ID tidak ditemukan |
| `409` | Conflict | Duplikat data (email, plan name, dll) |
| `429` | Too Many Requests | Rate limit login terlampaui |
| `500` | Internal Server Error | Error tak terduga di server |

---

## JWT Payload

```json
{
  "userId": 1,
  "role": "admin_store",
  "tenantId": 1,
  "storeId": 1,
  "iat": 1716123456,
  "exp": 1716152256
}
```

> `tenantId` = `null` untuk role `admin`  
> `storeId` = `null` untuk role `admin` dan `owner`  
> Access token expiry: **8 jam** (BL-001)  
> Refresh token expiry: **7 hari**

---

## Catatan Implementasi — TypeORM Dual-Column Issue

TypeORM membuat dua kolom untuk setiap relasi yang punya `@Column()` + `@JoinColumn({ name: 'snake_case' })`:
- Kolom camelCase (`transactionId`) — dipakai saat insert via ORM
- Kolom snake_case (`transaction_id`) — dipakai saat JOIN/query via ORM

Setelah seeder atau insert data, wajib sync kolom FK dengan script:
```sql
UPDATE transaction_items SET transaction_id=transactionId, product_id=productId WHERE transaction_id IS NULL;
UPDATE stock_movements SET product_id=productId, store_id=storeId, created_by=createdBy WHERE product_id IS NULL;
-- dst untuk semua tabel yang punya relasi
```

Script ini sudah terintegrasi di `seed-fresh.ts`. Jalankan via: `npx ts-node -r tsconfig-paths/register src/database/seed-fresh.ts`

---

## Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| v1.0 | 2026-05-19 | Dokumen awal — semua endpoint lengkap dari FSD v1.9 |
| v1.1 | 2026-05-19 | Tambah Module 2 Kelola Admin Platform: GET/POST /admin/users + PATCH /admin/users/:id/status. Module lama digeser jadi Module 3+. |
| v1.2 | 2026-05-19 | **Integrasi BE**: Tambah GET /auth/me (profil + tenant/store/plan info). Tambah GET /kasir/products (produk untuk POS, scope per store). Fix standard response format — paginated response nested di data.data. Tambah catatan TypeORM dual-column issue + fix script. Tambah info Vite proxy. |
