import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Clock, CalendarDays, TrendingUp, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usersAPI, attendanceAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([usersAPI.getStats(), attendanceAPI.getToday()])
      .then(([statsRes, todayRes]) => {
        setStats(statsRes.data);
        setTodayRecords(todayRes.data.records);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      icon: Users,
      color: 'blue',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/admin/users',
    },
    {
      label: 'Pending Approval',
      value: stats?.pendingUsers ?? '—',
      icon: Clock,
      color: 'yellow',
      bg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      link: '/admin/pending',
      alert: stats?.pendingUsers > 0,
    },
    {
      label: "Today's Attendance",
      value: stats?.todayAttendance ?? '—',
      icon: UserCheck,
      color: 'green',
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/admin/attendance',
    },
    {
      label: 'Total Logs',
      value: stats?.totalAttendance ?? '—',
      icon: TrendingUp,
      color: 'purple',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/admin/attendance',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link to="/admin/scanner" className="btn-primary flex items-center gap-2 w-fit">
          <QrCode className="w-4 h-4" />
          Open Scanner
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`card hover:shadow-md transition-shadow relative ${card.alert ? 'ring-2 ring-yellow-400' : ''}`}
          >
            {card.alert && (
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full" />
            )}
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div className="text-3xl font-bold text-gray-800">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Today's Attendance */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-800" />
            <h2 className="text-lg font-semibold text-gray-800">
              Today's Attendance
              <span className="ml-2 text-sm text-gray-400 font-normal">
                ({todayRecords.length} logged)
              </span>
            </h2>
          </div>
          <Link to="/admin/attendance" className="text-sm text-blue-700 font-medium hover:underline">
            View all records →
          </Link>
        </div>

        {todayRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No attendance logged today</p>
            <p className="text-sm mt-1">Use the QR scanner to log attendance</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header hidden sm:table-cell">OWWA ID</th>
                  <th className="table-header">AM In</th>
                  <th className="table-header hidden md:table-cell">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="font-medium text-gray-800">
                        {record.userId?.firstName} {record.userId?.lastName}
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">
                      {record.userId?.owwaId || '—'}
                    </td>
                    <td className="table-cell">
                      <span className="badge-approved">
                        {record.morningIn ? format(new Date(record.morningIn), "h:mm a") : "—"}
                      </span>
                    </td>
                    <td className="table-cell hidden md:table-cell text-gray-500 text-xs">
                      {record.userId?.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Scan QR Code', desc: 'Log attendance via camera', icon: QrCode, path: '/admin/scanner', color: 'bg-blue-800' },
          { label: 'Pending Accounts', desc: `${stats?.pendingUsers || 0} awaiting approval`, icon: Clock, path: '/admin/pending', color: 'bg-yellow-600' },
          { label: 'All Users', desc: `${stats?.approvedUsers || 0} approved members`, icon: Users, path: '/admin/users', color: 'bg-green-700' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className="card hover:shadow-md transition-all group flex items-center gap-4"
          >
            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{action.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
