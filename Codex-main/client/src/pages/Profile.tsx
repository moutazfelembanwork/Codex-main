
import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="h-20 w-20 bg-satorp-blue rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user.name.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
              user.role === 'advisor' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900">{user.department || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">User Role</label>
                <p className="text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Account Status</label>
                <p className="text-green-600 font-semibold">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-lg">💡</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Development Mode
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                This is a demonstration profile page. In a production environment, 
                you would see more detailed information and settings options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;