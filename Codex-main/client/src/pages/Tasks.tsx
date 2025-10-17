import React, { useState, useEffect } from 'react';
import { tasksAPI, traineesAPI } from '../services/api';
import { Task, Trainee, HelpRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/Tasks/TaskForm';
import ProgressUpdate from '../components/Tasks/ProgressUpdate';
import HelpRequestForm from '../components/Tasks/HelpRequestForm';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<Task | null>(null);
  const [requestingHelp, setRequestingHelp] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, traineesRes, helpRequestsRes] = await Promise.all([
        tasksAPI.getAll(),
        traineesAPI.getAll(),
        tasksAPI.getHelpRequests(),
      ]);

      setTasks(tasksRes.data.data);
      setTrainees(traineesRes.data.data);
      setHelpRequests(helpRequestsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add missing CRUD functions
  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await tasksAPI.create(taskData);
      setTasks(prev => [...prev, response.data.data]);
      setShowForm(false);
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!editingTask) return;
    
    try {
      const response = await tasksAPI.update(editingTask.id, taskData);
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id ? response.data.data : t
      ));
      setEditingTask(null);
      alert('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task. Please try again.');
    }
  };

const handleDeleteTask = async (taskId: number) => {
  if (!window.confirm('Are you sure you want to delete this task?')) return;

  setActionLoading(taskId);
  try {
    await tasksAPI.delete(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    alert('Task deleted successfully!');
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Error deleting task. Please try again.');
  } finally {
    setActionLoading(null);
  }
};

  const handleUpdateProgress = async (taskId: number, progress: number, notes?: string) => {
    setActionLoading(taskId);
    try {
      const response = await tasksAPI.updateProgress(taskId, progress, notes);
      setTasks(prev => prev.map(t => 
        t.id === taskId ? response.data.data : t
      ));
      setUpdatingProgress(null);
      alert('Progress updated successfully!');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestHelp = async (taskId: number, message: string) => {
    setActionLoading(taskId);
    try {
      const response = await tasksAPI.requestHelp(taskId, message);
      setHelpRequests(prev => [...prev, response.data.data]);
      setRequestingHelp(null);
      alert('Help request sent successfully! Your advisor will contact you soon.');
    } catch (error) {
      console.error('Error sending help request:', error);
      alert('Error sending help request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getTaskProgress = (taskId: number) => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    return task?.progress ?? 0;
  };

  const hasPendingHelpRequest = (taskId: number) => {
    return helpRequests.some(request => 
      request.taskId === taskId && 
      request.status === 'pending' &&
      request.traineeId === (trainees.find((t) => t.userId === currentUser?.id)?.id ?? -1)
    );
  };

  // Check user permissions
  const isAdmin = currentUser?.role === 'admin';
  const isAdvisor = currentUser?.role === 'advisor';
  const isTrainee = currentUser?.role === 'trainee';
  const canManageTasks = isAdmin || isAdvisor;

  // For trainees, only show their own tasks
  const userTasks = isTrainee 
    ? tasks.filter(task => {
        const userTrainee = trainees.find(t => t.userId === currentUser.id);
        return userTrainee && task.traineeId === userTrainee.id;
      })
    : tasks;

  const filteredTasks = filterStatus === 'all' 
    ? userTasks 
    : userTasks.filter(task => task.status === filterStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-satorp-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {filteredTasks.length} tasks
          </span>
          {canManageTasks && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-satorp-blue text-white px-4 py-2 rounded-lg hover:bg-satorp-darkblue transition duration-200 font-medium"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => {
          const progress = getTaskProgress(task.id);
          const hasHelpRequest = hasPendingHelpRequest(task.id);
          
          return (
            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <div className="flex space-x-2">
                  {canManageTasks && (
                    <>
                      <button
                        onClick={() => setEditingTask(task)}
                        disabled={actionLoading === task.id}
                        className="text-satorp-blue hover:text-satorp-darkblue disabled:opacity-50 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={actionLoading === task.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm"
                      >
                        {actionLoading === task.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-sm">{task.description}</p>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Your Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-satorp-blue h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {isTrainee && (
                  <button
                    onClick={() => setUpdatingProgress(task)}
                    disabled={actionLoading === task.id}
                    className="mt-2 text-xs text-satorp-blue hover:text-satorp-darkblue disabled:opacity-50"
                  >
                    Update Progress
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned to:</span>
                  <span className="font-medium">{task.trainee?.user?.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </div>

              {/* Help Request Section for Trainees */}
              {isTrainee && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {hasHelpRequest ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-2">⏳</span>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Help Request Sent</p>
                          <p className="text-xs text-blue-600">Your advisor will contact you soon</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRequestingHelp(task)}
                      disabled={actionLoading === task.id}
                      className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition duration-200 text-sm font-medium"
                    >
                      🆘 Request Help
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isTrainee ? "No tasks assigned" : "No tasks found"}
          </h3>
          <p className="text-gray-600">
            {isTrainee 
              ? "You don't have any tasks assigned yet. Please check with your advisor."
              : filterStatus !== 'all' 
                ? `No ${filterStatus} tasks available.`
                : "No tasks have been created yet."
            }
          </p>
          {canManageTasks && filterStatus === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-satorp-blue text-white px-4 py-2 rounded-lg hover:bg-satorp-darkblue transition duration-200"
            >
              Create Your First Task
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {(showForm || editingTask) && canManageTasks && (
        <TaskForm
          task={editingTask || undefined}
          trainees={trainees}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          isEditing={!!editingTask}
        />
      )}

      {updatingProgress && (
        <ProgressUpdate
          taskId={updatingProgress.id}
          currentProgress={getTaskProgress(updatingProgress.id)}
          onUpdate={handleUpdateProgress}
          onCancel={() => setUpdatingProgress(null)}
        />
      )}

      {requestingHelp && (
        <HelpRequestForm
          taskId={requestingHelp.id}
          taskTitle={requestingHelp.title}
          onSubmit={handleRequestHelp}
          onCancel={() => setRequestingHelp(null)}
        />
      )}
    </div>
  );
};

export default Tasks;