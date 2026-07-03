import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OWWALogo from '../shared/OWWALogo';

const userNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'My Attendance', icon: ClipboardList, path: '/attendance' },
];

const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink: React.FC<{ item: typeof userNavItems[0] }> = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-blue-800 text-white shadow-sm'
            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'
        }`}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {item.label}
        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-100">
        <OWWALogo size="md" />
        <p className="text-xs text-gray-500 mt-2 font-medium">Logbook System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {userNavItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <OWWALogo size="sm" />
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl w-full mx-auto animate-fade-in">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white mt-auto">
          © {new Date().getFullYear()} OWWA Region IX — Zamboanga Peninsula
        </footer>
      </div>
    </div>
  );
};

export default UserLayout;
