// src/components/Tasks/HelpRequestForm.tsx
import React, { useState } from 'react';

interface HelpRequestFormProps {
  taskId: number;
  taskTitle: string;
  onSubmit: (taskId: number, message: string) => void;
  onCancel: () => void;
}

const HelpRequestForm: React.FC<HelpRequestFormProps> = ({
  taskId,
  taskTitle,
  onSubmit,
  onCancel
}) => {
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please provide details about the help you need.');
      return;
    }
    
    const fullMessage = `[${requestType.toUpperCase()}] ${message}`;
    onSubmit(taskId, fullMessage);
  };

  const quickMessages = [
    "I'm having technical difficulties with this task",
    "I need clarification on the requirements",
    "I'm stuck and don't know how to proceed",
    "I need additional resources or documentation",
    "The deadline seems too tight, need extension"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Request Help for: {taskTitle}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Help Needed
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
            >
              <option value="general">General Help</option>
              <option value="technical">Technical Issue</option>
              <option value="clarification">Clarification Needed</option>
              <option value="resources">Need Resources</option>
              <option value="deadline">Deadline Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what help you need *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-satorp-blue focus:border-transparent"
              placeholder="Please describe the specific help you need. Be as detailed as possible so your advisor can assist you effectively."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Help Templates (Click to use)
            </label>
            <div className="space-y-2">
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(quickMsg)}
                  className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition duration-200"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-lg">💡</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Help Request Tips
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be specific about what you've tried</li>
                    <li>Include any error messages you're seeing</li>
                    <li>Mention if there's a deadline concern</li>
                    <li>Your advisor will respond within 24 hours</li>
                  </ul>
                </div>
              </div>
            </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition duration-200"
            >
              Send Help Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HelpRequestForm;