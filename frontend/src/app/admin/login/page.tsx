'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import GlassCard from '../../../components/GlassCard';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const { adminLogin, errorMsg, setErrorMsg } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(username, password);
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
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">Admin Portal</h1>
              <p className="text-sm text-muted">Sign in to control and supervise the workspace</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Username Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Admin Username
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Admin username"
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
                    placeholder="Enter admin password"
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
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Access Dashboard
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
}
