import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, DirectChatSession } from '../../types'; // Use DirectChatSession
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DirectChat: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<DirectChatSession[]>([]); // Use DirectChatSession
  const [selectedSession, setSelectedSession] = useState<DirectChatSession | null>(null); // Use DirectChatSession
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'new'>('sessions');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAvailableUsers();
    fetchDirectSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await chatAPI.getAvailableUsers();
      setAvailableUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const fetchDirectSessions = async () => {
    try {
      const response = await chatAPI.getDirectSessions();
      setSessions(response.data.data);
    } catch (error) {
      console.error('Error fetching direct sessions:', error);
    }
  };

  const fetchMessages = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await chatAPI.getMessages(sessionId);
      setMessages(response.data.data);
      // Mark messages as read
      await chatAPI.markAsRead(sessionId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async (otherUser: User) => {
    try {
      const response = await chatAPI.getOrCreateDirectSession(otherUser.id);
      const session = response.data.data;
      setSelectedSession(session);
      setActiveTab('sessions');
      // Refresh sessions list
      fetchDirectSessions();
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSession) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage(selectedSession.id, newMessage.trim());
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
      // Refresh sessions to update last message
      fetchDirectSessions();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUser = (session: DirectChatSession) => {
    // Use the otherParticipant field from the backend or calculate it
    if (session.otherParticipant) {
      return session.otherParticipant;
    }
    return session.participant1Id === currentUser?.id 
      ? session.participant2 
      : session.participant1;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg h-[600px] flex">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Direct Messages</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'sessions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'new'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            New Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'sessions' ? (
            /* Existing Conversations */
            <div className="p-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start a new chat!</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const otherUser = getOtherUser(session);
                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        selectedSession?.id === session.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {otherUser?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {otherUser?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.lastMessage?.message || 'No messages yet'}
                          </p>
                        </div>
                        {session.unreadCount && session.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {session.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* New Chat - Available Users */
            <div className="p-2">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users available</p>
                </div>
              ) : (
                availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startNewChat(user)}
                    className="w-full text-left p-3 rounded-lg mb-1 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {getOtherUser(selectedSession)?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getOtherUser(selectedSession)?.name}
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {getOtherUser(selectedSession)?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderId === currentUser?.id
                              ? 'text-blue-200'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p>Choose a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectChat;