# Galaxy Explorer Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/oalalif/galaxy-explorer-pro.svg?style=social)](https://github.com/oalalif/galaxy-explorer-pro/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/oalalif/galaxy-explorer-pro.svg)](https://github.com/oalalif/galaxy-explorer-pro/issues)

3D Galaxy Explorer adalah aplikasi web interaktif yang memungkinkan Anda menjelajahi galaksi dan tata surya secara real-time menggunakan teknologi WebGL dengan Three.js.

## Fitur Utama

- 🌌 Tampilan 3D galaksi dan tata surya yang menakjubkan
- 🪐 Visualisasi planet dengan tekstur resolusi tinggi
- 🚀 Navigasi bebas di ruang angkasa
- 📱 Responsif dan mendukung perangkat mobile
- 🔄 PWA (Progressive Web App) - Dapat diinstal di perangkat
- 🌓 Mode Gelap dan Terang
- 🔍 Zoom dan rotasi dengan kontrol mouse/touch

## Teknologi yang Digunakan

- [Vite](https://vitejs.dev/) - Build tool yang cepat
- [Three.js](https://threejs.org/) - Library 3D JavaScript
- [GSAP](https://greensock.com/gsap/) - Animasi yang halus
- [Howler.js](https://howlerjs.com/) - Untuk efek suara
- [Vite PWA](https://github.com/antfu/vite-plugin-pwa) - Dukungan PWA

## Prasyarat

- Node.js (versi 18 atau lebih baru)
- npm (versi 8 atau lebih baru) atau Yarn (versi 1.22 atau lebih baru)
- Git

## Cara Menginstal

1. Clone repositori ini:
   ```bash
   git clone https://github.com/oalalif/galaxy-explorer-pro.git
   cd galaxy-explorer-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   # atau
   yarn
   ```

3. Jalankan server pengembangan:
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

4. Buka http://localhost:3000 di browser Anda.

## Membuat Build Produksi

Untuk membuat versi produksi:

```bash
npm run build
# atau
yarn build
```

File-file produksi akan berada di direktori `dist/`.

## Menjalankan Server Produksi

Setelah build, Anda dapat menjalankan server produksi lokal dengan:

```bash
npm run preview
# atau
yarn preview
```

## Deploy ke GitHub Pages

1. Pastikan Anda sudah mengatur remote repository dengan benar.
2. Jalankan perintah berikut:
   ```bash
   npm run deploy
   # atau
   yarn deploy
   ```
3. Aplikasi akan tersedia di `https://<username>.github.io/galaxy-explorer-pro/`

## Kontribusi

Kontribusi selalu diterima! Berikut cara berkontribusi:

1. Fork repositori ini
2. Buat branch fitur (`git checkout -b fitur/namafitur`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur/namafitur`)
5. Buat Pull Request

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detailnya.

## Penghargaan

- Ikon dari [Font Awesome](https://fontawesome.com/)
- Tekstur planet dari [Solar System Scope](https://www.solarsystemscope.com/)

## Kontak

Nama Anda - [@twittermu](https://twitter.com/twittermu) - email@example.com

Tautan Proyek: [https://github.com/oalalif/galaxy-explorer-pro](https://github.com/oalalif/galaxy-explorer-pro)
