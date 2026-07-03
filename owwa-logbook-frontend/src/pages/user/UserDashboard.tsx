import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  CalendarDays,
  RefreshCw,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, authAPI } from '../../utils/api';
import UserLayout from '../../components/user/UserLayout';
import { format } from 'date-fns';

const UserDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [loadingQR, setLoadingQR] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const { data } = await attendanceAPI.getMy({ limit: 5 });
      setRecentAttendance(data.records);
      setTotalDays(data.total);
    } catch (err) {
      // silent fail
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleRegenerateQR = async () => {
    setLoadingQR(true);
    try {
      await authAPI.regenerateQR();
      await refreshUser();
      toast.success('QR Code refreshed successfully!');
    } catch {
      toast.error('Failed to refresh QR Code');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDownloadQR = () => {
    if (!user?.qrCode) return;
    const link = document.createElement('a');
    link.href = user.qrCode;
    link.download = `owwa-qr-${user.firstName}-${user.lastName}.png`;
    link.click();
    toast.success('QR Code downloaded!');
  };

  const qrPayload = JSON.stringify({ userId: user?._id });

  return (
    <UserLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Your Attendance QR Code</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Present this code at the OWWA scanner
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateQR}
                  disabled={loadingQR}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingQR ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3"
                >
                  <Download className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center py-6 bg-gradient-to-b from-blue-50 to-white rounded-xl border border-blue-100">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 mb-4">
                <QRCode
                  value={qrPayload}
                  size={220}
                  fgColor="#1e3a8a"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <p className="text-blue-800 font-bold text-base mt-2">
                {user?.firstName} {user?.lastName}
              </p>
              {user?.owwaId && (
                <p className="text-gray-500 text-sm">{user.owwaId}</p>
              )}
              <div className="flex items-center gap-1.5 mt-3 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Account Approved
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              This QR code is unique to your account. Keep it secure.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Stats Card */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Attendance Summary
            </h3>
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-blue-800">{totalDays}</div>
              <div className="text-sm text-gray-500 mt-1">Total Days Logged</div>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-blue-50 rounded-lg p-3">
              <CalendarDays className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-xs text-blue-700">
                Attendance is logged once per day via QR scan
              </span>
            </div>
          </div>

          {/* Profile Card */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Your Profile
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800 break-all">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{user?.phone}</p>
                </div>
              </div>
              {user?.owwaId && (
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">OWWA ID</p>
                    <p className="font-medium text-gray-800">{user.owwaId}</p>
                  </div>
                </div>
              )}
              {user?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="font-medium text-gray-800">{user.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      {!loadingAttendance && recentAttendance.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Recent Attendance</h3>
            <a href="/attendance" className="text-sm text-blue-700 font-medium hover:underline">
              View all →
            </a>
          </div>
          <div className="space-y-2">
            {recentAttendance.map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between py-2.5 px-4 bg-green-50 rounded-lg border border-green-100"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {format(new Date(record.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(record.timestamp), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </UserLayout>
  );
};

export default UserDashboard;
