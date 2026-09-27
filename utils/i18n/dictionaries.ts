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
    savings: string;
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
    cadenceWeek: string;
    cadenceMonth: string;
    spentThisMonth: string;
    monthToDate: string;
    dayOfMonth: string;
    noExpensesMonth: string;
    tabThisMonth: string;
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
    tabWeekly: string;
    monthActivitySubtitle: string;
    peakDay: string;
    noCategories: string;
    hideBreakdownAria: string;
    showBreakdownAria: string;
  };
  budget: {
    percentUsedOf: string;
    editLimit: string;
    overBudgetBy: string;
    aboveTargetBy: string;
    honestTrackingBadge: string;
    overBudgetEncouragement: string;
    focusPacingNote: string;
    left: string;
    dailyAllowance: string;
    modalTitle: string;
    modalSubtitle: string;
    monthlyModalTitle: string;
    monthlyModalSubtitle: string;
    quickPresets: string;
    saveBudget: string;
    preset250k: string;
    preset500k: string;
    preset1m: string;
    preset1m5: string;
    preset2m: string;
    preset2m5: string;
    preset5m: string;
    preset10m: string;
    exemptSummary: string;
    exemptSuggestTitle: string;
    exemptSuggestAction: string;
  };
  burnRate: {
    cardTitle: string;
    projectedEndMonth: string;
    dailyVelocity: string;
    targetDailyPace: string;
    paceSafe: string;
    paceTight: string;
    paceExceeded: string;
    monthProgress: string;
    budgetConsumed: string;
    momPaceTitle: string;
    momHigher: string;
    momLower: string;
    momEven: string;
    momVsSameTime: string;
    projectedSafeNote: string;
    projectedExceedNote: string;
  };
  streak: {
    title: string;
    dayStreak: string;
    daysStreak: string;
    loggedToday: string;
    logTodayNudge: string;
    weekConsistency: string;
    noSpendButton: string;
    noSpendToast: string;
    noSpendDescription: string;
    encouragementActive: string;
    encouragementOverBudget: string;
    encouragementStart: string;
    zeroSpendCelebration: string;
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
    oneOffBadge: string;
    oneOffCheckbox: string;
    oneOffHelp: string;
    oneOffDetectBanner: string;
    oneOffMarkButton: string;
    oneOffTaggedIndicator: string;
    oneOffRemoveButton: string;
    moreOptions: string;
    lessOptions: string;
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
    viewBreakdown: string;
    viewChart: string;
    daysLower: string;
    daysHigher: string;
    allDaysEven: string;
    highestSpend: string;
    biggestSaving: string;
    upcoming: string;
    noSpendDay: string;
    selectedDayDetails: string;
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
    continueAsGuest: string;
  };
  guest: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    features: {
      instantTitle: string;
      instantDesc: string;
      budgetTitle: string;
      budgetDesc: string;
      insightsTitle: string;
      insightsDesc: string;
    };
    riskCardTitle: string;
    riskCardDesc: string;
    riskPoints: [string, string, string];
    continueBtn: string;
    signInOrRegisterBtn: string;
    alreadyHaveAccount: string;
    logInHere: string;
    bannerText: string;
    bannerAction: string;
    guestBadge: string;
    guestButton: string;
    upgradeModalTitle: string;
    upgradeModalSubtitle: string;
    upgradeEmailLabel: string;
    upgradePasswordLabel: string;
    upgradeSubmitBtn: string;
    upgradeSubmittingBtn: string;
    upgradeOrGoogle: string;
    upgradeGoogleBtn: string;
    upgradeSuccessMessage: string;
    upgradeDismissBtn: string;
    createAccountOrSignIn: string;
    mergedToast: string;
    tabSignUp: string;
    tabLogIn: string;
    loginTitle: string;
    loginSubtitle: string;
    loginSubmitBtn: string;
    loginSubmittingBtn: string;
    switchToLogIn: string;
    switchToSignUp: string;
    loginSuccessMessage: string;
  };
  install: {
    title: string;
    subtitle: string;
    install: string;
    dismiss: string;
  };
  savings: {
    title: string;
    subtitle: string;
    // Core Vault
    coreSavingsTitle: string;
    coreSavingsSubtitle: string;
    totalCoreSavings: string;
    availableForGoals: string;
    allocatedToGoals: string;
    manageCoreSavings: string;
    // Budget Surplus
    budgetSurplusTitle: string;
    budgetSurplusSubtitle: string;
    availableSurplus: string;
    totalSurplusEarned: string;
    sweptSurplusTotal: string;
    sweepSurplusButton: string;
    sweepModalTitle: string;
    sweepModalSubtitle: string;
    sweepDestinationLabel: string;
    sweepToCoreSavings: string;
    sweepToGoal: string;
    sweepSelectGoalPlaceholder: string;
    confirmSweep: string;
    sweepSuccess: string;
    noSurplusAvailable: string;
    // Ongoing Week
    ongoingWeekLabel: string;
    ongoingWeekNotice: string;
    // Goals
    goalsTitle: string;
    goalsSubtitle: string;
    noGoalTitle: string;
    noGoalDescription: string;
    createGoalButton: string;
    addGoalButton: string;
    editGoalTitle: string;
    createGoalTitle: string;
    goalNameLabel: string;
    goalTargetLabel: string;
    goalEmojiLabel: string;
    goalNamePlaceholder: string;
    targetAmountPlaceholder: string;
    allocateButton: string;
    withdrawButton: string;
    allocateModalTitle: string;
    allocateModalSubtitle: string;
    withdrawModalTitle: string;
    withdrawModalSubtitle: string;
    allocationAmountLabel: string;
    maxAvailable: string;
    maxAllocated: string;
    quickAll: string;
    quickHalf: string;
    confirmAllocate: string;
    confirmWithdraw: string;
    goalReached: string;
    goalProgress: string;
    deleteGoalConfirm: string;
    // History
    historyTitle: string;
    historySubtitle: string;
    surplusWeekContribution: string;
    noSurplusWeeks: string;
    noSurplusWeeksDesc: string;
    weekPacingLabel: string;
    // Mindful & Manual
    supportiveTitle: string;
    nextQuote: string;
    quotes: string[];
    zeroSavingsEncouragement: string;
    allGoodPacingEncouragement: string;
    manualAdjustmentButton: string;
    manualAdjustmentTitle: string;
    manualAdjustmentSubtitle: string;
    adjustmentAmountLabel: string;
    adjustmentTypeDeposit: string;
    adjustmentTypeWithdraw: string;
    adjustmentNoteLabel: string;
    adjustmentSuccess: string;
    // Balance History
    balanceHistoryTitle: string;
    balanceHistorySubtitle: string;
    balanceHistoryBadge: string;
    filterAll: string;
    filterInflow: string;
    filterOutflow: string;
    filterGoals: string;
    searchHistoryPlaceholder: string;
    runningBalance: string;
    totalInflow: string;
    totalOutflow: string;
    currentBalance: string;
    netSavings: string;
    noHistoryTitle: string;
    noHistoryDesc: string;
    noMatchingHistory: string;
    addFirstEntry: string;
    deleteHistoryConfirm: string;
    deleteHistoryButton: string;
    viewHistoryButton: string;
    typeDeposit: string;
    typeWithdraw: string;
    typeSurplus: string;
    typeSurplusGoal: string;
    typeGoalAllocate: string;
    typeGoalWithdraw: string;
    balanceTrendTitle: string;
    balanceTrendSubtitle: string;
    initialBalanceLabel: string;
    goalMovement: string;
    closeHistory: string;
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
      savings: "Tabungan",
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
      cadenceWeek: "Mingguan",
      cadenceMonth: "Bulanan",
      spentThisMonth: "Pengeluaran Bulan Ini",
      monthToDate: "Bulan Berjalan (MTD)",
      dayOfMonth: "hari",
      noExpensesMonth: "Belum ada pengeluaran yang dicatat bulan ini.",
      tabThisMonth: "Bulan Ini",
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
      tabWeekly: "Mingguan",
      monthActivitySubtitle: "Aktivitas mingguan & pembagian kategori",
      peakDay: "Puncak",
      noCategories: "Belum ada data kategori yang dicatat minggu ini.",
      hideBreakdownAria: "Sembunyikan rincian",
      showBreakdownAria: "Tampilkan rincian",
    },
    budget: {
      percentUsedOf: "terpakai dari",
      editLimit: "Ubah budget",
      overBudgetBy: "Melebihi anggaran sebesar",
      aboveTargetBy: "di atas target",
      honestTrackingBadge: "Dicatat Jujur ✨",
      overBudgetEncouragement: "Target terlampaui? Wajar terjadi! Yang terpenting kamu tetap mencatatnya dengan jujur. Mengetahui angka sebenarnya adalah kemenangan sejati.",
      focusPacingNote: "Target minggu ini terlampaui • Fokus catat sisa minggu tanpa beban",
      left: "sisa",
      dailyAllowance: "hari",
      modalTitle: "Budget Mingguan",
      modalSubtitle: "Tentukan target budget pengeluaran mingguanmu",
      monthlyModalTitle: "Budget Bulanan",
      monthlyModalSubtitle: "Tentukan target budget pengeluaran bulananmu",
      quickPresets: "Pilihan Cepat",
      saveBudget: "Simpan Anggaran",
      preset250k: "250rb",
      preset500k: "500rb",
      preset1m: "1jt",
      preset1m5: "1.5jt",
      preset2m: "2jt",
      preset2m5: "2.5jt",
      preset5m: "5jt",
      preset10m: "10jt",
      exemptSummary: "Rp {amount} ({count} sekali pakai) dikecualikan",
      exemptSuggestTitle: "{name} (Rp {amount}) membuatmu overbudget. Mau tandai sebagai One-Off?",
      exemptSuggestAction: "Kecualikan",
    },
    burnRate: {
      cardTitle: "Proyeksi Pengeluaran Bulanan",
      projectedEndMonth: "Estimasi Akhir Bulan",
      dailyVelocity: "Kecepatan Harian",
      targetDailyPace: "Batas Aman Harian",
      paceSafe: "Aman & Terkendali",
      paceTight: "Mendekati Batas",
      paceExceeded: "Beresiko Overbudget",
      monthProgress: "Waktu Berjalan",
      budgetConsumed: "Budget Terpakai",
      momPaceTitle: "Perbandingan Bulan Lalu (MTD)",
      momHigher: "lebih tinggi dari bulan lalu",
      momLower: "lebih hemat dari bulan lalu",
      momEven: "seimbang dengan bulan lalu",
      momVsSameTime: "vs periode sama bulan lalu",
      projectedSafeNote: "Di kecepatan belanja saat ini, kamu diproyeksikan hemat",
      projectedExceedNote: "Di kecepatan belanja saat ini, kamu berpotensi melebihi target sebesar",
    },
    streak: {
      title: "Logging Streak",
      dayStreak: "Hari Streak",
      daysStreak: "Hari Streak",
      loggedToday: "Hari ini sudah dicatat!",
      logTodayNudge: "Catat pengeluaran hari ini untuk jaga streak 🔥",
      weekConsistency: "Konsistensi Minggu Ini",
      noSpendButton: "Hari Tanpa Pengeluaran 🎉",
      noSpendToast: "Hari tanpa pengeluaran berhasil dicatat!",
      noSpendDescription: "Hemat maksimal! Rp 0 pengeluaran hari ini.",
      encouragementActive: "Konsistensi hebat! Api streakmu terus menyala.",
      encouragementOverBudget: "Pengeluaran naik turun itu wajar, kejujuran mencatat adalah kemenanganmu!",
      encouragementStart: "Mulai streak pertamamu dengan mencatat hari ini!",
      zeroSpendCelebration: "Hari Bebas Pengeluaran",
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
      quickBarPlaceholder: "Ketik: cth. Makan 25k Rabu, Bensin 20rb kemarin...",
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
      oneOffBadge: "Sekali Pakai",
      oneOffCheckbox: "Tandai sebagai Pengeluaran Sekali Pakai (One-Off)",
      oneOffHelp: "Kecualikan dari batas budget rutin mingguan",
      oneOffDetectBanner: "Pengeluaran ini terlihat cukup besar / anomali. Mau tandai sebagai One-Off agar tidak membebani budget rutin?",
      oneOffMarkButton: "✨ Tandai One-Off",
      oneOffTaggedIndicator: "Ditandai sebagai One-Off",
      oneOffRemoveButton: "Batal Tandai",
      moreOptions: "Opsi lainnya",
      lessOptions: "Sembunyikan opsi",
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
      viewBreakdown: "Rincian",
      viewChart: "Grafik",
      daysLower: "{count} dari {total} hari lebih hemat",
      daysHigher: "{count} dari {total} hari lebih tinggi",
      allDaysEven: "Pengeluaran harian seimbang",
      highestSpend: "Puncak: {day} ({amount})",
      biggestSaving: "Hemat terbaik: {day} ({amount})",
      upcoming: "Akan datang",
      noSpendDay: "Tanpa pengeluaran",
      selectedDayDetails: "Detail Hari Terpilih",
      categoryChangesTitle: "Perubahan Kategori",
      noExpensesBothWeeks: "Belum ada pengeluaran tercatat untuk kedua minggu ini.",
      noChange: "Tidak ada perubahan",
    },
    login: {
      title: "Catatan Pengeluaran",
      subtitle: "Masuk atau buat akun baru",
      emailPlaceholder: "nama@email.com",
      passwordPlaceholder: "••••••••",
      logIn: "Masuk",
      signUp: "Daftar",
      or: "atau",
      googleSignIn: "Lanjutkan dengan Google",
      continueAsGuest: "Lanjutkan sebagai Tamu (Tanpa Akun)",
    },
    guest: {
      welcomeTitle: "Selamat Datang di SakuTrack!",
      welcomeSubtitle: "Pelacak pengeluaran pribadi yang simpel, cepat, dan tanpa ribet.",
      features: {
        instantTitle: "Catat Secepat Kilat",
        instantDesc: "Input pengeluaran dalam hitungan detik dengan chip cepat dan format teks natural.",
        budgetTitle: "Anggaran Fleksibel",
        budgetDesc: "Pantau ritme mingguan atau bulanan lengkap dengan sisa kuota harian otomatis.",
        insightsTitle: "Wawasan Finansial Cerdas",
        insightsDesc: "Bangun konsistensi tracking streak, deteksi anomali belanja, dan kelola tabungan.",
      },
      riskCardTitle: "Mode Tamu & Akses Gratis",
      riskCardDesc: "Anda dapat menggunakan SakuTrack 100% gratis tanpa membuat akun. Namun, data Anda saat ini hanya tersimpan di peramban (browser) perangkat ini.",
      riskPoints: [
        "Jika Anda membersihkan riwayat (cache/history) browser, data pengeluaran akan terhapus.",
        "Mode Samaran (Incognito/Private) akan menghapus data begitu tab atau jendela ditutup.",
        "Data tidak akan tersinkronisasi ke perangkat lain (HP/Laptop) tanpa akun.",
      ],
      continueBtn: "Lanjutkan",
      signInOrRegisterBtn: "Masuk atau Daftar",
      alreadyHaveAccount: "Sudah punya akun sebelumnya?",
      logInHere: "Masuk di sini",
      bannerText: "Mode Tamu: Data hanya tersimpan di browser ini.",
      bannerAction: "Sinkronkan / Buat Akun",
      guestBadge: "Tamu",
      guestButton: "Mode Tamu",
      upgradeModalTitle: "Amankan Data Pengeluaran Anda",
      upgradeModalSubtitle: "Hubungkan ke akun permanen untuk sinkronisasi antar-perangkat dan mencegah data terhapus.",
      upgradeEmailLabel: "Email",
      upgradePasswordLabel: "Kata Sandi",
      upgradeSubmitBtn: "Simpan Akun",
      upgradeSubmittingBtn: "Menyimpan...",
      upgradeOrGoogle: "atau hubungkan dengan Google",
      upgradeGoogleBtn: "Hubungkan dengan Google",
      upgradeSuccessMessage: "Akun berhasil dihubungkan! Pengeluaran Anda kini aman tersimpan di cloud.",
      upgradeDismissBtn: "Tutup",
      createAccountOrSignIn: "Buat Akun / Masuk",
      mergedToast: "{count} pengeluaran dari mode tamu berhasil digabungkan ke akun Anda!",
      tabSignUp: "Buat Akun",
      tabLogIn: "Masuk",
      loginTitle: "Selamat Datang Kembali",
      loginSubtitle: "Masuk ke akun Anda untuk sinkronisasi cloud dan penggabungan data tamu.",
      loginSubmitBtn: "Masuk",
      loginSubmittingBtn: "Sedang masuk...",
      switchToLogIn: "Sudah punya akun? Masuk",
      switchToSignUp: "Belum punya akun? Buat akun",
      loginSuccessMessage: "Selamat datang kembali! Berhasil masuk ke akun Anda.",
    },
    install: {
      title: "Pasang Aplikasi Pengeluaran",
      subtitle: "Tambahkan ke layar utama untuk mode layar penuh",
      install: "Pasang",
      dismiss: "Tutup info pemasangan",
    },
    savings: {
      title: "Tabungan",
      subtitle: "Tabungan pokok & sisa anggaran untuk target finansial",
      // Core Vault
      coreSavingsTitle: "Tabungan Pokok",
      coreSavingsSubtitle: "Saldo riil di rekening bank & simpanan utama",
      totalCoreSavings: "Total Tabungan Pokok",
      availableForGoals: "Bebas Dialokasikan",
      allocatedToGoals: "Terkunci di Target",
      manageCoreSavings: "Kelola Saldo",
      // Budget Surplus
      budgetSurplusTitle: "Sisa Anggaran Mingguan",
      budgetSurplusSubtitle: "Hasil disiplin belanja mingguan yang berhasil dihemat",
      availableSurplus: "Sisa Belum Dialirkan",
      totalSurplusEarned: "Total Penghematan Anggaran",
      sweptSurplusTotal: "Sudah Dialirkan ke Target/Tabungan",
      sweepSurplusButton: "Alirkan Sisa Anggaran",
      sweepModalTitle: "Alirkan Sisa Anggaran",
      sweepModalSubtitle: "Pindahkan sisa belanja yang dihemat ke tabungan pokok atau langsung ke target pilihanmu",
      sweepDestinationLabel: "Tujuan Aliran Dana",
      sweepToCoreSavings: "Tambahkan ke Tabungan Pokok",
      sweepToGoal: "Alokasikan Langsung ke Target",
      sweepSelectGoalPlaceholder: "Pilih target impian...",
      confirmSweep: "Alirkan Sekarang",
      sweepSuccess: "Sisa anggaran berhasil dialirkan!",
      noSurplusAvailable: "Belum ada sisa anggaran yang dapat dialirkan saat ini.",
      // Ongoing Week
      ongoingWeekLabel: "Minggu Berjalan (Estimasi)",
      ongoingWeekNotice: "Sisa anggaran minggu ini akan difinalisasi saat minggu berakhir.",
      // Goals
      goalsTitle: "Target Tabungan",
      goalsSubtitle: "Rencanakan tujuan finansial atau simpan sebagai dana siaga",
      noGoalTitle: "Belum Ada Target Tabungan",
      noGoalDescription: "Kamu bisa menyimpan saldo tabungan secara bebas, atau buat target jika ingin menabung untuk tujuan tertentu.",
      createGoalButton: "Buat Target Tabungan",
      addGoalButton: "Tambah Target Baru",
      editGoalTitle: "Ubah Target Tabungan",
      createGoalTitle: "Target Tabungan Baru",
      goalNameLabel: "Nama Target",
      goalTargetLabel: "Jumlah Target (Rp)",
      goalEmojiLabel: "Ikon",
      goalNamePlaceholder: "cth. Dana Darurat, Liburan, Laptop",
      targetAmountPlaceholder: "cth. 1.000.000",
      allocateButton: "Alokasikan Dana",
      withdrawButton: "Tarik ke Saldo Bebas",
      allocateModalTitle: "Alokasikan ke Target",
      allocateModalSubtitle: "Pindahkan sebagian dari dana tersedia ke target ini",
      withdrawModalTitle: "Tarik dari Target",
      withdrawModalSubtitle: "Kembalikan saldo target ke dana tabungan tersedia",
      allocationAmountLabel: "Nominal (Rp)",
      maxAvailable: "Maks. Tersedia",
      maxAllocated: "Maks. Terkumpul",
      quickAll: "Semua",
      quickHalf: "50%",
      confirmAllocate: "Alokasikan",
      confirmWithdraw: "Tarik Dana",
      goalReached: "Target Tercapai! 🎉",
      goalProgress: "terkumpul",
      deleteGoalConfirm: "Hapus target ini? Dana yang telah dialokasikan akan otomatis kembali ke saldo tersedia.",
      // History
      historyTitle: "Riwayat Sisa Anggaran",
      historySubtitle: "Daftar minggu yang berhasil menyisihkan anggaran ke tabungan",
      surplusWeekContribution: "disisihkan ke tabungan",
      noSurplusWeeks: "Belum Ada Sisa Anggaran Terkumpul",
      noSurplusWeeksDesc: "Ketika pengeluaran dalam satu minggu di bawah batas mingguan, sisanya otomatis terkumpul di sini.",
      weekPacingLabel: "Terpakai",
      // Mindful Quotes & Manual adjustments
      supportiveTitle: "Pesan Pengingat",
      nextQuote: "Ganti Pesan",
      quotes: [
        "Mencatat pengeluaran secara jujur adalah kemenangan utama. Tabungan akan menyusul dengan konsistensi.",
        "Wajar bila ada minggu dengan pengeluaran ekstra. Penganggaran adalah latihan ketahanan, bukan ujian kesempurnaan.",
        "Menabung bukan tentang membatasi diri berlebihan, melainkan memberi ruang bernapas dan pilihan di masa depan.",
        "Langkah kecil awal dari hal besar. Setiap minggu baru adalah lembaran bersih untuk memulai kembali.",
        "Jangan cemas jika belum ada saldo tersimpan. Kesadaran finansialmu saat ini sedang membangun fondasi yang kokoh.",
        "Keuangan memiliki pasang surutnya sendiri. Tetap tenang, pantau dengan mindful, dan lanjutkan perjalananmu."
      ],
      zeroSavingsEncouragement: "Belum ada tabungan terkumpul saat ini. Tetap rileks dan lanjutkan pencatatan harianmu!",
      allGoodPacingEncouragement: "Terus pertahankan ritme pengeluaran yang nyaman dan terencana.",
      manualAdjustmentButton: "Kelola Saldo Pokok",
      manualAdjustmentTitle: "Kelola Saldo Tabungan Pokok",
      manualAdjustmentSubtitle: "Catat saldo awal rekening, tabungan riil, atau penyesuaian dana",
      adjustmentAmountLabel: "Nominal (Rp)",
      adjustmentTypeDeposit: "Setor ke Tabungan (+)",
      adjustmentTypeWithdraw: "Tarik dari Tabungan (-)",
      adjustmentNoteLabel: "Keterangan (opsional)",
      adjustmentSuccess: "Saldo tabungan berhasil disesuaikan.",
      // Balance History
      balanceHistoryTitle: "Riwayat Mutasi Saldo",
      balanceHistorySubtitle: "Catatan setoran, penarikan, aliran sisa anggaran, dan alokasi target",
      balanceHistoryBadge: "Mutasi Saldo",
      filterAll: "Semua",
      filterInflow: "Masuk (+)",
      filterOutflow: "Keluar (-)",
      filterGoals: "Target",
      searchHistoryPlaceholder: "Cari riwayat mutasi saldo...",
      runningBalance: "Saldo",
      totalInflow: "Total Masuk",
      totalOutflow: "Total Keluar",
      currentBalance: "Saldo Saat Ini",
      netSavings: "Saldo Tabungan",
      noHistoryTitle: "Belum Ada Catatan Mutasi",
      noHistoryDesc: "Setiap setoran, penarikan, aliran sisa anggaran, atau pergerakan target tabungan akan otomatis tercatat rapi di sini.",
      noMatchingHistory: "Tidak ada riwayat mutasi yang cocok dengan pencarian.",
      addFirstEntry: "Catat Setoran / Mutasi",
      deleteHistoryConfirm: "Apakah kamu yakin ingin menghapus catatan mutasi ini? Saldo tabungan akan disesuaikan kembali.",
      deleteHistoryButton: "Hapus",
      viewHistoryButton: "Riwayat Mutasi Saldo",
      typeDeposit: "Setoran",
      typeWithdraw: "Penarikan",
      typeSurplus: "Sisa Anggaran",
      typeSurplusGoal: "Aliran ke Target",
      typeGoalAllocate: "Alokasi Target",
      typeGoalWithdraw: "Tarik Target",
      balanceTrendTitle: "Perjalanan Saldo Tabungan",
      balanceTrendSubtitle: "Grafik pertumbuhan saldo tabungan dari waktu ke waktu",
      initialBalanceLabel: "Saldo Awal Tercatat",
      goalMovement: "Pergerakan Target",
      closeHistory: "Tutup Riwayat",
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
      compare: "Compare",
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
      savings: "Savings",
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
      cadenceWeek: "Weekly",
      cadenceMonth: "Monthly",
      spentThisMonth: "Spent this month",
      monthToDate: "Month-to-Date (MTD)",
      dayOfMonth: "days",
      noExpensesMonth: "No expenses recorded this month yet.",
      tabThisMonth: "This Month",
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
      tabWeekly: "Weekly",
      monthActivitySubtitle: "Weekly activity & category split",
      peakDay: "Peak",
      noCategories: "No category data recorded for this week yet.",
      hideBreakdownAria: "Hide breakdown",
      showBreakdownAria: "Show breakdown",
    },
    budget: {
      percentUsedOf: "used of",
      editLimit: "Edit limit",
      overBudgetBy: "Over budget by",
      aboveTargetBy: "above goal",
      honestTrackingBadge: "Tracked Honestly ✨",
      overBudgetEncouragement: "Over your target? Life happens! What matters most is that you stayed aware and tracked it. Knowing your true numbers is the real victory.",
      focusPacingNote: "Weekly target passed • Focus on tracking the rest of the week guilt-free",
      left: "left",
      dailyAllowance: "left",
      modalTitle: "Weekly Budget Limit",
      modalSubtitle: "Set your maximum weekly spending goal",
      monthlyModalTitle: "Monthly Budget Limit",
      monthlyModalSubtitle: "Set your maximum monthly spending goal",
      quickPresets: "Quick Presets",
      saveBudget: "Save Budget",
      preset250k: "250k",
      preset500k: "500k",
      preset1m: "1jt",
      preset1m5: "1.5jt",
      preset2m: "2jt",
      preset2m5: "2.5jt",
      preset5m: "5jt",
      preset10m: "10jt",
      exemptSummary: "Rp {amount} ({count} one-off) excluded from routine budget",
      exemptSuggestTitle: "{name} (Rp {amount}) caused you to go overbudget. Mark as One-Off?",
      exemptSuggestAction: "Exempt",
    },
    burnRate: {
      cardTitle: "Projected Monthly Burn",
      projectedEndMonth: "Month-End Estimate",
      dailyVelocity: "Daily Velocity",
      targetDailyPace: "Safe Target Pace",
      paceSafe: "Safe & On Track",
      paceTight: "Pacing Tight",
      paceExceeded: "Risk of Overspending",
      monthProgress: "Month Elapsed",
      budgetConsumed: "Budget Used",
      momPaceTitle: "Prior Month Comparison (MTD)",
      momHigher: "higher than last month",
      momLower: "lower than last month",
      momEven: "even with last month",
      momVsSameTime: "vs same period last month",
      projectedSafeNote: "At your current pace, you are projected to save",
      projectedExceedNote: "At your current pace, you are projected to exceed target by",
    },
    streak: {
      title: "Logging Streak",
      dayStreak: "Day Streak",
      daysStreak: "Days Streak",
      loggedToday: "Logged today!",
      logTodayNudge: "Log an expense today to keep your streak 🔥",
      weekConsistency: "This Week's Consistency",
      noSpendButton: "No-Spend Day 🎉",
      noSpendToast: "No-spend day recorded!",
      noSpendDescription: "Total save! Rp 0 spent today.",
      encouragementActive: "Awesome consistency! Your streak is burning bright.",
      encouragementOverBudget: "Spikes happen! Staying honest with your tracking is the ultimate win.",
      encouragementStart: "Start your streak by logging today!",
      zeroSpendCelebration: "Zero-Spend Day",
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
      quickBarPlaceholder: "Type: e.g. Lunch 25k Wednesday, Gas 20000 yesterday...",
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
      oneOffBadge: "One-Off",
      oneOffCheckbox: "Mark as One-Off / Splurge",
      oneOffHelp: "Exclude from regular weekly budget pace",
      oneOffDetectBanner: "This looks like a large one-off expense. Tag it as a One-Off Splurge so it doesn't skew your weekly budget?",
      oneOffMarkButton: "✨ Mark One-Off",
      oneOffTaggedIndicator: "Tagged as One-Off",
      oneOffRemoveButton: "Remove Tag",
      moreOptions: "More options",
      lessOptions: "Hide options",
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
      viewBreakdown: "Breakdown",
      viewChart: "Chart",
      daysLower: "{count} of {total} days lower",
      daysHigher: "{count} of {total} days higher",
      allDaysEven: "Daily spend is even",
      highestSpend: "Peak: {day} ({amount})",
      biggestSaving: "Best saving: {day} ({amount})",
      upcoming: "Upcoming",
      noSpendDay: "No spend",
      selectedDayDetails: "Selected Day Details",
      categoryChangesTitle: "Category Changes",
      noExpensesBothWeeks: "No expenses recorded for either week yet.",
      noChange: "No change",
    },
    login: {
      title: "Campus Expenses",
      subtitle: "Log in or create an account",
      emailPlaceholder: "name@email.com",
      passwordPlaceholder: "••••••••",
      logIn: "Log In",
      signUp: "Sign Up",
      or: "or",
      googleSignIn: "Continue with Google",
      continueAsGuest: "Continue as Guest (No Account)",
    },
    guest: {
      welcomeTitle: "Welcome to SakuTrack!",
      welcomeSubtitle: "Simple, honest, lightning-fast personal expense tracking.",
      features: {
        instantTitle: "Instant Logging",
        instantDesc: "Track expenses in seconds with quick chips and natural phrasing.",
        budgetTitle: "Flexible Budgets",
        budgetDesc: "Switch between weekly and monthly pacing with real-time daily allowances.",
        insightsTitle: "Smart Insights",
        insightsDesc: "Build tracking streaks, catch spending anomalies, and grow your savings.",
      },
      riskCardTitle: "Guest Mode & Free Usage",
      riskCardDesc: "You can use SakuTrack 100% free without creating an account. However, your records are saved only in this browser on this device.",
      riskPoints: [
        "Clearing your browser cache or site data will permanently delete your records.",
        "Incognito / private windows will wipe data as soon as they are closed.",
        "Expenses will not sync to your other phones or computers without an account.",
      ],
      continueBtn: "Continue",
      signInOrRegisterBtn: "Sign In or Register",
      alreadyHaveAccount: "Already have an account?",
      logInHere: "Log in here",
      bannerText: "Guest Mode: Data is saved only to this browser.",
      bannerAction: "Sync / Create Account",
      guestBadge: "Guest",
      guestButton: "Guest Mode",
      upgradeModalTitle: "Secure Your Expense Records",
      upgradeModalSubtitle: "Link to a permanent account to sync across devices and prevent accidental data loss.",
      upgradeEmailLabel: "Email",
      upgradePasswordLabel: "Password",
      upgradeSubmitBtn: "Save Account",
      upgradeSubmittingBtn: "Saving...",
      upgradeOrGoogle: "or link with Google",
      upgradeGoogleBtn: "Link with Google",
      upgradeSuccessMessage: "Account linked successfully! Your expenses are now securely backed up to the cloud.",
      upgradeDismissBtn: "Close",
      createAccountOrSignIn: "Create Account / Sign In",
      mergedToast: "Successfully merged {count} guest expenses into your account!",
      tabSignUp: "Create Account",
      tabLogIn: "Log In",
      loginTitle: "Welcome Back",
      loginSubtitle: "Sign in to sync your cloud data and merge any guest expenses.",
      loginSubmitBtn: "Log In",
      loginSubmittingBtn: "Logging in...",
      switchToLogIn: "Already have an account? Log In",
      switchToSignUp: "Need an account? Create one",
      loginSuccessMessage: "Welcome back! Logged in successfully.",
    },
    install: {
      title: "Install Expense Tracker",
      subtitle: "Add to home screen for full-screen mode",
      install: "Install",
      dismiss: "Dismiss install banner",
    },
    savings: {
      title: "Savings",
      subtitle: "Core savings & budget surplus for meaningful milestones",
      // Core Vault
      coreSavingsTitle: "Core Savings",
      coreSavingsSubtitle: "Real bank deposits & primary financial reserve",
      totalCoreSavings: "Total Core Savings",
      availableForGoals: "Free to Allocate",
      allocatedToGoals: "Locked in Goals",
      manageCoreSavings: "Manage Balance",
      // Budget Surplus
      budgetSurplusTitle: "Weekly Budget Surplus",
      budgetSurplusSubtitle: "Disciplined spending leftovers saved from past weeks",
      availableSurplus: "Available to Transfer",
      totalSurplusEarned: "Total Saved from Budget",
      sweptSurplusTotal: "Transferred to Goals/Savings",
      sweepSurplusButton: "Transfer Surplus",
      sweepModalTitle: "Transfer Budget Surplus",
      sweepModalSubtitle: "Move your disciplined spending leftovers into core savings or directly into a goal",
      sweepDestinationLabel: "Destination",
      sweepToCoreSavings: "Deposit into Core Savings",
      sweepToGoal: "Allocate Directly to a Goal",
      sweepSelectGoalPlaceholder: "Choose destination goal...",
      confirmSweep: "Transfer Now",
      sweepSuccess: "Surplus successfully transferred!",
      noSurplusAvailable: "No unspent budget surplus available right now.",
      // Ongoing Week
      ongoingWeekLabel: "Current Week (Estimated)",
      ongoingWeekNotice: "Unspent budget from this week will be finalized once the week closes.",
      // Goals
      goalsTitle: "Savings Goals",
      goalsSubtitle: "Plan for meaningful milestones or maintain a general rainy day buffer",
      noGoalTitle: "No Savings Goal Set Yet",
      noGoalDescription: "You can freely accumulate your savings buffer, or set a target if you're saving for something specific.",
      createGoalButton: "Create a Savings Goal",
      addGoalButton: "Add New Goal",
      editGoalTitle: "Edit Savings Goal",
      createGoalTitle: "New Savings Goal",
      goalNameLabel: "Goal Name",
      goalTargetLabel: "Target Amount (Rp)",
      goalEmojiLabel: "Icon",
      goalNamePlaceholder: "e.g. Emergency Fund, Vacation, New Laptop",
      targetAmountPlaceholder: "e.g. 1,000,000",
      allocateButton: "Allocate Funds",
      withdrawButton: "Withdraw to Available",
      allocateModalTitle: "Allocate to Goal",
      allocateModalSubtitle: "Move funds from your available savings into this goal",
      withdrawModalTitle: "Withdraw from Goal",
      withdrawModalSubtitle: "Return funds from this goal back to your available pool",
      allocationAmountLabel: "Amount (Rp)",
      maxAvailable: "Max Available",
      maxAllocated: "Max Allocated",
      quickAll: "All",
      quickHalf: "50%",
      confirmAllocate: "Allocate",
      confirmWithdraw: "Withdraw",
      goalReached: "Goal Reached! 🎉",
      goalProgress: "saved",
      deleteGoalConfirm: "Delete this goal? Any allocated funds will automatically return to your available savings pool.",
      // History
      historyTitle: "Unspent Budget Rollover",
      historySubtitle: "Completed weeks that successfully contributed unspent budget to savings",
      surplusWeekContribution: "rolled into savings",
      noSurplusWeeks: "No Unspent Surpluses Yet",
      noSurplusWeeksDesc: "When a week wraps up with spending below your weekly budget, the leftover amount rolls over here.",
      weekPacingLabel: "Used",
      // Mindful Quotes & Manual adjustments
      supportiveTitle: "Mindful Reminder",
      nextQuote: "New Thought",
      quotes: [
        "Tracking your expenses honestly is your biggest win. Savings will naturally follow with patience.",
        "It is completely okay to have tight weeks. Healthy finances are about resilience, not perfection.",
        "Saving isn't about extreme restriction; it's about giving your future self breathing room and choices.",
        "Small mindful choices lead to great milestones. Every new week is a fresh slate.",
        "Don't worry if nothing was saved this week. Your awareness right now is building lasting habits.",
        "Every financial journey has ebbs and flows. Stay kind to yourself and keep pacing forward."
      ],
      zeroSavingsEncouragement: "No savings accumulated yet. Keep calm and take it one day at a time!",
      allGoodPacingEncouragement: "Keep up your steady, mindful pacing.",
      manualAdjustmentButton: "Manage Balance",
      manualAdjustmentTitle: "Manage Core Savings Balance",
      manualAdjustmentSubtitle: "Record base bank deposits, initial balances, or adjustments",
      adjustmentAmountLabel: "Amount (Rp)",
      adjustmentTypeDeposit: "Deposit into Savings (+)",
      adjustmentTypeWithdraw: "Withdraw from Savings (-)",
      adjustmentNoteLabel: "Note (optional)",
      adjustmentSuccess: "Savings balance updated successfully.",
      // Balance History
      balanceHistoryTitle: "Savings Balance History",
      balanceHistorySubtitle: "Track deposits, withdrawals, surplus rollovers, and goal allocations",
      balanceHistoryBadge: "Balance History",
      filterAll: "All",
      filterInflow: "Inflow (+)",
      filterOutflow: "Outflow (-)",
      filterGoals: "Goals",
      searchHistoryPlaceholder: "Search balance history...",
      runningBalance: "Balance",
      totalInflow: "Total Inflow",
      totalOutflow: "Total Outflow",
      currentBalance: "Current Balance",
      netSavings: "Savings Balance",
      noHistoryTitle: "No Balance History Yet",
      noHistoryDesc: "Every deposit, withdrawal, surplus transferred, or goal movement will automatically be logged here.",
      noMatchingHistory: "No transactions match your search.",
      addFirstEntry: "Record First Deposit / Entry",
      deleteHistoryConfirm: "Are you sure you want to delete this transaction record? The savings balance will be reverted.",
      deleteHistoryButton: "Delete",
      viewHistoryButton: "Balance History",
      typeDeposit: "Deposit",
      typeWithdraw: "Withdrawal",
      typeSurplus: "Surplus Rollover",
      typeSurplusGoal: "Surplus to Goal",
      typeGoalAllocate: "Goal Allocation",
      typeGoalWithdraw: "Goal Withdrawal",
      balanceTrendTitle: "Balance Trajectory",
      balanceTrendSubtitle: "Growth of your savings balance over time",
      initialBalanceLabel: "Initial Balance",
      goalMovement: "Goal Movement",
      closeHistory: "Close History",
    },
  },
};

