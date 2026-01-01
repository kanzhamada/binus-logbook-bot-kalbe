Berikut adalah draf Laporan Enrichment Program untuk bulan September 2025 berdasarkan data aktivitas yang Anda berikan.

---

# LAPORAN TRAINING INTERNSHIP KALBE BULAN SEPTEMBER

**Laporan Enrichment Program**

**oleh**

**Kanz Abdillah Hamada - 2602170202**

**Computer Science Study Program**
**School of Computer Science**
**UNIVERSITAS BINA NUSANTARA**
**MALANG**
**2025**

---

## BAB 1 PENDAHULUAN

### 1.1. Profil Perusahaan
PT Kalbe Farma Tbk (Kalbe) merupakan salah satu perusahaan farmasi terbesar di Asia Tenggara yang berdiri sejak tahun 1966. Berawal dari sebuah usaha sederhana di sebuah garasi kecil, Kalbe telah berkembang pesat menjadi perusahaan penyedia solusi kesehatan terintegrasi terkemuka di Indonesia. Transformasi ini dicapai melalui pertumbuhan organik serta berbagai strategi penggabungan usaha dan akuisisi yang berkelanjutan.

Kalbe mengelola bisnisnya melalui empat divisi utama, yaitu:
1. Divisi Obat Resep (kontribusi 23%)
2. Divisi Produk Kesehatan (kontribusi 17%)
3. Divisi Nutrisi (kontribusi 30%)
4. Divisi Distribusi dan Logistik (kontribusi 30%)

Masing-masing divisi tersebut memiliki portofolio produk yang komprehensif, mulai dari obat resep, obat bebas, minuman energi, produk nutrisi, hingga layanan distribusi. Didukung oleh lebih dari 17.000 karyawan, Kalbe Farma telah membangun fondasi kuat dalam bidang pemasaran, distribusi, keuangan, riset dan pengembangan (R&D).

**1.1.1. Visi**
Menjadi Perusahaan Produk Kesehatan Indonesia terbaik dengan skala internasional yang didukung oleh inovasi, merek yang kuat, dan manajemen yang prima.

**1.1.2. MISI**
Meningkatkan kesehatan untuk kehidupan yang lebih baik.

**1.1.3. Motto**
Inovasi untuk Kehidupan yang Lebih Baik.

### 1.2. Posisi dan Peran Mahasiswa
Saya berposisi sebagai *Software Engineer* (SWE) yang menjadi bagian dari divisi *Corporate Digital Technology* (CDT). Fokus utama saya adalah pada pengembangan perangkat lunak yang dibutuhkan oleh stakeholder maupun divisi-divisi lain di Kalbe. Sebagai SWE, saya berperan penting dalam mengerjakan proyek-proyek strategis seperti Vision X, proyek AIM, dan otomasi. Saya bertanggung jawab dalam pengembangan *backend*, manajemen basis data melalui Supabase, serta integrasi sistem melalui RPC (*Remote Procedure Call*).

---

## BAB 2 LAPORAN KEGIATAN

### 2.1. Proses Bisnis
Pada bulan September 2025, proses bisnis saya sebagai *Software Engineer* di divisi CDT berfokus pada pengembangan intensif proyek AIM, yang mencakup modifikasi ERD, implementasi *schema* ke Supabase, serta pengembangan RPC untuk integrasi tim *front-end*. Selain itu, saya melakukan pemeliharaan pada proyek Blue Halo dengan memperbaiki *bug* terkait *status code* dan *deployment*, serta melakukan eksplorasi teknologi *big data* dan AI seperti Trino, Hive, dan CLIP guna mendukung efisiensi infrastruktur digital perusahaan.

### 2.2. Kegiatan yang Dilakukan Sesuai Learning Plan

#### 2.2.1. Project
**a) Minggu Pertama (1 - 5 September 2025)**
Fokus minggu ini adalah inisiasi teknis proyek AIM. Saya melakukan modifikasi ERD berdasarkan kebutuhan alur kerja, mengintegrasikan skema ERD MLflow, dan memulai implementasi ERD ke dalam Supabase. Selain itu, saya menyelesaikan *API Proxy* untuk fitur unggah dan pengecekan struktur *dataset*.

**b) Minggu Kedua (8 - 12 September 2025)**
Melanjutkan pengerjaan proyek AIM melalui serangkaian rapat koordinasi dengan tim AI dan *stakeholder*. Aktivitas utama meliputi revisi ERD, pembuatan daftar RPC berdasarkan desain UI/UX, dan implementasi RPC tersebut. Saya juga menangani perbaikan *bug* pada proyek Vision X terkait masalah pengembalian *status code*.

**c) Minggu Ketiga (15 - 19 September 2025)**
Fokus beralih pada integrasi sistem. Saya mengimplementasikan ERD ke Supabase secara menyeluruh dan mengembangkan *Proof of Concept* (POC) untuk pengecekan ukuran penyimpanan Azure dan struktur folder file ZIP. Selain itu, dilakukan perbaikan *bug* pada *AIM Proxy* terkait *Deeplake ingestion*.

**d) Minggu Keempat & Kelima (22 - 30 September 2025)**
Minggu terakhir diisi dengan integrasi RPC ke tim *front-end* dan melakukan *load testing* menggunakan k6 Grafana untuk memastikan stabilitas sistem. Saya juga melakukan perbaikan pada proyek Blue Halo terkait *endpoint delete* dan masalah *mismatch request body*. Bulan ini ditutup dengan eksplorasi teknologi baru seperti Trino, Hive, Celery, dan Redis.

#### 2.2.2. Technical Competency (TC)
1. **Supabase & RPC:** Mengelola database PostgreSQL dan membuat fungsi RPC untuk menjembatani logika *backend* dengan *front-end*.
2. **Azure Storage Integration:** Mengembangkan POC untuk menghitung penggunaan penyimpanan organisasi pada layanan *cloud* Azure.
3. **k6 & Grafana:** Melakukan pengujian beban (*load testing*) untuk mengukur performa API sebelum diimplementasikan secara luas.
4. **Trino & Hive:** Mengeksplorasi mesin kueri SQL terdistribusi untuk kebutuhan analisis data skala besar.
5. **Backend Debugging (FastAPI/Node.js):** Mengidentifikasi dan memperbaiki *mismatch request body* serta kesalahan kode status HTTP pada layanan yang sudah berjalan.

#### 2.2.3. Employability and Entrepreneurial Skill (EES)
1. **Collaboration:** Melakukan koordinasi rutin dengan tim AI, tim *front-end*, dan *stakeholder* internal dalam rapat mingguan proyek AIM.
2. **Problem Solving:** Mengidentifikasi penyebab kegagalan integrasi *Deeplake* dan memperbaiki masalah *deployment* pada proyek Blue Halo.
3. **Adaptability:** Mempelajari dan mencoba alternatif teknologi OpenAI seperti CLIP serta alat bantu produktivitas berbasis AI secara mandiri.
4. **Digital & Technology Fluency:** Menggunakan alat *load testing* modern (k6) dan platform manajemen data (MLflow) untuk meningkatkan kualitas perangkat lunak.

### 2.3. Penuntasan Tugas dan Penanganan Masalah
1. **Minggu 1:** Berhasil memodifikasi ERD AIM dan menyelesaikan integrasi API POC untuk Azure.
2. **Minggu 2:** Penyusunan daftar RPC sesuai UI/UX selesai tepat waktu dan *bug* Vision X teratasi.
3. **Minggu 3:** Implementasi ERD ke Supabase rampung; POC pengecekan struktur folder ZIP berhasil dijalankan.
4. **Minggu 4 & 5:** Integrasi RPC dengan tim *front-end* sukses dilakukan; masalah *status code* dan *mismatch body* pada Blue Halo berhasil diperbaiki dan dideploy ulang.

---

## KESIMPULAN
Bulan September 2025 merupakan periode krusial dalam pengembangan infrastruktur proyek AIM dan pemeliharaan proyek Blue Halo. Saya berhasil mengintegrasikan skema data yang kompleks ke dalam Supabase dan memastikan komunikasi antar sistem berjalan lancar melalui RPC yang terstandarisasi. Penggunaan metode *load testing* memberikan keyakinan lebih pada stabilitas aplikasi. Secara keseluruhan, pencapaian bulan ini memperkuat fondasi teknis saya dalam pengembangan *backend* serta kemampuan adaptasi terhadap teknologi baru di lingkungan PT Kalbe Farma Tbk.

---

## REFERENSI
*   Azure Storage Documentation. (2025). *Monitor, diagnose, and troubleshoot Microsoft Azure Storage*. Diambil dari https://learn.microsoft.com/en-us/azure/storage/
*   Grafana k6 Documentation. (2025). *Performance testing for modern software teams*. Diambil dari https://k6.io/docs/
*   Supabase Documentation. (2025). *Database Functions and RPC*. Diambil dari https://supabase.com/docs
*   Trino Software Foundation. (2025). *Trino Documentation*. Diambil dari https://trino.io/docs/current/