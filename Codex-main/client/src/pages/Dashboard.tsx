import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, traineesAPI, usersAPI } from '../services/api';
import { HelpRequest, Task, Trainee, User } from '../types';
import ChatSessionsCard from '../components/Dashboard/ChatSessionsCard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, helpRes, traineesRes] = await Promise.all([
          tasksAPI.getAll(),
          tasksAPI.getHelpRequests(),
          traineesAPI.getAll(),
        ]);

        setTasks(Array.isArray(tasksRes.data.data) ? tasksRes.data.data : []);
        setHelpRequests(Array.isArray(helpRes.data.data) ? helpRes.data.data : []);
        setTrainees(Array.isArray(traineesRes.data.data) ? traineesRes.data.data : []);

        if (user.role === 'admin') {
          const usersRes = await usersAPI.getAll();
          setUsersList(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);
        } else {
          setUsersList([]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const myTraineeRecord = useMemo(() => {
    if (!user || user.role !== 'trainee') {
      return null;
    }
    return trainees.find((record) => record.userId === user.id) ?? null;
  }, [trainees, user]);

  const advisorTrainees = useMemo(() => {
    if (!user || user.role !== 'advisor') {
      return trainees;
    }
    return trainees.filter((record) => record.advisorId === user.id);
  }, [trainees, user]);

  const visibleTasks = useMemo(() => {
    if (!user) {
      return [] as Task[];
    }

    if (user.role === 'trainee') {
      return tasks.filter((task) => task.traineeId === myTraineeRecord?.id);
    }

    if (user.role === 'advisor') {
      const traineeIds = advisorTrainees.map((record) => record.id);
      return tasks.filter((task) => traineeIds.includes(task.traineeId));
    }

    return tasks;
  }, [tasks, user, myTraineeRecord, advisorTrainees]);

  const stats = useMemo(() => {
    const assignedTasks = visibleTasks.length;
    const completedTasks = visibleTasks.filter((task) => task.status === 'completed').length;
    const pendingTasks = visibleTasks.filter((task) => task.status !== 'completed').length;

    const relevantHelpRequests = helpRequests.filter((request) =>
      visibleTasks.some((task) => task.id === request.taskId) && request.status === 'pending'
    );

    return {
      assignedTasks,
      completedTasks,
      pendingTasks,
      pendingHelp: relevantHelpRequests.length,
      totalTrainees: trainees.length,
      systemPendingTasks: tasks.filter((task) => task.status !== 'completed').length,
      activeUsers: usersList.filter((candidate) => candidate.isActive !== false).length,
    };
  }, [visibleTasks, helpRequests, trainees, tasks, usersList]);

  const upcomingDeadlines = useMemo(() => {
    return [...visibleTasks]
      .filter((task) => task.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [visibleTasks]);

  const renderStatCard = (label: string, value: number, accent: string) => (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className={`text-3xl font-bold ${accent} mb-2`}>{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 text-lg">
              {user?.role === 'trainee'
                ? 'Track your progress and get help when you need it.'
                : user?.role === 'advisor'
                ? 'Monitor trainee progress and provide support.'
                : 'Manage the trainee system and oversee operations.'}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold capitalize">{user?.role}</div>
            <div className="text-blue-100 text-sm">Role</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {user?.role === 'admin' ? (
              <>
                {renderStatCard('All Trainees', stats.totalTrainees, 'text-blue-600')}
                {renderStatCard('Active Users', stats.activeUsers, 'text-green-600')}
                {renderStatCard('Pending Tasks', stats.systemPendingTasks, 'text-orange-600')}
              </>
            ) : (
              <>
                {renderStatCard('Assigned Tasks', stats.assignedTasks, 'text-blue-600')}
                {renderStatCard('Completed', stats.completedTasks, 'text-green-600')}
                {renderStatCard('Pending Help', stats.pendingHelp, 'text-orange-600')}
              </>
            )}
          </div>

          {user?.role === 'admin' ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{usersList.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">Active Help Requests</p>
                  <p className="text-2xl font-bold text-green-600">{helpRequests.filter((req) => req.status === 'pending').length}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-800">Completed Tasks</p>
                  <p className="text-2xl font-bold text-orange-600">{tasks.filter((task) => task.status === 'completed').length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-800">Advisor Chats</p>
                  <p className="text-2xl font-bold text-purple-600">{trainees.filter((record) => record.advisorId).length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {visibleTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        ✅
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {visibleTasks.length === 0 && (
                    <p className="text-sm text-gray-600">No tasks assigned yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                <div className="space-y-4">
                  {visibleTasks.map((task) => (
                    <div key={task.id}>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{task.title}</span>
                        <span>{task.progress ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(task.progress ?? 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {visibleTasks.length === 0 && (
                    <p className="text-sm text-gray-600">No active tasks to display.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {user?.role !== 'admin' && <ChatSessionsCard />}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {user?.role === 'admin' ? (
                <>
                  <button
                    onClick={() => navigate('/chat')}
                    className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">💬</span>
                    <span>All Chats</span>
                  </button>
                  <button
                    onClick={() => navigate('/trainees')}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">👥</span>
                    <span>All Trainees</span>
                  </button>
                  <button
                    onClick={() => navigate('/users')}
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">👤</span>
                    <span>Users</span>
                  </button>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">✅</span>
                    <span>Manage Tasks</span>
                  </button>
                  <button
                    onClick={() => navigate('/help-requests')}
                    className="w-full bg-indigo-500 text-white py-3 px-4 rounded-lg hover:bg-indigo-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">🆘</span>
                    <span>Help Requests</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">✅</span>
                    <span>View My Tasks</span>
                  </button>
                  <button
                    onClick={() => navigate('/help-requests')}
                    className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">🆘</span>
                    <span>Help Requests</span>
                  </button>
                  <button
                    onClick={() => navigate('/documents')}
                    className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">📁</span>
                    <span>Documents</span>
                  </button>
                  <button
                    onClick={() => navigate('/chat')}
                    className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors duration-200 text-left flex items-center space-x-3"
                  >
                    <span className="text-xl">💬</span>
                    <span>Open Chat</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {user?.role !== 'admin' && upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => {
                  const dueDate = new Date(task.dueDate);
                  const daysRemaining = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const badgeColor =
                    daysRemaining <= 3
                      ? 'bg-red-500'
                      : daysRemaining <= 7
                      ? 'bg-yellow-500'
                      : 'bg-blue-500';

                  return (
                    <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">Due {dueDate.toLocaleDateString()}</p>
                      </div>
                      <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded-full`}>
                        {daysRemaining} days
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
