import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import OWWALogo from '../../components/shared/OWWALogo';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Will redirect after context updates
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Redirect after login
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-blue-800 to-blue-400 flex flex-col">

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-slide-up">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-8 text-center">
              <div className="flex justify-center mb-4">
                <img src="/owwa-icon.jpg" alt="OWWA Logo" className="text-white h-[60px] rounded-full" />
              </div>
              <h1 className="text-white text-xl font-bold">Logbook System</h1>
              <p className="text-blue-200 text-sm mt-1">Region IX — Zamboanga Peninsula</p>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <h2 className="text-gray-800 text-lg font-semibold mb-6 text-center">
                Sign in to your account
              </h2>

              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input pl-10"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pl-10 pr-10"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-800 font-semibold hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>


        </div>
      </div>

      <footer className="text-center text-xs text-blue-300 py-4">
        © {new Date().getFullYear()} OWWA Region IX. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
