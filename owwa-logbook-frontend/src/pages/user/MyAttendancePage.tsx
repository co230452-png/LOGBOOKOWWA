import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, Clock } from 'lucide-react';
import { attendanceAPI } from '../../utils/api';
import UserLayout from '../../components/user/UserLayout';
import { format } from 'date-fns';

const fmt = (d: string | null | undefined) =>
  d ? format(new Date(d), 'h:mm a') : '—';

const fmtMins = (mins: number) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const MyAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAttendance(); }, [page]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getMy({ page, limit: 20 });
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } finally { setLoading(false); }
  };

  const totalMinutesAll = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance History</h1>
        <p className="text-gray-500 text-sm mt-1">Your complete attendance log with time breakdown</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card bg-gradient-to-r from-blue-800 to-blue-700 text-white border-0">
          <CalendarDays className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-blue-200 text-sm">Days Attended</div>
        </div>
        <div className="card bg-gradient-to-r from-green-700 to-green-600 text-white border-0">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <div className="text-3xl font-bold">{fmtMins(totalMinutesAll)}</div>
          <div className="text-green-200 text-sm">Total Time (this page)</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No attendance records yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Date</th>
                    <th className="table-header bg-blue-50 text-blue-700">🌅 AM In</th>
                    <th className="table-header bg-blue-50 text-blue-700">🌅 AM Out</th>
                    <th className="table-header bg-orange-50 text-orange-700">🌇 PM In</th>
                    <th className="table-header bg-orange-50 text-orange-700">🌇 PM Out</th>
                    <th className="table-header bg-green-50 text-green-700">⏱ Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r, idx) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-400">{(page - 1) * 20 + idx + 1}</td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-800">{r.date}</div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(r.date + 'T00:00:00'), 'EEE')}
                        </div>
                      </td>
                      <td className="table-cell bg-blue-50/30">
                        {r.morningIn ? <span className="text-blue-700 font-medium">{fmt(r.morningIn)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-blue-50/30">
                        {r.morningOut ? <span className="text-blue-700 font-medium">{fmt(r.morningOut)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-orange-50/30">
                        {r.afternoonIn ? <span className="text-orange-700 font-medium">{fmt(r.afternoonIn)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-orange-50/30">
                        {r.afternoonOut ? <span className="text-orange-700 font-medium">{fmt(r.afternoonOut)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell bg-green-50/30">
                        {r.totalMinutes > 0
                          ? <span className="font-bold text-green-700">{fmtMins(r.totalMinutes)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} of {pages} ({total} records)</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Previous</button>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default MyAttendancePage;
