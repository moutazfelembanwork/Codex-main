import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import { ChatSession, DirectChatSession, User } from '../types';
import ChatInterface from '../components/Chat/ChatInterface';
import ChatList from '../components/Chat/ChatList';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'advisor' | 'direct'>('advisor');
  const [sessions, setSessions] = useState<(ChatSession | DirectChatSession)[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | DirectChatSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatData();
  }, [activeTab]);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, usersRes] = await Promise.all([
        chatAPI.getSessions(),
        chatAPI.getAvailableUsers()
      ]);
      
      setSessions(sessionsRes.data.data);
      setAvailableUsers(usersRes.data.data);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (session: ChatSession | DirectChatSession) => {
    setSelectedSession(session);
  };

  const handleStartNewChat = async (selectedUser: User) => {
    try {
      let session;
      
      if (activeTab === 'advisor' && user?.role === 'trainee') {
        // Start advisor chat
        session = await chatAPI.getOrCreateSession(selectedUser.id);
      } else {
        // Start direct chat
        session = await chatAPI.getOrCreateDirectSession(selectedUser.id);
      }
      
      setSelectedSession(session.data.data);
      fetchChatData(); // Refresh sessions list
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start chat');
    }
  };

  const handleBackToList = () => {
    setSelectedSession(null);
    fetchChatData(); // Refresh to update unread counts
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat</h1>
          <p className="text-gray-600">Communicate with advisors and team members</p>
        </div>

        {/* Main Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px]">
          {/* Chat Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('advisor');
                  setSelectedSession(null);
                }}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm ${
                  activeTab === 'advisor'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {user?.role === 'trainee' ? 'Advisor Chat' : 'Trainee Chat'}
              </button>
              <button
                onClick={() => {
                  setActiveTab('direct');
                  setSelectedSession(null);
                }}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm ${
                  activeTab === 'direct'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Direct Messages
              </button>
            </nav>
          </div>

          <div className="flex h-[544px]">
            {/* Chat List Sidebar */}
            {!selectedSession && (
              <div className="w-1/3 border-r border-gray-200">
                <ChatList
                  sessions={sessions.filter(session => 
                    activeTab === 'advisor' 
                      ? !('participant1Id' in session) // Advisor sessions
                      : 'participant1Id' in session    // Direct sessions
                  )}
                  availableUsers={availableUsers}
                  onSelectSession={handleSelectSession}
                  onStartNewChat={handleStartNewChat}
                  activeTab={activeTab}
                />
              </div>
            )}

            {/* Chat Interface or Welcome Message */}
            <div className={selectedSession ? 'w-full' : 'w-2/3'}>
              {selectedSession ? (
                <ChatInterface
                  session={selectedSession}
                  onBack={handleBackToList}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === 'advisor' 
                        ? user?.role === 'trainee'
                          ? 'Chat with Your Advisor'
                          : 'Chat with Trainees'
                        : 'Direct Messages'
                      }
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {activeTab === 'advisor'
                        ? user?.role === 'trainee'
                          ? 'Get guidance and support from your assigned advisor'
                          : 'Provide support and guidance to your assigned trainees'
                        : 'Chat directly with other team members'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      Select a conversation from the list to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;