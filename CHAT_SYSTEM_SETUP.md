# Chat System Implementation Guide

## Overview
A complete chat system has been implemented that allows users to chat with admins. The system includes:
- User-facing chat widget (floating button on all pages)
- Admin dashboard to view and respond to all conversations
- Real-time message polling
- Unread message indicators
- Anonymous admin identity (users see "Admin", admins see user names)

## Database Changes

### New Models Added to Prisma Schema
Two new models have been added to `backend/prisma/schema.prisma`:

1. **Conversation**: Tracks chat conversations between users and admin
2. **Message**: Stores individual messages within conversations

## Setup Instructions

### 1. Run Database Migration

You need to run the Prisma migration to create the new tables in your database:

```bash
cd backend
npx prisma migrate dev --name add_chat_system
```

This command will:
- Create the `Conversation` and `Message` tables
- Add necessary foreign keys and indexes
- **NOT delete or modify any existing data**

### 2. Restart Backend Server

After running the migration, restart your backend server:

```bash
cd backend
npm run dev
```

### 3. Restart Frontend Server

Restart your frontend to pick up the new components:

```bash
cd frontend
npm run dev
```

## Features Implemented

### For Users
- **Floating Chat Button**: Appears on all non-admin pages in the bottom-right corner
- **Chat Widget**: Opens a chat window to communicate with admin
- **Unread Indicator**: Shows red badge with unread message count
- **Real-time Updates**: Messages poll every 3 seconds for new messages
- **Message History**: All previous messages are displayed

### For Admins
- **Messenger Icon**: Added to top-right of admin header with unread count badge
- **Chat Dashboard**: Located at `/admin/messages`
- **Conversation List**: Shows all users who have messaged, sorted by most recent
- **User Information**: Displays user name and email
- **Unread Indicators**: Shows which conversations have unread messages
- **Real-time Updates**: Conversations and messages poll every 3 seconds

## API Endpoints Created

All endpoints require authentication (JWT token):

### User Endpoints
- `GET /api/chat/conversation` - Get or create user's conversation
- `GET /api/chat/conversation/:conversationId/messages` - Get messages
- `POST /api/chat/messages` - Send a message
- `PATCH /api/chat/conversation/:conversationId/read` - Mark messages as read
- `GET /api/chat/unread-count` - Get unread message count

### Admin Endpoints
- `GET /api/chat/admin/conversations` - Get all conversations (admin only)

## File Structure

### Backend Files Created/Modified
```
backend/
├── prisma/schema.prisma (modified - added Conversation and Message models)
├── src/
│   ├── controllers/chat.controller.ts (new)
│   ├── routes/chat.routes.ts (new)
│   └── server.ts (modified - added chat routes)
```

### Frontend Files Created/Modified
```
frontend/
├── src/
│   ├── lib/chatApi.ts (new - API service for chat)
│   ├── components/
│   │   ├── admin/AdminHeader.tsx (modified - added messenger icon)
│   │   └── chat/ChatWidget.tsx (new - user chat widget)
│   └── app/
│       ├── layout.tsx (modified - added ChatWidget)
│       └── admin/messages/page.tsx (new - admin chat dashboard)
```

## How It Works

### User Flow
1. User clicks the floating chat button (bottom-right)
2. A conversation is created (or existing one is loaded)
3. User types and sends messages
4. Messages are displayed in the chat widget
5. Admin responses appear automatically (via polling)
6. Unread count updates when new admin messages arrive

### Admin Flow
1. Admin sees unread count badge on messenger icon in header
2. Admin clicks messenger icon to go to `/admin/messages`
3. Admin sees list of all conversations with users
4. Admin clicks on a conversation to view messages
5. Admin can type and send responses
6. User messages appear automatically (via polling)
7. Unread count decreases as messages are viewed

## Real-time Updates

The system uses polling (not WebSockets) for real-time updates:
- **User chat widget**: Polls every 3 seconds when open
- **Admin chat dashboard**: Polls every 3 seconds for messages
- **Admin header**: Polls every 5 seconds for unread count
- **User unread count**: Polls every 5 seconds when widget is closed

## Message Display

### User View
- User messages: Right-aligned, gradient background (rose to pink)
- Admin messages: Left-aligned, white background with "Admin" label

### Admin View
- Admin messages: Right-aligned, gradient background (rose to pink)
- User messages: Left-aligned, white background with user name

## Testing the Chat System

1. **As a User**:
   - Log in as a regular user (not admin)
   - Navigate to any page
   - Click the floating chat button in bottom-right
   - Send a test message
   - Keep the chat open to see admin responses

2. **As an Admin**:
   - Log in as an admin user
   - Click the messenger icon in the top-right of admin header
   - You should see the user's conversation in the list
   - Click on the conversation
   - Send a response
   - The user will see your message automatically

## Troubleshooting

### Chat button not appearing
- Make sure you're logged in as a USER (not ADMIN)
- Check browser console for errors
- Verify the ChatWidget component is imported in layout.tsx

### Messenger icon not showing in admin header
- Make sure you're logged in as an ADMIN
- Check that AdminHeader has been updated with the messenger icon
- Verify the imports are correct

### Messages not sending
- Check that backend server is running
- Verify JWT token is valid
- Check browser console and backend logs for errors
- Ensure database migration was run successfully

### Database migration fails
- Make sure your DATABASE_URL is correctly set in backend/.env
- Ensure you have a PostgreSQL database running
- Check that you have write permissions to the database
- Try running `npx prisma generate` first

## Future Enhancements (Optional)

If you want to add more features later:
- WebSocket support for true real-time updates (no polling)
- Typing indicators
- Message read receipts
- File/image attachments
- Chat history export
- Admin assignment (multiple admins)
- Canned responses for admins
- Chat notifications (email/push)
- Message search functionality
- User blocking/muting

## Security Notes

- All endpoints require authentication
- Users can only access their own conversations
- Admins can access all conversations
- Messages are never deleted (full history is kept)
- No XSS vulnerabilities (content is escaped by React)
- SQL injection prevented by Prisma ORM

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend server logs
3. Verify all files were created correctly
4. Ensure the database migration ran successfully
5. Make sure both frontend and backend servers are running
