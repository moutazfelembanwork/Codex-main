import React, { useState, useEffect } from 'react';
import { Trainee, CreateTraineeData, UpdateTraineeData, User } from '../../types';

interface TraineeFormProps {
  trainee?: Trainee;
  users: User[];
  onSubmit: (data: CreateTraineeData | UpdateTraineeData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const TraineeForm: React.FC<TraineeFormProps> = ({
  trainee,
  users,
  onSubmit,
  onCancel,
  isEditing
}) => {
  const [formData, setFormData] = useState({
    userId: trainee?.userId || '',
    employeeId: trainee?.employeeId || '',
    startDate: trainee?.startDate || '',
    endDate: trainee?.endDate || '',
    status: trainee?.status || 'active',
    advisorId: trainee?.advisorId || '',
    trainingType: trainee?.trainingType || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      employeeId: formData.employeeId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      trainingType: formData.trainingType
    };

    if (!isEditing) {
      submitData.userId = parseInt(formData.userId as string);
    }

    if (formData.advisorId) {
      submitData.advisorId = parseInt(formData.advisorId as string);
    }

    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const availableUsers = users.filter(user => user.role === 'trainee');
  const availableAdvisors = users.filter(user => user.role === 'advisor');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Trainee' : 'Add New Trainee'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
                required
              >
                <option value="">Choose a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
              placeholder="Enter employee ID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Type
            </label>
            <input
              type="text"
              name="trainingType"
              value={formData.trainingType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
              placeholder="e.g., Engineering, Operations, Safety"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Advisor
            </label>
            <select
              name="advisorId"
              value={formData.advisorId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
            >
              <option value="">No advisor assigned</option>
              {availableAdvisors.map(advisor => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-satorp-blue hover:bg-satorp-darkblue rounded-lg transition duration-200"
            >
              {isEditing ? 'Update Trainee' : 'Create Trainee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraineeForm;