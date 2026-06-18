'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import Navbar from '../../components/Navbar';
import CreateGroupModal from '../../components/CreateGroupModal';
import {
  Search, Plus, Send, Check, CheckCheck, Info,
  Users, User, LogOut, Trash2, UserPlus, UserMinus,
  MessageCircle, X, Shield, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageType {
  _id: string;
  chatId: string;
  senderId: {
    _id: string;
    username: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  seen: boolean;
  createdAt: string;
}

interface ChatType {
  _id: string;
  type: 'one-to-one' | 'group';
  participants: Array<{
    _id: string;
    username: string;
    avatar: string;
    role: string;
    isOnline: boolean;
    lastSeen: string;
  }>;
  groupName?: string;
  groupAvatar?: string;
  groupDescription?: string;
  groupAdmin?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  lastMessage?: MessageType;
  unreadCount?: number;
}

const AVATAR_PRESETS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FF5E62"/><stop offset="100%" stop-color="%23FF9966"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234A00E0"/><stop offset="100%" stop-color="%238E2DE2"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2311998e"/><stop offset="100%" stop-color="%2338ef7d"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { socket, onlineUsers, typingStates, registerChatRoom, leaveChatRoom, setOnlineUsers } = useSocket();
  const router = useRouter();

  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search Users to start O2O
  const [userSearchText, setUserSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Group Details Sidebar Panel
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [availableUsersToAdd, setAvailableUsersToAdd] = useState<any[]>([]);
  const [showAddMemberSelector, setShowAddMemberSelector] = useState(false);

  // Create Group Modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load Initial Chats
  const loadChats = async (selectChatId?: string) => {
    try {
      const chatList = await api.get<ChatType[]>('/chats');
      setChats(chatList);

      // Populate online status from database mapping initially
      const statuses: Record<string, { isOnline: boolean; lastSeen: Date }> = {};
      chatList.forEach((chat) => {
        chat.participants.forEach((p) => {
          statuses[p._id] = { isOnline: p.isOnline, lastSeen: new Date(p.lastSeen) };
        });
      });
      setOnlineUsers((prev) => ({ ...prev, ...statuses }));

      if (selectChatId) {
        const found = chatList.find((c) => c._id === selectChatId);
        if (found) setActiveChat(found);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Subscribe to real-time events when socket is available
  useEffect(() => {
    if (!socket || !user) return;

    // Handle new incoming messages
    const handleNewMessage = (msg: MessageType) => {
      // Append message if active chat matches
      if (activeChat && msg.chatId === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
        
        // Notify socket we read it
        socket.emit('mark-seen', { chatId: activeChat._id, userId: user.id });
        api.post(`/chats/${activeChat._id}/seen`, {});
      } else {
        // Increment unread count or reload chat summaries
        loadChats();
      }
    };

    // Handle real-time read updates
    const handleSeenReceipts = (data: { chatId: string; readerId: string }) => {
      if (activeChat && data.chatId === activeChat._id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId._id === user.id ? { ...m, seen: true } : m))
        );
      }
    };

    // Handle sidebar updates
    const handleChatListUpdate = () => {
      loadChats();
    };

    socket.on('new-message', handleNewMessage);
    socket.on('messages-seen', handleSeenReceipts);
    socket.on('chat-list-update', handleChatListUpdate);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('messages-seen', handleSeenReceipts);
      socket.off('chat-list-update', handleChatListUpdate);
    };
  }, [socket, activeChat, user]);

  // Handle active chat selection change
  useEffect(() => {
    if (!user) return;

    if (activeChat) {
      // Register WebSocket room join
      registerChatRoom(activeChat._id);
      
      // Fetch messages history
      const fetchMessages = async () => {
        try {
          const history = await api.get<MessageType[]>(`/chats/${activeChat._id}/messages`);
          setMessages(history);
          
          // Mark seen in database and emit Socket notification
          await api.post(`/chats/${activeChat._id}/seen`, {});
          if (socket) {
            socket.emit('mark-seen', { chatId: activeChat._id, userId: user.id });
          }
          
          // Reset local unread counters
          setChats((prev) =>
            prev.map((c) => (c._id === activeChat._id ? { ...c, unreadCount: 0 } : c))
          );
        } catch (err) {
          console.error('Failed to load message history:', err);
        }
      };

      fetchMessages();
      setShowDetailsPanel(false);
      setShowAddMemberSelector(false);
    }

    return () => {
      if (activeChat) {
        leaveChatRoom(activeChat._id);
      }
    };
  }, [activeChat, user, socket]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStates]);

  // Search standard users to open direct conversation
  useEffect(() => {
    if (!userSearchText.trim()) {
      setSearchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await api.get<any[]>(`/users?search=${userSearchText}`);
        setSearchedUsers(results);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [userSearchText]);

  // Handle message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || !user || !socket) return;

    // Send via socket connection
    socket.emit('send-message', {
      chatId: activeChat._id,
      senderId: user.id,
      content: messageText.trim(),
    });

    // Stop typing indicator
    socket.emit('stop-typing', { chatId: activeChat._id, userId: user.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setMessageText('');
  };

  // Handle typing actions and debounce notifications
  const handleTyping = () => {
    if (!socket || !activeChat || !user) return;

    socket.emit('typing', {
      chatId: activeChat._id,
      username: user.username,
      userId: user.id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatId: activeChat._id, userId: user.id });
    }, 2000);
  };

  // Open direct chat
  const startDirectChat = async (recipientId: string) => {
    try {
      const chat = await api.post<ChatType>('/chats/one-to-one', { recipientId });
      setUserSearchText('');
      setSearchedUsers([]);
      await loadChats(chat._id);
    } catch (err) {
      console.error('Failed to start direct conversation', err);
    }
  };

  // Group Details modifications: Remove participant
  const handleRemoveMember = async (targetUserId: string) => {
    if (!activeChat) return;
    try {
      const remainingParticipants = activeChat.participants
        .map((p) => p._id)
        .filter((id) => id !== targetUserId);

      const updatedGroup = await api.put<ChatType>(`/chats/group/${activeChat._id}`, {
        participantIds: remainingParticipants,
      });

      setActiveChat(updatedGroup);
      loadChats(updatedGroup._id);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  // Group Details: Add new participants selector
  const loadUsersToAdd = async () => {
    try {
      const allUsers = await api.get<any[]>('/users');
      const activeIds = activeChat?.participants.map((p) => p._id) || [];
      const filterAddable = allUsers.filter((u) => !activeIds.includes(u._id));
      setAvailableUsersToAdd(filterAddable);
      setShowAddMemberSelector(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (targetUserId: string) => {
    if (!activeChat) return;
    try {
      const currentIds = activeChat.participants.map((p) => p._id);
      const updatedGroup = await api.put<ChatType>(`/chats/group/${activeChat._id}`, {
        participantIds: [...currentIds, targetUserId],
      });
      setActiveChat(updatedGroup);
      loadChats(updatedGroup._id);
      setShowAddMemberSelector(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get Chat Info dynamically depending on type
  const getChatDetails = (chat: ChatType) => {
    if (chat.type === 'group') {
      return {
        name: chat.groupName || 'Group Chat',
        avatar: chat.groupAvatar || AVATAR_PRESETS[0],
        status: `${chat.participants.length} members`,
      };
    }

    const otherUser = chat.participants.find((p) => p._id !== user.id);
    const onlineState = onlineUsers[otherUser?._id || ''];
    const statusText = onlineState?.isOnline
      ? 'Online'
      : `Last seen ${onlineState ? new Date(onlineState.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'offline'}`;

    return {
      name: otherUser?.username || 'Private Chat',
      avatar: otherUser?.avatar || '',
      status: statusText,
      isOnline: onlineState?.isOnline || false,
    };
  };

  // Get current active chat's details
  const currentDetails = activeChat ? getChatDetails(activeChat) : null;

  // Filter local chats listing based on left panel search box
  const filteredChats = chats.filter((chat) => {
    if (chat.type === 'group') {
      return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const other = chat.participants.find((p) => p._id !== user.id);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Extract typing users lists for the active chat
  const typingUsersInActiveChat = activeChat && typingStates[activeChat._id]
    ? Object.values(typingStates[activeChat._id]).filter((name) => name !== user.username)
    : [];

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar panel */}
        <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] border-r border-border bg-card/15 backdrop-blur-md flex-col shrink-0`}>
          
          {/* Direct chat user search bar */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl tracking-tight">Messages</h2>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer"
                title="Create Group"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
              <input
                type="text"
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                placeholder="Find a user to chat..."
                className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
              />
            </div>
          </div>

          {/* User query search dropdown overlay */}
          <div className="relative px-4">
            <AnimatePresence>
              {userSearchText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-4 right-4 z-40 bg-popover/90 backdrop-blur-md border border-border rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2"
                >
                  {isSearchingUsers ? (
                    <div className="p-6 text-center text-xs text-muted">Searching users...</div>
                  ) : searchedUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted">No users found</div>
                  ) : (
                    searchedUsers.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => startDirectChat(item._id)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-secondary/40 rounded-xl transition-all text-left cursor-pointer"
                      >
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.username} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{item.username.slice(0, 2).toUpperCase()}</div>
                        )}
                        <div>
                          <div className="text-xs font-semibold">{item.username}</div>
                          <div className="text-[10px] text-muted">{item.role === 'admin' ? 'System Admin' : 'User'}</div>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Local Chats Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8.5 pr-4 py-1.5 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 opacity-40 text-muted" />
                <span>No active chats. Start one above!</span>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const details = getChatDetails(chat);
                const isActive = activeChat?._id === chat._id;
                
                return (
                  <button
                    key={chat._id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full flex gap-3 p-3 rounded-2xl mb-1.5 transition-all text-left cursor-pointer border ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10'
                        : 'hover:bg-secondary/40 border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {details.avatar ? (
                        <img
                          src={details.avatar}
                          alt={details.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-border/40"
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs border ${
                          isActive ? 'bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {details.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Online status indicator */}
                      {chat.type === 'one-to-one' && details.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background online-indicator" />
                      )}
                    </div>

                    {/* Message Preview */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-xs font-semibold truncate pr-1">
                          {details.name}
                        </span>
                        {chat.lastMessage && (
                          <span className={`text-[10px] shrink-0 ${isActive ? 'text-primary-foreground/70' : 'text-muted'}`}>
                            {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-[11px] truncate flex-1 ${isActive ? 'text-primary-foreground/85' : 'text-muted'}`}>
                          {chat.lastMessage ? (
                            <>
                              <span className="font-medium mr-1">
                                {chat.lastMessage.senderId._id === user.id ? 'You:' : `${chat.lastMessage.senderId.username}:`}
                              </span>
                              {chat.lastMessage.content}
                            </>
                          ) : (
                            'No messages yet'
                          )}
                        </span>

                        {/* Unread & Double Checkmarks status */}
                        {chat.unreadCount && chat.unreadCount > 0 ? (
                          <span className="ml-1 bg-red-500 text-white rounded-full text-[9px] font-bold px-1.5 py-0.5 shrink-0">
                            {chat.unreadCount}
                          </span>
                        ) : chat.lastMessage && chat.lastMessage.senderId._id === user.id ? (
                          <span className="ml-1 shrink-0">
                            {chat.lastMessage.seen ? (
                              <CheckCheck className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-muted" />
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window Panel */}
        <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-card/5`}>
          {activeChat && currentDetails ? (
            <>
              {/* Header */}
              <div className="h-16 border-b border-border px-4 md:px-6 bg-card/15 backdrop-blur-md flex items-center justify-between z-10">
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted hover:text-foreground transition-all cursor-pointer"
                    title="Back to Chats"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  {/* Chat Avatar */}
                  <div className="relative">
                    {currentDetails.avatar ? (
                      <img
                        src={currentDetails.avatar}
                        alt={currentDetails.name}
                        className="w-10 h-10 rounded-xl object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                        {currentDetails.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {activeChat.type === 'one-to-one' && currentDetails.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background online-indicator" />
                    )}
                  </div>

                  {/* Header text */}
                  <div>
                    <h3 className="text-xs font-semibold">{currentDetails.name}</h3>
                    <div className="text-[10px] text-muted font-medium flex items-center gap-1.5">
                      {typingUsersInActiveChat.length > 0 ? (
                        <span className="text-primary font-medium animate-pulse flex items-center gap-1">
                          {typingUsersInActiveChat.join(', ')} typing
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
                            <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
                            <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
                          </span>
                        </span>
                      ) : (
                        currentDetails.status
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary text-muted hover:text-foreground transition-all cursor-pointer border border-transparent hover:border-border ${
                      showDetailsPanel ? 'bg-secondary text-foreground' : ''
                    }`}
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message History flow */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => {
                  const isSelf = msg.senderId._id === user.id;
                  
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex flex-col max-w-[70%] ${isSelf ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                    >
                      {/* Sender Name label */}
                      {!isSelf && activeChat.type === 'group' && (
                        <span className="text-[10px] font-semibold text-primary mb-1 pl-1">
                          {msg.senderId.username}
                        </span>
                      )}

                      {/* Bubble */}
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed border relative shadow-sm ${
                        isSelf
                          ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                          : 'bg-input text-foreground border-border rounded-tl-none bg-opacity-35'
                      }`}>
                        <div>{msg.content}</div>
                        
                        {/* Time & seen checks inside bubble */}
                        <div className="flex items-center gap-1 justify-end mt-1 text-[9px] opacity-70">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isSelf && (
                            <span>
                              {msg.seen ? (
                                <CheckCheck className="w-3 h-3 text-emerald-300 stroke-[3]" />
                              ) : (
                                <Check className="w-3 h-3 text-white/70 stroke-[2]" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicators bubble */}
                {typingUsersInActiveChat.map((name) => (
                  <div key={name} className="flex flex-col self-start items-start">
                    <span className="text-[10px] font-semibold text-primary mb-1 pl-1">{name}</span>
                    <div className="p-3 bg-input border border-border rounded-2xl rounded-tl-none flex items-center gap-1 bg-opacity-35">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted typing-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted typing-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted typing-dot" />
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card/15 backdrop-blur-md flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all shadow-md shadow-primary/10 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted p-8">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-4 border border-border">
                <MessageCircle className="w-8 h-8 opacity-40 text-muted" />
              </div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">No Chat Selected</h3>
              <p className="text-xs max-w-xs text-center leading-relaxed">
                Choose a conversations thread from the list or lookup a user to start direct messaging.
              </p>
            </div>
          )}
        </div>

        {/* Group Details Sidebar Overlay Panel */}
        <AnimatePresence>
          {showDetailsPanel && activeChat && currentDetails && (
            <motion.div
              initial={{ opacity: 0, x: 260 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 260 }}
              className="absolute md:relative right-0 top-0 bottom-0 h-full w-72 md:w-64 border-l border-border bg-background md:bg-card/25 backdrop-blur-md flex flex-col shrink-0 z-30 shadow-2xl md:shadow-none"
            >
              {/* Header */}
              <div className="h-16 border-b border-border flex items-center justify-between px-4">
                <span className="font-semibold text-xs uppercase tracking-wider text-muted">Chat Info</span>
                <button
                  onClick={() => {
                    setShowDetailsPanel(false);
                    setShowAddMemberSelector(false);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content body */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <img
                    src={currentDetails.avatar}
                    alt={currentDetails.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-border"
                  />
                  <h4 className="font-semibold text-xs mt-2">{currentDetails.name}</h4>
                  <p className="text-[10px] text-muted">{activeChat.type === 'group' ? 'Group Chat' : 'Direct Conversation'}</p>
                </div>

                {activeChat.type === 'group' && (
                  <>
                    {/* Description */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Description</span>
                      <p className="text-[11px] leading-relaxed text-muted bg-input/40 p-2.5 rounded-xl border border-border/40">
                        {activeChat.groupDescription || 'No description provided.'}
                      </p>
                    </div>

                    {/* Member supervisors list */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                          Members ({activeChat.participants.length})
                        </span>
                        
                        {/* Add members button for group admin / system admins */}
                        {(activeChat.groupAdmin?._id === user.id || user.role === 'admin') && (
                          <button
                            onClick={loadUsersToAdd}
                            className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>

                      {/* Add Member Selector drop inline */}
                      {showAddMemberSelector && (
                        <div className="border border-primary/20 bg-primary/5 rounded-xl p-2 mb-2 flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-primary">Select Member:</span>
                          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                            {availableUsersToAdd.length === 0 ? (
                              <span className="text-[9px] text-muted p-1">No other users available</span>
                            ) : (
                              availableUsersToAdd.map((u) => (
                                <button
                                  key={u._id}
                                  onClick={() => handleAddMember(u._id)}
                                  className="w-full text-left text-[10px] hover:bg-primary/15 p-1 rounded transition-colors truncate"
                                >
                                  + {u.username}
                                </button>
                              ))
                            )}
                          </div>
                          <button onClick={() => setShowAddMemberSelector(false)} className="text-[9px] text-center text-muted hover:underline mt-1">Cancel</button>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {activeChat.participants.map((member) => {
                          const isMemberAdmin = activeChat.groupAdmin?._id === member._id;
                          const isSelf = member._id === user.id;
                          
                          return (
                            <div
                              key={member._id}
                              className="flex items-center justify-between p-1.5 hover:bg-secondary/40 rounded-xl text-[11px]"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.username} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px] shrink-0">{member.username.slice(0,2).toUpperCase()}</div>
                                )}
                                <span className="truncate">{member.username} {isSelf && '(You)'}</span>
                                {isMemberAdmin && (
                                  <span title="Group Admin" className="shrink-0 flex items-center">
                                    <Shield className="w-3 h-3 text-amber-500" />
                                  </span>
                                )}
                              </div>

                              {/* Kick button */}
                              {activeChat.groupAdmin?._id === user.id && !isSelf && (
                                <button
                                  onClick={() => handleRemoveMember(member._id)}
                                  className="p-1 hover:bg-destructive/10 text-muted hover:text-destructive rounded-lg transition-colors cursor-pointer"
                                  title="Remove from group"
                                >
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(newChat) => {
            setShowCreateGroup(false);
            loadChats(newChat._id);
          }}
        />
      )}
    </div>
  );
}
