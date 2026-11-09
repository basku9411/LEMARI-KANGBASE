# AMAN AJA — Firebase + Cloudinary + Vercel

Aplikasi brankas digital pribadi React + Vite. Firebase Authentication dan Firestore tetap digunakan untuk akun, status keanggotaan, metadata file, folder, dan persetujuan pemilik. File disimpan sebagai **authenticated assets** di Cloudinary. API serverless Vercel memverifikasi Firebase ID token dan membuat URL unduhan privat berumur 5 menit.

## Penting sebelum deploy
- Jangan commit `.env.local`, Firebase service-account JSON, API Secret Cloudinary, atau private key ke GitHub.
- Jangan mengaktifkan akses publik pada Cloudinary. Upload menggunakan `type=authenticated`.
- Jangan deploy `storage.rules` ke Cloudinary; file aplikasi versi ini tidak memakai Firebase Storage. File `storage.rules` hanya menutup akses Firebase Storage.
- Admin UID di rules sudah diset ke UID pemilik yang ditentukan untuk proyek ini. `VITE_ADMIN_UID` hanya mengatur tampilan panel; `ADMIN_UID` di Vercel mengamankan endpoint server.
- Cloudinary signed upload dan authenticated delivery memerlukan konfigurasi paket/akun Cloudinary yang mendukung authenticated assets. Uji dengan file non-sensitif terlebih dahulu.

## 1. Firebase
1. Firebase Authentication → Sign-in method → aktifkan Email/Password.
2. Firestore Database tetap gunakan database yang sudah dibuat.
3. Firestore Database → Rules: salin isi `firestore.rules`, lalu Publish.
4. Firebase Console → Project settings → General → Your apps → Web app: salin `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, dan `appId`.
5. Untuk server Vercel: Project settings → Service accounts → Generate new private key. Simpan file JSON dengan aman; jangan upload ke GitHub.

## 2. Cloudinary
Dari Cloudinary Console → API Keys ambil Cloud name, API Key, dan API Secret. API Secret hanya dimasukkan ke Environment Variables Vercel. Cloud name untuk akun yang saat ini digunakan: `duqwdwn9q`.

## 3. GitHub
Upload **isi folder `brankas-pribadi`** ke root repository, bukan file ZIP-nya. Timpa file aplikasi lama dengan file versi ini dan tambahkan folder `api/` serta `lib/`. Jangan menghapus repository atau mengganti Firebase project. Pastikan `.env.local` dan file service-account tidak ikut terunggah.

## 4. Vercel
Import repository atau buka Project yang sudah ada. Build command: `npm run build`; Output Directory: `dist`; Node.js 20.x atau lebih baru.

Tambahkan Environment Variables berikut pada Vercel (Production, Preview bila diperlukan):

### Browser config
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_UID` = UID pemilik
- `VITE_PAYMENT_INSTRUCTIONS` = instruksi pembayaran yang benar

### Server-only config
- `ADMIN_UID` = UID pemilik yang sama
- `CLOUDINARY_CLOUD_NAME` = `duqwdwn9q`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON` = seluruh isi file service-account JSON dalam satu nilai environment variable. Tempel sebagai JSON valid; jangan membagikannya di chat atau GitHub.

Setelah semua variabel disimpan, lakukan Redeploy. Setiap perubahan Environment Variables memerlukan deployment ulang.

## 5. Alur aplikasi
- Daftar: Firebase Auth membuat akun, Firestore membuat profil `pending` dengan biaya Rp50.000.
- Bukti pembayaran: akun pending boleh meminta tanda tangan upload hanya ke `payment-proofs/{UID}`; tidak mendapat akses brankas.
- Persetujuan: hanya UID pemilik yang ditetapkan dalam Firestore Rules dan `ADMIN_UID` Vercel dapat melihat bukti dan mengubah status melalui menu **Anggota** milik pemilik. Menu tersebut menampilkan semua akun terdaftar dan statusnya.
- Brankas: hanya akun berstatus `approved` yang dapat membaca/menulis `users/{UID}/items` dan `folders` miliknya sendiri.
- Upload file: API hanya menandatangani upload ke folder UID pemanggil.
- Buka/download: API memeriksa token dan metadata Firestore milik UID yang sama, lalu membuat private download URL yang kedaluwarsa dalam 5 menit.
- Hapus: API hanya menghapus asset berdasarkan dokumen item milik UID pemanggil.

## 6. Kontrol status anggota
- Menu **Anggota** menampilkan semua akun pada koleksi `users`, termasuk pending, approved, rejected, dan disabled.
- Tombol **Aktifkan** menyetujui pendaftar atau mengaktifkan kembali akun nonaktif menjadi `approved`.
- Tombol **Nonaktifkan** menyetel status `disabled`, menonaktifkan akun Firebase Authentication, dan mencabut refresh token.
- Tombol **Tolak** mengubah status menjadi `rejected`.
- Endpoint `api/member-status.js` hanya menerima perintah dari pemilik yang cocok dengan `ADMIN_UID` di Vercel. API juga memverifikasi token Firebase yang belum dicabut.
- Penonaktifan tidak menghapus dokumen Firestore maupun file Cloudinary anggota. Status `disabled` memblokir akses Firestore melalui rules, API server, dan proses login Firebase.

## 7. Uji sebelum dipakai sungguhan
1. Daftarkan akun uji kedua dengan email yang kamu kuasai.
2. Pastikan akun uji berstatus pending dan tidak dapat membuka brankas.
3. Unggah bukti pembayaran dummy, bukan KTP/KK.
4. Masuk sebagai pemilik dan buka bukti uji; setujui akun.
5. Upload file dummy sebagai anggota, buka dan download.
6. Buat akun uji ketiga dan pastikan akun itu tidak dapat membaca file akun kedua.
7. Dari menu Anggota, nonaktifkan akun uji; pastikan akun itu tidak dapat masuk/mengakses API dan file tetap tersimpan.
8. Aktifkan kembali akun uji; pastikan file lama tetap ada dan akses pulih.
9. Pastikan URL file kedaluwarsa setelah 5 menit.

## 8. Batasan yang belum diaktifkan
- Pembayaran otomatis Xendit belum diintegrasikan; verifikasi pembayaran masih manual.
- Migrasi file lama dari Firebase Storage ke Cloudinary belum otomatis. File lama yang hanya tersimpan di Firebase Storage tidak otomatis muncul di Cloudinary.
- Jangan gunakan dokumen identitas sensitif sebelum seluruh pengujian akses berhasil. Tautan privat tetap dapat diakses oleh siapa pun yang sempat menerima URL selama masa berlakunya.

## Perubahan versi perbaikan
- Pemilik sekarang dapat berpindah antara **Brankas Pemilik** dan **Anggota**; panel persetujuan tidak lagi menutupi brankas pribadi pemilik.
- Folder baru menyimpan kategori. Folder Foto hanya tampil di Foto, folder Video hanya tampil di Video, dan subfolder mewarisi kategori folder induknya.
- Di dalam folder tersedia tombol Kembali dan jalur lokasi folder (breadcrumb), seperti File Explorer.
- Folder lama yang dibuat sebelum kategori disimpan tetap terlihat di **Semua File**. Folder lama tersebut tidak otomatis dipindahkan ke kategori tertentu.
- Pesan kegagalan upload/API sekarang menyertakan status HTTP atau petunjuk log Vercel agar penyebabnya tidak disamarkan menjadi “Permintaan gagal”.

## Pemeriksaan kode versi ini
- Sintaks JSX/JavaScript frontend diperiksa dengan parser TypeScript: lulus.
- Sintaks seluruh fungsi API dan konfigurasi server Node.js: lulus.
- Build produksi Vite belum dapat dijalankan di lingkungan penyusunan karena `npm install` mengalami timeout. Karena itu, deployment Vercel tetap harus menunjukkan **Ready** dan lulus build sebelum aplikasi dipakai.
- Koneksi nyata ke Firebase dan Cloudinary, serta pengujian lintas-akun, tidak dapat disimulasikan dari sini. Ikuti seluruh uji di bagian 6 menggunakan file dummy terlebih dahulu.

- Menu **Anggota** kini memuat seluruh akun, bukan hanya pendaftar pending. Pemilik dapat mengaktifkan, menonaktifkan, dan menolak anggota. Penonaktifan juga memakai Firebase Authentication Admin SDK di server dan mencabut refresh token.
- Verifikasi ID token API server kini memeriksa pencabutan token agar sesi anggota nonaktif tidak tetap dapat memakai endpoint privat.


## Manajemen Anggota (khusus pemilik)

Pemilik membuka menu **Anggota** untuk melihat nama, email, dan status pendaftar. Pendaftaran baru meminta nama lengkap; akun lama yang belum memiliki nama tetap ditampilkan menggunakan email. Pemilik dapat menyetujui/mengaktifkan, menonaktifkan, mengaktifkan kembali, atau menolak pendaftaran. Menonaktifkan anggota juga menonaktifkan akun Firebase Authentication dan mencabut refresh token. Aturan Firestore serta API server tetap memblokir akses anggota berstatus selain `approved`; file Cloudinary tidak dihapus. Periksa pembayaran secara manual sebelum menekan **Setujui & Aktifkan**.
