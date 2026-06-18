'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, errorMsg, setErrorMsg } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setErrorMsg('Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      await login(emailOrUsername, password);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="w-full max-w-md"
        >
          <GlassCard className="border border-border shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
              <p className="text-sm text-muted">Sign in to join the conversation</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email / Username Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="name@apple.com or Username"
                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-muted">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create Account
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
}
