import React, { createContext, useContext, useState } from "react";

type Language = "ID" | "EN";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ID: {
    "nav.architect": "Architect",
    "nav.archive": "Archive",
    "nav.admin": "Admin",
    "nav.tokens": "Service Tokens",
    "nav.tokens_used": "Digunakan",
    "nav.tokens_reset":
      "Token reset setiap hari. Gunakan untuk memperluas limit jadwal.",
    "nav.signout": "Keluar",
    "nav.language": "Bahasa",
    "footer.tagline":
      "Platform optimasi jadwal perkuliahan tercanggih untuk mahasiswa Indonesia.",
    "footer.about": "Tentang",
    "footer.donate": "Donasi",
    "footer.feedback": "Saran",
    "footer.copyright": "Built by Indra",
    "maker.step_config": "Konfigurasi",
    "maker.step_select": "Pilih Matkul",
    "maker.step_view": "Lihat Jadwal",
    "config.academic_year": "Tahun Akademik 2025/2026",
    "config.title": "Rancang Semester",
    "config.title_span": "Anda.",
    "config.sub_title":
      "Tentukan parameter akademik Anda untuk memulai penjadwalan cerdas semester depan.",
    "config.ai_engine_active": "Mesin Optimasi AI Aktif",
    "config.ai_scrolling":
      "Menyinkronkan database... Mencapai keseimbangan akademik optimal... Mencegah konflik jadwal...",
    "config.card_title": "Konfigurasi Akademik",
    "config.univ_label": "Institusi / Universitas",
    "config.univ_placeholder": "Pilih Universitas",
    "config.prodi_label": "Program Studi (Prodi)",
    "config.prodi_placeholder": "Pilih Prodi",
    "config.semester_label": "Target Semester",
    "config.max_sks_label": "Batas Maks SKS",
    "config.btn_init": "Inisialisasi Sesi",
    "config.footer": "DIDUKUNG OLEH THE CORE ARCHITECT ENGINE",
    "selector.title": "Katalog Mata Kuliah",
    "selector.sub_title": "Pilih mata kuliah yang ingin Anda ambil.",
    "selector.add_course": "Tambah Matkul",
    "selector.generating": "Merencanakan...",
    "selector.generate": "Hasilkan Jadwal",
    "selector.thinking": "Berpikir...",
    "selector.smart_generate": "Smart Generate (1 Token)",
    "selector.back": "Kembali",
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
  },
  EN: {
    "nav.architect": "Architect",
    "nav.archive": "Archive",
    "nav.admin": "Admin",
    "nav.tokens": "Service Tokens",
    "nav.tokens_used": "Used",
    "nav.tokens_reset":
      "Tokens reset daily. Use them to expand schedule limits.",
    "nav.signout": "Sign Out",
    "nav.language": "Language",
    "footer.tagline":
      "The most advanced course schedule optimization platform for Indonesian students.",
    "footer.about": "About",
    "footer.donate": "Donate",
    "footer.feedback": "Feedback",
    "footer.copyright": "Built by Indra",
    "maker.step_config": "Configure",
    "maker.step_select": "Select Courses",
    "maker.step_view": "View Schedule",
    "config.academic_year": "Academic Year 2025/2026",
    "config.title": "Architect Your",
    "config.title_span": "Semester.",
    "config.sub_title":
      "Establish your academic parameters to initialize the intelligent scheduler for the upcoming term.",
    "config.ai_engine_active": "AI Optimization Engine Active",
    "config.ai_scrolling":
      "Cross-referencing database... Achieve optimal academic balance... Preventing scheduling conflicts...",
    "config.card_title": "Academic Configuration",
    "config.univ_label": "Institution / University",
    "config.univ_placeholder": "Select University",
    "config.prodi_label": "Study Program (Prodi)",
    "config.prodi_placeholder": "Select Prodi",
    "config.semester_label": "Target Semester",
    "config.max_sks_label": "Max SKS Load",
    "config.btn_init": "Initialize Session",
    "config.footer": "POWERED BY THE CORE ARCHITECT ENGINE",
    "selector.title": "Course Catalog",
    "selector.sub_title": "Select the courses you want to take.",
    "selector.add_course": "Add Course",
    "selector.generating": "Planning...",
    "selector.generate": "Generate Docs",
    "selector.thinking": "Thinking...",
    "selector.smart_generate": "Smart Generate (1 Token)",
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
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("krsan_lang");
    return (saved as Language) || "ID";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("krsan_lang", newLang);
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
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
