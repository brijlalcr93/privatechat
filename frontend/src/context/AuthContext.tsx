'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api';

interface UserType {
  id: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
}

interface AdminType {
  id: string;
  username: string;
  role: string;
}

interface AuthContextProps {
  user: UserType | null;
  admin: AdminType | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, avatar: string) => Promise<void>;
  updateProfile: (username: string, email: string, avatar: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  adminLogout: () => void;
  setErrorMsg: (msg: string | null) => void;
  errorMsg: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [admin, setAdmin] = useState<AdminType | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const fetchedUser = await api.get<UserType>('/auth/me');
          if (fetchedUser.status === 'suspended') {
            localStorage.removeItem('token');
            setUser(null);
          } else {
            setUser(fetchedUser);
          }
        }
      } catch (err) {
        console.error('Failed to authenticate token', err);
        localStorage.removeItem('token');
      }

      try {
        const adminToken = localStorage.getItem('admin_token');
        const storedAdmin = localStorage.getItem('admin_user');
        if (adminToken && storedAdmin) {
          setAdmin(JSON.parse(storedAdmin));
        }
      } catch (err) {
        console.error('Failed to load admin storage', err);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    setErrorMsg(null);
    try {
      const data = await api.post<{ token: string; user: UserType }>('/auth/login', {
        emailOrUsername,
        password,
      });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      router.push('/chat');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string, avatar: string) => {
    setErrorMsg(null);
    try {
      const data = await api.post<{ token: string; user: UserType }>('/auth/register', {
        username,
        email,
        password,
        avatar,
      });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      router.push('/chat');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
      throw err;
    }
  };

  const updateProfile = async (username: string, email: string, avatar: string) => {
    setErrorMsg(null);
    try {
      const updatedUser = await api.put<UserType>('/auth/profile', {
        username,
        email,
        avatar,
      });
      setUser(updatedUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const adminLogin = async (username: string, password: string) => {
    setErrorMsg(null);
    try {
      const data = await api.post<{ token: string; admin: AdminType }>('/admin/login', {
        username,
        password,
      });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      setAdmin(data.admin);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Admin login failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        loading,
        login,
        register,
        updateProfile,
        adminLogin,
        logout,
        adminLogout,
        errorMsg,
        setErrorMsg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
