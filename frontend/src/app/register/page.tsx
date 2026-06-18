'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Loader2, AlertCircle, Upload } from 'lucide-react';

const AVATAR_PRESETS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23007AFF"/><stop offset="100%" stop-color="%2300C7BE"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2334C759"/><stop offset="100%" stop-color="%2330B0C7"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FF9500"/><stop offset="100%" stop-color="%23FF2D55"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23AF52DE"/><stop offset="100%" stop-color="%23FF2D55"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
];

export default function RegisterPage() {
  const { register, errorMsg, setErrorMsg } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setErrorMsg('Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, avatar);
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">Create Account</h1>
              <p className="text-sm text-muted">Join the secure private workspace</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-3.5 mb-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider self-start">
                  Choose Avatar
                </span>
                <div className="flex items-center gap-3">
                  {/* Selected Preview */}
                  <img
                    src={avatar}
                    alt="Avatar Preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-border"
                  />
                  {/* Options */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            avatar === preset ? 'border-primary scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    {/* Custom File Upload */}
                    <label className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload custom image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Alice"
                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@apple.com"
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
                    placeholder="Create a password"
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
}
