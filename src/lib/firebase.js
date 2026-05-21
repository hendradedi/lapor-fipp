import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { PRIMARY_ADMIN_EMAIL } from './constants'
import { safeSessionStorage, safeLocalStorage } from './utils'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const mapAuthErrorMessage = (error, fallback) => {
  const code = error?.code || ''

  if (code === 'auth/invalid-email') return 'Format email tidak valid.'
  if (code === 'auth/missing-password') return 'Password wajib diisi.'
  if (code === 'auth/invalid-credential') return 'Email atau password salah.'
  if (code === 'auth/user-disabled') return 'Akun ini dinonaktifkan.'
  if (code === 'auth/user-not-found') return 'Akun tidak ditemukan.'
  if (code === 'auth/wrong-password') return 'Password salah.'
  if (code === 'auth/email-already-in-use') return 'Email sudah terdaftar, silakan login.'
  if (code === 'auth/weak-password') return 'Password terlalu lemah (minimal 6 karakter).'
  if (code === 'auth/popup-closed-by-user') return 'Popup Google ditutup sebelum login selesai.'
  if (code === 'auth/cancelled-popup-request') return 'Permintaan login dibatalkan.'
  if (code === 'auth/network-request-failed') return 'Koneksi bermasalah. Periksa internet Anda.'
  if (code === 'auth/too-many-requests') return 'Terlalu banyak percobaan. Coba lagi beberapa saat.'

  return fallback || 'Terjadi kesalahan autentikasi.'
}

let app = null
let auth = null
let db = null
let storage = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export const firebaseState = {
  isFirebaseConfigured,
  app,
  auth,
  db,
  storage,
}

const SESSION_USER_KEY = 'lapor_fipp_session_user'

const persistSession = (userData) => {
  safeSessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData))
}

const clearSession = () => {
  safeSessionStorage.removeItem(SESSION_USER_KEY)
}

const getSession = () => {
  try {
    const raw = safeSessionStorage.getItem(SESSION_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const resolveRole = (email) => {
  const normalized = String(email || '').trim().toLowerCase()
  if (normalized === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return 'PRIMARY_ADMIN'
  }
  return 'REPORTER'
}

export const authApi = {
  async registerReporterWithEmail(email, password) {
    if (!auth) {
      const userData = {
        uid: 'local-reporter-register',
        email,
        displayName: email.split('@')[0],
        role: 'REPORTER',
      }
      persistSession(userData)
      return userData
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const userData = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || email.split('@')[0],
        role: 'REPORTER',
      }
      persistSession(userData)
      return userData
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error, 'Registrasi akun gagal.'))
    }
  },

  async loginWithEmailPassword(email, password) {
    if (!auth) {
      const role = resolveRole(email)
      const userData = {
        uid: role === 'PRIMARY_ADMIN' ? 'local-primary-admin' : 'local-admin',
        email,
        role,
        displayName: role === 'PRIMARY_ADMIN' ? 'Admin Utama' : 'Admin',
      }
      persistSession(userData)
      return userData
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const role = resolveRole(email)
      const userData = {
        uid: credential.user.uid,
        email: credential.user.email,
        role,
        displayName: credential.user.displayName || 'Admin',
      }
      persistSession(userData)
      return userData
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error, 'Login admin gagal.'))
    }
  },

  async loginAdminWithGoogle() {
    if (!auth) {
      const userData = {
        uid: 'local-admin-google',
        email: PRIMARY_ADMIN_EMAIL,
        displayName: 'Admin Utama (Google)',
        role: 'PRIMARY_ADMIN',
      }
      persistSession(userData)
      return userData
    }

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const role = resolveRole(result.user.email)
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Admin',
        role,
      }
      persistSession(userData)
      return userData
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error, 'Login admin Google gagal.'))
    }
  },

  async logout() {
    clearSession()
    if (!auth) {
      return
    }

    try {
      await signOut(auth)
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error, 'Logout gagal.'))
    }
  },

  async loginReporterWithEmail(email, password) {
    if (!auth) {
      const userData = {
        uid: 'local-reporter',
        email,
        displayName: email.split('@')[0],
        role: 'REPORTER',
      }
      persistSession(userData)
      return userData
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const userData = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || email.split('@')[0],
        role: 'REPORTER',
      }
      persistSession(userData)
      return userData
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password)
          const userData = {
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName || email.split('@')[0],
            role: 'REPORTER',
          }
          persistSession(userData)
          return userData
        } catch (registerError) {
          throw new Error(mapAuthErrorMessage(registerError, 'Login pelapor gagal.'))
        }
      }
      throw new Error(mapAuthErrorMessage(error, 'Login pelapor gagal.'))
    }
  },

  async loginReporterWithGoogle() {
    if (!auth) {
      const userData = {
        uid: 'local-reporter-google',
        email: 'local.google@example.com',
        displayName: 'Local Google User',
        role: 'REPORTER',
      }
      persistSession(userData)
      return userData
    }

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Google User',
        role: 'REPORTER',
      }
      persistSession(userData)
      return userData
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error, 'Login Google gagal.'))
    }
  },

  getSession,
  clearSession,
}
