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
    totalSaved: string;
    availableSavings: string;
    allocatedToGoals: string;
    totalPatched: string;
    unspentSurplusTotal: string;
    availableDescription: string;
    ongoingWeekLabel: string;
    ongoingWeekNotice: string;
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
    patchSectionTitle: string;
    patchSectionSubtitle: string;
    noBadWeeksTitle: string;
    noBadWeeksDescription: string;
    badWeekOverBy: string;
    badWeekPatchedBadge: string;
    badWeekUnpatchedBadge: string;
    patchWithSavingsButton: string;
    patchModalTitle: string;
    patchModalSubtitle: string;
    patchAmountLabel: string;
    confirmPatch: string;
    unpatchButton: string;
    insufficientSavingsNotice: string;
    historyTitle: string;
    historySubtitle: string;
    surplusWeekContribution: string;
    noSurplusWeeks: string;
    noSurplusWeeksDesc: string;
    weekPacingLabel: string;
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
    },
    install: {
      title: "Pasang Aplikasi Pengeluaran",
      subtitle: "Tambahkan ke layar utama untuk mode layar penuh",
      install: "Pasang",
      dismiss: "Tutup info pemasangan",
    },
    savings: {
      title: "Tabungan",
      subtitle: "Sisa anggaran mingguan & resolusi finansial",
      totalSaved: "Total Tabungan",
      availableSavings: "Dana Tersedia",
      allocatedToGoals: "Dialokasikan ke Target",
      totalPatched: "Dipakai Tambal Minggu",
      unspentSurplusTotal: "Akumulasi Sisa Anggaran",
      availableDescription: "Bebas dialokasikan ke target atau dipakai menutup minggu berlebih.",
      ongoingWeekLabel: "Minggu Berjalan (Estimasi)",
      ongoingWeekNotice: "Sisa anggaran minggu ini akan difinalisasi saat minggu berakhir.",
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
      patchSectionTitle: "Tambal Pengeluaran Berlebih",
      patchSectionSubtitle: "Gunakan saldo tabungan untuk menutup minggu yang melebihi batas anggaran",
      noBadWeeksTitle: "Semua Minggu Terkendali",
      noBadWeeksDescription: "Seluruh minggu yang tercatat berada dalam batas anggaran. Ritme pengeluaranmu terjaga dengan baik!",
      badWeekOverBy: "Melebihi anggaran sebesar",
      badWeekPatchedBadge: "Ditambal dari tabungan",
      badWeekUnpatchedBadge: "Belum ditambal",
      patchWithSavingsButton: "Tambal dengan Tabungan",
      patchModalTitle: "Tambal Minggu Ini",
      patchModalSubtitle: "Gunakan saldo tabungan untuk menyeimbangkan pengeluaran minggu ini",
      patchAmountLabel: "Nominal Penambalan (Rp)",
      confirmPatch: "Tambal Sekarang",
      unpatchButton: "Kembalikan ke Tabungan",
      insufficientSavingsNotice: "Saldo tabungan belum mencukupi untuk menutup minggu ini. Surplus dari minggu berikutnya akan membantu menyeimbangkannya.",
      historyTitle: "Riwayat Sisa Anggaran",
      historySubtitle: "Daftar minggu yang berhasil menyisihkan anggaran ke tabungan",
      surplusWeekContribution: "disisihkan ke tabungan",
      noSurplusWeeks: "Belum Ada Sisa Anggaran Terkumpul",
      noSurplusWeeksDesc: "Ketika pengeluaran dalam satu minggu di bawah batas mingguan, sisanya otomatis terkumpul di sini.",
      weekPacingLabel: "Terpakai",
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
      manualAdjustmentButton: "Penyesuaian Manual",
      manualAdjustmentTitle: "Catat Tabungan Manual",
      manualAdjustmentSubtitle: "Tambahkan saldo ekstra dari bonus, THR, atau penyesuaian khusus",
      adjustmentAmountLabel: "Nominal (Rp)",
      adjustmentTypeDeposit: "Tambah ke Tabungan (+)",
      adjustmentTypeWithdraw: "Kurangi Tabungan (-)",
      adjustmentNoteLabel: "Keterangan (opsional)",
      adjustmentSuccess: "Saldo tabungan berhasil disesuaikan.",
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
    },
    install: {
      title: "Install Expense Tracker",
      subtitle: "Add to home screen for full-screen mode",
      install: "Install",
      dismiss: "Dismiss install banner",
    },
    savings: {
      title: "Savings",
      subtitle: "Unspent weekly budget & mindful financial buffers",
      totalSaved: "Total Savings",
      availableSavings: "Available Funds",
      allocatedToGoals: "Allocated to Goals",
      totalPatched: "Used to Patch Weeks",
      unspentSurplusTotal: "Accumulated Unspent Budget",
      availableDescription: "Free to allocate to goals or use to cover extra expenses.",
      ongoingWeekLabel: "Current Week (Estimated)",
      ongoingWeekNotice: "Unspent budget from this week will be finalized once the week closes.",
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
      patchSectionTitle: "Patch Extra Expenses",
      patchSectionSubtitle: "Use your accumulated savings to balance out weeks that went over budget",
      noBadWeeksTitle: "All Weeks Balanced",
      noBadWeeksDescription: "Every past recorded week stayed within budget. Your spending pacing is steady and calm!",
      badWeekOverBy: "Exceeded budget by",
      badWeekPatchedBadge: "Covered by savings",
      badWeekUnpatchedBadge: "Unpatched",
      patchWithSavingsButton: "Patch with Savings",
      patchModalTitle: "Patch This Week",
      patchModalSubtitle: "Use your savings to absorb the extra expenses from this week",
      patchAmountLabel: "Patch Amount (Rp)",
      confirmPatch: "Apply Patch",
      unpatchButton: "Return to Savings",
      insufficientSavingsNotice: "Savings balance is not yet high enough to patch this week. Future weekly surpluses will help build your buffer.",
      historyTitle: "Unspent Budget Rollover",
      historySubtitle: "Completed weeks that successfully contributed unspent budget to savings",
      surplusWeekContribution: "rolled into savings",
      noSurplusWeeks: "No Unspent Surpluses Yet",
      noSurplusWeeksDesc: "When a week wraps up with spending below your weekly budget, the leftover amount rolls over here.",
      weekPacingLabel: "Used",
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
      manualAdjustmentButton: "Manual Adjustment",
      manualAdjustmentTitle: "Record Manual Savings",
      manualAdjustmentSubtitle: "Add extra funds from bonuses, gifts, or adjust your balance",
      adjustmentAmountLabel: "Amount (Rp)",
      adjustmentTypeDeposit: "Add to Savings (+)",
      adjustmentTypeWithdraw: "Deduct from Savings (-)",
      adjustmentNoteLabel: "Note (optional)",
      adjustmentSuccess: "Savings balance updated successfully.",
    },
  },
};

