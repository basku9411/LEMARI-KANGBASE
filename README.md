# AMAN AJA

Aplikasi brankas digital berbasis React + Vite + Firebase, responsif untuk HP dan desktop.

## Fitur
- Login, daftar email/password, dan reset password melalui link email Firebase Authentication.
- Keanggotaan Rp50.000 dengan status `pending`, unggah bukti pembayaran, serta persetujuan/penolakan manual oleh satu akun pemilik.
- Folder bertingkat, buat folder baru, buka folder, hapus folder kosong, tampilan ikon berjajar atau daftar yang dapat di-scroll.
- Upload foto, video, dokumen, dan kategori dokumen identitas; koleksi tautan dan catatan.
- Pencarian langsung, download, berbagi tautan, hapus file.
- Firestore/Storage Rules membatasi data pribadi ke pemilik akun yang sudah disetujui.

## 1. Siapkan Firebase
1. Buat project di https://console.firebase.google.com/.
2. Authentication → Sign-in method → aktifkan **Email/Password**.
3. Firestore Database → Create database.
4. Storage → Get started.
5. Project settings → Your apps → Web app → salin konfigurasi.
6. Buat `.env.local` dari `.env.example`, isi enam nilai `VITE_FIREBASE_...`.

## 2. Tentukan akun pemilik/admin
1. Daftarkan akun email milik Anda melalui aplikasi setelah Firebase dikonfigurasi.
2. Firebase Console → Authentication → Users → salin **UID** akun tersebut.
3. Isi `VITE_ADMIN_UID=UID_ANDA` di `.env.local` dan di Vercel Environment Variables.
4. Di `firestore.rules` dan `storage.rules`, ganti teks `GANTI_DENGAN_UID_PEMILIK` dengan UID yang sama persis.
5. Pastikan akun pemilik mempunyai dokumen `users/{UID}` di Firestore dengan field `status: "approved"`. Buat/ubah melalui Firebase Console sebagai pemilik project.

**Penting:** VITE_ADMIN_UID hanya mengatur tampilan panel di browser, bukan pengaman sebenarnya. Pengaman sebenarnya adalah UID yang ditulis langsung di Firebase Security Rules. Jangan pernah mengganti aturan dengan akses publik. Jangan membagikan UID admin sebagai rahasia; keamanan ditentukan oleh aturan server dan akses akun Firebase.

## 3. Atur pembayaran Rp50.000
Saat ini paket starter masih menggunakan status pending dan unggah bukti manual; payment gateway otomatis belum diaktifkan.
- Isi `VITE_PAYMENT_INSTRUCTIONS` dengan instruksi transfer/QRIS yang benar-benar Anda miliki, misalnya nama bank, nomor rekening, nama penerima atau instruksi QRIS.
- Jangan masukkan data rekening contoh. Pastikan jumlah Rp50.000 dan ketentuan biaya dijelaskan kepada pendaftar.
- Sampai Xendit dikonfigurasi, pendaftar membuat akun → status pending → mengunggah bukti → pemilik memeriksa bukti di panel **Persetujuan Anggota** → pemilik klik setujui/tolak.
- Hanya UID pemilik yang ditetapkan di Firestore Rules dapat mengubah status anggota. Pengguna tidak bisa menyetujui akunnya sendiri.
- Untuk mengaktifkan kembali akun yang ditolak, pemilik dapat mengubah status dokumen pengguna menjadi `pending` dari Firebase Console, lalu minta pengguna login kembali.


## Reset password melalui email
- Di halaman login, pengguna mengisi email akun lalu menekan **LUPA PASSWORD?**.
- Firebase Authentication mengirim email berisi link untuk membuat password baru. Pengguna membuka link tersebut, menyimpan password baru, lalu login kembali.
- Firebase Console → Authentication → Templates → Password reset: atur nama pengirim, alamat balasan, dan template email.
- Firebase Console → Authentication → Settings → Authorized domains: pastikan domain Vercel Anda sudah ditambahkan.
- Uji alur ini setelah domain produksi aktif. Pengiriman email dan masa berlaku link dikelola Firebase.

## Pembayaran otomatis (integrasi berikutnya)
Payment gateway yang direkomendasikan: **Xendit**. Dokumentasi Xendit mencantumkan Virtual Account/transfer bank, QRIS, serta e-wallet termasuk OVO, DANA, dan GoPay untuk Indonesia. Ketersediaan metode dapat bergantung pada verifikasi dan aktivasi akun merchant.
- Daftar dan selesaikan verifikasi merchant di https://www.xendit.co/.
- Integrasi produksi membutuhkan backend/serverless endpoint untuk membuat invoice dan menerima webhook pembayaran. Secret API key harus disimpan sebagai environment variable server-side (misalnya `XENDIT_SECRET_KEY`), **jangan** pernah memakai prefix `VITE_` atau menaruh secret di browser/GitHub.
- Webhook harus memverifikasi token/keaslian notifikasi, jumlah Rp50.000, ID transaksi, dan status pembayaran sebelum menandai pembayaran berhasil.
- Status pembayaran berhasil **tidak otomatis menyetujui keanggotaan**: akun tetap berstatus `pending` sampai pemilik aplikasi menekan Setujui. Penolakan juga hanya dapat dilakukan pemilik melalui aturan keamanan server.
- Integrasi gateway belum aktif pada paket starter ini karena membutuhkan akun merchant Xendit, secret key, callback/webhook URL, dan backend deployment yang dikonfigurasi pemilik.

## 4. Pasang Firebase Security Rules
Salin isi `firestore.rules` ke Firestore Database → Rules dan `storage.rules` ke Storage → Rules. Sebelum Publish, ganti `GANTI_DENGAN_UID_PEMILIK` pada kedua file dengan UID admin yang benar.

## 5. Jalankan lokal
Butuh Node.js 20+.
```bash
npm install
npm run dev
npm run build
```

## 6. Deploy GitHub + Vercel
1. Upload seluruh isi folder ke repository GitHub. Jangan upload `.env.local`.
2. Vercel → Add New → Project → Import repository.
3. Build command `npm run build`; output directory `dist`.
4. Tambahkan semua variabel dari `.env.local` ke Vercel Project → Settings → Environment Variables.
5. Deploy. Setiap push ke branch production akan memicu deployment baru.

## Catatan keamanan dan operasional
- Pembayaran otomatis belum aktif sampai backend Xendit dan webhook dikonfigurasi; untuk sementara pemilik memeriksa bukti transfer secara manual.
- Ini adalah aplikasi web responsif/PWA-ready, bukan APK Android native yang sudah dipaketkan.
- Link unduhan Firebase bertoken bersifat bearer link: siapa pun yang menerima link dapat mengakses file. Berhati-hatilah membagikan dokumen KTP/KK. Untuk dokumen sensitif, pengembangan lanjutan sebaiknya memakai tautan sementara dari backend tepercaya dan/atau enkripsi sisi-klien.
- Folder yang berisi file/subfolder tidak dapat dihapus sampai isinya dipindahkan atau dihapus.
- Batas upload file 100 MB; bukti pembayaran 10 MB. Batas aktual juga tunduk pada paket dan konfigurasi Firebase.
- Untuk bisnis berbayar skala produksi, pertimbangkan Cloud Functions/Admin SDK untuk audit log, email notifikasi, verifikasi transaksi otomatis, dan custom claims; jangan mengandalkan UI browser sebagai kontrol keamanan.
