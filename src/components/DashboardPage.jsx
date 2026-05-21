function DashboardPage({ dashboard, trendRows }) {
  return (
    <section className="dashboard-grid">
      <article className="card metric">
        <h3>Volume Laporan</h3>
        <p>{dashboard.total}</p>
      </article>
      <article className="card metric warning">
        <h3>SLA Terlambat</h3>
        <p>{dashboard.delayed}</p>
      </article>
      <article className="card metric">
        <h3>Urgensi Tinggi</h3>
        <p>{dashboard.urgencyHigh}</p>
      </article>

      <article className="card">
        <h2>Tren Volume Per Waktu</h2>
        <div className="bar-chart">
          {trendRows.map(([day, count]) => (
            <div className="bar-item" key={day}>
              <span>{day}</span>
              <div style={{ width: `${Math.max(10, count * 12)}%` }}></div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="card">
        <h2>Kategori & Subkategori</h2>
        <div className="key-value">
          {Object.entries(dashboard.byCategory).map(([key, value]) => (
            <p key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </p>
          ))}
        </div>
      </article>

      <article className="card">
        <h2>Heatmap Lokasi (Ringkas)</h2>
        <div className="key-value">
          {Object.entries(dashboard.locations).map(([key, value]) => (
            <p key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </p>
          ))}
          {!Object.keys(dashboard.locations).length ? <p className="muted">Belum ada data lokasi.</p> : null}
        </div>
      </article>

      <article className="card">
        <h2>Funnel Status</h2>
        <div className="key-value">
          {Object.entries(dashboard.byStatus).map(([key, value]) => (
            <p key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </p>
          ))}
        </div>
      </article>
    </section>
  )
}

export default DashboardPage
