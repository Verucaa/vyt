# 🚀 VYT DOWNLOADER

YouTube video downloader dengan UI modern ala Gen Z untuk Vercel deployment.

## ✨ Fitur Utama
- ✅ UI/UX modern dengan particle background & animasi
- ✅ Support semua resolusi (144p hingga 4K)
- ✅ Ekstraksi audio MP3 (64kbps - 320kbps)
- ✅ Sistem tab dan filter untuk navigasi mudah
- ✅ Preview video dengan thumbnail
- ✅ PWA support (bisa install di device)
- ✅ Responsive design (mobile & desktop)
- ✅ Toast notifications yang stylish

## 🚀 Deployment ke Vercel

### **Cara 1: Deploy dengan 1 Klik**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vyt-downloader)

### **Cara 2: Manual Deploy**
```bash
# 1. Clone atau buat folder baru
mkdir vyt-downloader
cd vyt-downloader

# 2. Copy semua file ke folder
# (file-file dari kode di atas)

# 3. Install Vercel CLI (jika belum)
npm i -g vercel

# 4. Login ke Vercel
vercel login

# 5. Deploy
vercel --prod

## 📁 STRUKTUR FILE
``
vyt-downloader/
├── api/
│   └── download/
│       └── route.js         # Vercel Edge Function
├── public/
│   ├── index.html           # Halaman utama
│   ├── style.css            # Styling modern
│   ├── script.js            # Logika aplikasi
│   └── manifest.json        # PWA manifest
├── package.json             # Dependencies
├── vercel.json             # Konfigurasi Vercel
└── README.md               # Dokumentasi
``
