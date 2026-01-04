import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Upload, Eye } from 'lucide-react';
import axios from 'axios';

export default function ComplianceFeatures({ programId, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [approvals, setApprovals] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [complianceReport, setComplianceReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('document');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchComplianceReport();
    } else if (activeTab === 'approvals') {
      fetchApprovalHistory();
    } else if (activeTab === 'evidence') {
      fetchEvidences();
    } else if (activeTab === 'audit') {
      fetchAuditLog();
    }
  }, [activeTab]);

  const fetchComplianceReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/compliance/programs/${programId}/compliance-report`
      );
      setComplianceReport(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching compliance report:', err);
      setError('Gagal memuat laporan kepatuhan');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/compliance/programs/${programId}/approval-history`
      );
      setApprovals(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching approval history:', err);
      setError('Gagal memuat riwayat persetujuan');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidences = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/compliance/programs/${programId}/evidences`
      );
      setEvidences(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching evidences:', err);
      setError('Gagal memuat bukti kepatuhan');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/compliance/programs/${programId}/audit-log`
      );
      setAuditLogs(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError('Gagal memuat log audit');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('evidence_type', evidenceType);
    formData.append('description', description);

    try {
      setLoading(true);
      await axios.post(
        `/api/admin/compliance/programs/${programId}/upload-evidence`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      alert('Bukti kepatuhan berhasil diunggah');
      setUploadFile(null);
      setDescription('');
      await fetchEvidences();
    } catch (err) {
      console.error('Error uploading evidence:', err);
      alert('Gagal mengunggah bukti kepatuhan');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    try {
      await axios.post(`/api/admin/compliance/programs/${programId}/request-approval`);
      alert('Permohonan persetujuan berhasil dikirim');
      await fetchApprovalHistory();
    } catch (err) {
      console.error('Error requesting approval:', err);
      alert('Gagal mengirim permohonan persetujuan');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Ikhtisar' },
    { id: 'approvals', label: 'Persetujuan' },
    { id: 'evidence', label: 'Bukti Kepatuhan' },
    { id: 'audit', label: 'Log Audit' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Fitur Kepatuhan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 py-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Memuat...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && complianceReport && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-medium text-gray-600">Status Kepatuhan</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {complianceReport.compliance_status}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-gray-600">Bukti Terverifikasi</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {complianceReport.evidence_summary?.verified_evidences || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm font-medium text-gray-600">Bukti Tertunda</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {complianceReport.evidence_summary?.pending_evidences || 0}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm font-medium text-gray-600">Bukti Ditolak</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {complianceReport.evidence_summary?.rejected_evidences || 0}
                  </p>
                </div>
              </div>

              {/* Program Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informasi Program
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Judul</dt>
                    <dd className="text-gray-900 mt-1">
                      {complianceReport.program?.title}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">
                      Kepatuhan Diperlukan
                    </dt>
                    <dd className="text-gray-900 mt-1">
                      {complianceReport.program?.compliance_required ? 'Ya' : 'Tidak'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRequestApproval}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Ajukan Permohonan Persetujuan
                </button>
              </div>
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div>
              {approvals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Belum ada riwayat persetujuan
                </p>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                approval.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : approval.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {approval.status === 'approved'
                                ? 'Disetujui'
                                : approval.status === 'rejected'
                                ? 'Ditolak'
                                : 'Tertunda'}
                            </span>
                            <p className="text-sm text-gray-600">
                              Diminta oleh: {approval.requested_by}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Tanggal: {approval.requested_at}
                          </p>
                          {approval.request_notes && (
                            <p className="text-sm text-gray-700 mt-2">
                              Catatan: {approval.request_notes}
                            </p>
                          )}
                          {approval.reviewer_notes && (
                            <p className="text-sm text-gray-700 mt-2">
                              Catatan Reviewer: {approval.reviewer_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Upload Form */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Unggah Bukti Kepatuhan
                </h3>
                <form onSubmit={handleUploadEvidence} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Bukti
                    </label>
                    <select
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="document">Dokumen</option>
                      <option value="screenshot">Tangkapan Layar</option>
                      <option value="attestation">Atestasi</option>
                      <option value="assessment">Penilaian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      accept="*/*"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Deskripsi bukti kepatuhan..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows="3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Unggah Bukti
                  </button>
                </form>
              </div>

              {/* Evidence List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Daftar Bukti
                </h3>
                {evidences.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Belum ada bukti yang diunggah
                  </p>
                ) : (
                  <div className="space-y-4">
                    {evidences.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {evidence.evidence_type}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  evidence.status === 'verified'
                                    ? 'bg-green-100 text-green-800'
                                    : evidence.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {evidence.status === 'verified'
                                  ? 'Terverifikasi'
                                  : evidence.status === 'rejected'
                                  ? 'Ditolak'
                                  : 'Tertunda'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Diunggah oleh: {evidence.uploaded_by}
                            </p>
                            <p className="text-sm text-gray-600">
                              Tanggal: {evidence.uploaded_at}
                            </p>
                            {evidence.description && (
                              <p className="text-sm text-gray-700 mt-2">
                                {evidence.description}
                              </p>
                            )}
                            {evidence.verification_notes && (
                              <p className="text-sm text-gray-700 mt-2">
                                Catatan Verifikasi: {evidence.verification_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div>
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Belum ada log audit
                </p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-600">
                          Oleh: {log.performed_by}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tanggal: {log.performed_at}
                        </p>
                        {log.ip_address && (
                          <p className="text-sm text-gray-600">
                            IP Address: {log.ip_address}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
