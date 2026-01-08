import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Get or create conversation for a user
export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      include: {
        Message: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            Sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
        },
        include: {
          Message: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              Sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    // Mark user's unread messages as read
    if (req.user!.role === 'USER') {
      await prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          isAdminMessage: true,
          read: false,
        },
        data: { read: true },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCount: 0 },
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

// Get all conversations (admin only)
export const getAllConversations = async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Message: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

// Get messages for a conversation
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isAdmin && conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        Sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Mark messages as read
    if (!isAdmin) {
      await prisma.message.updateMany({
        where: {
          conversationId,
          isAdminMessage: true,
          read: false,
        },
        data: { read: true },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify user has access to this conversation
    if (!isAdmin && conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
        isAdminMessage: isAdmin,
        read: false,
      },
      include: {
        Sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Update conversation last message time and unread count
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: isAdmin ? { increment: 1 } : 0,
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read (admin only)
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    // Verify conversation exists and user has access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!isAdmin && conversation.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark messages as read
    if (isAdmin) {
      // Admin marks user messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          isAdminMessage: false,
          read: false,
        },
        data: { read: true },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: 0 },
      });
    } else {
      // User marks admin messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          isAdminMessage: true,
          read: false,
        },
        data: { read: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Get unread count for user
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const conversation = await prisma.conversation.findFirst({
      where: { userId },
      select: { unreadCount: true },
    });

    res.json({ unreadCount: conversation?.unreadCount || 0 });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};
