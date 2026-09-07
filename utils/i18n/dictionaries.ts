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
    yesterday: string;
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
    tabToday: string;
    tabThisWeek: string;
    noExpensesToday: string;
    viewWeekExpenses: string;
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
    failedToUpdate: string;
    failedToDelete: string;
    amountPositiveError: string;
    nameRequiredError: string;
    standardTab: string;
    quickTypeTab: string;
    clearAmount: string;
    categoryLabel: string;
    whenLabel: string;
    customDate: string;
    addNote: string;
    hideNote: string;
    quickShortcuts: string;
    manageChips: string;
    manageChipsTitle: string;
    manageChipsSubtitle: string;
    addChip: string;
    editChip: string;
    deleteChip: string;
    chipNamePlaceholder: string;
    chipEmojiPlaceholder: string;
    defaultAmountOptional: string;
    resetDefaults: string;
    noCustomChips: string;
    saveChip: string;
    quickBarPlaceholder: string;
    quickBarHint: string;
    detectedPreview: string;
    keepOpenBatch: string;
    expenseLoggedBatch: string;
    quickTypeParseError: string;
    searchPlaceholder: string;
    allCategories: string;
    showingFiltered: string;
    noMatchingExpenses: string;
    clearSearch: string;
    shareExport: string;
  };
  exportShare: {
    modalTitle: string;
    modalSubtitle: string;
    tabWhatsApp: string;
    tabCsv: string;
    recapTitle: string;
    recapWeek: string;
    recapTotal: string;
    recapBudget: string;
    recapRemaining: string;
    recapOverBudget: string;
    recapDailyAvg: string;
    recapTopCategories: string;
    recapLargestSpend: string;
    recapFooter: string;
    copyRecap: string;
    recapCopied: string;
    openWhatsApp: string;
    csvTitle: string;
    csvSubtitle: string;
    downloadCsv: string;
    csvScopeWeek: string;
    csvScopeAll: string;
    csvColDate: string;
    csvColName: string;
    csvColCategory: string;
    csvColAmount: string;
    csvColNote: string;
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
    or: string;
    googleSignIn: string;
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
      yesterday: "Kemarin",
      none: "Tidak ada",
      vs: "dibanding",
      error: "Terjadi kesalahan",
    },
    nav: {
      tracker: "Pelacak",
      archive: "Arsip & Riwayat Minggu",
      compare: "Bandingkan",
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
      tabToday: "Hari Ini",
      tabThisWeek: "Minggu Ini",
      noExpensesToday: "Belum ada pengeluaran yang dicatat hari ini.",
      viewWeekExpenses: "Lihat pengeluaran minggu ini",
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
      editLimit: "Ubah budget",
      overBudgetBy: "Melebihi anggaran sebesar",
      left: "sisa",
      dailyAllowance: "hari",
      modalTitle: "Budget Mingguan",
      modalSubtitle: "Tentukan target budget pengeluaran mingguanmu",
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
      failedToUpdate: "Gagal memperbarui pengeluaran",
      failedToDelete: "Gagal menghapus pengeluaran",
      amountPositiveError: "Nominal harus lebih dari 0",
      nameRequiredError: "Nama pengeluaran wajib diisi",
      standardTab: "Standar",
      quickTypeTab: "Ketik Cepat",
      clearAmount: "Hapus",
      categoryLabel: "Kategori",
      whenLabel: "Kapan",
      customDate: "Pilih Tanggal",
      addNote: "+ Catatan",
      hideNote: "- Catatan",
      quickShortcuts: "Pintasan Cepat",
      manageChips: "Kelola",
      manageChipsTitle: "Kelola Pintasan Cepat",
      manageChipsSubtitle: "Kustomisasi tombol pintasan untuk entri cepat pengeluaran",
      addChip: "Tambah Pintasan",
      editChip: "Ubah Pintasan",
      deleteChip: "Hapus",
      chipNamePlaceholder: "Contoh: Makan Siang, Bensin",
      chipEmojiPlaceholder: "Emoji (opsional, cth: 🍔)",
      defaultAmountOptional: "Nominal bawaan (opsional, cth: 20000)",
      resetDefaults: "Kembalikan Bawaan",
      noCustomChips: "Belum ada pintasan khusus.",
      saveChip: "Simpan Pintasan",
      quickBarPlaceholder: "Ketik: cth. Makan siang 25k, Bensin 20rb kemarin...",
      quickBarHint: "Tekan Enter untuk langsung simpan",
      detectedPreview: "Terdeteksi",
      keepOpenBatch: "Tetap buka untuk input berturut-turut",
      expenseLoggedBatch: "Tersimpan! Siap untuk entri berikutnya...",
      quickTypeParseError: "Masukkan nama dan nominal (cth: Kopi 18k)",
      searchPlaceholder: "Cari nama atau catatan pengeluaran...",
      allCategories: "Semua",
      showingFiltered: "Menampilkan {count} dari {total} entri",
      noMatchingExpenses: "Tidak ada pengeluaran yang cocok.",
      clearSearch: "Reset filter",
      shareExport: "Bagikan / Ekspor",
    },
    exportShare: {
      modalTitle: "Bagikan & Ekspor",
      modalSubtitle: "Salin ringkasan ke WhatsApp atau unduh file CSV spreadsheet",
      tabWhatsApp: "Rekap WhatsApp",
      tabCsv: "Unduh CSV",
      recapTitle: "Laporan Pengeluaran SakuTrack",
      recapWeek: "Minggu",
      recapTotal: "Total Pengeluaran",
      recapBudget: "Target Anggaran",
      recapRemaining: "Sisa Saldo",
      recapOverBudget: "Kelebihan Anggaran",
      recapDailyAvg: "Rata-rata Harian",
      recapTopCategories: "Rincian Kategori Terbesar",
      recapLargestSpend: "Pengeluaran Terbesar",
      recapFooter: "Dicatat praktis dengan SakuTrack",
      copyRecap: "Salin Rekap",
      recapCopied: "Rekap Berhasil Disalin!",
      openWhatsApp: "Kirim ke WhatsApp",
      csvTitle: "Ekspor Spreadsheet CSV",
      csvSubtitle: "Unduh data pengeluaran dalam format .csv yang rapi untuk Microsoft Excel atau Google Sheets.",
      downloadCsv: "Unduh CSV",
      csvScopeWeek: "Minggu Ini Saja",
      csvScopeAll: "Semua Riwayat Tercatat",
      csvColDate: "Tanggal",
      csvColName: "Nama Pengeluaran",
      csvColCategory: "Kategori",
      csvColAmount: "Nominal (Rp)",
      csvColNote: "Catatan",
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
      or: "atau",
      googleSignIn: "Lanjutkan dengan Google",
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
      yesterday: "Yesterday",
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
      tabToday: "Today",
      tabThisWeek: "This Week",
      noExpensesToday: "No expenses recorded today yet.",
      viewWeekExpenses: "View this week's expenses",
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
      failedToUpdate: "Failed to update expense",
      failedToDelete: "Failed to delete expense",
      amountPositiveError: "Amount must be greater than 0",
      nameRequiredError: "Expense name is required",
      standardTab: "Standard",
      quickTypeTab: "Quick Type",
      clearAmount: "Clear",
      categoryLabel: "Category",
      whenLabel: "When",
      customDate: "Pick Date",
      addNote: "+ Note",
      hideNote: "- Note",
      quickShortcuts: "Quick Shortcuts",
      manageChips: "Manage",
      manageChipsTitle: "Manage Shortcuts",
      manageChipsSubtitle: "Customize 1-tap shortcut chips for fast logging",
      addChip: "Add Shortcut",
      editChip: "Edit Shortcut",
      deleteChip: "Delete",
      chipNamePlaceholder: "e.g. Lunch, Coffee, Gas",
      chipEmojiPlaceholder: "Emoji (optional, e.g. 🍔)",
      defaultAmountOptional: "Default amount (optional, e.g. 20000)",
      resetDefaults: "Reset Defaults",
      noCustomChips: "No custom shortcuts yet.",
      saveChip: "Save Shortcut",
      quickBarPlaceholder: "Type: e.g. Lunch 25k, Gas 20000 yesterday...",
      quickBarHint: "Press Enter to add instantly",
      detectedPreview: "Detected",
      keepOpenBatch: "Keep open for rapid consecutive logging",
      expenseLoggedBatch: "Saved! Ready for next log...",
      quickTypeParseError: "Please enter a name and amount (e.g. Coffee 18k)",
      searchPlaceholder: "Search expense name or notes...",
      allCategories: "All",
      showingFiltered: "Showing {count} of {total} entries",
      noMatchingExpenses: "No expenses found matching your search.",
      clearSearch: "Clear filters",
      shareExport: "Share / Export",
    },
    exportShare: {
      modalTitle: "Share & Export",
      modalSubtitle: "Copy weekly recap for WhatsApp or download CSV file for spreadsheets",
      tabWhatsApp: "WhatsApp Recap",
      tabCsv: "Download CSV",
      recapTitle: "SakuTrack Expense Report",
      recapWeek: "Week",
      recapTotal: "Total Spent",
      recapBudget: "Budget Target",
      recapRemaining: "Remaining Balance",
      recapOverBudget: "Over Budget by",
      recapDailyAvg: "Daily Average",
      recapTopCategories: "Top Spending Categories",
      recapLargestSpend: "Largest Spend",
      recapFooter: "Tracked effortlessly with SakuTrack",
      copyRecap: "Copy Recap",
      recapCopied: "Recap Copied to Clipboard!",
      openWhatsApp: "Send via WhatsApp",
      csvTitle: "CSV Spreadsheet Export",
      csvSubtitle: "Download your expense data in standard .csv format compatible with Excel or Google Sheets.",
      downloadCsv: "Download CSV",
      csvScopeWeek: "Current Week Only",
      csvScopeAll: "All Recorded History",
      csvColDate: "Date",
      csvColName: "Expense Name",
      csvColCategory: "Category",
      csvColAmount: "Amount (IDR)",
      csvColNote: "Note",
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
      or: "or",
      googleSignIn: "Continue with Google",
    },
    install: {
      title: "Install Expense Tracker",
      subtitle: "Add to home screen for full-screen mode",
      install: "Install",
      dismiss: "Dismiss install banner",
    },
  },
};

