'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextProps {
  socket: Socket | null;
  onlineUsers: Record<string, { isOnline: boolean; lastSeen: Date }>;
  typingStates: Record<string, Record<string, string>>; // chatId -> userId -> username
  registerChatRoom: (chatId: string) => void;
  leaveChatRoom: (chatId: string) => void;
  setOnlineUsers: React.Dispatch<React.SetStateAction<Record<string, { isOnline: boolean; lastSeen: Date }>>>;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { isOnline: boolean; lastSeen: Date }>>({});
  const [typingStates, setTypingStates] = useState<Record<string, Record<string, string>>>({});
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Initialize socket
    const socketIo = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketIo.on('connect', () => {
      console.log('Socket.IO connected:', socketIo.id);
      socketIo.emit('user-online', user.id);
    });

    socketIo.on('user-status-change', (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: {
          isOnline: data.isOnline,
          lastSeen: new Date(data.lastSeen),
        },
      }));
    });

    socketIo.on('user-typing', (data: { chatId: string; username: string; userId: string }) => {
      setTypingStates((prev) => {
        const chatTyping = prev[data.chatId] || {};
        return {
          ...prev,
          [data.chatId]: {
            ...chatTyping,
            [data.userId]: data.username,
          },
        };
      });
    });

    socketIo.on('user-stop-typing', (data: { chatId: string; userId: string }) => {
      setTypingStates((prev) => {
        const chatTyping = { ...(prev[data.chatId] || {}) };
        delete chatTyping[data.userId];
        return {
          ...prev,
          [data.chatId]: chatTyping,
        };
      });
    });

    socketIo.on('kicked', () => {
      alert('Your account has been suspended by the administrator.');
      logout();
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [user]);

  const registerChatRoom = (chatId: string) => {
    if (socket) {
      socket.emit('join-chat', chatId);
    }
  };

  const leaveChatRoom = (chatId: string) => {
    if (socket) {
      socket.emit('leave-chat', chatId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingStates, registerChatRoom, leaveChatRoom, setOnlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
