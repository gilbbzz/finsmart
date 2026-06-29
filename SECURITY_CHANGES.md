# FinSmart — Catatan Perubahan Keamanan v2.1

## Langkah PERTAMA (wajib sebelum jalankan server)

```bash
# 1. Install dependensi baru
npm install

# 2. Generate JWT_SECRET baru dan masukkan ke .env
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# 3. Edit .env — ganti kedua nilai GANTI_DENGAN_... dengan hasil di atas
```

---

## Ringkasan perubahan

### [CRITICAL] JWT secret bocor
- `.env` dikosongkan dari secret asli
- **Kamu harus generate secret baru** dengan perintah di atas

### [CRITICAL] Token JWT di localStorage
- `authController.js` → login/register tidak lagi mengirim `token` di response body
- `public/js/main.js` → `setUser()` hanya menyimpan `{ _id, name, email }` — tanpa token
- Token kini **hanya** ada di httpOnly cookie (sudah aman dari XSS)

### [HIGH] Refresh token tidak pernah di-revoke
- `models/User.js` → tambah field `refreshTokenHash`
- `middleware/authMiddleware.js` → `generateAndSaveRefreshToken()` menyimpan SHA-256 hash token ke DB
- `middleware/authMiddleware.js` → `verifyAndRotateRefreshToken()` validasi hash + rotation otomatis
- `controllers/authController.js` → logout & change-password memanggil `revokeRefreshToken()`

### [HIGH] Tidak ada security headers
- `app.js` → `app.use(helmet(...))` dipasang sebelum semua route
- `package.json` → `helmet ^8.0.0` ditambahkan ke dependencies

### [HIGH] /api/auth/refresh tanpa rate limit
- `routes/authRoutes.js` → `authLimiter` ditambahkan ke route `/refresh`

### [MEDIUM] req.query tidak disanitasi
- `middleware/inputValidator.js` → `sanitizeRequest()` menggantikan `sanitizeBody()`
  mencakup `req.body`, `req.query`, dan `req.params`
- `app.js` → `app.use(sanitizeRequest)` (backward-compat: `sanitizeBody` tetap tersedia)

### [MEDIUM] ?months tidak dibatasi (DoS)
- `controllers/summaryController.js` → `Math.min(Math.max(..., 1), 24)` — maks 24 bulan

### [MEDIUM] Tidak ada CORS policy
- `app.js` → `cors()` dikonfigurasi dengan `origin` whitelist dari `ALLOWED_ORIGINS` di `.env`
- `package.json` → `cors ^2.8.5` ditambahkan

### [LOW] minlength password tidak konsisten
- `models/User.js` → `minlength` diubah dari 6 ke **8** karakter

### [LOW] Logout via GET (CSRF)
- `routes/authRoutes.js` → `GET /logout` → **`POST /logout`**
- `controllers/authController.js` → logout juga memanggil `revokeRefreshToken()`
- `public/js/main.js` → `logout()` menggunakan `method: 'POST'`

---

## File yang diubah

| File | Perubahan |
|------|-----------|
| `.env` | Secrets dikosongkan — **wajib isi ulang** |
| `package.json` | Tambah `helmet`, `cors` |
| `app.js` | Tambah helmet, cors, ganti sanitizeBody → sanitizeRequest |
| `models/User.js` | Tambah `refreshTokenHash`, fix `minlength` |
| `middleware/authMiddleware.js` | Refresh token rotation, revoke, SHA-256 hash |
| `middleware/inputValidator.js` | Perluaskan ke query + params |
| `controllers/authController.js` | Hapus token dari body, pakai generateAndSaveRefreshToken |
| `controllers/summaryController.js` | Batasi ?months maks 24 |
| `routes/authRoutes.js` | Rate limit /refresh, logout POST |
| `public/js/main.js` | Hapus token dari localStorage, logout POST |
