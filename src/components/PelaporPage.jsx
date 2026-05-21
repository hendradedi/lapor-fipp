import { useState } from 'react';

function PelaporPage({ reportForm, setReportForm, submitReport, loading, reports, toWhatsAppLink, token }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <section className="page-grid">
      <article className="card">
        <h2>Kirim Laporan</h2>
        <p className="muted">Semua peran dapat melapor: mahasiswa, dosen, tendik, dan masyarakat.</p>
        <form className="form" onSubmit={submitReport}>
          <label>
            Tipe Pelapor
            <select
              value={reportForm.reporterType}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, reporterType: event.target.value }))
              }
            >
              <option value="MAHASISWA">Mahasiswa</option>
              <option value="DOSEN">Dosen</option>
              <option value="TENDIK">Tendik</option>
              <option value="MASYARAKAT">Masyarakat</option>
            </select>
          </label>

          <label>
            Nama
            <input
              required
              value={reportForm.reporterName}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, reporterName: event.target.value }))
              }
              placeholder="Nama pelapor"
            />
          </label>

          <label>
            Kontak (Email/NIM/NIP)
            <input
              required
              value={reportForm.contact}
              onChange={(event) => setReportForm((prev) => ({ ...prev, contact: event.target.value }))}
              placeholder="Contoh: nama@email.com"
            />
          </label>

          <label>
            Nomor WhatsApp Aktif
            <input
              required
              value={reportForm.phoneNumber}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
              }
              placeholder="08xxxxxxxxxx"
            />
          </label>

          <label>
            Kategori
            <select
              value={reportForm.category}
              onChange={(event) => setReportForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="SARPRAS">Sarpras</option>
              <option value="AKADEMIK">Akademik</option>
              <option value="KEJIWAAN">Masalah Kejiwaan</option>
              <option value="SARAN_KRITIK">Saran/Kritik</option>
            </select>
          </label>

          <label>
            Subkategori
            <input
              required
              value={reportForm.subCategory}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, subCategory: event.target.value }))
              }
              placeholder="Contoh: fasilitas kelas"
            />
          </label>

          <label>
            Lokasi
            <input
              required
              value={reportForm.locationName}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, locationName: event.target.value }))
              }
              placeholder="Gedung / ruang / area"
            />
          </label>

          <label>
            Deskripsi Laporan
            <textarea
              required
              rows="5"
              value={reportForm.description}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Jelaskan kronologi, dampak, dan harapan penyelesaian"
            />
          </label>

          <label>
            Upload Foto (Opsional)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <small className="muted">Format: JPG, PNG, GIF, BMP, WebP (Maks 5MB per file)</small>
          </label>

          {selectedFiles.length > 0 && (
            <div className="file-list">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} className="btn-remove">
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="check">
            <input
              type="checkbox"
              checked={reportForm.anonymousLimited}
              onChange={(event) =>
                setReportForm((prev) => ({ ...prev, anonymousLimited: event.target.checked }))
              }
            />
            Anonim terbatas (identitas hanya terlihat admin dan asisten admin)
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Kirim Laporan'}
          </button>
        </form>
      </article>

      <article className="card">
        <h2>Progres Laporan Terbaru</h2>
        <p className="muted">Pelapor dapat memantau status dan kontak WhatsApp admin.</p>
        <div className="list">
          {reports.slice(0, 10).map((report) => (
            <div className="list-item" key={report.id}>
              <div>
                <strong>#{report.id.slice(0, 8)}</strong>
                <p>
                  {report.category} - {report.subCategory}
                </p>
                <p>Status: {report.status}</p>
              </div>
              <div className="item-actions">
                <span className={`status ${String(report.status || '').toLowerCase()}`}>
                  {report.status}
                </span>
                <a href={toWhatsAppLink(report.phoneNumber, report.id, report.status)} target="_blank" rel="noreferrer">
                  Buka WhatsApp
                </a>
              </div>
            </div>
          ))}
          {!reports.length ? <p className="muted">Belum ada laporan.</p> : null}
        </div>
      </article>
    </section>
  )
}

export default PelaporPage
