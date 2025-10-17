import React, { useState, useEffect } from 'react';
import { ChatSession, DirectChatSession } from '../../types';
import { chatAPI } from '../../services/api';
import ChatWindow from '../Chat/ChatWindow';

const ChatSessionsCard: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      const activeSessions = (
        response.data.data as (ChatSession | DirectChatSession)[]
      ).filter(
        (session): session is ChatSession =>
          'traineeId' in session && session.status === 'active'
      );
      setSessions(activeSessions.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAdvisorName = (session: ChatSession) => {
    if (user.role === 'trainee') {
      return session.advisor?.name || 'Advisor';
    }
    return session.trainee?.user?.name || 'Trainee';
  };

  const getTaskTitle = (session: ChatSession) => {
    // In a real app, you might want to associate sessions with specific tasks
    // For now, we'll use a generic title or extract from last message
    return 'Task Discussion';
  };

  const formatLastMessage = (session: ChatSession) => {
    if (session.lastMessage) {
      const message = session.lastMessage.message;
      return message.length > 50 ? message.substring(0, 50) + '...' : message;
    }
    return 'No messages yet';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {sessions.length} active
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No active chat sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
              onClick={() => setSelectedSession(session)}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {getAdvisorName(session).charAt(0)}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {getTaskTitle(session)}
                  </h4>
                  {session.unreadCount && session.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {session.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  With {getAdvisorName(session)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatLastMessage(session)}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-500 block">
                  {formatTime(session.lastMessageAt)}
                </span>
                {session.unreadCount && session.unreadCount > 0 && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Window Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">
                  Chat: {getTaskTitle(selectedSession)}
                </h3>
                <p className="text-blue-100 text-sm">
                  With {getAdvisorName(selectedSession)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-blue-100 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
              <div className="text-center text-gray-500 py-8">
                <p>This is a simplified chat view for the dashboard.</p>
                <p className="text-sm mt-2">
                  Full chat functionality available in the Chat section.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSessionsCard;