import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    setIsProfileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  // Removed the unused fallbackLogoSVG variable

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-green-600 shadow-lg border-b border-white/10 h-16 flex items-center justify-between px-6">
      {/* LEFT SIDE */}
      <div className="flex items-center space-x-3">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5 border border-white/20">
          <div className="flex items-center bg-transparent p-0 m-0">
            <img
              src="/logo.png"
              alt="SATORP"
              className="h-10 w-10 object-contain border-none"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white leading-tight">
            SATORP
          </span>
          <span className="text-xs text-white/80 font-medium leading-tight">
            Trainee System
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      {user && (
        <div className="flex items-center space-x-4" ref={dropdownRef}>
          {/* Status */}
          <div className="hidden md:block bg-white/10 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white">Online</span>
            </div>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-white/80 capitalize leading-tight">
                  {user.role}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {user.name?.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-white transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-green-50 rounded-t-xl">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {user.role}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <svg
                      className="w-4 h-4 mr-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    My Profile
                  </button>
                </div>

                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 rounded-b-xl"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;