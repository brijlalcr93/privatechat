import { Router, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { Log } from '../models/Log';
import { userAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// @route   GET api/chats
// @desc    Get all chats for current user (direct & groups)
router.get('/', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Find all chats where user is a participant
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'username email avatar role isOnline lastSeen')
      .populate('groupAdmin', 'username email avatar')
      .sort({ updatedAt: -1 });

    // Attach last message and unread count to each chat
    const chatsWithMetadata = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({ chatId: chat._id })
          .sort({ createdAt: -1 })
          .populate('senderId', 'username');

        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: userId },
          seen: false,
        });

        return {
          ...chat.toObject(),
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort by last message timestamp or chat creation date if no messages
    chatsWithMetadata.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    res.json(chatsWithMetadata);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving chats' });
  }
});

// @route   GET api/chats/:chatId/messages
// @desc    Get message history for a chat
router.get('/:chatId/messages', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    // Verify user is in chat
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this chat.' });
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username email avatar role');

    res.json(messages);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
});

// @route   POST api/chats/one-to-one
// @desc    Get or create a one-to-one chat with a specific user
router.post('/one-to-one', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { recipientId } = req.body;
  const senderId = req.user?.id;

  try {
    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient user ID is required' });
    }

    // Verify recipient exists and is active
    const recipient = await User.findOne({ _id: recipientId, status: 'active' });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found or suspended' });
    }

    // Check if one-to-one chat already exists between these users
    let chat = await Chat.findOne({
      type: 'one-to-one',
      participants: { $all: [senderId, recipientId], $size: 2 },
    });

    if (!chat) {
      chat = new Chat({
        type: 'one-to-one',
        participants: [senderId, recipientId],
      });
      await chat.save();

      // Log creation
      await new Log({
        action: 'CHAT_CREATE_O2O',
        details: `Direct chat created between ${req.user?.username} and ${recipient.username}`,
        userId: senderId,
        username: req.user?.username,
      }).save();
    }

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'username email avatar role isOnline lastSeen');

    res.status(201).json(populatedChat);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error creating direct chat' });
  }
});

// @route   POST api/chats/group
// @desc    Create a new group chat
router.post('/group', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { groupName, groupDescription, groupAvatar, participantIds } = req.body;
  const adminId = req.user?.id;

  try {
    if (!groupName || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'Group name and at least one member are required' });
    }

    // Include the creator as a participant
    const uniqueParticipants = Array.from(new Set([...participantIds, adminId]));

    // Verify all participants are active
    const activeUsers = await User.find({ _id: { $in: uniqueParticipants }, status: 'active' });
    if (activeUsers.length !== uniqueParticipants.length) {
      return res.status(400).json({ error: 'One or more group participants are inactive or suspended' });
    }

    const group = new Chat({
      type: 'group',
      participants: uniqueParticipants,
      groupName,
      groupDescription: groupDescription || '',
      groupAvatar: groupAvatar || '',
      groupAdmin: adminId,
    });

    await group.save();

    // Log creation
    await new Log({
      action: 'CHAT_CREATE_GROUP',
      details: `Group chat "${groupName}" created by ${req.user?.username}`,
      userId: adminId,
      username: req.user?.username,
    }).save();

    const populatedGroup = await Chat.findById(group._id)
      .populate('participants', 'username email avatar role isOnline lastSeen')
      .populate('groupAdmin', 'username email avatar');

    res.status(201).json(populatedGroup);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error creating group chat' });
  }
});

// @route   PUT api/chats/group/:chatId
// @desc    Update group settings or manage members (Admin controls)
router.put('/group/:chatId', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const { groupName, groupDescription, groupAvatar, participantIds } = req.body;
  const userId = req.user?.id;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ error: 'This operation is only allowed on group chats' });
    }

    // Verify requester is groupAdmin or System Admin
    const isGroupAdmin = chat.groupAdmin?.toString() === userId;
    const isSystemAdmin = req.user?.role === 'admin';

    if (!isGroupAdmin && !isSystemAdmin) {
      return res.status(403).json({ error: 'Only group administrators or system admins can modify group settings.' });
    }

    if (groupName) chat.groupName = groupName;
    if (groupDescription !== undefined) chat.groupDescription = groupDescription;
    if (groupAvatar !== undefined) chat.groupAvatar = groupAvatar;
    
    if (participantIds && Array.isArray(participantIds)) {
      // Ensure the group admin remains in the group
      const adminToKeep = chat.groupAdmin?.toString() || userId;
      const uniqueParticipants = Array.from(new Set([...participantIds, adminToKeep]));
      chat.participants = uniqueParticipants as any;
    }

    await chat.save();

    // Log update
    await new Log({
      action: 'CHAT_UPDATE_GROUP',
      details: `Group "${chat.groupName}" updated by ${req.user?.username}`,
      userId,
      username: req.user?.username,
    }).save();

    const populatedGroup = await Chat.findById(chat._id)
      .populate('participants', 'username email avatar role isOnline lastSeen')
      .populate('groupAdmin', 'username email avatar');

    res.json(populatedGroup);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating group' });
  }
});

// @route   POST api/chats/:chatId/seen
// @desc    Mark all messages in a chat as seen by the current user
router.post('/:chatId/seen', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user?.id;

  try {
    // Verify user is in chat
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this chat.' });
    }

    // Mark messages sent by others as seen
    await Message.updateMany(
      { chatId, senderId: { $ne: userId }, seen: false },
      { $set: { seen: true } }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error marking messages as seen' });
  }
});

export default router;
