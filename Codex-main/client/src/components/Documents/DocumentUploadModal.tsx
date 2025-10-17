import React, { useState, useEffect } from 'react';
import { Trainee } from '../../types';
import { documentsAPI, traineesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    description: '',
    documentType: 'other' as 'certificate' | 'report' | 'assessment' | 'other',
    traineeId: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchTrainees();
    }
  }, [isOpen]);

  const fetchTrainees = async () => {
    try {
      const response = await traineesAPI.getAll();
      let filteredTrainees = response.data.data;
      
      // Filter trainees based on user role
      if (user?.role === 'trainee') {
        filteredTrainees = filteredTrainees.filter((t: Trainee) => t.userId === user.id);
      } else if (user?.role === 'advisor') {
        filteredTrainees = filteredTrainees.filter((t: Trainee) => t.advisorId === user.id);
      }
      // Admin can see all trainees
      
      setTrainees(filteredTrainees);
      
      // Auto-select trainee for trainees (only one option)
      if (user?.role === 'trainee' && filteredTrainees.length === 1) {
        setFormData(prev => ({ ...prev, traineeId: filteredTrainees[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching trainees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fileName || !formData.traineeId) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await documentsAPI.create({
        fileName: formData.fileName,
        description: formData.description,
        documentType: formData.documentType,
        traineeId: parseInt(formData.traineeId)
      });

      onUploadSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fileName: '',
      description: '',
      documentType: 'other',
      traineeId: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Trainee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trainee {user?.role === 'trainee' && '(Your Profile)'}
              {user?.role === 'advisor' && '(Your Assigned Trainees)'}
            </label>
            {user?.role === 'trainee' && trainees.length === 1 ? (
              <div className="p-3 bg-gray-50 rounded border border-gray-300 text-sm text-gray-700">
                {trainees[0]?.user?.name} ({trainees[0]?.employeeId})
              </div>
            ) : (
              <select
                required
                value={formData.traineeId}
                onChange={(e) => setFormData(prev => ({ ...prev, traineeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Trainee</option>
                {trainees.map(trainee => (
                  <option key={trainee.id} value={trainee.id}>
                    {trainee.user?.name} ({trainee.employeeId})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Name *
            </label>
            <input
              type="text"
              required
              value={formData.fileName}
              onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
              placeholder="Enter document name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="certificate">Certificate</option>
              <option value="report">Report</option>
              <option value="assessment">Assessment</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;