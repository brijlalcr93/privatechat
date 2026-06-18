'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import { motion } from 'framer-motion';
import { User, Mail, Save, AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';

const AVATAR_PRESETS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23007AFF"/><stop offset="100%" stop-color="%2300C7BE"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2334C759"/><stop offset="100%" stop-color="%2330B0C7"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FF9500"/><stop offset="100%" stop-color="%23FF2D55"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23AF52DE"/><stop offset="100%" stop-color="%23FF2D55"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
];

export default function ProfilePage() {
  const { user, loading, updateProfile, errorMsg, setErrorMsg } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  /* const [avatar, setAvatar] = useState('');*/

  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Set initial state
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setAvatar(user.avatar || AVATAR_PRESETS[0]);
    }
  }, [user, loading, router]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setErrorMsg(null);

    if (!username.trim() || !email.trim()) {
      setErrorMsg('Username and email are required');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(username.trim(), email.trim(), avatar);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold tracking-tight mb-2">Profile Settings</h1>
              <p className="text-sm text-muted">Update your display information and picture</p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Avatar Manager */}
              <div className="flex flex-col items-center gap-3.5 mb-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider self-start">
                  Avatar Photo
                </span>
                <div className="flex items-center gap-4 w-full">
                  <img
                    src={avatar}
                    alt="Current Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0"
                  />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex gap-2">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${avatar === preset ? 'border-primary scale-105' : 'border-transparent opacity-80'
                            }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <label className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload custom photo
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

              {/* Username Input */}
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
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@apple.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                  />
                </div>
              </div>

              {/* Submit Save */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
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
