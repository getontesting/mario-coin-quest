# Deploy gratis — Mario Bros: Coin Quest

## Rekomendasi: Render (gratis, backend Node lengkap)

Render menyediakan Web Service gratis dengan HTTPS otomatis — cocok untuk Telegram Mini App karena
BotFather dan TON Connect **wajib** HTTPS.

1. Buat akun gratis di <https://render.com> (bisa login dengan GitHub).
2. Upload folder proyek ke GitHub (repository baru, public atau private).
3. Di Render → **New + → Blueprint** → pilih repository tersebut → `render.yaml` akan terdeteksi.
   Atau **New + → Web Service** → pilih repo → isi manual:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`
   - Health Check Path: `/health`
4. Isi Environment Variables (di Blueprint sebagian sudah ada, yang `sync: false` harus diisi):

| Variable | Contoh / catatan |
|---|---|
| `RIFTY_PUBLIC_URL` | `https://mario-coin-quest.onrender.com` (URL Render Anda, tanpa `/`) |
| `RIFTY_SESSION_SECRET` | string acak panjang (Blueprint bisa generate otomatis) |
| `RIFTY_BOT_TOKEN` | token dari @BotFather |
| `RIFTY_BOT_NAME` | username bot, mis. `mariocoinbot` |
| `RIFTY_ADMIN_IDS` | ID Telegram admin, dipisah koma |
| `RIFTY_DEMO_MODE` | `false` untuk produksi |
| `RIFTY_TONAPI_KEY` | opsional, dari tonconsole.ai |
| `RIFTY_JETTON_MASTER` | alamat master jetton COIN (EQ…) |
| `RIFTY_TREASURY` | alamat kas TON (UQ/EQ…) |

5. Klik **Create Web Service**. Tunggu status **Live**. Cek `https://<app>.onrender.com/health`.
6. Pasang ke bot:
   - @BotFather → `/setmenubutton` → pilih bot → **Web App** → masukkan `https://<app>.onrender.com/`
   - Atau kirim keyboard inline dengan `WebAppInfo` URL yang sama.
7. Buka bot di Telegram → tekan tombol Web App. Akun Telegram akan diverifikasi server.

> Catatan Render gratis: web service **tidak memiliki disk permanen**, sehingga folder `data/users`
> (state akun) akan hilang saat service restart/sleep. Untuk produksi, gunakan Postgres gratis
> (Supabase/Neon) atau Persistent Disk Render (berbayar). Untuk demo ini cukup.

## Alternatif gratis lain

| Platform | Cocok? | Catatan |
|---|---|---|
| **Koyeb** | Ya | Free web service, tapi butuh verifikasi kartu kredit. |
| **Fly.io** | Ya | Free allowance, butuh kartu kredit. |
| **Oracle Cloud Always Free** | Ya | VPS penuh gratis selamanya, tapi butuh kartu & setup Nginx. |
| **Vercel / Netlify / GitHub Pages** | Sebagian | Gratis & mudah, tapi **hanya frontend statis**. Aplikasi otomatis jatuh ke mode lokal (localStorage) karena tidak ada backend. Cocok untuk demo UI. |
| **Replit** | Ya | Free, tapi resource terbatas dan kadang perlu upgrade. |

## Deploy statis cepat (tanpa backend)

Jika ingin cepat tanpa Node: upload isi folder (kecuali `server/` dan `data/`) ke Netlify Drop /
Vercel / GitHub Pages. Aplikasi tetap tampil lengkap dengan tema Mario dan berjalan dalam mode
simulasi lokal. Nanti bisa dialihkan ke backend dengan mengubah URL di `js/backend.js`.

## File pendukung yang sudah disiapkan

- `render.yaml` — blueprint Render (one-click deploy).
- `Dockerfile` + `.dockerignore` — untuk Koyeb/Fly/Oracle/VPS.
- `.gitignore` — menyembunyikan `.env`, `data/`, dan `node_modules`.
- `mario-coin-quest.zip` — arsip siap upload manual.
