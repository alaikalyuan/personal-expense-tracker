export type Locale = "id" | "en";

export const CATEGORY_KEYS = [
  "Food & Dining",
  "Transportation",
  "Utilities",
  "Academics",
  "Entertainment",
  "Others",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface Dictionary {
  common: {
    appName: string;
    loading: string;
    cancel: string;
    save: string;
    saving: string;
    delete: string;
    deleting: string;
    add: string;
    adding: string;
    close: string;
    today: string;
    none: string;
    vs: string;
    error: string;
  };
  nav: {
    tracker: string;
    archive: string;
    compare: string;
    signOut: string;
    addExpense: string;
    openMenu: string;
    language: string;
    indonesian: string;
    english: string;
    theme: string;
    light: string;
    dark: string;
    quickAddAria: string;
  };
  categories: Record<CategoryKey, string>;
  dashboard: {
    title: string;
    spentThisWeek: string;
    dailyAvg: string;
    dayOfSeven: string;
    topCategory: string;
    largest: string;
    recentEntries: string;
    noExpenses: string;
  };
  breakdown: {
    title: string;
    hide: string;
    show: string;
    pastSevenDays: string;
    totalAmount: string;
    summarySubtitle: string;
    tabDaily: string;
    tabCategories: string;
    peakDay: string;
    noCategories: string;
    hideBreakdownAria: string;
    showBreakdownAria: string;
  };
  budget: {
    percentUsedOf: string;
    editLimit: string;
    overBudgetBy: string;
    left: string;
    dailyAllowance: string;
    modalTitle: string;
    modalSubtitle: string;
    quickPresets: string;
    saveBudget: string;
    preset250k: string;
    preset500k: string;
    preset1m: string;
    preset2m: string;
  };
  expenses: {
    deleteConfirm: string;
    editTitle: string;
    editSubtitle: string;
    namePlaceholder: string;
    notePlaceholder: string;
    amountPlaceholder: string;
    saveChanges: string;
    addTitle: string;
    failedToAdd: string;
    amountPositiveError: string;
    nameRequiredError: string;
  };
  archive: {
    title: string;
    subtitle: string;
    historicalSummary: string;
    totalSpent: string;
    weeklyAvg: string;
    history: string;
    weekCount: string;
    weeksCount: string;
    entryCount: string;
    entriesCount: string;
    searchPlaceholder: string;
    weeksMatching: string;
    weekMatching: string;
    expandAll: string;
    collapseAll: string;
    noArchivedWeeks: string;
    noArchivedDescription: string;
    backToTracker: string;
  };
  compare: {
    title: string;
    subtitle: string;
    wowCardTitle: string;
    thisWeek: string;
    lastWeek: string;
    fullSevenDays: string;
    evenWithLastWeek: string;
    lessThanLastWeek: string;
    moreThanLastWeek: string;
    burnRateTitle: string;
    currentDailyAvg: string;
    basedOnElapsedDays: string;
    lastWeekDailyAvg: string;
    acrossAllDays: string;
    pacingSaving: string;
    pacingOver: string;
    trendTitle: string;
    categoryChangesTitle: string;
    noExpensesBothWeeks: string;
    noChange: string;
  };
  login: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    logIn: string;
    signUp: string;
  };
  install: {
    title: string;
    subtitle: string;
    install: string;
    dismiss: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  id: {
    common: {
      appName: "Catatan Pengeluaran",
      loading: "Memuat...",
      cancel: "Batal",
      save: "Simpan",
      saving: "Menyimpan...",
      delete: "Hapus",
      deleting: "Menghapus...",
      add: "Tambah",
      adding: "Menambahkan...",
      close: "Tutup",
      today: "Hari Ini",
      none: "Tidak ada",
      vs: "dibanding",
      error: "Terjadi kesalahan",
    },
    nav: {
      tracker: "Pelacak",
      archive: "Arsip & Riwayat Minggu",
      compare: "Bandingkan Minggu",
      signOut: "Keluar",
      addExpense: "Tambah pengeluaran",
      openMenu: "Buka menu",
      language: "Bahasa",
      indonesian: "Bahasa Indonesia",
      english: "English",
      theme: "Tema",
      light: "Terang",
      dark: "Gelap",
      quickAddAria: "Tambah pengeluaran",
    },
    categories: {
      "Food & Dining": "Makanan & Minuman",
      Transportation: "Transportasi",
      Utilities: "Tagihan & Kebutuhan",
      Academics: "Kuliah & Pendidikan",
      Entertainment: "Hiburan",
      Others: "Lainnya",
    },
    dashboard: {
      title: "Pengeluaran Mingguan",
      spentThisWeek: "Pengeluaran Minggu Ini",
      dailyAvg: "Rata-rata Harian",
      dayOfSeven: "dari 7 hari",
      topCategory: "Kategori Teratas",
      largest: "Terbesar",
      recentEntries: "Entri Terbaru",
      noExpenses: "Belum ada pengeluaran yang dicatat minggu ini.",
    },
    breakdown: {
      title: "Rincian",
      hide: "Sembunyikan",
      show: "Tampilkan",
      pastSevenDays: "7 hari terakhir",
      totalAmount: "Total",
      summarySubtitle: "Aktivitas 7 hari & pembagian kategori",
      tabDaily: "Harian",
      tabCategories: "Kategori",
      peakDay: "Puncak",
      noCategories: "Belum ada data kategori yang dicatat minggu ini.",
      hideBreakdownAria: "Sembunyikan rincian",
      showBreakdownAria: "Tampilkan rincian",
    },
    budget: {
      percentUsedOf: "terpakai dari",
      editLimit: "Ubah batas",
      overBudgetBy: "Melebihi anggaran sebesar",
      left: "sisa",
      dailyAllowance: "hari",
      modalTitle: "Batas Anggaran Mingguan",
      modalSubtitle: "Tentukan target batas pengeluaran mingguanmu",
      quickPresets: "Pilihan Cepat",
      saveBudget: "Simpan Anggaran",
      preset250k: "250rb",
      preset500k: "500rb",
      preset1m: "1jt",
      preset2m: "2jt",
    },
    expenses: {
      deleteConfirm: "Apakah kamu yakin ingin menghapus pengeluaran ini?",
      editTitle: "Ubah pengeluaran",
      editSubtitle: "Perbarui detail atau hapus entri ini",
      namePlaceholder: "Nama pengeluaran",
      notePlaceholder: "Catatan tambahan (opsional)",
      amountPlaceholder: "Nominal",
      saveChanges: "Simpan perubahan",
      addTitle: "Tambah pengeluaran",
      failedToAdd: "Gagal menambahkan pengeluaran",
      amountPositiveError: "Nominal harus lebih dari 0",
      nameRequiredError: "Nama pengeluaran wajib diisi",
    },
    archive: {
      title: "Arsip",
      subtitle: "Riwayat pengeluaran minggu-minggu sebelumnya",
      historicalSummary: "Ringkasan Riwayat",
      totalSpent: "Total Pengeluaran",
      weeklyAvg: "Rata-rata Mingguan",
      history: "Riwayat",
      weekCount: "minggu",
      weeksCount: "minggu",
      entryCount: "entri",
      entriesCount: "entri",
      searchPlaceholder: "Cari riwayat pengeluaran...",
      weeksMatching: "minggu cocok dengan",
      weekMatching: "minggu cocok dengan",
      expandAll: "Buka semua",
      collapseAll: "Tutup semua",
      noArchivedWeeks: "Belum ada arsip minggu sebelumnya",
      noArchivedDescription:
        "Pengeluaran di minggu lalu akan otomatis muncul di sini setelah minggu berjalan selesai.",
      backToTracker: "Kembali ke pelacak",
    },
    compare: {
      title: "Bandingkan Minggu",
      subtitle: "Perbandingan pengeluaran minggu ini dengan minggu lalu",
      wowCardTitle: "Pengeluaran Minggu ke Minggu",
      thisWeek: "Minggu Ini",
      lastWeek: "Minggu Lalu",
      fullSevenDays: "7 hari penuh",
      evenWithLastWeek: "Sama dengan minggu lalu",
      lessThanLastWeek: "lebih hemat dari minggu lalu",
      moreThanLastWeek: "lebih boros dari minggu lalu",
      burnRateTitle: "Laju Pengeluaran Harian",
      currentDailyAvg: "Rata-rata Harian Saat Ini",
      basedOnElapsedDays: "Berdasarkan {days} hari berjalan",
      lastWeekDailyAvg: "Rata-rata Harian Minggu Lalu",
      acrossAllDays: "Rata-rata selama 7 hari",
      pacingSaving: "Kamu lebih hemat ~Rp {amount} per hari sejauh ini!",
      pacingOver: "Pacing ~Rp {amount} lebih boros per hari dibanding minggu lalu.",
      trendTitle: "Perbandingan Tren Harian",
      categoryChangesTitle: "Perubahan Kategori",
      noExpensesBothWeeks: "Belum ada pengeluaran tercatat untuk kedua minggu ini.",
      noChange: "Tidak ada perubahan",
    },
    login: {
      title: "Catatan Pengeluaran",
      subtitle: "Masuk atau buat akun baru",
      emailPlaceholder: "nama@kampus.ac.id",
      passwordPlaceholder: "••••••••",
      logIn: "Masuk",
      signUp: "Daftar",
    },
    install: {
      title: "Pasang Aplikasi Pengeluaran",
      subtitle: "Tambahkan ke layar utama untuk mode layar penuh",
      install: "Pasang",
      dismiss: "Tutup info pemasangan",
    },
  },
  en: {
    common: {
      appName: "Personal Expense Tracker",
      loading: "Loading...",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
      delete: "Delete",
      deleting: "Deleting...",
      add: "Add",
      adding: "Adding...",
      close: "Close",
      today: "Today",
      none: "None",
      vs: "vs",
      error: "An error occurred",
    },
    nav: {
      tracker: "Tracker",
      archive: "Archive & Past Weeks",
      compare: "Compare Weeks",
      signOut: "Sign out",
      addExpense: "Add expense",
      openMenu: "Open menu",
      language: "Language",
      indonesian: "Bahasa Indonesia",
      english: "English",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      quickAddAria: "Add expense",
    },
    categories: {
      "Food & Dining": "Food & Dining",
      Transportation: "Transportation",
      Utilities: "Utilities",
      Academics: "Academics",
      Entertainment: "Entertainment",
      Others: "Others",
    },
    dashboard: {
      title: "Weekly Expenses",
      spentThisWeek: "Spent this week",
      dailyAvg: "Daily Avg",
      dayOfSeven: "of 7 days",
      topCategory: "Top Category",
      largest: "Largest",
      recentEntries: "Recent entries",
      noExpenses: "No expenses recorded this week yet.",
    },
    breakdown: {
      title: "Breakdown",
      hide: "Hide",
      show: "Show",
      pastSevenDays: "Past 7 days",
      totalAmount: "total",
      summarySubtitle: "7-day activity & category split",
      tabDaily: "Daily",
      tabCategories: "Categories",
      peakDay: "Peak",
      noCategories: "No category data recorded for this week yet.",
      hideBreakdownAria: "Hide breakdown",
      showBreakdownAria: "Show breakdown",
    },
    budget: {
      percentUsedOf: "used of",
      editLimit: "Edit limit",
      overBudgetBy: "Over budget by",
      left: "left",
      dailyAllowance: "left",
      modalTitle: "Weekly Budget Limit",
      modalSubtitle: "Set your maximum weekly spending goal",
      quickPresets: "Quick Presets",
      saveBudget: "Save Budget",
      preset250k: "250k",
      preset500k: "500k",
      preset1m: "1jt",
      preset2m: "2jt",
    },
    expenses: {
      deleteConfirm: "Are you sure you want to delete this expense?",
      editTitle: "Edit expense",
      editSubtitle: "Update details or delete this entry",
      namePlaceholder: "Expense name",
      notePlaceholder: "Optional note",
      amountPlaceholder: "Amount",
      saveChanges: "Save changes",
      addTitle: "Add expense",
      failedToAdd: "Failed to add expense",
      amountPositiveError: "Amount must be greater than 0",
      nameRequiredError: "Expense name is required",
    },
    archive: {
      title: "Archive",
      subtitle: "Past weeks spending history",
      historicalSummary: "Historical Summary",
      totalSpent: "Total Spent",
      weeklyAvg: "Weekly Avg",
      history: "History",
      weekCount: "week",
      weeksCount: "weeks",
      entryCount: "entry",
      entriesCount: "entries",
      searchPlaceholder: "Search past expenses...",
      weeksMatching: "weeks matching",
      weekMatching: "week matching",
      expandAll: "Expand all",
      collapseAll: "Collapse all",
      noArchivedWeeks: "No archived weeks yet",
      noArchivedDescription:
        "Expenses recorded in past weeks will automatically appear here once the current week concludes.",
      backToTracker: "Back to tracker",
    },
    compare: {
      title: "Compare Weeks",
      subtitle: "Comparison of this week's expenses against last week",
      wowCardTitle: "Week-over-Week Spend",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      fullSevenDays: "Full 7 days",
      evenWithLastWeek: "Even with last week",
      lessThanLastWeek: "less than last week",
      moreThanLastWeek: "more than last week",
      burnRateTitle: "Daily Burn Rate Pace",
      currentDailyAvg: "Current Daily Avg",
      basedOnElapsedDays: "Based on {days} elapsed days",
      lastWeekDailyAvg: "Last Week Daily Avg",
      acrossAllDays: "Across all 7 days",
      pacingSaving: "You are spending ~Rp {amount} less per day so far!",
      pacingOver: "Pacing ~Rp {amount} more per day than last week.",
      trendTitle: "Daily Trend Comparison",
      categoryChangesTitle: "Category Changes",
      noExpensesBothWeeks: "No expenses recorded for either week yet.",
      noChange: "No change",
    },
    login: {
      title: "Campus Expenses",
      subtitle: "Log in or create an account",
      emailPlaceholder: "student@university.edu",
      passwordPlaceholder: "••••••••",
      logIn: "Log In",
      signUp: "Sign Up",
    },
    install: {
      title: "Install Expense Tracker",
      subtitle: "Add to home screen for full-screen mode",
      install: "Install",
      dismiss: "Dismiss install banner",
    },
  },
};

