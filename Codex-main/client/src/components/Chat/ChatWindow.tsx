import React, { useState, useEffect, useRef } from 'react';
import { HelpRequest, ChatMessage } from '../../types';
import { chatAPI } from '../../services/api';

interface ChatWindowProps {
  helpRequest: HelpRequest;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ helpRequest, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMessages();
  }, [helpRequest.chatSessionId]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  const fetchMessages = async () => {
    if (!helpRequest.chatSessionId) return;
    
    setLoading(true);
    try {
      const response = await chatAPI.getMessages(helpRequest.chatSessionId);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!helpRequest.chatSessionId) return;
    
    try {
      await chatAPI.markAsRead(helpRequest.chatSessionId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !helpRequest.chatSessionId) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage(helpRequest.chatSessionId, newMessage.trim());
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUser = () => {
    if (user?.role === 'trainee') {
      return helpRequest.trainee?.advisor || { name: 'Advisor' };
    } else {
      // For advisor/admin, get trainee's user info
      const traineeUser = helpRequest.trainee?.user;
      return traineeUser || { name: 'Trainee' };
    }
  };

  const otherUser = getOtherUser();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">
              Chat: {helpRequest.task?.title || 'Task Discussion'}
            </h3>
            <p className="text-blue-100 text-sm">
              With {otherUser.name}
              {helpRequest.urgency && (
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  helpRequest.urgency === 'high' ? 'bg-red-500' :
                  helpRequest.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {helpRequest.urgency} priority
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === user.id
                          ? 'text-blue-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                      {!message.read && message.senderId === user.id && (
                        <span className="ml-2">• Sent</span>
                      )}
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
      </div>
    </div>
  );
};

export default ChatWindow;