import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TraineePlan } from '../types';
import { traineePlansAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TraineePlanPage: React.FC = () => {  // CHANGED NAME to TraineePlanPage
  const { traineeId } = useParams<{ traineeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState<TraineePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (traineeId) {
      fetchTraineePlan(parseInt(traineeId));
    }
  }, [traineeId]);

  const fetchTraineePlan = async (id: number) => {
    try {
      const response = await traineePlansAPI.getByTraineeId(id);
      setPlan(response.data.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch training plan');
    } finally {
      setLoading(false);
    }
  };

  const updateMilestoneStatus = async (milestoneId: number, status: string) => {
    if (!plan) return;

    try {
      const response = await traineePlansAPI.updateMilestone(plan.id, milestoneId, { status });
      const updatedMilestone = response.data.data;
      
      setPlan(prev => prev ? {
        ...prev,
        milestones: prev.milestones.map(m => 
          m.id === milestoneId ? updatedMilestone : m
        )
      } : null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update milestone');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    if (!plan) return 0;
    const completed = plan.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / plan.milestones.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Training Plan Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Plan Found</h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'admin' 
                ? 'Create a training plan for this trainee to get started'
                : 'Your training plan has not been created yet. Please contact your advisor.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Plan</h1>
              <p className="text-gray-600">
                {plan.trainee?.user?.name} • {plan.trainee?.employeeId}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Progress Overview</h2>
            <span className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{plan.milestones.length}</div>
              <div className="text-sm text-gray-600">Total Milestones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {plan.milestones.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {plan.milestones.filter(m => m.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {plan.milestones.filter(m => m.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milestones */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Training Milestones</h2>
              <div className="space-y-4">
                {plan.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                          {milestone.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        {milestone.completedDate && (
                          <span>Completed: {new Date(milestone.completedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {(user?.role === 'admin' || user?.role === 'advisor' || user?.id === plan.trainee?.userId) && (
                        <div className="flex space-x-2 mt-3">
                          {milestone.status !== 'completed' && (
                            <button
                              onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Mark Complete
                            </button>
                          )}
                          {milestone.status !== 'in-progress' && milestone.status !== 'completed' && (
                            <button
                              onClick={() => updateMilestoneStatus(milestone.id, 'in-progress')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Start Progress
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Goals & Information */}
          <div className="space-y-6">
            {/* Plan Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-900">{plan.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{plan.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-gray-900">{new Date(plan.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-gray-900">{new Date(plan.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals</h2>
              <div className="space-y-4">
                {plan.goals.map(goal => (
                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-1">{goal.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        goal.status === 'on-track' ? 'bg-green-100 text-green-800' :
                        goal.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                        goal.status === 'behind' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraineePlanPage;  // CHANGED EXPORT NAME