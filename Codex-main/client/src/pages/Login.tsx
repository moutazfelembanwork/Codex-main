import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user was redirected to login, return them to that page after successful login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call login from AuthContext (should handle token and user info)
      const success = await login(email, password);

      if (success) {
        navigate(from, { replace: true }); // ✅ Redirect after successful login
      } else {
        setError('❌ Invalid email or password. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('❌ Invalid email or password. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full blur-xl"></div>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-8 relative z-10 transform hover:scale-[1.02] transition-all duration-300">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-8">
            <img src="/logo.png" alt="SATORP" className="h-40 object-contain" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Trainee Hub</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p
              className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-center text-sm font-medium animate-fadeIn"
              style={{ transition: 'opacity 0.5s ease' }}
            >
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg">Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="text-lg">Sign in</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2 text-center">
            Demo Accounts
          </h3>
          <div className="text-xs text-blue-700 space-y-1 text-center">
            <div>
              <strong>Admin:</strong> admin@satorp.com / password
            </div>
            <div>
              <strong>Advisor:</strong> advisor@satorp.com / password
            </div>
            <div>
              <strong>Trainee:</strong> trainee@satorp.com / password
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Secure access to SATORP Trainee Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
