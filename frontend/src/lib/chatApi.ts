const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isAdminMessage: boolean;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  Sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  Message: Message[];
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

// Get or create conversation for the current user
export const getOrCreateConversation = async (): Promise<Conversation> => {
  const response = await fetch(`${API_URL}/api/chat/conversation`, {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get conversation');
  }

  return response.json();
};

// Get all conversations (admin only)
export const getAllConversations = async (): Promise<Conversation[]> => {
  const response = await fetch(`${API_URL}/api/chat/admin/conversations`, {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get conversations');
  }

  return response.json();
};

// Get messages for a conversation
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetch(`${API_URL}/api/chat/conversation/${conversationId}/messages`, {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get messages');
  }

  return response.json();
};

// Send a message
export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  const response = await fetch(`${API_URL}/api/chat/messages`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/chat/conversation/${conversationId}/read`, {
    method: 'PATCH',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark messages as read');
  }
};

// Get unread count
export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const response = await fetch(`${API_URL}/api/chat/unread-count`, {
    method: 'GET',
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get unread count');
  }

  return response.json();
};
