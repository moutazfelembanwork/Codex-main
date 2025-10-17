import React, { useState, useEffect } from 'react';
import { traineesAPI, usersAPI } from '../services/api';
import { Trainee, CreateTraineeData, UpdateTraineeData, User } from '../types';
import TraineeForm from '../components/Trainees/TraineeForm';
import { useAuth } from '../context/AuthContext';

const Trainees: React.FC = () => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const traineesRes = await traineesAPI.getAll();
        setTrainees(Array.isArray(traineesRes.data.data) ? traineesRes.data.data : []);

        if (currentUser?.role === 'admin') {
          const usersRes = await usersAPI.getAll();
          setUsers(Array.isArray(usersRes.data.data) ? usersRes.data.data : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      setLoading(true);
      fetchData();
    }
  }, [currentUser]);

  const handleCreateTrainee = async (traineeData: CreateTraineeData | UpdateTraineeData) => {
    try {
      // Type guard to ensure it's CreateTraineeData
      if (!('userId' in traineeData)) {
        throw new Error('User ID is required for creating a trainee');
      }
      
      const response = await traineesAPI.create(traineeData as CreateTraineeData);
      const createdTrainee = response.data.data;
      if (createdTrainee) {
        setTrainees(prev => [...prev, createdTrainee]);
      }
      setShowForm(false);
      alert('Trainee created successfully!');
    } catch (error: any) {
      console.error('Error creating trainee:', error);
      alert(error.message || 'Error creating trainee. Please try again.');
    }
  };

  const handleUpdateTrainee = async (traineeData: CreateTraineeData | UpdateTraineeData) => {
    if (!editingTrainee) return;

    setActionLoading(editingTrainee.id);
    try {
      const response = await traineesAPI.update(editingTrainee.id, traineeData as UpdateTraineeData);
      const updatedTrainee = response.data.data;
      if (updatedTrainee) {
        setTrainees(prev => prev.map(t =>
          t.id === editingTrainee.id ? updatedTrainee : t
        ));
      }
      setEditingTrainee(null);
      alert('Trainee updated successfully!');
    } catch (error) {
      console.error('Error updating trainee:', error);
      alert('Error updating trainee. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTrainee = async (traineeId: number) => {
   if (!window.confirm('Are you sure you want to delete this trainee?')) return;


    setActionLoading(traineeId);
    try {
      await traineesAPI.delete(traineeId);
      setTrainees(prev => prev.filter(t => t.id !== traineeId));
      alert('Trainee deleted successfully!');
    } catch (error) {
      console.error('Error deleting trainee:', error);
      alert('Error deleting trainee. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (trainee: Trainee) => {
    setEditingTrainee(trainee);
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

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
        <h1 className="text-3xl font-bold text-gray-900">Trainees</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {trainees.length} trainees
          </span>
          {/* Only show Add button for admins */}
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-satorp-blue text-white px-4 py-2 rounded-lg hover:bg-satorp-darkblue transition duration-200 font-medium"
            >
              + Add Trainee
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Trainees</h2>
          {!isAdmin && (
            <p className="text-sm text-gray-600 mt-1">
              Viewing trainee information. Only administrators can modify trainee records.
            </p>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advisor
                </th>
                {/* Only show Actions column for admins */}
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trainees.map((trainee) => (
                <tr key={trainee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-satorp-blue rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {trainee.user?.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trainee.user?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trainee.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{trainee.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(trainee.startDate).toLocaleDateString()} - {' '}
                      {new Date(trainee.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      trainee.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : trainee.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {trainee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trainee.advisor?.name || 'Not assigned'}
                  </td>
                  {/* Only show action buttons for admins */}
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(trainee)}
                          disabled={actionLoading === trainee.id}
                          className="text-satorp-blue hover:text-satorp-darkblue disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTrainee(trainee.id)}
                          disabled={actionLoading === trainee.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {actionLoading === trainee.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal - Only show for admins */}
      {(showForm || editingTrainee) && isAdmin && (
        <TraineeForm
          trainee={editingTrainee || undefined}
          users={users}
          onSubmit={editingTrainee ? handleUpdateTrainee : handleCreateTrainee}
          onCancel={() => {
            setShowForm(false);
            setEditingTrainee(null);
          }}
          isEditing={!!editingTrainee}
        />
      )}
    </div>
  );
};

export default Trainees;