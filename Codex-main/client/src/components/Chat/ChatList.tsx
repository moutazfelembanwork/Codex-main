import React from 'react';
import { ChatSession, DirectChatSession, User } from '../../types';

interface ChatListProps {
  sessions: (ChatSession | DirectChatSession)[];
  availableUsers: User[];
  onSelectSession: (session: ChatSession | DirectChatSession) => void;
  onStartNewChat: (user: User) => void;
  activeTab: 'advisor' | 'direct';
}

const ChatList: React.FC<ChatListProps> = ({
  sessions,
  availableUsers,
  onSelectSession,
  onStartNewChat,
  activeTab
}) => {
  const formatLastMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // ✅ Fixed version: null-safe handling
  const getOtherParticipant = (session: ChatSession | DirectChatSession): User | undefined => {
    if ('otherParticipant' in session) {
      return session.otherParticipant ?? undefined;
    }

    if ('trainee' in session && session.trainee?.user) {
      return session.trainee.user ?? undefined;
    }

    if ('advisor' in session && session.advisor) {
      return session.advisor ?? undefined;
    }

    return undefined;
  };

  const getUnreadCount = (session: ChatSession | DirectChatSession): number => {
    return session.unreadCount || 0;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Available Users for New Chat */}
      {activeTab === 'direct' && availableUsers.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Start New Chat</h3>
          <div className="space-y-2">
            {availableUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onStartNewChat(user)}
                className="w-full flex items-center space-x-3 p-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    {user.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
            <p className="text-gray-600">
              {activeTab === 'advisor'
                ? 'Start a conversation with your advisor'
                : 'Select a user to start chatting'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {sessions.map((session) => {
              const otherParticipant = getOtherParticipant(session);
              const unreadCount = getUnreadCount(session);

              return (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {otherParticipant?.name?.charAt(0) ?? 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {otherParticipant?.name ?? 'Unknown User'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {session.lastMessage?.message || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.lastMessage
                        ? formatLastMessageTime(session.lastMessage.timestamp)
                        : 'New chat'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
