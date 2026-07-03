import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

const PendingApprovalsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getPending();
      setUsers(data);
    } catch {
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'approved' | 'rejected') => {
    setProcessingId(userId);
    try {
      await usersAPI.updateStatus(userId, action);
      toast.success(
        action === 'approved'
          ? 'User approved successfully!'
          : 'User rejected.'
      );
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and approve new member registrations
          </p>
        </div>
        <button
          onClick={loadPending}
          className="btn-secondary flex items-center gap-2 text-sm py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Counter Banner */}
      <div className={`card mb-6 border-2 ${users.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
        <div className="flex items-center gap-3">
          {users.length > 0 ? (
            <Clock className="w-7 h-7 text-yellow-600" />
          ) : (
            <CheckCircle className="w-7 h-7 text-green-600" />
          )}
          <div>
            <p className={`font-bold text-lg ${users.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
              {users.length > 0
                ? `${users.length} Registration${users.length !== 1 ? 's' : ''} Pending`
                : 'All Caught Up!'}
            </p>
            <p className={`text-sm ${users.length > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
              {users.length > 0
                ? 'These accounts need your review before they can access the system'
                : 'No pending registrations at the moment'}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Users */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">No pending registrations</p>
          <p className="text-sm mt-1">New registrations will appear here for review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user) => (
            <div key={user._id} className="card border-2 border-yellow-100 hover:border-yellow-300 transition-colors animate-slide-up">
              {/* User Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {user.firstName} {user.lastName}
                  </h3>
                  <span className="badge-pending">Pending Review</span>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-2 text-sm mb-5">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
                {user.owwaId && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{user.owwaId}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{user.address}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400 pt-1">
                  Registered: {format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(user._id, 'approved')}
                  disabled={processingId === user._id}
                  className="flex-1 btn-success flex items-center justify-center gap-1.5 text-sm py-2"
                >
                  {processingId === user._id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(user._id, 'rejected')}
                  disabled={processingId === user._id}
                  className="flex-1 btn-danger flex items-center justify-center gap-1.5 text-sm py-2"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default PendingApprovalsPage;
