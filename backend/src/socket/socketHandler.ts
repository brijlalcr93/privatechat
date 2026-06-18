import { Server, Socket } from 'socket.io';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { Log } from '../models/Log';

// Map of userId -> Set of socketIds (handles multiple tabs per user)
const userSockets = new Map<string, Set<string>>();

export const setupSocket = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    let currentUserId: string | null = null;

    console.log(`Socket connected: ${socket.id}`);

    // Register User status and join their personal room
    socket.on('user-online', async (userId: string) => {
      try {
        if (!userId) return;
        currentUserId = userId;

        // Associate user ID with socket ID
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)?.add(socket.id);

        // Update online status in database
        await User.findByIdAndUpdate(userId, { isOnline: true });

        // Join personal room for target delivery
        socket.join(userId);
        console.log(`User registered online: ${userId} on socket ${socket.id}`);

        // Broadcast to everyone that user is online
        socket.broadcast.emit('user-status-change', {
          userId,
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Error handling user-online socket event:', err);
      }
    });

    // Join chat room
    socket.on('join-chat', (chatId: string) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave-chat', (chatId: string) => {
      if (!chatId) return;
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat room: ${chatId}`);
    });

    // Real-time message sending
    socket.on('send-message', async (data: { chatId: string; senderId: string; content: string }) => {
      const { chatId, senderId, content } = data;
      try {
        if (!chatId || !senderId || !content) return;

        // Save message to database
        const message = new Message({
          chatId,
          senderId,
          content,
          seen: false,
        });
        await message.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'username email avatar role');

        if (!populatedMessage) return;

        // Update chat updatedAt field
        await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

        // Broadcast to chat room
        io.to(chatId).emit('new-message', populatedMessage);

        // Find participants to notify them of a new message (for sidebar updates / unread counts)
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.participants.forEach((participantId) => {
            const pIdStr = participantId.toString();
            // Emit sidebar update to each participant's personal room
            io.to(pIdStr).emit('chat-list-update', {
              chatId,
              lastMessage: populatedMessage,
            });
          });
        }
      } catch (err) {
        console.error('Error handling send-message socket event:', err);
      }
    });

    // Mark messages as seen/read
    socket.on('mark-seen', async (data: { chatId: string; userId: string }) => {
      const { chatId, userId } = data;
      try {
        if (!chatId || !userId) return;

        // Update DB
        await Message.updateMany(
          { chatId, senderId: { $ne: userId }, seen: false },
          { $set: { seen: true } }
        );

        // Notify other participants in the room
        socket.to(chatId).emit('messages-seen', { chatId, readerId: userId });
      } catch (err) {
        console.error('Error handling mark-seen socket event:', err);
      }
    });

    // Typing Indicators
    socket.on('typing', (data: { chatId: string; username: string; userId: string }) => {
      socket.to(data.chatId).emit('user-typing', data);
    });

    socket.on('stop-typing', (data: { chatId: string; userId: string }) => {
      socket.to(data.chatId).emit('user-stop-typing', data);
    });

    // Admin suspension override: force logout a specific user
    socket.on('admin-kick-user', (userId: string) => {
      // Find all active sockets for this user and emit kick event
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.forEach((sId) => {
          io.to(sId).emit('kicked');
        });
      }
    });

    // Handle Disconnection
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (currentUserId) {
        const sockets = userSockets.get(currentUserId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            // User has no more open tabs, set offline status
            userSockets.delete(currentUserId);
            const lastSeen = new Date();
            try {
              await User.findByIdAndUpdate(currentUserId, {
                isOnline: false,
                lastSeen,
              });

              // Broadcast offline status
              socket.broadcast.emit('user-status-change', {
                userId: currentUserId,
                isOnline: false,
                lastSeen,
              });
            } catch (err) {
              console.error('Error updating status on disconnect:', err);
            }
          }
        }
      }
    });
  });
};
