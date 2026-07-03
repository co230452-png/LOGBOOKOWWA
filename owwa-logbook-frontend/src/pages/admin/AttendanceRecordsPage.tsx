import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Download,
  Search,
  Trash2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

const AttendanceRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await attendanceAPI.getAll(params);
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await attendanceAPI.delete(id);
      toast.success('Record deleted');
      loadRecords();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch all records for export (no pagination)
      const params: any = { page: 1, limit: 10000 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await attendanceAPI.getAll(params);
      const allRecords = data.records;

      // Build CSV content
      const headers = ['#', 'Full Name', 'OWWA ID', 'Email', 'Phone', 'Date', 'Day', 'Time In'];
      const rows = allRecords.map((r: any, idx: number) => [
        idx + 1,
        `${r.userId?.firstName || ''} ${r.userId?.lastName || ''}`.trim(),
        r.userId?.owwaId || '',
        r.userId?.email || '',
        r.userId?.phone || '',
        r.date,
        format(new Date(r.date + 'T00:00:00'), 'EEEE'),
        format(new Date(r.timestamp), 'h:mm a'),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `owwa-attendance-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allRecords.length} records to CSV`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => loadRecords(), 100);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-gray-500 text-sm mt-1">
          View, filter, and export all attendance logs
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label text-xs">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-sm py-2"
            />
          </div>
          <div>
            <label className="form-label text-xs">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input text-sm py-2"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary flex items-center gap-2 py-2">
            <Search className="w-4 h-4" />
            Filter
          </button>
          {(startDate || endDate) && (
            <button onClick={clearFilters} className="btn-secondary text-sm py-2 px-3">
              Clear
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={exporting || records.length === 0}
            className="btn-success flex items-center gap-2 ml-auto py-2 disabled:opacity-50"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">{total}</span> total records
            {(startDate || endDate) && (
              <span className="text-gray-400">
                {startDate && endDate ? ` (${startDate} → ${endDate})` : startDate ? ` (from ${startDate})` : ` (until ${endDate})`}
              </span>
            )}
          </div>
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
            <p className="text-sm mt-1">Try adjusting your date filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Name</th>
                    <th className="table-header hidden sm:table-cell">OWWA ID</th>
                    <th className="table-header hidden md:table-cell">Email</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Time In</th>
                    <th className="table-header text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record, idx) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-400 text-xs">
                        {(page - 1) * 25 + idx + 1}
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-800">
                          {record.userId?.firstName} {record.userId?.lastName}
                        </div>
                        <div className="text-xs text-gray-400 sm:hidden">
                          {record.userId?.owwaId || 'No OWWA ID'}
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">
                        {record.userId?.owwaId || '—'}
                      </td>
                      <td className="table-cell hidden md:table-cell text-gray-500 text-xs">
                        {record.userId?.email}
                      </td>
                      <td className="table-cell">
                        <div>{format(new Date(record.date + 'T00:00:00'), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(record.date + 'T00:00:00'), 'EEEE')}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge-approved">
                          {format(new Date(record.timestamp), 'h:mm a')}
                        </span>
                      </td>
                      <td className="table-cell text-right pr-4">
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                  >
                    ← Prev
                  </button>
                  <span className="flex items-center text-sm text-gray-600 px-2">
                    {page} / {pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                  >
                    Next →
                  </button>
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
