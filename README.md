# ManStock - Inventory Management ( CLIENT )

ManStock adalah aplikasi manajemen inventory yang memungkinkan pengguna untuk melacak produk, supplier, customer, dan stok barang dalam beberapa warehouse. Aplikasi ini mendukung pengelolaan user, role, dan akses modul berdasarkan peran yang ditetapkan. Terdapat fitur lengkap mulai dari CRUD user, produk, kategori, brand, customer, supplier, hingga laporan untuk barang masuk dan keluar.

## Fitur Utama

- **Manajemen User**: CRUD user dan role, serta autentikasi login menggunakan email atau username (tanpa pengiriman notifikasi email).
- **Pengelolaan Warehouse**: Membuat dan mengelola warehouse untuk memantau stok produk.
- **Manajemen Produk**: CRUD produk, termasuk kategori, brand, dan penyesuaian modul sesuai role user.
- **Manajemen Customer dan Supplier**: CRUD customer dan supplier untuk mencatat hubungan bisnis.
- **Dashboard & Laporan**: Menyediakan informasi ringkasan penjualan, pembelian, barang populer, serta pengeluaran terkait produk.
- **Autentikasi**: Autentikasi menggunakan email atau username, tanpa notifikasi email.
- **Modular Access**: Pengelolaan akses modul berdasarkan role pengguna.
- **Report Barang**: Laporan barang masuk dan keluar dengan manajemen warehouse.

## Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/) (TypeScript)
- **State Management**: Redux & Redux Toolkit Query
- **UI Framework**: Material UI (MUI) & Tailwind CSS
- **Backend**: Node.js
- **Package Manager**: npm

## Prasyarat

Pastikan Anda memiliki hal berikut sebelum menjalankan proyek ini:

- **Node.js** (v14 atau lebih baru)
- **npm** (v6 atau lebih baru)

## Instalasi

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal.

### 1. Clone repositori

```bash
git clone https://github.com/username/ManStock.git
```

### 2. Masuk ke direktori proyek

```bash
cd ManStock
```

### 3. Instal dependensi

```bash
npm install
```

### 4. Set up file environment

Buat file `.env.local` di root direktori proyek dan masukkan variabel berikut:

```bash
BASE_URL=http://your-api-url.com
```

Anda juga dapat membuat file .env.staging dan .env.production jika diperlukan.

### 5. Jalankan proyek

```bash
npm run dev
```

Buka http://localhost:3000 untuk melihat aplikasi.

ManStock adalah aplikasi sederhana namun lengkap untuk mengelola inventaris barang dalam berbagai warehouse dan melacak supplier serta customer dengan mudah. Selamat menggunakan!
