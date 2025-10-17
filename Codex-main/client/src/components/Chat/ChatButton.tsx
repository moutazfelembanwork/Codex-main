import React, { useState } from 'react';
import { HelpRequest } from '../../types';
import ChatWindow from './ChatWindow';

interface ChatButtonProps {
  helpRequest: HelpRequest;
  variant?: 'primary' | 'secondary';
}

const ChatButton: React.FC<ChatButtonProps> = ({ helpRequest, variant = 'primary' }) => {
  const [showChat, setShowChat] = useState(false);

  const getButtonClass = () => {
    const baseClass = "flex items-center space-x-2 transition duration-200";
    
    if (variant === 'primary') {
      return `${baseClass} bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium`;
    } else {
      return `${baseClass} text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg`;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className={getButtonClass()}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>Chat</span>
        {helpRequest.hasUnreadMessages && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {helpRequest.unreadCount || 0}
          </span>
        )}
      </button>

      {showChat && (
        <ChatWindow
          helpRequest={helpRequest}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
};

export default ChatButton;