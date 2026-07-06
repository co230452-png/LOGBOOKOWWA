import React, { useEffect, useState } from 'react';
import { CalendarDays, Download, Search, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

const fmt = (d: string | null | undefined) =>
  d ? format(new Date(d), 'h:mm a') : '—';

const fmtMins = (mins: number) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const AttendanceRecordsPage: React.FC = () => {
  const [records, setRecords]   = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadRecords(); }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await attendanceAPI.getAll(params);
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load records'); }
    finally  { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); loadRecords(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await attendanceAPI.delete(id);
      toast.success('Record deleted');
      loadRecords();
    } catch { toast.error('Failed to delete'); }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params: any = { page: 1, limit: 10000 };
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await attendanceAPI.getAll(params);

      const headers = [
        '#', 'Full Name', 'OWWA ID', 'Email', 'Phone',
        'Date',
        'Morning In', 'Morning Out',
        'Afternoon In', 'Afternoon Out',
        'Total Time',
      ];

      const rows = data.records.map((r: any, i: number) => {
        const mIn  = r.morningIn    ? format(new Date(r.morningIn),    'h:mm a') : '';
        const mOut = r.morningOut   ? format(new Date(r.morningOut),   'h:mm a') : '';
        const aIn  = r.afternoonIn  ? format(new Date(r.afternoonIn),  'h:mm a') : '';
        const aOut = r.afternoonOut ? format(new Date(r.afternoonOut), 'h:mm a') : '';
        const total = fmtMins(r.totalMinutes);
        return [
          i + 1,
          `${r.userId?.firstName || ''} ${r.userId?.lastName || ''}`.trim(),
          r.userId?.owwaId || '',
          r.userId?.email  || '',
          r.userId?.phone  || '',
          r.date,
          mIn, mOut, aIn, aOut,
          total,
        ];
      });

      const csv = [headers, ...rows]
        .map(row => row.map((c: unknown) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `owwa-attendance-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.records.length} records`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-gray-500 text-sm mt-1">View, filter, and export all attendance logs</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label text-xs">From Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input text-sm py-2" />
          </div>
          <div>
            <label className="form-label text-xs">To Date</label>
            <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className="form-input text-sm py-2" />
          </div>
          <button onClick={handleSearch} className="btn-primary flex items-center gap-2 py-2">
            <Search className="w-4 h-4" /> Filter
          </button>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setTimeout(loadRecords, 50); }} className="btn-secondary text-sm py-2 px-3">
              Clear
            </button>
          )}
          <button onClick={handleExportCSV} disabled={exporting || records.length === 0}
            className="btn-success flex items-center gap-2 ml-auto py-2 disabled:opacity-50">
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <CalendarDays className="inline w-4 h-4 text-blue-600 mr-1" />
          <span className="font-semibold text-gray-900">{total}</span> total records
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Name</th>
                    <th className="table-header hidden sm:table-cell">OWWA ID</th>
                    <th className="table-header">Date</th>
                    {/* Morning */}
                    <th className="table-header bg-blue-50 text-blue-700">🌅 AM In</th>
                    <th className="table-header bg-blue-50 text-blue-700">🌅 AM Out</th>
                    {/* Afternoon */}
                    <th className="table-header bg-orange-50 text-orange-700">🌇 PM In</th>
                    <th className="table-header bg-orange-50 text-orange-700">🌇 PM Out</th>
                    {/* Total */}
                    <th className="table-header bg-green-50 text-green-700">⏱ Total</th>
                    <th className="table-header text-right pr-4">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r, idx) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-400 text-xs">{(page - 1) * 25 + idx + 1}</td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-800">
                          {r.userId?.firstName} {r.userId?.lastName}
                        </div>
                        <div className="text-xs text-gray-400 sm:hidden">{r.userId?.owwaId || ''}</div>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">{r.userId?.owwaId || '—'}</td>
                      <td className="table-cell font-medium">{r.date}</td>
                      <td className="table-cell bg-blue-50/40">
                        {r.morningIn ? <span className="badge-approved">{fmt(r.morningIn)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-blue-50/40">
                        {r.morningOut ? <span className="badge-approved">{fmt(r.morningOut)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-orange-50/40">
                        {r.afternoonIn ? <span className="badge-approved">{fmt(r.afternoonIn)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-orange-50/40">
                        {r.afternoonOut ? <span className="badge-approved">{fmt(r.afternoonOut)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-green-50/40">
                        {r.totalMinutes > 0
                          ? <span className="font-semibold text-green-700">{fmtMins(r.totalMinutes)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-right pr-4">
                        <button onClick={() => handleDelete(r._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">← Prev</button>
                  <span className="flex items-center text-sm text-gray-600 px-2">{page} / {pages}</span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AttendanceRecordsPage;
