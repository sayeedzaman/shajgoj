'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import {
  getAllConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  type Conversation,
  type Message,
} from '@/src/lib/chatApi';

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const convs = await getAllConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  // Handle sending message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const message = await sendMessage({
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      setTimeout(scrollToBottom, 100);

      // Refresh conversations to update last message
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Poll for new messages
  const pollMessages = async () => {
    try {
      await loadConversations();
      if (selectedConversation) {
        const msgs = await getMessages(selectedConversation.id);
        setMessages(msgs);
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // Set up polling
  useEffect(() => {
    pollingInterval.current = setInterval(pollMessages, 3000);
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null; email: string }) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">Chat with customers</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100%-100px)] flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    selectedConversation?.id === conversation.id ? 'bg-rose-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-medium">
                      {conversation.User.firstName?.charAt(0) || conversation.User.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`truncate ${conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                        {getUserName(conversation.User)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate ${conversation.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                        {conversation.Message[0]?.content || 'No messages yet'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(conversation.lastMessageAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedConversation.User.firstName?.charAt(0) || selectedConversation.User.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getUserName(selectedConversation.User)}
                    </h3>
                    <p className="text-xs text-gray-500">{selectedConversation.User.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isAdminMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          message.isAdminMessage
                            ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        {!message.isAdminMessage && (
                          <p className="text-xs font-semibold mb-1 text-rose-600">
                            {getUserName(message.Sender)}
                          </p>
                        )}
                        <p className="text-sm break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.isAdminMessage ? 'text-white/80' : 'text-gray-400'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-2 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-sm text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
