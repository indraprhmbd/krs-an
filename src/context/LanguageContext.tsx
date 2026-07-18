import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Language = "ID" | "EN";

/** Values interpolated into a `{placeholder}` in a translation string. */
type TVars = Record<string, string | number>;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: TVars) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ID: {
    "nav.architect": "Architect",
    "nav.archive": "Archive",
    "nav.admin": "Admin",
    "nav.tokens": "Service Tokens",
    "nav.tokens_used": "Tersisa",
    "nav.tokens_reset":
      "Token reset setiap hari. Gunakan untuk memperluas limit jadwal.",
    "nav.signout": "Keluar",
    "nav.language": "Bahasa",
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
      "Tentukan parameter akademik Anda untuk memulai penjadwalan cerdas semester depan.",
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
    "toast.no_valid_schedules":
      "Tidak ada jadwal yang valid. Coba lepas beberapa kelas yang dikunci.",
    "toast.selections_cleared": "Pilihan dibersihkan.",
    "toast.quick_fix": "Perbaikan cepat diterapkan.",
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

    "footer.howtouse": "Cara Pakai",
    "howtouse.title": "Panduan Penggunaan KRSan",
    "howtouse.step1_title": "1. Konfigurasi Akademik",
    "howtouse.step1_desc":
      "Masukkan universitas, program studi, dan semester target Anda.",
    "howtouse.step2_title": "2. Pilih Mata Kuliah",
    "howtouse.step2_desc":
      "Cari dan tambahkan mata kuliah yang Anda inginkan dari katalog.",
    "howtouse.step3_title": "3. Visualisasi & Optimasi",
    "howtouse.step3_desc":
      "Biarkan sistem menghasilkan berbagai kombinasi jadwal tanpa bentrok untuk Anda.",
    "howtouse.premium_title": "Fitur Premium",
    "howtouse.premium_desc":
      "Gunakan Smart Generate untuk mengatur preferensi spesifik seperti 'Tanpa Kelas Pagi'.",
    "about.legal_title": "Aspek Legal & Privasi",
    "about.legal_desc":
      "KRSan menyajikan data jadwal kuliah dan nama pengajar berdasarkan informasi publik yang disediakan oleh institusi terkait. Kami hanya memproses data ini untuk tujuan edukasi dan kemudahan administratif mahasiswa, sesuai dengan semangat UU Pelindungan Data Pribadi No. 27 Tahun 2022 (Kapasitas Profesional).",
    "about.illustration_credit": "Ilustrasi oleh",
    "about.title": "Filosofi KRSan",
    "about.background_title": "Latar Belakang",
    "about.background_desc":
      "Masa pengisian KRS (Kartu Rencana Studi) seringkali menjadi momen paling menegangkan bagi mahasiswa. Antara mengejar kuota kelas, menghindari jadwal yang bentrok, hingga mencari dosen idaman, mahasiswa dipaksa menjadi 'optimizer' manual dalam waktu yang singkat.",
    "about.mission_title": "Misi Kami",
    "about.mission_desc":
      "KRSan dibuat untuk mendemokrasikan optimasi jadwal. Kami percaya bahwa teknologi AI seharusnya membantu hal-hal administratif yang membosankan sehingga mahasiswa bisa lebih fokus pada pencapaian akademik yang sebenarnya.",
    "about.quote":
      "'KRSan bukan hanya alat pembuat jadwal, tapi manifestasi dari rasa empati terhadap perjuangan ratusan ribu mahasiswa setiap semesternya.'",
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
  },
  EN: {
    "nav.architect": "Architect",
    "nav.archive": "Archive",
    "nav.admin": "Admin",
    "nav.tokens": "Service Tokens",
    "nav.tokens_used": "Remaining",
    "nav.tokens_reset":
      "Tokens reset daily. Use them to expand schedule limits.",
    "nav.signout": "Sign Out",
    "nav.language": "Language",
    "nav.tutorial": "Tutorial",
    "nav.contact": "Contact",
    "footer.tagline":
      "The most advanced course schedule optimization platform for Indonesian students.",
    "footer.about": "About",
    "footer.donate": "Donate",
    "footer.feedback": "Feedback",
    "footer.copyright": "Built by Indra",
    "maker.step_config": "Configure",
    "maker.step_select": "Select Courses",
    "maker.step_view": "View Schedule",
    "config.academic_year": "Academic Year",
    "config.title": "Architect Your",
    "config.title_span": "Semester.",
    "config.sub_title":
      "Establish your academic parameters to initialize the intelligent scheduler for the upcoming term.",
    "config.card_title": "Academic Configuration",
    "config.section_institution": "Institution",
    "config.section_target": "Academic Target",
    "config.univ_label": "Institution / University",
    "config.univ_placeholder": "Select University",
    "config.prodi_label": "Study Program (Prodi)",
    "config.prodi_placeholder": "Select Prodi",
    "config.semester_label": "Target Semester",
    "config.max_sks_label": "Max SKS Load",
    "config.btn_init": "Initialize Session",
    "config.clear_session": "Clear Saved Session",
    "config.clear_confirm":
      "Clear all saved session data? This will reset your configuration and selections.",
    "selector.title": "Course Catalog",
    "selector.sub_title": "Select the courses you want to take.",
    "selector.quick_build": "Quick Build",
    "selector.plotter": "Plotter",
    "selector.no_subjects_title": "No courses yet",
    "selector.no_subjects_desc":
      "Load your semester's required courses, or add your own from the catalog.",
    "selector.needs_courses": "Add some courses before building a schedule.",
    "selector.add_course": "Add",
    "selector.generating": "Planning...",
    "selector.generate": "Generate Schedule",
    "selector.thinking": "Thinking...",
    "selector.smart_generate": "Smart Generate",
    "selector.back": "Back",
    "viewer.title": "Review Schedules",
    "viewer.sub_title": "The best schedule optimization results for you.",
    "viewer.save": "Save to Archive",
    "viewer.saving": "Saving...",
    "landing.tagline":
      "Professional schedule planning for university students. Optimized by AI for an elegant academic experience.",
    "landing.welcome": "Welcome Back",
    "landing.sub_welcome": "Securely sign in to manage your academic semester",
    "landing.continue": "Continue with Clerk",
    "help.tokens_title": "About Service Tokens",
    "help.tokens_desc":
      "Tokens are used for premium features like Smart Generate. You get 5 free tokens every day, which reset at midnight.",
    "help.smart_generate_title": "AI Optimization (Smart Generate)",
    "help.smart_generate_desc":
      "This feature uses AI to design the best schedule based on your preferences (e.g., no morning classes or specific off-days). Requires 1 token per use.",
    "help.architect_title": "Architect Engine",
    "help.architect_desc":
      "A 3-stage workflow to create your perfect schedule: Configure academic data, Select courses, and Visualize the results.",
    "help.master_data_title": "Global Database",
    "help.master_data_desc":
      "Access course databases from other study programs to take elective or cross-major courses.",

    "toast.needs_courses": "Select at least one course first.",
    "toast.no_credits": "You need 1 token for Smart Generate.",
    "toast.cooldown": "Wait {seconds} seconds before generating again.",
    "toast.daily_limit": "Daily limit reached. Come back tomorrow!",
    "toast.plan_archived": "Plan saved to your archive.",
    "toast.manual_saved": "Manual plan saved.",
    "toast.saved_local":
      "Saved on this device. Sign in to keep it across devices and share it.",
    "toast.save_failed": "Failed to save plan: {error}",
    "toast.plan_removed": "Plan removed from archive.",
    "toast.delete_failed": "Failed to delete plan: {error}",
    "toast.plan_renamed": "Plan renamed.",
    "toast.rename_failed": "Failed to rename plan: {error}",
    "toast.imported_to_viewer": "Loaded {count} plans into the viewer.",
    "toast.plans_imported": "Imported {count} plans.",
    "toast.import_failed": "Import failed: {error}",
    "toast.import_partial":
      "Imported {imported} of {total} plans. The rest exceed the archive limit.",
    "toast.ai_success": "AI generated {count} optimized schedules. Check Archive.",
    "toast.ai_no_result":
      "AI couldn't find a schedule that fits. Try relaxing your constraints (days off/lecturers) or reducing SKS.",
    "toast.ai_failed": "Smart Generate failed: {error}",
    "toast.ai_cached": "Using cached AI result.",
    "toast.token_spent": "Spent 1 token for +12 more plans.",
    "toast.token_failed": "Failed to spend token: {error}",
    "toast.plan_limit": "Maximum of 36 plans reached.",
    "toast.no_combinations":
      "No new schedule combinations found with this configuration.",
    "toast.no_valid_schedules":
      "No valid schedules found. Try releasing some locked classes.",
    "toast.selections_cleared": "Selections cleared.",
    "toast.quick_fix": "Applied quick fix for conflicts.",
    "toast.link_copied": "Link copied to clipboard.",
    "toast.account_copied": "Account number copied.",
    "toast.plan_corrupt": "{count} saved plans could not be read and were skipped.",
    "toast.migrate_title": "Import your saved plans?",
    "toast.migrate_desc":
      "{count} plans from before you signed in can be moved into your account.",
    "toast.migrate_action": "Import",
    "toast.share_imported": "Plan imported to your account. Redirecting...",
    "toast.course_removed": "Course removed.",
    "toast.course_removed_code": "Removed {code} from the schedule.",
    "toast.courses_added": "{count} courses added to the session.",

    "footer.howtouse": "How to Use",
    "howtouse.title": "KRSan Usage Guide",
    "howtouse.step1_title": "1. Academic Configuration",
    "howtouse.step1_desc":
      "Enter your university, study program, and target semester.",
    "howtouse.step2_title": "2. Select Courses",
    "howtouse.step2_desc": "Search and add desired courses from the catalog.",
    "howtouse.step3_title": "3. Visualize & Optimize",
    "howtouse.step3_desc":
      "Let the system generate various conflict-free schedule combinations for you.",
    "howtouse.premium_title": "Premium Features",
    "howtouse.premium_desc":
      "Use Smart Generate to set specific preferences like 'No Morning Classes'.",
    "about.legal_title": "Legal & Privacy Aspects",
    "about.legal_desc":
      "KRSan presents course schedules and faculty names based on public information provided by the respective institutions. We process this data solely for educational purposes and student administrative convenience, in accordance with the spirit of the Personal Data Protection Act No. 27 of 2022 (Professional Capacity).",
    "about.illustration_credit": "Illustration by",
    "about.title": "KRSan Philosophy",
    "about.background_title": "Background",
    "about.background_desc":
      "KRS (Study Plan) registration period is often the most stressful moment for students. Between chasing class quotas, avoiding schedule conflicts, to finding dream lecturers, students are forced to be manual 'optimizers' in a short time.",
    "about.mission_title": "Our Mission",
    "about.mission_desc":
      "KRSan was created to democratize schedule optimization. We believe that AI technology should help with tedious administrative tasks so that students can focus more on actual academic achievement.",
    "about.quote":
      "'KRSan is not just a scheduling tool, but a manifestation of empathy towards the struggles of hundreds of thousands of students every semester.'",
    "help.shuffle_title": "Macro Adjustment (Shuffle)",
    "help.shuffle_desc":
      "Use Shuffle to completely reorganize the schedule combination randomly. This is a large-scale adjustment to find a completely different schedule structure.",
    "help.slider_title": "Micro Adjustment (Slider)",
    "help.slider_desc":
      "Use the slider to see detailed variations of the existing schedule structure. This is a small-scale adjustment to compare specific class options.",
    "help.master_catalog_title": "Global Catalog (Master)",
    "help.master_catalog_desc":
      "Search and add courses from the entire university database, including from other study programs.",
    "help.quick_build_title": "Quick Build",
    "help.quick_build_desc":
      "The system will attempt to automatically assemble a schedule based on your selected courses if possible.",
    "help.plotter_title": "Manual Plotter",
    "help.plotter_desc":
      "Use the plotter to assemble your schedule manually one by one with full control over class selection.",
    "help.quick_fix_title": "Conflict Fixer",
    "help.quick_fix_desc":
      "The system will automatically find alternative class variations to resolve existing schedule conflicts.",
    "help.expand_title": "Exploration (Expand)",
    "help.expand_desc":
      "Use Expand to find more possible schedule combinations that haven't appeared yet.",
    "help.ai_smart_generate_title": "Smart Generate (AI)",
    "help.ai_smart_generate_desc":
      "Premium feature using AI to find the most optimal schedule based on your specific preferences.",
    "tutorial.step1_title": "Start Your Journey",
    "tutorial.step1_desc":
      "Set your major, semester, and preferences here. This helps us tailor the schedule for you.",
    "tutorial.step2_title": "Choose Your Courses",
    "tutorial.step2_desc":
      "Browse the catalog and add subjects to your session. We'll automatically detect conflicts!",
    "tutorial.step3_title": "AI & Smart Tools",
    "tutorial.step3_desc":
      "Use 'Smart Generate' to let AI build your perfect schedule in seconds, or use 'Quick Build' to shuffle options.",
    "tutorial.step4_title": "Visual Timegrid",
    "tutorial.step4_desc":
      "See your week at a glance. Click on any class to see details or lock it in place.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Via the hook rather than raw localStorage: it guards against a throwing
  // localStorage (Safari private mode, disabled storage), which would
  // otherwise take down the whole provider and with it the app.
  const [lang, setLang] = useLocalStorage<Language>("krsan_lang", "ID");

  // Memoised so `t` is referentially stable across renders. As an inline arrow
  // it was a new function every render, which makes it useless in a dependency
  // array: any effect depending on it would re-run on every render.
  const t = useCallback(
    (key: string, vars?: TVars) => {
      // A missing key falls back to the key itself, which renders literal text
      // like "selector.no_subjects" to the user. `npm run check:i18n` exists to
      // catch that at build time, because nothing else does.
      let out = translations[lang][key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          out = out.split(`{${name}}`).join(String(value));
        }
      }
      return out;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

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
