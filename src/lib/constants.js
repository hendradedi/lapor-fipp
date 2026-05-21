// Konstanta dan konfigurasi aplikasi

// Email admin utama
export const PRIMARY_ADMIN_EMAIL = 'fipp@mail.unnes.ac.id';

// Kunci penyimpanan sesi
export const REPORTER_SESSION_KEY = 'lapor_fipp_reporter_session';
export const ADMIN_SESSION_KEY = 'lapor_fipp_admin_session';
export const ACTIVE_PAGE_KEY = 'lapor_fipp_active_page';
export const REPORTER_PROFILE_KEY = 'lapor_fipp_reporter_profile';

// Kunci penyimpanan lokal data
export const LOCAL_REPORTS_KEY = 'lapor_fipp_reports';
export const LOCAL_SETTINGS_KEY = 'lapor_fipp_settings';
export const LOCAL_ADMIN_POLICY_KEY = 'lapor_fipp_admin_policy';

// Status laporan
export const STATUS_ORDER = ['BARU', 'DIVERIFIKASI', 'DIPROSES', 'MENUNGGU_PELAPOR', 'SELESAI', 'DITOLAK'];

// Pesan error umum
export const ERROR_MESSAGES = {
  NETWORK: 'Koneksi bermasalah. Periksa internet Anda.',
  SERVER: 'Terjadi kesalahan server. Coba lagi beberapa saat.',
  AUTH: {
    INVALID_EMAIL: 'Format email tidak valid.',
    MISSING_PASSWORD: 'Password wajib diisi.',
    INVALID_CREDENTIAL: 'Email atau password salah.',
    USER_DISABLED: 'Akun ini dinonaktifkan.',
    USER_NOT_FOUND: 'Akun tidak ditemukan.',
    WRONG_PASSWORD: 'Password salah.',
    EMAIL_ALREADY_IN_USE: 'Email sudah terdaftar, silakan login.',
    WEAK_PASSWORD: 'Password terlalu lemah (minimal 6 karakter).',
    POPUP_CLOSED: 'Popup ditutup sebelum login selesai.',
    CANCELLED_POPUP: 'Permintaan login dibatalkan.',
    TOO_MANY_REQUESTS: 'Terlalu banyak percobaan. Coba lagi beberapa saat.',
    AUTH_FAILED: 'Terjadi kesalahan autentikasi.',
    LOGIN_FAILED: 'Login gagal.',
    REGISTER_FAILED: 'Registrasi akun gagal.',
  },
  FIRESTORE: {
    PERMISSION_DENIED: 'Akses Firestore ditolak. Data disimpan sementara di mode lokal.',
    UNAUTHENTICATED: 'Sesi belum terautentikasi ke Firestore. Coba login ulang.',
    UNAVAILABLE: 'Layanan Firestore sedang tidak tersedia. Coba lagi sebentar.',
    FAILED_PRECONDITION: 'Konfigurasi Firestore belum siap (mis. index/rules). Sistem memakai mode lokal sementara.',
    DATA_ERROR: 'Terjadi kesalahan data.',
  },
  REPORT: {
    CREATE_FAILED: 'Gagal mengirim laporan.',
    UPDATE_FAILED: 'Gagal memperbarui status laporan.',
    LOAD_FAILED: 'Gagal memuat daftar laporan.',
    INVALID_STATUS: 'Status tidak valid',
    NOT_FOUND: 'Laporan tidak ditemukan',
  },
  SETTINGS: {
    LOAD_FAILED: 'Gagal memuat konfigurasi',
    SAVE_FAILED: 'Gagal menyimpan konfigurasi',
  },
  ADMIN: {
    ACCESS_DENIED: 'Hanya admin utama yang dapat mengangkat/mencabut asisten admin.',
    EMAIL_REQUIRED: 'Isi email terlebih dahulu.',
    INVALID_EMAIL: 'Email tidak valid.',
  },
};

// Pesan sukses
export const SUCCESS_MESSAGES = {
  REPORT_CREATED: (id) => `Laporan berhasil dikirim. ID: ${id}`,
  REPORT_UPDATED: 'Status laporan berhasil diperbarui.',
  SETTINGS_SAVED: 'Konfigurasi SLA diperbarui.',
  ADMIN_ADDED: (email) => `Asisten admin ${email} berhasil ditambahkan.`,
  ADMIN_REMOVED: (email) => `Asisten admin ${email} berhasil dicabut.`,
  LOGIN_SUCCESS: (role) => `Login berhasil sebagai ${role}.`,
  LOGOUT_SUCCESS: 'Sesi berhasil ditutup.',
};

// Role dan akses
export const ROLE_LABELS = {
  PRIMARY_ADMIN: 'Admin Utama',
  ASSISTANT_ADMIN: 'Asisten Admin',
  REPORTER: 'Pelapor',
  GUEST: 'Guest',
};