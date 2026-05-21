import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import './App.css'
import { authApi, reportService, settingsService, adminService, analyticsService, util } from './lib/apiClient.js'

const AdminPage = lazy(() => import('./components/AdminPage'))
const DashboardPage = lazy(() => import('./components/DashboardPage'))
const PelaporPage = lazy(() => import('./components/PelaporPage'))

const REPORTER_SESSION_KEY = 'lapor_fipp_reporter_session'
const ADMIN_SESSION_KEY = 'lapor_fipp_admin_session'
const ACTIVE_PAGE_KEY = 'lapor_fipp_active_page'
const REPORTER_PROFILE_KEY = 'lapor_fipp_reporter_profile'
const PRIMARY_ADMIN_EMAIL = import.meta.env.VITE_PRIMARY_ADMIN_EMAIL || 'fipp@mail.unnes.ac.id'

const readLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (_error) {
    return fallback
  }
}

const writeLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

function App() {
  const storedReporterSession = readLocal(REPORTER_SESSION_KEY, null)
  const storedReporterProfile = readLocal(REPORTER_PROFILE_KEY, null)

  const [activePage, setActivePage] = useState(() => readLocal(ACTIVE_PAGE_KEY, 'pelapor'))
  const [entryRole, setEntryRole] = useState('pelapor')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [adminSession, setAdminSession] = useState(() => readLocal(ADMIN_SESSION_KEY, null))
  const [reporterAuth, setReporterAuth] = useState(() => {
    if (!storedReporterSession) {
      return {
        loading: false,
        verified: false,
        provider: '',
        email: '',
        uid: '',
        token: '',
      }
    }

    return {
      ...storedReporterSession,
      loading: false,
    }
  })
  const [reporterAuthForm, setReporterAuthForm] = useState({
    email: '',
    password: '',
  })
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
  })
  const [slaConfig, setSlaConfig] = useState({
    defaultHours: 72,
    message: 'SLA ditentukan admin sesuai tingkat kesulitan.',
  })
  const [reportForm, setReportForm] = useState(() => ({
    reporterType: 'MAHASISWA',
    reporterName:
      storedReporterSession?.verified && storedReporterProfile?.reporterName
        ? storedReporterProfile.reporterName
        : '',
    contact:
      storedReporterSession?.verified && storedReporterProfile?.contact
        ? storedReporterProfile.contact
        : storedReporterSession?.email || '',
    phoneNumber:
      storedReporterSession?.verified && storedReporterProfile?.phoneNumber
        ? storedReporterProfile.phoneNumber
        : '',
    anonymousLimited: true,
    category: 'SARPRAS',
    subCategory: '',
    locationName: '',
    description: '',
  }))
  const [statusForm, setStatusForm] = useState({
    reportId: '',
    status: 'DIVERIFIKASI',
    note: '',
    assignedUnit: 'sarpras',
    slaDueAt: '',
  })
  const [adminPolicy, setAdminPolicy] = useState({
    primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
    assistantEmails: [],
  })
  const [assistantAdminEmail, setAssistantAdminEmail] = useState('')
  const [dashboard, setDashboard] = useState({
    total: 0,
    byStatus: {},
    byCategory: {},
    delayed: 0,
    urgencyHigh: 0,
    locations: {},
  })
  const [trendRows, setTrendRows] = useState([])

  const canManage = Boolean(adminSession?.isAdmin)
  const isPrimaryAdmin = Boolean(adminSession?.isPrimaryAdmin)
  const activeRoleLabel =
    reporterAuth.verified && adminSession
      ? 'Pelapor + Admin'
      : reporterAuth.verified
      ? 'Pelapor'
      : adminSession
      ? 'Admin'
      : 'Guest'

  useEffect(() => {
    void refreshAll()
    void refreshSlaConfig()
    void refreshAdminPolicy()
    void refreshDashboard()
  }, [])

  useEffect(() => {
    writeLocal(ACTIVE_PAGE_KEY, activePage)
  }, [activePage])

  useEffect(() => {
    if (adminSession) {
      writeLocal(ADMIN_SESSION_KEY, adminSession)
      return
    }

    localStorage.removeItem(ADMIN_SESSION_KEY)
  }, [adminSession])

  useEffect(() => {
    if (!adminSession?.email) {
      return
    }

    if (adminSession.isAdmin) {
      return
    }

    const access = resolveAdminAccess(adminSession.email)
    if (!access.isAdmin) {
      setAdminSession(null)
      return
    }

    setAdminSession((prev) => ({
      ...prev,
      isAdmin: true,
      isPrimaryAdmin: access.isPrimaryAdmin,
      role: access.roleLabel,
    }))
  }, [adminPolicy, adminSession])

  useEffect(() => {
    if (reporterAuth.verified) {
      writeLocal(REPORTER_SESSION_KEY, {
        verified: true,
        provider: reporterAuth.provider,
        email: reporterAuth.email,
        uid: reporterAuth.uid,
        token: reporterAuth.token,
      })
      return
    }

    localStorage.removeItem(REPORTER_SESSION_KEY)
  }, [reporterAuth])

  useEffect(() => {
    if (!reporterAuth.verified) {
      return
    }

    writeLocal(REPORTER_PROFILE_KEY, {
      reporterName: reportForm.reporterName || '',
      contact: reportForm.contact || '',
      phoneNumber: reportForm.phoneNumber || '',
    })
  }, [reporterAuth.verified, reportForm.reporterName, reportForm.contact, reportForm.phoneNumber])

  const refreshAll = async () => {
    setLoading(true)
    try {
      const token = reporterAuth.token || adminSession?.token
      if (!token) {
        setReports([])
        return
      }
      const result = await reportService.listReports(token)
      setReports(result.reports || [])
    } catch (error) {
      setMessage(error.message || 'Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  const refreshSlaConfig = async () => {
    try {
      const token = adminSession?.token
      if (!token) return
      const result = await settingsService.getSlaConfig(token)
      setSlaConfig(result.config)
    } catch (error) {
      setMessage(error.message || 'Gagal memuat konfigurasi SLA')
    }
  }

  const refreshAdminPolicy = async () => {
    try {
      const token = adminSession?.token
      if (!token) return
      const result = await adminService.getAdminPolicy(token)
      setAdminPolicy(result.policy)
    } catch (error) {
      setMessage(error.message || 'Gagal memuat data admin.')
    }
  }

  const refreshDashboard = async () => {
    try {
      const token = adminSession?.token
      if (!token) return
      
      const [metricsResult, trendResult] = await Promise.all([
        analyticsService.getDashboardMetrics(token),
        analyticsService.getTrendData(token),
      ])
      
      setDashboard(metricsResult.metrics)
      setTrendRows(trendResult.trendRows || [])
    } catch (error) {
      console.error('Gagal memuat dashboard:', error)
    }
  }

  const resolveAdminAccess = (email) => {
    const normalized = normalizeEmail(email)
    const isPrimary = normalized === normalizeEmail(adminPolicy.primaryAdminEmail)
    const isAssistant = adminPolicy.assistantEmails.includes(normalized)

    return {
      isAdmin: isPrimary || isAssistant,
      isPrimaryAdmin: isPrimary,
      roleLabel: isPrimary ? 'Admin Utama' : isAssistant ? 'Asisten Admin' : 'Bukan Admin',
    }
  }

  const startReporterSession = (userData, provider) => {
    setReporterAuth({
      loading: false,
      verified: true,
      provider,
      email: userData.email,
      uid: userData.id?.toString() || '',
      token: userData.token,
    })

    setReportForm((prev) => ({
      ...prev,
      contact: userData.email || prev.contact,
      reporterName: userData.displayName || prev.reporterName,
    }))

    setActivePage('pelapor')
  }

  const toWhatsAppLink = (phoneNumber, reportId, status) => {
    const cleaned = String(phoneNumber || '').replace(/[^0-9]/g, '')
    const normalized = cleaned.startsWith('0') ? `62${cleaned.slice(1)}` : cleaned
    const text = encodeURIComponent(
      `Update Lapor FIPP #${reportId}: status laporan Anda saat ini ${status}.`,
    )
    return `https://wa.me/${normalized}?text=${text}`
  }

  const scoreUrgency = (text) => {
    const value = text.toLowerCase()
    let score = 45
    if (/rusak|bahaya|darurat|kekerasan|krisis/.test(value)) score += 35
    if (/cepat|segera|urgent|mendesak/.test(value)) score += 20
    return Math.min(score, 100)
  }

  const submitReport = async (event) => {
    event.preventDefault()
    if (!reporterAuth.verified) {
      setMessage('Silakan login terlebih dahulu sebelum mengisi laporan.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const result = await reportService.createReport(
        {
          ...reportForm,
          createdBy: reportForm.contact || 'anonymous',
          reporterAuthProvider: reporterAuth.provider || null,
          reporterUid: reporterAuth.uid || null,
        },
        reporterAuth.token
      )

      await refreshAll()
      setStatusForm((prev) => ({ ...prev, reportId: result.report.id }))
      setMessage(`Laporan berhasil dikirim. ID: ${result.report.id}`)
      setReportForm((prev) => ({
        ...prev,
        subCategory: '',
        locationName: '',
        description: '',
      }))
    } catch (error) {
      setMessage(error.message || 'Gagal mengirim laporan')
    } finally {
      setLoading(false)
    }
  }

  const loginReporterWithEmail = async () => {
    if (!reporterAuthForm.email || !reporterAuthForm.password) {
      setMessage('Isi email dan password terlebih dahulu.')
      return
    }

    setReporterAuth((prev) => ({ ...prev, loading: true }))
    setMessage('')

    try {
      const result = await authApi.loginReporter(reporterAuthForm.email, reporterAuthForm.password)
      startReporterSession(result, 'email')
      setMessage('Login email berhasil.')
    } catch (error) {
      setReporterAuth((prev) => ({ ...prev, loading: false, verified: false }))
      setMessage(error.message || 'Login email gagal')
    }
  }

  const loginReporterWithGoogle = async () => {
    setReporterAuth((prev) => ({ ...prev, loading: true }))
    setMessage('')

    // Note: In production, you'd use Google OAuth and get the email from the OAuth response
    // For now, this is a placeholder that would need actual Google OAuth implementation
    try {
      // This would be replaced with actual Google OAuth flow
      const googleEmail = prompt('Masukkan email Google Anda (simulasi OAuth):')
      if (!googleEmail) {
        throw new Error('Login Google dibatalkan')
      }
      
      const result = await authApi.loginReporterWithGoogle(googleEmail, googleEmail.split('@')[0])
      startReporterSession(result, 'google')
      setMessage('Login Google berhasil.')
    } catch (error) {
      setReporterAuth((prev) => ({ ...prev, loading: false, verified: false }))
      setMessage(error.message || 'Login Google gagal')
    }
  }

  const registerReporterWithEmail = async () => {
    if (!reporterAuthForm.email || !reporterAuthForm.password) {
      setMessage('Isi email dan password untuk registrasi.')
      return
    }

    setReporterAuth((prev) => ({ ...prev, loading: true }))
    setMessage('')

    try {
      const result = await authApi.registerReporter(
        reporterAuthForm.email,
        reporterAuthForm.password,
        reporterAuthForm.email.split('@')[0]
      )
      startReporterSession(result, 'email')
      setMessage('Registrasi pelapor berhasil. Anda sudah login.')
    } catch (error) {
      setReporterAuth((prev) => ({ ...prev, loading: false, verified: false }))
      setMessage(error.message || 'Registrasi gagal')
    }
  }

  const loginAdmin = async (event) => {
    if (event) {
      event.preventDefault()
    }
    setLoading(true)
    setMessage('')
    try {
      const result = await authApi.loginAdmin(adminForm.email, adminForm.password)
      const session = {
        uid: result.id?.toString() || '',
        email: result.email,
        displayName: result.displayName,
        token: result.token,
        isAdmin: true,
        isPrimaryAdmin: result.isPrimaryAdmin,
        role: result.isPrimaryAdmin ? 'Admin Utama' : 'Asisten Admin',
      }
      setAdminSession(session)
      setActivePage('admin')
      setMessage(`Login berhasil sebagai ${session.role}.`)
      
      // Refresh admin data after login
      await refreshSlaConfig()
      await refreshAdminPolicy()
      await refreshDashboard()
    } catch (error) {
      setMessage(error.message || 'Login admin gagal')
    } finally {
      setLoading(false)
    }
  }

  const loginAdminWithGoogle = async () => {
    // Note: Similar to reporter Google login, this would need actual OAuth implementation
    setMessage('Login Google Admin memerlukan implementasi OAuth yang sebenarnya.')
  }

  const promoteAssistantAdmin = async () => {
    if (!isPrimaryAdmin) {
      setMessage('Hanya admin utama yang dapat mengangkat asisten admin.')
      return
    }

    const candidate = normalizeEmail(assistantAdminEmail)
    if (!candidate) {
      setMessage('Isi email asisten admin terlebih dahulu.')
      return
    }

    if (candidate === normalizeEmail(adminPolicy.primaryAdminEmail)) {
      setMessage('Email admin utama tidak perlu diangkat sebagai asisten.')
      return
    }

    setLoading(true)
    try {
      const result = await adminService.promoteAssistantAdmin(candidate, adminSession.token)
      setAdminPolicy(result.policy)
      setAssistantAdminEmail('')
      setMessage(`Asisten admin ${candidate} berhasil ditambahkan.`)
    } catch (error) {
      setMessage(error.message || 'Gagal menambahkan asisten admin.')
    } finally {
      setLoading(false)
    }
  }

  const revokeAssistantAdmin = async (email) => {
    if (!isPrimaryAdmin) {
      setMessage('Hanya admin utama yang dapat mencabut asisten admin.')
      return
    }

    setLoading(true)
    try {
      const result = await adminService.revokeAssistantAdmin(email, adminSession.token)
      setAdminPolicy(result.policy)
      setMessage(`Asisten admin ${email} berhasil dicabut.`)
    } catch (error) {
      setMessage(error.message || 'Gagal mencabut asisten admin.')
    } finally {
      setLoading(false)
    }
  }

  const saveSlaConfig = async (event) => {
    event.preventDefault()
    if (!canManage) {
      setMessage('Login admin diperlukan untuk mengatur SLA.')
      return
    }

    const form = new FormData(event.currentTarget)
    const defaultHours = Number(form.get('defaultHours') || 72)
    const note = String(form.get('message') || '')
    setLoading(true)

    try {
      const result = await settingsService.setSlaConfig(
        {
          defaultHours,
          message: note,
        },
        adminSession.token,
      )
      setSlaConfig(result.config)
      setMessage('Konfigurasi SLA diperbarui.')
    } catch (error) {
      setMessage(error.message || 'Gagal menyimpan SLA.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (event) => {
    event.preventDefault()
    if (!canManage) {
      setMessage('Login admin diperlukan untuk update status.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      await reportService.updateReportStatus(
        statusForm.reportId,
        {
          status: statusForm.status,
          note: statusForm.note,
          assignedUnit: statusForm.assignedUnit,
          slaDueAt: statusForm.slaDueAt || null,
        },
        adminSession.token
      )
      await refreshAll()
      await refreshDashboard()
      setMessage('Status laporan berhasil diperbarui.')
      setStatusForm((prev) => ({ ...prev, note: '' }))
    } catch (error) {
      setMessage(error.message || 'Update status gagal')
    } finally {
      setLoading(false)
    }
  }

  const logoutAdmin = async () => {
    setAdminSession(null)
    setMessage('Sesi admin ditutup tanpa memengaruhi sesi pelapor.')
  }

  const logoutReporter = async () => {
    setReporterAuth({
      loading: false,
      verified: false,
      provider: '',
      email: '',
      uid: '',
      token: '',
    })
    setReporterAuthForm({
      email: '',
      password: '',
    })
    localStorage.removeItem(REPORTER_PROFILE_KEY)
    setMessage('Sesi pelapor ditutup tanpa memengaruhi sesi admin.')
  }

  const logoutAllSessions = async () => {
    const isConfirmed = window.confirm('Yakin ingin logout semua sesi sekarang?')
    if (!isConfirmed) {
      return
    }

    setAdminSession(null)
    setReporterAuth({
      loading: false,
      verified: false,
      provider: '',
      email: '',
      uid: '',
      token: '',
    })
    setReporterAuthForm({
      email: '',
      password: '',
    })
    setActivePage('pelapor')
    localStorage.removeItem(REPORTER_PROFILE_KEY)
    setMessage('Semua sesi berhasil ditutup.')
  }

  if (!reporterAuth.verified && !adminSession) {
    return (
      <main className="login-shell">
        <section className="login-hero">
          <h1>Lapor FIPP</h1>
          <p>Login dulu untuk masuk ke sistem, lalu isi laporan Anda setelah berhasil masuk.</p>
        </section>

        <section className="login-card">
          <h2>Masuk Sistem</h2>
          <p className="muted">Pilih peran untuk login pertama kali.</p>
          <p className="role-pill role-pill-light">Role aktif: {activeRoleLabel}</p>

          <div className="entry-role-tabs">
            <button
              type="button"
              className={entryRole === 'pelapor' ? 'active' : ''}
              onClick={() => {
                setEntryRole('pelapor')
                setMessage('')
              }}
            >
              Pelapor
            </button>
            <button
              type="button"
              className={entryRole === 'admin' ? 'active' : ''}
              onClick={() => {
                setEntryRole('admin')
                setMessage('')
              }}
            >
              Admin / Asisten
            </button>
          </div>

          {message ? <section className="banner">{message}</section> : null}

          {entryRole === 'pelapor' ? (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                void loginReporterWithEmail()
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  required
                  value={reporterAuthForm.email}
                  onChange={(event) =>
                    setReporterAuthForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="nama@email.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  value={reporterAuthForm.password}
                  onChange={(event) =>
                    setReporterAuthForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Masukkan password"
                />
              </label>
              <button type="submit" disabled={reporterAuth.loading}>
                {reporterAuth.loading ? 'Memproses...' : 'Login Email'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={registerReporterWithEmail}
                disabled={reporterAuth.loading}
              >
                Daftar Pelapor
              </button>
              <button
                type="button"
                className="secondary"
                onClick={loginReporterWithGoogle}
                disabled={reporterAuth.loading}
              >
                Login Google
              </button>
            </form>
          ) : (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                void loginAdmin()
              }}
            >
              <label>
                Email Admin
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(event) =>
                    setAdminForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="admin@email.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(event) =>
                    setAdminForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Masukkan password admin"
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? 'Memproses...' : 'Login Admin'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={loginAdminWithGoogle}
                disabled={loading}
              >
                Login Google Admin
              </button>
              <small>Admin utama: {PRIMARY_ADMIN_EMAIL}</small>
            </form>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Lapor FIPP</h1>
          <p>Sistem laporan terpadu FIPP UNNES - Node.js + PostgreSQL</p>
          <p className="role-pill">Role aktif: {activeRoleLabel}</p>
          <p>
            Login pelapor: {reporterAuth.email || 'Belum login'} ({reporterAuth.provider || '-'})
          </p>
          {adminSession ? <p>Admin aktif: {adminSession.email} ({adminSession.role})</p> : null}
        </div>
        <nav>
          <button
            type="button"
            onClick={() => setActivePage('pelapor')}
            className={activePage === 'pelapor' ? 'active' : ''}
          >
            Pelapor
          </button>
          <button
            type="button"
            onClick={() => setActivePage('admin')}
            className={activePage === 'admin' ? 'active' : ''}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            className={activePage === 'dashboard' ? 'active' : ''}
          >
            Dashboard
          </button>
          {reporterAuth.verified ? (
            <button type="button" className="secondary" onClick={logoutReporter}>
              Logout Pelapor
            </button>
          ) : null}
          {adminSession ? (
            <button type="button" className="secondary" onClick={logoutAdmin}>
              Logout Admin
            </button>
          ) : null}
          {(reporterAuth.verified || adminSession) ? (
            <button type="button" className="danger" onClick={logoutAllSessions}>
              Logout Semua Sesi
            </button>
          ) : null}
        </nav>
      </header>

      {message ? <section className="banner">{message}</section> : null}

      <Suspense fallback={<section className="card full-width">Memuat halaman...</section>}>
        {activePage === 'pelapor' ? (
          <PelaporPage
            reportForm={reportForm}
            setReportForm={setReportForm}
            submitReport={submitReport}
            loading={loading}
            reports={reports}
            toWhatsAppLink={toWhatsAppLink}
          />
        ) : null}

        {activePage === 'admin' ? (
          <AdminPage
            adminForm={adminForm}
            setAdminForm={setAdminForm}
            loginAdmin={loginAdmin}
            loginAdminWithGoogle={loginAdminWithGoogle}
            adminSession={adminSession}
            logoutAdmin={logoutAdmin}
            loading={loading}
            firebaseConfigured={true}
            slaConfig={slaConfig}
            saveSlaConfig={saveSlaConfig}
            updateStatus={updateStatus}
            statusForm={statusForm}
            setStatusForm={setStatusForm}
            reports={reports}
            statusOrder={util.statusOrder}
            adminPolicy={adminPolicy}
            isPrimaryAdmin={isPrimaryAdmin}
            assistantAdminEmail={assistantAdminEmail}
            setAssistantAdminEmail={setAssistantAdminEmail}
            promoteAssistantAdmin={promoteAssistantAdmin}
            revokeAssistantAdmin={revokeAssistantAdmin}
          />
        ) : null}

        {activePage === 'dashboard' ? (
          <DashboardPage dashboard={dashboard} trendRows={trendRows} />
        ) : null}
      </Suspense>

      <footer className="footer-note">
        <p>
          Backend: Node.js + Express + PostgreSQL. Frontend: React + Vite.
        </p>
      </footer>
    </main>
  )
}

export default App
