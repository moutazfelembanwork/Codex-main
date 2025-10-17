import React, { useState } from 'react';
import { TraineeDocument } from '../../types';
import { documentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface DocumentCardProps {
  document: TraineeDocument;
  onUpdate: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    fileName: document.fileName,
    description: document.description || '',
    documentType: document.documentType
  });

  const handleEdit = async () => {
    try {
      await documentsAPI.update(document.id, editForm);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(document.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = user?.role === 'admin' || document.uploadedBy === user?.id;
  const canDelete = user?.role === 'admin' || document.uploadedBy === user?.id;

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return '🎓';
      case 'report':
        return '📊';
      case 'assessment':
        return '📝';
      default:
        return '📄';
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'certificate':
        return 'bg-green-100 text-green-800';
      case 'report':
        return 'bg-blue-100 text-blue-800';
      case 'assessment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getDocumentTypeIcon(document.documentType)}</div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.fileName}
                onChange={(e) => setEditForm(prev => ({ ...prev, fileName: e.target.value }))}
                className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
                {document.fileName}
              </h3>
            )}
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(document.documentType)}`}>
              {document.documentType}
            </span>
          </div>
        </div>
        
        {(canEdit || canDelete) && !isEditing && (
          <div className="flex space-x-2">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Delete document"
                disabled={isDeleting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {isEditing ? (
        <textarea
          value={editForm.description}
          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded mb-4 text-sm text-gray-600"
          placeholder="Add a description..."
          rows={2}
        />
      ) : (
        document.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{document.description}</p>
        )
      )}

      {/* Document Details */}
      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Uploaded:</span>
          <span>{formatDate(document.uploadDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Size:</span>
          <span>{formatFileSize(document.fileSize)}</span>
        </div>
        <div className="flex justify-between">
          <span>Uploaded by:</span>
          <span className="font-medium">{document.uploader?.name || 'Unknown'}</span>
        </div>
        {document.trainee && (
          <div className="flex justify-between">
            <span>Trainee:</span>
            <span className="font-medium">{document.trainee.user?.name} ({document.trainee.employeeId})</span>
          </div>
        )}
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleEdit}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditForm({
                fileName: document.fileName,
                description: document.description || '',
                documentType: document.documentType
              });
            }}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Status Badge */}
      <div className="mt-4 flex justify-between items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          document.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {document.status}
        </span>
        
        {/* Download/View Button */}
        <button
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
          title="View document"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>View</span>
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;