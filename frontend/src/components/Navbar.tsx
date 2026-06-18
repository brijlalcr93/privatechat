'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, MessageSquare, ShieldAlert, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, admin, logout, adminLogout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-border py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
          <MessageSquare className="w-5 h-5" />
        </div>
        <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          PrivateChat
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary text-muted hover:text-foreground transition-all duration-200 border border-transparent hover:border-border cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Standard User Authenticated */}
        {user && (
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/20"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            <div className="h-5 w-px bg-border hidden sm:block" />

            <Link href="/profile" className="flex items-center gap-2 group">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover border border-border transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold border border-primary/20 transition-transform group-hover:scale-105">
                  {getInitials(user.username)}
                </div>
              )}
              <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate group-hover:text-primary transition-colors">
                {user.username}
              </span>
            </Link>

            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-destructive/10 text-muted hover:text-destructive transition-all border border-transparent hover:border-destructive/20 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Admin Explicitly Authenticated */}
        {admin && !user && (
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/20"
            >
              <ShieldAlert className="w-4 h-4" />
              System Admin
            </Link>

            <button
              onClick={adminLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}

        {/* Unauthenticated */}
        {!user && !admin && (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-secondary transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md shadow-primary/15"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
