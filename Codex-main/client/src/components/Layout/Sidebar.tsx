import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get user's trainee record if they are a trainee
  const userTrainee = user?.role === 'trainee' ? { id: 1 } : null; // Temporary - we'll fetch this properly later

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">SATORP Trainee</h1>
        <p className="text-sm text-gray-600">Management System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive('/') 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </Link>

        {(user?.role === 'admin' || user?.role === 'advisor') && (
          <Link
            to="/trainees"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/trainees') 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>Trainees</span>
          </Link>
        )}

        <Link
          to="/tasks"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive('/tasks') 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Tasks</span>
        </Link>

        <Link
          to="/documents"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive('/documents') 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Documents</span>
        </Link>

        {/* Help Requests - Only for Admins and Advisors */}
        {(user?.role === 'admin' || user?.role === 'advisor') && (
          <Link
            to="/help-requests"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive('/help-requests') 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help Requests</span>
          </Link>
        )}

        <Link
          to="/chat"
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive('/chat') 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Chat</span>
        </Link>

        {/* Trainee Plan Link - Only for trainees */}
        {user?.role === 'trainee' && userTrainee && (
          <Link
            to={`/trainee-plan/${userTrainee.id}`}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(`/trainee-plan/${userTrainee.id}`) 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>My Training Plan</span>
          </Link>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;