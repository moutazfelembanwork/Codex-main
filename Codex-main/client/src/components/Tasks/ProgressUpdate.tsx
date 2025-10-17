import React, { useState } from 'react';

interface ProgressUpdateProps {
  taskId: number;
  currentProgress: number;
  onUpdate: (taskId: number, progress: number, notes?: string) => void;
  onCancel: () => void;
}

const ProgressUpdate: React.FC<ProgressUpdateProps> = ({
  taskId,
  currentProgress,
  onUpdate,
  onCancel
}) => {
  const [progress, setProgress] = useState(currentProgress);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(taskId, progress, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Update Task Progress
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
              placeholder="Add notes about your progress..."
            />
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
              Update Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdate;