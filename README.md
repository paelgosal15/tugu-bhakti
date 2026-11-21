# Website Sekolah Kristen Tugu Bhakti (Supabase)

| File | Untuk | Fungsi |
|---|---|---|
| `index.html` | Pengunjung | Hanya melihat isi website dan bertanya ke asisten AI (tombol "Tanya") |
| `admin.html` | Admin | Mengisi dan mengubah semua data lewat dashboard, tanpa menyentuh database |

## Pasang
1. **Supabase**: daftar di supabase.com, buat project. Catat Project URL dan anon key (Project Settings > API).
2. **Database**: SQL Editor > tempel isi `supabase/schema.sql` > Run. Ini membuat tabel, aturan keamanan, tempat simpan foto, dan kerangka bagian (Profil, Sejarah, Visi, Misi, Struktur, Program, Fasilitas, Kegiatan, Prestasi, Penerimaan).
3. **Akun admin**: Authentication > Users > Add user (isi email dan sandi, centang Auto confirm). Matikan *Allow new users to sign up* di Sign In / Providers > Email. Lalu di SQL Editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'email-anda@contoh.com';
   ```
4. **Sambungkan**: isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `js/config.js`.
5. **Asisten AI**: 
   ```bash
   supabase login && supabase link --project-ref <ref>
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy ask-ai --no-verify-jwt
   ```
   (tanpa CLI: Edge Functions > Create function `ask-ai`, tempel `supabase/functions/ask-ai/index.ts`, tambah secret `ANTHROPIC_API_KEY`).
6. **Unggah** seluruh folder ke Netlify, Vercel, Cloudflare Pages, atau GitHub Pages. Coba lokal: `python3 -m http.server 8000`. Admin ada di `/admin.html`.

## Memakai dashboard
Menu di sisi kiri, satu menu untuk satu bagian website. Isi lalu klik **Simpan**.
- **Profil Sekolah**: nama, jenjang, akreditasi, NPSN, tahun berdiri, deskripsi, foto.
- **Lokasi**: alamat, petunjuk arah, peta Google Maps (opsional).
- **Sejarah Singkat**, **Struktur Organisasi**, **Program Pendidikan**, **Fasilitas**, **Kegiatan Sekolah**, **Prestasi**: tambah, ubah, hapus, atur urutan (↑ ↓), dan unggah foto bila ada.
- **Visi dan Misi**: satu kolom visi dan daftar poin misi.
- **Penerimaan Peserta Baru**: status, periode, biaya, tautan formulir, dan langkah pendaftaran.
- **Hubungi Kami**: telepon, WhatsApp, email, jam layanan, media sosial.
- **Asisten AI** dan **Riwayat Tanya AI**: pengaturan asisten dan pertanyaan pengunjung.

Bagian yang kosong otomatis tidak tampil di website. Jika sebelumnya sudah menjalankan `schema.sql` versi lama, jalankan ulang versi ini; data lama tidak hilang.
