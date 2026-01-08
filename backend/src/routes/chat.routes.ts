import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getOrCreateConversation,
  getAllConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
} from '../controllers/chat.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User routes
router.get('/conversation', getOrCreateConversation);
router.get('/conversation/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);
router.patch('/conversation/:conversationId/read', markMessagesAsRead);
router.get('/unread-count', getUnreadCount);

// Admin routes
router.get('/admin/conversations', getAllConversations);

export default router;
