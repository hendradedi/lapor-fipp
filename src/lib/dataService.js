import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { firebaseState } from './firebase';
import { PRIMARY_ADMIN_EMAIL } from './constants';
import { statusOrder as statusOrderUtil } from './utils';
import { generateId } from './utils';
import { safeLocalStorage as storage } from './utils';
import { normalizeEmail as normalizeEmailUtil } from './utils';

const LOCAL_REPORTS_KEY = 'lapor_fipp_reports'
const LOCAL_SETTINGS_KEY = 'lapor_fipp_settings'
const LOCAL_ADMIN_POLICY_KEY = 'lapor_fipp_admin_policy'

const nowIso = () => new Date().toISOString()

const readLocal = (key, fallback) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  storage.setItem(key, JSON.stringify(value));
};

const normalizeReport = (report) => ({
  ...report,
  createdAt: report.createdAt || nowIso(),
  updatedAt: report.updatedAt || nowIso(),
  status: report.status || 'BARU',
})

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const normalizeAdminPolicy = (raw) => {
  const assistantEmailsRaw = Array.isArray(raw?.assistantEmails) ? raw.assistantEmails : []
  const assistantEmails = [...new Set(assistantEmailsRaw.map(normalizeEmail).filter(Boolean))].filter(
    (email) => email !== PRIMARY_ADMIN_EMAIL,
  )

  return {
    primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
    assistantEmails,
  }
}

const shouldUseLocalFallback = (error) => {
  const code = error?.code || ''
  return (
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    code === 'unavailable' ||
    code === 'failed-precondition'
  )
}

const mapFirestoreErrorMessage = (error, fallback) => {
  const code = error?.code || ''

  if (code === 'permission-denied') {
    return 'Akses Firestore ditolak. Data disimpan sementara di mode lokal.'
  }

  if (code === 'unauthenticated') {
    return 'Sesi belum terautentikasi ke Firestore. Coba login ulang.'
  }

  if (code === 'unavailable') {
    return 'Layanan Firestore sedang tidak tersedia. Coba lagi sebentar.'
  }

  if (code === 'failed-precondition') {
    return 'Konfigurasi Firestore belum siap (mis. index/rules). Sistem memakai mode lokal sementara.'
  }

  return fallback || 'Terjadi kesalahan data.'
}

const createLocalReport = (payload) => {
  const reports = readLocal(LOCAL_REPORTS_KEY, [])
  const newReport = { ...payload, id: generateId() }
  reports.unshift(newReport)
  writeLocal(LOCAL_REPORTS_KEY, reports)
  return newReport
}

const listLocalReports = () =>
  readLocal(LOCAL_REPORTS_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

const updateLocalReportStatus = (reportId, payload) => {
  const reports = readLocal(LOCAL_REPORTS_KEY, [])
  const reportIndex = reports.findIndex((item) => item.id === reportId)
  if (reportIndex < 0) {
    throw new Error('Laporan tidak ditemukan')
  }

  const current = reports[reportIndex]
  const timeline = current.timeline || []
  const next = {
    ...current,
    status: payload.status,
    updatedAt: nowIso(),
    slaDueAt: payload.slaDueAt || current.slaDueAt,
    assignedUnit: payload.assignedUnit || current.assignedUnit,
    timeline: [
      ...timeline,
      {
        status: payload.status,
        note: payload.note,
        by: payload.by,
        at: nowIso(),
      },
    ],
  }
  reports[reportIndex] = next
  writeLocal(LOCAL_REPORTS_KEY, reports)
  return next
}

export const settingsService = {
  async getSlaConfig() {
    if (!firebaseState.db) {
      const settings = readLocal(LOCAL_SETTINGS_KEY, {
        defaultHours: 72,
        message: 'SLA ditentukan admin sesuai tingkat kesulitan.',
      })
      return settings
    }

    try {
      const settingsRef = doc(firebaseState.db, 'app_settings', 'sla')
      const snapshot = await getDoc(settingsRef)
      if (!snapshot.exists()) {
        return {
          defaultHours: 72,
          message: 'SLA ditentukan admin sesuai tingkat kesulitan.',
        }
      }

      return snapshot.data()
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        return readLocal(LOCAL_SETTINGS_KEY, {
          defaultHours: 72,
          message: 'SLA ditentukan admin sesuai tingkat kesulitan.',
        })
      }
      throw new Error(mapFirestoreErrorMessage(error, 'Gagal memuat konfigurasi SLA.'))
    }
  },

  async setSlaConfig(payload, actor = 'system') {
    const value = {
      ...payload,
      updatedBy: actor,
      updatedAt: nowIso(),
    }

    if (!firebaseState.db) {
      writeLocal(LOCAL_SETTINGS_KEY, value)
      return value
    }

    try {
      await setDoc(doc(firebaseState.db, 'app_settings', 'sla'), value, { merge: true })
      return value
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        writeLocal(LOCAL_SETTINGS_KEY, value)
        return value
      }
      throw new Error(mapFirestoreErrorMessage(error, 'Gagal menyimpan konfigurasi SLA.'))
    }
  },

  async getAdminPolicy() {
    if (!firebaseState.db) {
      const localPolicy = readLocal(LOCAL_ADMIN_POLICY_KEY, {
        primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
        assistantEmails: [],
      })
      return normalizeAdminPolicy(localPolicy)
    }

    try {
      const policyRef = doc(firebaseState.db, 'app_settings', 'admin_roles')
      const snapshot = await getDoc(policyRef)
      if (!snapshot.exists()) {
        return {
          primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
          assistantEmails: [],
        }
      }

      return normalizeAdminPolicy(snapshot.data())
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        const localPolicy = readLocal(LOCAL_ADMIN_POLICY_KEY, {
          primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
          assistantEmails: [],
        })
        return normalizeAdminPolicy(localPolicy)
      }

      throw new Error(mapFirestoreErrorMessage(error, 'Gagal memuat data admin.'))
    }
  },

  async setAdminPolicy(payload, actor = 'system') {
    const normalized = normalizeAdminPolicy(payload)
    const value = {
      ...normalized,
      updatedBy: actor,
      updatedAt: nowIso(),
    }

    if (!firebaseState.db) {
      writeLocal(LOCAL_ADMIN_POLICY_KEY, value)
      return normalized
    }

    try {
      await setDoc(doc(firebaseState.db, 'app_settings', 'admin_roles'), value, { merge: true })
      return normalized
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        writeLocal(LOCAL_ADMIN_POLICY_KEY, value)
        return normalized
      }

      throw new Error(mapFirestoreErrorMessage(error, 'Gagal menyimpan data admin.'))
    }
  },
}

export const reportService = {
  async createReport(payload) {
    const prepared = normalizeReport({
      ...payload,
      status: 'BARU',
      timeline: [
        {
          status: 'BARU',
          note: 'Laporan diterima sistem',
          at: nowIso(),
          by: 'system',
        },
      ],
    })

    if (!firebaseState.db) {
      return createLocalReport(prepared)
    }

    try {
      const ref = await addDoc(collection(firebaseState.db, 'reports'), {
        ...prepared,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { ...prepared, id: ref.id }
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        return createLocalReport(prepared)
      }
      throw new Error(mapFirestoreErrorMessage(error, 'Gagal mengirim laporan.'))
    }
  },

  async listReports(max = 200) {
    if (!firebaseState.db) {
      return listLocalReports()
    }

    try {
      const reportsQuery = query(
        collection(firebaseState.db, 'reports'),
        orderBy('createdAt', 'desc'),
        limit(max),
      )
      const snapshot = await getDocs(reportsQuery)
      return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        return listLocalReports()
      }
      throw new Error(mapFirestoreErrorMessage(error, 'Gagal memuat daftar laporan.'))
    }
  },

  async updateReportStatus(reportId, payload) {
    if (!statusOrderUtil.includes(payload.status)) {
      throw new Error('Status tidak valid')
    }

    if (!firebaseState.db) {
      return updateLocalReportStatus(reportId, payload)
    }

    try {
      const target = doc(firebaseState.db, 'reports', reportId)
      const currentRef = await getDoc(target)
      if (!currentRef.exists()) {
        throw new Error('Laporan tidak ditemukan')
      }

      const current = currentRef.data()
      const timeline = current.timeline || []
      const nextTimeline = [
        ...timeline,
        {
          status: payload.status,
          note: payload.note,
          by: payload.by,
          at: nowIso(),
        },
      ]

      await updateDoc(target, {
        status: payload.status,
        timeline: nextTimeline,
        updatedAt: serverTimestamp(),
        assignedUnit: payload.assignedUnit || current.assignedUnit,
        slaDueAt: payload.slaDueAt || current.slaDueAt || null,
      })

      return {
        id: reportId,
        ...current,
        status: payload.status,
        timeline: nextTimeline,
        assignedUnit: payload.assignedUnit || current.assignedUnit,
        slaDueAt: payload.slaDueAt || current.slaDueAt || null,
      }
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        return updateLocalReportStatus(reportId, payload)
      }
      throw new Error(mapFirestoreErrorMessage(error, 'Gagal memperbarui status laporan.'))
    }
  },
}

export const analyticsService = {
  buildDashboardMetrics(reports) {
    const now = Date.now()
    const metrics = {
      total: reports.length,
      byStatus: {},
      byCategory: {},
      delayed: 0,
      urgencyHigh: 0,
      locations: {},
    }

    for (const report of reports) {
      metrics.byStatus[report.status] = (metrics.byStatus[report.status] || 0) + 1
      metrics.byCategory[report.category] = (metrics.byCategory[report.category] || 0) + 1

      if (report.urgencyScore >= 70) {
        metrics.urgencyHigh += 1
      }

      if (report.slaDueAt && new Date(report.slaDueAt).getTime() < now && report.status !== 'SELESAI') {
        metrics.delayed += 1
      }

      if (report.locationName) {
        metrics.locations[report.locationName] = (metrics.locations[report.locationName] || 0) + 1
      }
    }

    return metrics
  },
}

export const util = {
  statusOrder: statusOrderUtil,
}