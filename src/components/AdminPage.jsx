function AdminPage({
  adminForm,
  setAdminForm,
  loginAdmin,
  loginAdminWithGoogle,
  adminSession,
  logoutAdmin,
  loading,
  firebaseConfigured,
  slaConfig,
  saveSlaConfig,
  updateStatus,
  statusForm,
  setStatusForm,
  reports,
  statusOrder,
  adminPolicy,
  isPrimaryAdmin,
  assistantAdminEmail,
  setAssistantAdminEmail,
  promoteAssistantAdmin,
  revokeAssistantAdmin,
}) {
  return (
    <section className="page-grid">
      <article className="card">
        <h2>Login Admin / Asisten</h2>
        <form className="form" onSubmit={loginAdmin}>
          <label>
            Email
            <input
              required
              type="email"
              value={adminForm.email}
              onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={adminForm.password}
              onChange={(event) =>
                setAdminForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </label>
          <button type="submit" disabled={loading}>
            Masuk
          </button>
          <button type="button" className="secondary" onClick={loginAdminWithGoogle} disabled={loading}>
            Login Google Admin
          </button>
          {adminSession ? (
            <button type="button" className="secondary" onClick={logoutAdmin}>
              Keluar
            </button>
          ) : null}
        </form>
        <p className="muted">Admin utama: {adminPolicy.primaryAdminEmail}</p>
        <p className="muted">Mode backend: {firebaseConfigured ? 'Firebase aktif' : 'Lokal demo aktif'}</p>
      </article>

      <article className="card">
        <h2>Kelola Asisten Admin</h2>
        {isPrimaryAdmin ? (
          <>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                void promoteAssistantAdmin()
              }}
            >
              <label>
                Email Asisten (wajib login Google)
                <input
                  type="email"
                  value={assistantAdminEmail}
                  onChange={(event) => setAssistantAdminEmail(event.target.value)}
                  placeholder="asisten@mail.unnes.ac.id"
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                Angkat Asisten Admin
              </button>
            </form>

            <div className="list">
              {adminPolicy.assistantEmails.map((email) => (
                <div className="list-item" key={email}>
                  <div>
                    <strong>{email}</strong>
                    <p>Role: Asisten Admin</p>
                  </div>
                  <div className="item-actions">
                    <button type="button" className="danger" onClick={() => revokeAssistantAdmin(email)}>
                      Cabut
                    </button>
                  </div>
                </div>
              ))}
              {!adminPolicy.assistantEmails.length ? (
                <p className="muted">Belum ada asisten admin.</p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="muted">Hanya admin utama yang dapat mengangkat atau mencabut asisten admin.</p>
        )}
      </article>

      <article className="card">
        <h2>Atur SLA Dinamis</h2>
        <form className="form" onSubmit={saveSlaConfig}>
          <label>
            SLA Default (jam)
            <input type="number" name="defaultHours" min="1" defaultValue={slaConfig.defaultHours || 72} />
          </label>
          <label>
            Catatan SLA
            <textarea name="message" rows="3" defaultValue={slaConfig.message || ''} />
          </label>
          <button type="submit" disabled={loading}>
            Simpan SLA
          </button>
        </form>
      </article>

      <article className="card full-width">
        <h2>Tindak Lanjut Laporan</h2>
        <form className="form grid-2" onSubmit={updateStatus}>
          <label>
            Laporan
            <select
              value={statusForm.reportId}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, reportId: event.target.value }))}
              required
            >
              <option value="">Pilih laporan</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  #{report.id.slice(0, 8)} - {report.category} ({report.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={statusForm.status}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Unit Penangan
            <select
              value={statusForm.assignedUnit}
              onChange={(event) =>
                setStatusForm((prev) => ({ ...prev, assignedUnit: event.target.value }))
              }
            >
              <option value="sarpras">Sarpras</option>
              <option value="akademik">Akademik</option>
              <option value="kejiwaan">Kejiwaan</option>
            </select>
          </label>

          <label>
            Target SLA
            <input
              type="datetime-local"
              value={statusForm.slaDueAt}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, slaDueAt: event.target.value }))}
            />
          </label>

          <label className="full-row">
            Catatan Tindak Lanjut
            <textarea
              required
              rows="3"
              value={statusForm.note}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </label>

          <button type="submit" disabled={loading || !statusForm.reportId}>
            Update Status
          </button>
        </form>
      </article>
    </section>
  )
}

export default AdminPage
