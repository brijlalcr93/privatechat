'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import { motion } from 'framer-motion';
import {
  Settings, Bell, Volume2, Shield, Monitor, Palette,
  ArrowLeft, Check, AlertTriangle, ChevronRight, Loader2, User as UserIcon
} from 'lucide-react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Local settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [wallpaper, setWallpaper] = useState('classic');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full flex flex-col gap-6">
        {/* Back Link */}
        <div>
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat Dashboard
          </button>
        </div>

        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Settings
          </h1>
          <p className="text-xs text-muted">Manage system preferences and display configurations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Navigation panel */}
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-between p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-left text-xs font-bold transition-all">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" /> General Settings
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary text-left text-xs font-bold transition-all"
            >
              <span className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted" /> Profile Customization
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <GlassCard className="border border-border">
              {savedSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex gap-2 items-center">
                  <Check className="w-4 h-4" />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                {/* Notifications section */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    Push Notifications
                  </h3>
                  <div className="flex justify-between items-center bg-input/20 p-3.5 rounded-xl border border-border/40">
                    <div>
                      <div className="text-xs font-semibold">Enable desktop alerts</div>
                      <div className="text-[10px] text-muted">Receive sound triggers on new message inputs.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                        notificationsEnabled ? 'bg-primary' : 'bg-muted/40'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Sound effects */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                    Sound Preferences
                  </h3>
                  <div className="flex justify-between items-center bg-input/20 p-3.5 rounded-xl border border-border/40">
                    <div>
                      <div className="text-xs font-semibold">Play chat sound effects</div>
                      <div className="text-[10px] text-muted">Hear a click on message sent and received.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundsEnabled(!soundsEnabled)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all cursor-pointer ${
                        soundsEnabled ? 'bg-primary' : 'bg-muted/40'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                        soundsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Wallpaper customization */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    Chat Wallpaper
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['classic', 'midnight', 'forest'].map((themeName) => (
                      <button
                        key={themeName}
                        type="button"
                        onClick={() => setWallpaper(themeName)}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer capitalize ${
                          wallpaper === themeName
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-input/20 border-border hover:bg-input'
                        }`}
                      >
                        {wallpaper === themeName && <Check className="w-3.5 h-3.5" />}
                        {themeName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session supervisor */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-primary" />
                    Active Devices Sessions
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <div>
                        <div className="font-semibold text-emerald-500">Chrome on Windows (This PC)</div>
                        <div className="text-[9px] text-muted">Active Session</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-input/20 border border-border/40 rounded-xl text-muted">
                      <div>
                        <div className="font-semibold text-foreground">Safari on iPhone 15 Pro</div>
                        <div className="text-[9px]">Logged in June 18, 2026</div>
                      </div>
                      <button className="text-[10px] font-semibold text-red-500 hover:underline">Revoke</button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  Save Preferences
                </button>
              </form>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}

// Fallback user icon wrapper to avoid compilation conflict
const UserIconWrapper = () => <span className="w-4 h-4" />;
