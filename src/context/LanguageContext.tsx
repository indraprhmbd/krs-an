import React, { createContext, useContext, useMemo } from "react";

/** Values interpolated into a `{placeholder}` in a translation string. */
type TVars = Record<string, string | number>;

interface LanguageContextType {
  t: (key: string, vars?: TVars) => string;
}

// UI is Indonesian-only (target users are Indonesian college students) --
// see CLAUDE.md. This used to be a Record<Language, Record<string,string>>
// with parallel ID/EN maps; keeping two full copies of ~140 strings in sync
// was never worth it for an audience that reads one language, and it was the
// direct cause of the day-name inconsistency bug (day labels come from
// src/lib/schedule-format.ts now, not this map, and never needed a language
// branch to begin with). `t()` keeps its call shape so existing call sites
// don't need to change.
const translations: Record<string, string> = {
  "nav.architect": "Jadwal",
  "nav.archive": "Arsip",
  "nav.admin": "Admin",
  "nav.tokens": "Service Tokens",
  "nav.tokens_used": "Tersisa",
  "nav.tokens_reset":
    "Token reset setiap hari. Gunakan untuk memperluas limit jadwal.",
  "nav.signout": "Keluar",
  "nav.tutorial": "Tutorial",
  "nav.contact": "Kontak",
  "footer.tagline":
    "Platform optimasi jadwal perkuliahan tercanggih untuk mahasiswa Indonesia.",
  "footer.about": "Tentang",
  "footer.donate": "Donasi",
  "footer.feedback": "Saran",
  "footer.copyright": "Built by Indra",
  "maker.step_config": "Konfigurasi",
  "maker.step_select": "Pilih Matkul",
  "maker.step_view": "Lihat Jadwal",
  "config.academic_year": "Tahun Akademik",
  "config.title": "Rancang Semester",
  "config.title_span": "Anda.",
  "config.sub_title":
    "Nggak perlu lagi pusing coret-coret jadwal manual. Isi data kuliah Anda, biar KRSan yang carikan kombinasi jadwal yang pas.",
  "config.card_title": "Konfigurasi Akademik",
  "config.section_institution": "Institusi",
  "config.section_target": "Target Akademik",
  "config.univ_label": "Institusi / Universitas",
  "config.univ_placeholder": "Pilih Universitas",
  "config.prodi_label": "Program Studi (Prodi)",
  "config.prodi_placeholder": "Pilih Prodi",
  "config.semester_label": "Target Semester",
  "config.max_sks_label": "Batas Maks SKS",
  "config.btn_init": "Inisialisasi Sesi",
  "config.clear_session": "Hapus Sesi Tersimpan",
  "config.clear_confirm":
    "Hapus semua data sesi yang tersimpan? Ini akan mereset konfigurasi dan pilihan mata kuliah Anda.",
  "selector.title": "Katalog Mata Kuliah",
  "selector.sub_title": "Pilih mata kuliah yang ingin Anda ambil.",
  "selector.add_course": "Tambah",
  "selector.load_curriculum": "Muat dari Kurikulum",
  "selector.generating": "Merencanakan...",
  "selector.generate": "Hasilkan Jadwal",
  "selector.thinking": "Berpikir...",
  "selector.smart_generate": "Smart Generate",
  "selector.quick_build": "Susun Cepat",
  "selector.plotter": "Plotter",
  "selector.back": "Kembali",
  "selector.no_subjects_title": "Belum ada mata kuliah",
  "selector.no_subjects_desc":
    "Muat mata kuliah wajib semester Anda, atau tambah sendiri dari katalog.",
  "selector.needs_courses": "Tambah mata kuliah dulu sebelum menyusun jadwal.",
  "viewer.title": "Review Jadwal",
  "viewer.sub_title": "Hasil optimasi jadwal terbaik untuk Anda.",
  "viewer.save": "Simpan ke Arsip",
  "viewer.saving": "Menyimpan...",
  "landing.tagline":
    "Optimasi jadwal perkuliahan profesional untuk mahasiswa. Didukung oleh AI untuk pengalaman akademik yang elegan.",
  "landing.welcome": "Selamat Datang Kembali",
  "landing.sub_welcome": "Masuk untuk mengelola semester akademik Anda",
  "landing.continue": "Lanjutkan dengan Clerk",
  "help.tokens_title": "Tentang Service Tokens",
  "help.tokens_desc":
    "Token digunakan untuk fitur premium seperti Smart Generate. Anda mendapatkan 5 token gratis setiap hari yang akan di-reset pada tengah malam.",
  "help.smart_generate_title": "Optimasi AI (Smart Generate)",
  "help.smart_generate_desc":
    "Fitur ini menggunakan AI untuk mendesain jadwal terbaik berdasarkan preferensi Anda (misalnya: tanpa kelas pagi, atau hari libur tertentu). Memerlukan 1 token per penggunaan.",
  "help.architect_title": "Architect Engine",
  "help.architect_desc":
    "Alur kerja 3 tahap untuk membuat jadwal sempurna: Konfigurasi data akademik, Pilih mata kuliah, dan Visualisasikan hasilnya.",
  "help.master_data_title": "Database Global",
  "help.master_data_desc":
    "Akses basis data mata kuliah dari program studi lain untuk mengambil mata kuliah pilihan atau lintas prodi.",

  // Toasts. These were 41 hardcoded English strings, so switching to
  // Indonesian changed the page but not a single notification.
  "toast.needs_courses": "Pilih minimal satu mata kuliah dulu.",
  "toast.no_credits": "Butuh 1 token untuk Smart Generate.",
  "toast.cooldown": "Tunggu {seconds} detik sebelum menyusun lagi.",
  "toast.daily_limit": "Batas harian tercapai. Kembali lagi besok!",
  "toast.plan_archived": "Jadwal tersimpan di arsip.",
  "toast.manual_saved": "Jadwal manual tersimpan.",
  "toast.saved_local":
    "Tersimpan di perangkat ini. Masuk untuk menyimpannya lintas perangkat dan membagikannya.",
  "toast.save_failed": "Gagal menyimpan jadwal: {error}",
  "toast.plan_removed": "Jadwal dihapus dari arsip.",
  "toast.delete_failed": "Gagal menghapus jadwal: {error}",
  "toast.plan_renamed": "Nama jadwal diperbarui.",
  "toast.rename_failed": "Gagal mengganti nama: {error}",
  "toast.imported_to_viewer": "{count} jadwal dimuat ke penampil.",
  "toast.plans_imported": "{count} jadwal diimpor.",
  "toast.import_failed": "Impor gagal: {error}",
  "toast.import_partial":
    "{imported} dari {total} jadwal diimpor. Sisanya melebihi batas arsip.",
  "toast.ai_success": "AI membuat {count} jadwal optimal. Cek Arsip.",
  "toast.ai_no_result":
    "AI tidak menemukan jadwal yang cocok. Coba longgarkan batasan Anda (hari kosong/dosen) atau kurangi SKS.",
  "toast.ai_failed": "Smart Generate gagal: {error}",
  "toast.ai_cached": "Memakai hasil AI dari cache.",
  "toast.token_spent": "1 token dipakai untuk tambahan +12 jadwal.",
  "toast.token_failed": "Gagal memakai token: {error}",
  "toast.plan_limit": "Batas maksimum 36 jadwal tercapai.",
  "toast.no_combinations":
    "Tidak ada kombinasi jadwal baru dengan konfigurasi ini.",
  "toast.no_courses":
    "Belum ada mata kuliah. Tambah mata kuliah dulu.",
  "toast.no_valid_schedules":
    "Tidak ada jadwal yang valid. Coba lepas beberapa kelas yang dikunci.",
  "toast.selections_cleared": "Pilihan dibersihkan.",
  "toast.quick_fix": "Perbaikan cepat diterapkan.",
  "toast.quick_fix_partial":
    "{count} konflik belum bisa diperbaiki otomatis: {names}. Ganti kelasnya secara manual.",
  "toast.link_copied": "Tautan disalin ke papan klip.",
  "toast.account_copied": "Nomor rekening berhasil disalin.",
  "toast.plan_corrupt":
    "{count} jadwal tersimpan tidak bisa dibaca dan dilewati.",
  "toast.migrate_title": "Impor jadwal tersimpan Anda?",
  "toast.migrate_desc":
    "{count} jadwal yang dibuat sebelum Anda masuk bisa dipindahkan ke akun ini.",
  "toast.migrate_action": "Impor",
  "toast.share_imported": "Jadwal diimpor ke akun Anda. Mengalihkan...",
  "toast.course_removed": "Mata kuliah dihapus.",
  "toast.course_removed_code": "{code} dihapus dari jadwal.",
  "toast.courses_added": "{count} mata kuliah ditambahkan ke sesi.",
  "toast.curriculum_loaded":
    "{count} mata kuliah dimuat dari kurikulum.",
  "toast.curriculum_empty":
    "Kurikulum untuk prodi dan semester ini sudah ada, tapi kelasnya belum tersedia di katalog. Coba tambah manual atau hubungi admin.",

  "auth.sign_in_title": "Butuh login",
  "auth.sign_in_action": "Masuk",
  "auth.expand_plan":
    "Memperluas batas jadwal menghabiskan 1 dari 5 kredit harian, perlu akun.",
  "auth.share_plan":
    "Berbagi jadwal perlu akun supaya tautannya tersimpan. Arsip lokal akan diimpor saat masuk.",
  "auth.smart_generate":
    "Smart Generate pakai AI dan butuh 1 dari 5 kredit harian, jadi perlu akun. Generator biasa gratis tanpa login.",

  "footer.howtouse": "Cara Pakai",
  "howtouse.title": "Panduan Penggunaan KRSan",
  "howtouse.step1_title": "Konfigurasi Akademik",
  "howtouse.step1_desc":
    "Pilih universitas, program studi, dan semester yang dituju. Atur batas maksimal SKS sesuai kemampuan. Data akademik tersimpan otomatis untuk kunjungan berikutnya.",
  "howtouse.step2_title": "Pilih & Kunci Mata Kuliah",
  "howtouse.step2_desc":
    "Tambah mata kuliah dari katalog global. Cari berdasarkan kode atau nama. Kunci kelas favorit dengan mengklik opsi kelas yang tersedia - sistem akan prioritaskan kelas tersebut saat generate.",
  "howtouse.step3_title": "Generate Jadwal",
  "howtouse.step3_desc":
    "Tiga cara: Quick Build (gratis, sistem otomatis cari kombinasi tanpa bentrok), Smart Generate (AI dengan 1 token - atur preferensi hari libur, dosen favorit, batas SKS harian), atau Plotter (atur manual setiap kelas satu per satu).",
  "howtouse.step4_title": "Review, Simpan & Bagikan",
  "howtouse.step4_desc":
    "Lihat hasil jadwal di grid visual. Geser antar opsi, kunci atau perbaiki kelas di mode manual. Simpan ke arsip (maks 30). Nanti bisa diubah nama, dihapus, atau dibagikan lewat link atau WhatsApp.",
  "about.title": "Tentang KRSan",
  "about.personal":
    "KRSan saya buat karena saya sendiri dulu pusing nyusun jadwal KRS. Antara milih kelas, ngatur biar nggak bentrok, milih dosen - semuanya manual, waktunya mepet, bikin stres. Ini proyek kecil yang saya harap bisa bikin pengalaman KRSan teman-teman jadi lebih gampang.",
  "about.how":
    "Cara kerjanya: pilih mata kuliah yang mau diambil, atur preferensi kayak 'gak mau kelas pagi', sistem bakal nyariin kombinasi jadwal yang cocok tinggal pilih. Hasilnya bisa disimpan atau dibagikan.",
  "about.legal":
    "KRSan proyek sampingan pribadi, bukan produk komersial. Data jadwal kuliah dan nama pengajar bersumber dari informasi publik yang tersedia. Tidak terafiliasi dengan institusi pendidikan mana pun.",
  "about.illustration_credit": "Idea illustrations by Storyset",
  "help.shuffle_title": "Macro Adjustment (Shuffle)",
  "help.shuffle_desc":
    "Gunakan Shuffle untuk merombak total kombinasi jadwal secara acak. Ini adalah penyesuaian skala besar untuk menemukan struktur jadwal yang benar-benar berbeda.",
  "help.slider_title": "Micro Adjustment (Slider)",
  "help.slider_desc":
    "Gunakan penggeser untuk melihat variasi detail dari struktur jadwal yang sudah ada. Ini adalah penyesuaian skala kecil untuk membandingkan pilihan kelas secara spesifik.",
  "help.master_catalog_title": "Katalog Global (Master)",
  "help.master_catalog_desc":
    "Cari dan tambahkan mata kuliah dari seluruh database universitas, termasuk dari program studi lain.",
  "help.quick_build_title": "Penyusunan Cepat (Quick Build)",
  "help.quick_build_desc":
    "Sistem akan mencoba menyusun jadwal secara otomatis berdasarkan mata kuliah yang telah Anda pilih jika memungkinkan.",
  "help.plotter_title": "Manual Plotter",
  "help.plotter_desc":
    "Gunakan plotter untuk menyusun jadwal secara manual satu per satu dengan kontrol penuh atas pemilihan kelas.",
  "help.quick_fix_title": "Perbaikan Konflik",
  "help.quick_fix_desc":
    "Sistem akan mencoba mencari variasi kelas lain secara otomatis untuk menyelesaikan konflik jadwal yang ada.",
  "help.expand_title": "Eksplorasi (Expand)",
  "help.expand_desc":
    "Gunakan Expand untuk mencari lebih banyak variasi kombinasi jadwal yang mungkin belum muncul sebelumnya.",
  "help.ai_smart_generate_title": "Smart Generate (AI)",
  "help.ai_smart_generate_desc":
    "Fitur premium yang menggunakan AI untuk mencari jadwal paling optimal berdasarkan preferensi spesifik Anda.",
  "tutorial.step1_title": "Mulai Perjalanan Anda",
  "tutorial.step1_desc":
    "Atur program studi, semester, dan preferensi Anda di sini. Ini membantu kami menyesuaikan jadwal untuk Anda.",
  "tutorial.step2_title": "Pilih Mata Kuliah",
  "tutorial.step2_desc":
    "Jelajahi katalog dan tambahkan mata kuliah ke sesi Anda. Kami akan mendeteksi konflik secara otomatis!",
  "tutorial.step3_title": "AI & Alat Cerdas",
  "tutorial.step3_desc":
    "Gunakan 'Smart Generate' agar AI membuat jadwal sempurna dalam hitungan detik, atau 'Quick Build' untuk mengacak opsi.",
  "tutorial.step4_title": "Visualisasi Waktu",
  "tutorial.step4_desc":
    "Lihat minggu Anda secara sekilas. Klik kelas mana pun untuk melihat detail atau menguncinya.",
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const t = useMemo(
    () =>
      (key: string, vars?: TVars) => {
        // A missing key falls back to the key itself, which renders literal
        // text like "selector.no_subjects" to the user. `npm run check:i18n`
        // exists to catch that at build time, because nothing else does.
        let out = translations[key] ?? key;
        if (vars) {
          for (const [name, value] of Object.entries(vars)) {
            out = out.split(`{${name}}`).join(String(value));
          }
        }
        return out;
      },
    [],
  );

  const value = useMemo(() => ({ t }), [t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
