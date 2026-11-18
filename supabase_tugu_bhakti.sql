-- =====================================================================
-- Website Sekolah Kristen Tugu Bhakti: skema + DATA DUMMY
-- Jalankan di Supabase > SQL Editor. Aman dijalankan berulang
-- (tabel konten dibuat ulang; tabel pesan_kontak tidak dihapus).
-- Semua isi di bawah adalah contoh, bukan data resmi sekolah.
-- =====================================================================

drop table if exists sekolah_profil, sejarah, visi_misi, struktur, fasilitas,
  program, kegiatan, prestasi, ppdb_info, galeri, faq cascade;

create table sekolah_profil (
  id serial primary key, urutan int default 0,
  nama text, yayasan text, jenjang text, akreditasi text, tahun_berdiri text,
  kurikulum text, kepala_sekolah text, alamat text, telp text, whatsapp text,
  email text, jam_layanan text, sambutan text
);
create table sejarah   (id serial primary key, urutan int default 0, tahun text, uraian text);
create table visi_misi (id serial primary key, urutan int default 0, jenis text check (jenis in ('visi','misi')), isi text);
create table struktur  (id serial primary key, urutan int default 0, level int, jabatan text, nama text);
create table fasilitas (id serial primary key, urutan int default 0, nama text, deskripsi text);
create table program   (id serial primary key, urutan int default 0, nama text, deskripsi text);
create table kegiatan  (id serial primary key, urutan int default 0, judul text, deskripsi text, waktu text);
create table prestasi  (id serial primary key, urutan int default 0, tahun text, judul text, keterangan text);
create table ppdb_info (id serial primary key, urutan int default 0, kategori text check (kategori in ('syarat','alur','jadwal','biaya','info')), isi text);
create table galeri    (id serial primary key, urutan int default 0, judul text, warna1 text, warna2 text);
create table faq       (id serial primary key, urutan int default 0, pertanyaan text, jawaban text);

create table if not exists pesan_kontak (
  id bigserial primary key,
  nama text not null check (char_length(nama) between 1 and 100),
  email text not null check (char_length(email) between 5 and 150),
  pesan text not null check (char_length(pesan) between 1 and 2000),
  dibuat timestamptz default now()
);

-- Keamanan: pengunjung (anon) hanya boleh MEMBACA tabel konten
-- dan hanya boleh MENAMBAH pesan_kontak (tidak bisa membaca/ubah/hapus).
do $$
declare t text;
begin
  foreach t in array array['sekolah_profil','sejarah','visi_misi','struktur','fasilitas',
    'program','kegiatan','prestasi','ppdb_info','galeri','faq'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "baca publik" on %I', t);
    execute format('create policy "baca publik" on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

alter table pesan_kontak enable row level security;
drop policy if exists "kirim pesan" on pesan_kontak;
create policy "kirim pesan" on pesan_kontak for insert to anon, authenticated with check (true);

-- ============================ DATA DUMMY ============================
insert into sekolah_profil (nama,yayasan,jenjang,akreditasi,tahun_berdiri,kurikulum,kepala_sekolah,alamat,telp,whatsapp,email,jam_layanan,sambutan) values
('Sekolah Kristen Tugu Bhakti','Yayasan Pendidikan Kristen Tugu Bhakti','TK, SD, dan SMP','A (contoh)','1985 (contoh)','Kurikulum Merdeka dengan pembinaan karakter Kristiani',
 'Ibu Maria Susanti, S.Pd., M.Pd.','Jl. Tugu Raya No. 12, Jakarta Utara (alamat contoh)','(021) 555-0123','0812-0000-1234','info@tugubhakti-contoh.sch.id','Senin–Jumat, 07.00–15.00 WIB',
 'Selamat datang di situs Sekolah Kristen Tugu Bhakti. Kami ingin Bapak/Ibu mengenal sekolah kami lebih dulu, mulai dari sejarah, visi dan misi, fasilitas, sampai kegiatan sehari-hari anak-anak, sebelum memutuskan datang langsung. Kami percaya pendidikan yang baik tumbuh dari kasih, disiplin, dan kerja sama antara sekolah dan keluarga.');

insert into sejarah (urutan,tahun,uraian) values
(1,'1985','Yayasan Pendidikan Kristen Tugu Bhakti didirikan oleh beberapa tokoh jemaat setempat untuk menyediakan pendidikan berlandaskan iman Kristen bagi anak-anak di lingkungan sekitar.'),
(2,'1987','Sekolah dasar dibuka dan menerima angkatan pertama sebanyak 38 peserta didik.'),
(3,'1996','Jenjang TK dan SMP mulai dibuka seiring bertambahnya kebutuhan orang tua.'),
(4,'2008','Gedung baru dengan perpustakaan dan laboratorium komputer diresmikan.'),
(5,'2020','Pembelajaran daring dijalankan selama pandemi, dengan pendampingan guru dan orang tua.'),
(6,'2024','Sekolah memperbarui ruang kelas dan memperluas pilihan kegiatan ekstrakurikuler.');

insert into visi_misi (urutan,jenis,isi) values
(1,'visi','Menjadi sekolah yang membentuk peserta didik beriman, berkarakter, cerdas, dan melayani sesama.'),
(2,'misi','Menanamkan nilai iman Kristen dalam kehidupan sekolah sehari-hari.'),
(3,'misi','Menyelenggarakan pembelajaran yang bermutu dan sesuai kebutuhan peserta didik.'),
(4,'misi','Membangun karakter jujur, disiplin, dan bertanggung jawab.'),
(5,'misi','Mengembangkan minat dan bakat melalui kegiatan di luar kelas.'),
(6,'misi','Bekerja sama dengan orang tua dan masyarakat.');

insert into struktur (urutan,level,jabatan,nama) values
(1,1,'Ketua Yayasan','Bapak Daniel Hartono, S.E.'),
(2,2,'Kepala Sekolah','Ibu Maria Susanti, S.Pd., M.Pd.'),
(3,3,'Wakil Kepala Sekolah Bidang Kurikulum','Bapak Yohanes Pratama, S.Pd.'),
(4,3,'Wakil Kepala Sekolah Bidang Kesiswaan','Ibu Ruth Natalia, S.Pd.'),
(5,3,'Kepala Tata Usaha','Ibu Lidia Wulandari');

insert into fasilitas (urutan,nama,deskripsi) values
(1,'Ruang kelas','18 ruang kelas ber-AC dengan papan tulis putih dan proyektor, kapasitas maksimal 28 peserta didik per kelas.'),
(2,'Perpustakaan','Sekitar 6.000 buku bacaan dan buku pelajaran, buka setiap jam sekolah dan saat istirahat.'),
(3,'Laboratorium komputer','30 unit komputer untuk pelajaran teknologi informasi, jadwal bergilir tiap kelas.'),
(4,'Ruang ibadah','Tempat kebaktian pagi, doa bersama, dan kegiatan rohani; kapasitas sekitar 300 orang.'),
(5,'Lapangan olahraga','Lapangan serbaguna untuk basket, futsal, dan upacara bendera.'),
(6,'Unit kesehatan sekolah','Ruang pertolongan pertama dengan petugas yang berjaga selama jam sekolah.'),
(7,'Kantin sehat','Menu makan siang dan jajanan yang diawasi sekolah; tersedia pilihan tanpa kacang.');

insert into program (urutan,nama,deskripsi) values
(1,'Pembelajaran kelas','Mengikuti kurikulum yang berlaku. TK memakai belajar sambil bermain, SD memakai guru kelas, SMP memakai guru mata pelajaran.'),
(2,'Pendidikan agama Kristen','Pelajaran agama, kebaktian pagi tiap Senin dan Jumat, serta pembinaan rohani per jenjang.'),
(3,'Pembentukan karakter','Pembiasaan disiplin, kejujuran, dan kepedulian lewat tugas kelas, bakti sosial, dan wali kelas.'),
(4,'Ekstrakurikuler','Paduan suara, musik, basket, futsal, pramuka, robotika dasar, dan klub bahasa Inggris, diikuti sepulang sekolah.'),
(5,'Bimbingan belajar','Pendampingan tambahan bagi peserta didik yang membutuhkan, tanpa biaya tambahan di jam sekolah.');

insert into kegiatan (urutan,judul,deskripsi,waktu) values
(1,'Ibadah pembukaan tahun ajaran','Seluruh warga sekolah berdoa bersama untuk memulai tahun ajaran baru.','Juli 2026'),
(2,'Pertemuan orang tua dan guru','Penyampaian perkembangan belajar dan diskusi dengan wali kelas.','Agustus 2026'),
(3,'Kunjungan belajar','Peserta didik belajar langsung di museum dan tempat kerja di luar sekolah.','September 2026'),
(4,'Pekan olahraga sekolah','Lomba antarkelas untuk melatih sportivitas dan kerja sama tim.','Oktober 2026'),
(5,'Bakti sosial','Peserta didik dan guru membagikan bingkisan ke panti asuhan terdekat.','November 2026'),
(6,'Perayaan Natal sekolah','Pentas drama dan paduan suara peserta didik bersama orang tua.','Desember 2026');

insert into prestasi (urutan,tahun,judul,keterangan) values
(1,'2026','Juara 2 Lomba Paduan Suara tingkat kota','Tim paduan suara SMP (contoh)'),
(2,'2025','Juara 1 Olimpiade Matematika SD tingkat kecamatan','Peserta didik kelas 5 (contoh)'),
(3,'2025','Juara 3 Futsal antar SMP se-wilayah','Tim futsal putra (contoh)'),
(4,'2024','Penghargaan sekolah dengan budaya baca terbaik','Tingkat kota (contoh)');

insert into ppdb_info (urutan,kategori,isi) values
(1,'syarat','Mengisi formulir pendaftaran di sekolah'),
(2,'syarat','Fotokopi akta kelahiran dan kartu keluarga'),
(3,'syarat','Pas foto terbaru ukuran 3x4 sebanyak 3 lembar'),
(4,'syarat','Rapor atau surat keterangan dari sekolah asal (untuk SD dan SMP)'),
(5,'syarat','Usia minimal: TK 4 tahun, SD 6 tahun, SMP lulusan SD/sederajat'),
(6,'alur','Hubungi sekolah atau datang langsung untuk mendapat informasi dan melihat sekolah'),
(7,'alur','Lengkapi berkas dan isi formulir pendaftaran di sekolah'),
(8,'alur','Ikuti observasi (TK) atau tes dan wawancara (SD dan SMP) sesuai jadwal'),
(9,'alur','Terima pengumuman hasil melalui telepon atau WhatsApp'),
(10,'alur','Lakukan daftar ulang dan pembayaran di sekolah'),
(11,'jadwal','Pendaftaran gelombang 1: 1 Desember 2026 – 28 Februari 2027'),
(12,'jadwal','Pendaftaran gelombang 2: 1 Maret – 30 April 2027'),
(13,'jadwal','Tes dan wawancara: dua pekan setelah berkas lengkap'),
(14,'jadwal','Tahun ajaran baru dimulai pertengahan Juli 2027'),
(15,'biaya','Uang pendaftaran: Rp500.000 (contoh)'),
(16,'biaya','Uang pangkal: TK Rp8.000.000, SD Rp12.000.000, SMP Rp15.000.000 (contoh)'),
(17,'biaya','SPP per bulan: TK Rp1.200.000, SD Rp1.500.000, SMP Rp1.800.000 (contoh)'),
(18,'biaya','Seragam dan buku dibayar terpisah saat daftar ulang (contoh)'),
(19,'info','Pendaftaran dilakukan langsung di sekolah; situs ini hanya memberi informasi.');

insert into galeri (urutan,judul,warna1,warna2) values
(1,'Ibadah pagi','#274690','#14213d'),(2,'Belajar di kelas','#2f7d5b','#14213d'),
(3,'Perpustakaan','#a14a76','#274690'),(4,'Pekan olahraga','#d9782d','#8a2f2f'),
(5,'Pentas Natal','#8a2f2f','#274690'),(6,'Upacara bendera','#14213d','#2f7d5b');

insert into faq (urutan,pertanyaan,jawaban) values
(1,'Jam masuk dan pulang sekolah?','TK 07.30–11.30, SD 07.00–13.30, SMP 07.00–14.30. Ekstrakurikuler berlangsung sampai sekitar 15.30 (contoh).'),
(2,'Apakah ada seragam?','Ya. Seragam harian, olahraga, dan pramuka. Ukuran diambil saat daftar ulang dan dibayar terpisah.'),
(3,'Apakah tersedia makan siang?','Kantin sekolah menyediakan menu makan siang yang bisa dipesan bulanan atau harian. Anak juga boleh membawa bekal.'),
(4,'Apakah ada antar jemput?','Sekolah tidak punya armada sendiri, tetapi bekerja sama dengan beberapa penyedia antar jemput; orang tua menghubungi penyedia langsung (contoh).'),
(5,'Apakah menerima peserta didik non-Kristen?','Sekolah terbuka bagi semua latar belakang, dengan catatan seluruh peserta didik mengikuti pelajaran agama Kristen dan kebaktian sekolah (contoh).'),
(6,'Apakah ada keringanan atau beasiswa?','Tersedia keringanan biaya bagi keluarga yang membutuhkan dan beasiswa prestasi; pengajuan melalui tata usaha (contoh).'),
(7,'Berapa jumlah peserta didik per kelas?','Maksimal 28 peserta didik per kelas, ditangani satu wali kelas.'),
(8,'Bisakah mengunjungi sekolah sebelum mendaftar?','Bisa. Hubungi tata usaha pada jam layanan untuk membuat janji kunjungan.');

insert into pesan_kontak (nama,email,pesan) select 'Contoh Orang Tua','orangtua@contoh.id','Pesan contoh: kapan sekolah bisa dikunjungi?'
where not exists (select 1 from pesan_kontak);
