import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, traineesAPI } from '../services/api';
import { HelpRequest, HelpRequestStats, Trainee } from '../types';

const statusBadgeStyles: Record<HelpRequest['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

const HelpRequests: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [stats, setStats] = useState<HelpRequestStats | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  
  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [requestsRes, statsRes, traineesRes] = await Promise.all([
          tasksAPI.getHelpRequests(),
          tasksAPI.getHelpRequestStats(),
          traineesAPI.getAll(),
        ]);

        setRequests(Array.isArray(requestsRes.data.data) ? requestsRes.data.data : []);
        setStats(statsRes.data.data);
        setTrainees(Array.isArray(traineesRes.data.data) ? traineesRes.data.data : []);
      } catch (error) {
        console.error('Failed to load help requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredRequests = useMemo(() => {
    if (!user) {
      return [] as HelpRequest[];
    }

    if (user.role === 'trainee') {
      const traineeRecord = trainees.find((record) => record.userId === user.id);
      if (!traineeRecord) {
        return [];
      }
      return requests.filter((request) => request.traineeId === traineeRecord.id);
    }

    if (user.role === 'advisor') {
      const traineeIds = trainees.filter((record) => record.advisorId === user.id).map((record) => record.id);
      return requests.filter((request) => traineeIds.includes(request.traineeId));
    }

    return requests;
  }, [requests, trainees, user]);

  const getTraineeName = (request: HelpRequest) => {
    if (request.trainee?.user) {
      return request.trainee.user.name;
    }

    const trainee = trainees.find((record) => record.id === request.traineeId);
    if (!trainee) {
      return 'Unknown Trainee';
    }

    return trainee.user?.name ?? 'Unknown Trainee';
  };

  const handleResolve = async (requestId: number) => {
    const response = await tasksAPI.resolveHelpRequest(requestId);
    setRequests((prev) =>
      prev.map((request) => (request.id === requestId ? response.data.data : request))
    );
  };

  if (user?.role === 'trainee') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Limited</h3>
            <p className="text-gray-600 mb-4">
              Help requests are managed by advisors and administrators. You can submit a request directly from the Tasks page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((key) => (
                <div key={key} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Requests</h1>
          <p className="text-gray-600">Manage and resolve trainee help requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">❓</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Help Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Track open issues and follow up with trainees</p>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredRequests.length === 0 && (
              <div className="p-6 text-center text-gray-500">No help requests to display.</div>
            )}
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {getTraineeName(request).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{request.message}</h3>
                    <p className="text-sm text-gray-600">
                      {getTraineeName(request)} • Priority {request.urgency}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted on {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeStyles[request.status]}`}>
                    {request.status === 'pending' ? 'Pending' : 'Resolved'}
                  </span>
                  {request.status === 'pending' && user?.role !== 'trainee' && (
                    <button
                      onClick={() => handleResolve(request.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpRequests;
