import React, { useEffect, useState } from 'react';
import {
  Search,
  Users as UsersIcon,
  Trash2,
  Mail,
  Phone,
  CreditCard,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
];

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll({
        status: statusFilter,
        search: search || undefined,
      });
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This will also delete their attendance records. This cannot be undone.`)) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge-approved">Approved</span>;
    if (status === 'pending') return <span className="badge-pending">Pending</span>;
    return <span className="badge-rejected">Rejected</span>;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all registered OWWA Region IX members
          </p>
        </div>
        <button onClick={loadUsers} className="btn-secondary flex items-center gap-2 text-sm py-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or OWWA ID..."
              className="form-input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary py-2.5">
            Search
          </button>
        </form>

        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UsersIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header hidden md:table-cell">Contact</th>
                  <th className="table-header hidden sm:table-cell">OWWA ID</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden lg:table-cell">Registered</th>
                  <th className="table-header text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="font-medium text-gray-800 hover:text-blue-700 text-left"
                      >
                        {user.firstName} {user.lastName}
                      </button>
                      <div className="text-xs text-gray-400 md:hidden">{user.email}</div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="text-gray-600 text-xs">{user.email}</div>
                      <div className="text-gray-400 text-xs">{user.phone}</div>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">
                      {user.owwaId || '—'}
                    </td>
                    <td className="table-cell">{statusBadge(user.status)}</td>
                    <td className="table-cell hidden lg:table-cell text-gray-500 text-xs">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell text-right pr-4">
                      <button
                        onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-400 mt-3 text-center">
        Showing {users.length} user{users.length !== 1 ? 's' : ''}
      </p>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-bold">
                  {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                {statusBadge(selectedUser.status)}
              </div>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{selectedUser.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{selectedUser.phone}</span>
              </div>
              {selectedUser.owwaId && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span>{selectedUser.owwaId}</span>
                </div>
              )}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                Registered {format(new Date(selectedUser.createdAt), 'MMMM d, yyyy')}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 btn-secondary text-sm py-2"
              >
                Close
              </button>
              {selectedUser.role !== 'admin' && (
                <button
                  onClick={() => handleDelete(selectedUser._id, `${selectedUser.firstName} ${selectedUser.lastName}`)}
                  className="flex-1 btn-danger flex items-center justify-center gap-1.5 text-sm py-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagementPage;
