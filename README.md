# Mario Bros: Coin Quest — Telegram Mini App (dengan backend nyata)

Replika **Rifty Mining** (`https://rifty.run.place/`) yang sudah di-rebrand ke tema **Mario Bros 8-bit**
(sebutan: **Mario Bros: Coin Quest**, token **COIN**). Sekarang memakai
**backend Node asli**: akun Telegram diverifikasi secara kriptografis, state disimpan di server,
dompet TON tersambung lewat **TON Connect**, saldo on-chain dibaca dari **TonAPI**, dan hak admin
dicek server-side berdasarkan ID Telegram.

## Yang sudah "nyata"

| Aspek | Implementasi |
|---|---|
| **Akun Telegram** | `initData` diverifikasi dengan HMAC-SHA256 memakai **bot token** dari BotFather (secret key `HMAC("WebAppData", token)`), plus pengecekan `auth_date` (maks. 24 jam). Data palsu/tampered ditolak. |
| **Sesi & keamanan** | Token sesi bertanda tangan HMAC disimpan di `sessionStorage`, dikirim lewat header `X-Rifty-Token`. Tidak bergantung pada cookie pihak ketiga di WebView Telegram. |
| **State pengguna** | Disimpan server-side di `data/users/<telegram-id>.json`, bukan lagi di `localStorage` browser. Semua aksi game dijalankan **di server** memakai engine yang sama dengan frontend. |
| **Dompet TON** | TON Connect UI (SDK resmi) — QR/deeplink, Wallet V5/Telegram Wallet, restore sesi, `sendTransaction`. Alamat dompet berasal dari wallet sungguhan. |
| **Saldo on-chain** | `GET /v2/accounts/{address}` (TON) dan `/v2/accounts/{address}/jettons` (RIFT jetton) melalui TonAPI. Level dihitung dari saldo RIFT on-chain yang sebenarnya. |
| **Verifikasi dompet** | Kirim **0,05 TON sungguhan** ke treasury; backend mencocokkan pengirim + jumlah + waktu lewat TonAPI, lalu menandai alamat terverifikasi. |
| **Deposit RIFT** | Transfer jetton sungguhan ke treasury dengan jumlah unik (delta dari challenge); backend mencocokkan di riwayat on-chain lalu mengkredit saldo aplikasi. |
| **Admin** | Daftar ID Telegram di `RIFTY_ADMIN_IDS`. Endpoint admin ditolak (403) untuk non-admin. Aksi admin dijalankan pada **state pengguna yang bersangkutan**, bukan state admin. Penarikan bisa ditandai lunas hanya dengan **TX hash yang diverifikasi di chain**. |
| **User** | Setiap Telegram ID punya akun, saldo, dan riwayat sendiri di server. Tidak bisa saling mengakses. |

## Tema Mario Bros & interaksi

- Identitas aplikasi sekarang **Mario Bros: Coin Quest**; token tampilan bernama **COIN** (internal tetap `RIFT` agar kompatibel dengan engine/API).
- Tema 8-bit: langit biru,awan piksel,bukit hijau,pipa,bata,bintang,dan koin. Aset SVG dibuat oleh `scripts/gen-mario-assets.js` (jalankan `node scripts/gen-mario-assets.js` untuk regenerate).
- Font monospace chunky, panel kream berborder cokelat dengan bayangan keras, tombol merah "blocky", progress bar koin beranimasi, dan strip koin di header.
- Interaksi baru: onboarding pertama kali, animasi **+COIN** saat klaim, notifikasi **LEVEL UP**, tombol **Klaim semua hadiah siap** di Tasks, serta modal input dalam aplikasi (bukan `prompt()` browser) untuk deposit/alamat dompet.
- Bahasa default mengikuti Telegram; tersedia Bahasa Indonesia.

## Struktur

```
miniapps/
├── index.html              # Frontend + Telegram SDK + TON Connect UI SDK
├── styles.css              # Base layout
├── theme-mario.css          # Tema 8-bit Mario Bros (dimuat terakhir)
├── scripts/gen-mario-assets.js # Generator aset pixel-art SVG
├── js/
│   ├── en.js, i18n.js      # 10 bahasa (termasuk Bahasa Indonesia)
│   ├── data.js             # Konfigurasi game (500 level, peti, misi, dll.)
│   ├── engine.js           # Aturan & operasi game (dipakai browser DAN server)
│   ├── backend.js          # Adapter: auth Telegram, API server, TON Connect
│   ├── ui.js               # Semua halaman & modal
│   └── app.js              # Router & event handling
├── server/
│   ├── index.js            # HTTP server + rute API + static hosting
│   ├── config.js           # Konfigurasi dari .env
│   ├── telegram.js         # Verifikasi initData (HMAC)
│   ├── store.js            # Penyimpanan state per-user + token sesi
│   ├── engine-host.js      # Menjalankan engine.js di server (Node vm)
│   └── ton.js              # Klien TonAPI
├── assets/                 # Gambar & font
├── .env.example
└── package.json
```

## Menjalankan lokal (mode demo)

Tanpa bot token, browser biasa masuk sebagai pengguna demo dan seluruh API tetap berjalan di server:

```powershell
cd D:\GoWorkspace\src\miniapps
npm start
```

Buka `http://localhost:8080/`.

## Menjalankan mode nyata

1. Salin `.env.example` menjadi `.env`, lalu isi:

```dotenv
RIFTY_BOT_TOKEN=123456:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RIFTY_ADMIN_IDS=123456789,987654321
RIFTY_PUBLIC_URL=https://domain-anda.com
RIFTY_SESSION_SECRET=random-panjang-rahasia
RIFTY_DEMO_MODE=false
RIFTY_TONAPI_KEY=...
RIFTY_JETTON_MASTER=EQ...        # alamat master jetton RIFT
RIFTY_TREASURY=UQ...             # alamat kas untuk verifikasi & deposit
PORT=8080
```

2. Jalankan `npm start` di VPS/hosting Node (port 8080, atau sesuai `PORT`).
3. Pasang HTTPS di depan aplikasi (Nginx/Caddy/Cloudflare Tunnel).
4. Di [@BotFather](https://t.me/BotFather):
   - `/setmenubutton` → pilih bot → **Web App** → `https://domain-anda.com/`
   - atau kirim keyboard dengan `WebAppInfo` berisi URL tersebut.
5. Buka bot di Telegram. Aplikasi akan memverifikasi `initData` dengan token bot di atas,
   membuat akun server, dan menyambungkan dompet melalui TON Connect.

> `RIFTY_PUBLIC_URL` **wajib** HTTPS dan harus sama dengan URL yang dipasang di BotFather —
> TON Connect memakai origin ini untuk `tonconnect-manifest.json`.

## Alur dompet (yang terjadi sebenarnya)

1. Tekan **Connect wallet** → TON Connect menampilkan pilihan wallet (QR/deeplink/Telegram Wallet).
2. Setelah disetujui, alamat dikirim ke `/api/wallet/connect`; server mengambil saldo TON + RIFT
   dari TonAPI dan menyimpannya.
3. **Verify wallet** → dompet mengirim 0,05 TON ke `RIFTY_TREASURY`; backend memindai transaksi
   masuk ke treasury dan mencocokkan pengirim + jumlah + waktu (maks. 10 menit).
4. **Deposit** → jetton RIFT dikirim ke treasury dengan jumlah unik; backend mencocokkan transfer
   di event TonAPI lalu mengkredit saldo aplikasi.
5. **Withdraw** dibuat di server. Admin menyetujui, lalu memasukkan TX hash transfer RIFT dari
   treasury; server mengecek hash tersebut lewat TonAPI sebelum menandai penarikan lunas.

## Akses admin

- ID Telegram yang tercantum di `RIFTY_ADMIN_IDS` mendapat `isAdmin: true` dari server.
- Menu **Admin** hanya muncul untuk ID tersebut; endpoint `/api/admin/*` dan aksi `admin*`
  menolak token biasa dengan HTTP 403.
- Di panel admin: daftar pengguna server (semua akun Telegram), seluruh penarikan lintas-user,
  setujui/tahan/tolak, moderasi, balas tiket, verifikasi duta, dan tandai lunas dengan TX hash.

## Reset data

Hapus file `data/users/<id>.json` untuk satu pengguna, atau seluruh folder `data/users` untuk
menghapus semua akun. Token sesi di browser bisa dihapus melalui `sessionStorage.removeItem('rifty_session_token')`.

## Catatan produksi

- **Payout otomatis** membutuhkan signer yang menyimpan kunci privat treasury dengan aman (HSM/signer service).
  Di versi ini admin melakukan transfer manual lalu melaporkan TX hash yang diverifikasi server.
- Market/swap STON.fi tetap merupakan estimasi (tidak menandatangani swap sungguhan) karena memerlukan
  konfigurasi router/lp dan quote STON.fi. Tombol **Open STON.fi** mengarah ke DEX resmi.
- Notifikasi bot sungguhan memerlukan Bot API (`sendMessage`) dengan chat ID pengguna; belum diaktifkan.
- Simpan `.env` dan folder `data/` di luar root yang bisa diakses publik (server tidak menyajikannya).
