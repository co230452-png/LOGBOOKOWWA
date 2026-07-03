import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, Search } from 'lucide-react';
import { attendanceAPI } from '../../utils/api';
import UserLayout from '../../components/user/UserLayout';
import { format } from 'date-fns';

const MyAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [page]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getMy({ page, limit: 20 });
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance History</h1>
        <p className="text-gray-500 text-sm mt-1">Your complete attendance log</p>
      </div>

      {/* Stats Banner */}
      <div className="card mb-6 bg-gradient-to-r from-blue-800 to-blue-700 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-blue-200 text-sm">Total Days Attended</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Attendance Records</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No attendance records yet</p>
            <p className="text-sm mt-1">Your attendance will appear here once scanned</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Day</th>
                    <th className="table-header">Time</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record, idx) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-400">
                        {(page - 1) * 20 + idx + 1}
                      </td>
                      <td className="table-cell font-medium">
                        {format(new Date(record.date), 'MMMM d, yyyy')}
                      </td>
                      <td className="table-cell text-gray-500">
                        {format(new Date(record.date), 'EEEE')}
                      </td>
                      <td className="table-cell">
                        {format(new Date(record.timestamp), 'h:mm a')}
                      </td>
                      <td className="table-cell">
                        <span className="badge-approved flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Present
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {page} of {pages} ({total} total records)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                  >
                    Next
                  </button>
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
