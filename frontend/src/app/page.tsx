'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { MessageSquare, ShieldCheck, Zap, Sparkles, ArrowRight, Activity, Users } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 w-full flex flex-col items-center justify-center text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center max-w-4xl"
        >
          {/* Tagline Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/15 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Designed for Small Private Workgroups
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6"
          >
            Real-time chat. <br />
            <span className="text-primary bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Refined simplicity.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted max-w-2xl mb-8 leading-relaxed"
          >
            A secure, ultra-fast WhatsApp-style messaging platform built for private teams. 
            Experience zero latency, responsive interfaces, and comprehensive admin controls.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link
              href="/register"
              className="flex items-center justify-center gap-1.5 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-95 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center px-8 py-3.5 rounded-2xl bg-secondary hover:bg-accent hover:text-accent-foreground font-medium border border-border transition-all hover:scale-[1.02]"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
        >
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time WebSocket Layer</h3>
            <p className="text-muted text-sm leading-relaxed">
              Immediate connection state tracking. Instant delivery, online bubbles, typing feedback, and live unread tallies.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Flexible Group Management</h3>
            <p className="text-muted text-sm leading-relaxed">
              Create shared channels, supervise participants lists, set group icons, and customize detailed channel topics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Complete System Analytics</h3>
            <p className="text-muted text-sm leading-relaxed">
              Supervise activity audit chains, generate aggregate tables, register users, and exercise suspension overrides.
            </p>
          </div>
        </motion.section>

        {/* Dynamic Glass App Preview Mockup */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden glass-panel p-3 border border-border shadow-2xl relative aspect-[16/9]"
        >
          {/* Glass window details */}
          <div className="w-full h-full bg-background/50 rounded-2xl overflow-hidden border border-border flex flex-col">
            {/* Header bar */}
            <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-card/40">
              <div className="flex gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-xs text-muted font-medium">Apple Dev Team - Live Chat Preview</div>
              <div className="w-16" />
            </div>

            {/* Inner Layout Mock */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Mock */}
              <div className="w-64 border-r border-border bg-card/25 p-4 flex flex-col gap-3">
                <div className="h-9 bg-input rounded-xl border border-border w-full" />
                <div className="flex gap-2.5 items-center p-2 rounded-xl bg-primary/10 border border-primary/15">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">AD</div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-semibold">Apple Dev Team</div>
                    <div className="text-[10px] text-muted truncate">Charlie: Is the backend ready?</div>
                  </div>
                </div>
                <div className="flex gap-2.5 items-center p-2 rounded-xl hover:bg-input transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-xs text-emerald-500">C</div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-semibold">Charlie</div>
                    <div className="text-[10px] text-muted">Online</div>
                  </div>
                </div>
              </div>

              {/* Chat View Mock */}
              <div className="flex-1 bg-card/10 p-6 flex flex-col justify-between text-left">
                <div className="flex flex-col gap-4 overflow-y-auto">
                  <div className="max-w-[70%] bg-input border border-border p-3.5 rounded-2xl text-xs leading-relaxed self-start">
                    <div className="font-semibold text-primary mb-1">Alice</div>
                    Welcome everyone to the Apple Dev Team workspace! 🎉
                  </div>
                  <div className="max-w-[70%] bg-input border border-border p-3.5 rounded-2xl text-xs leading-relaxed self-start">
                    <div className="font-semibold text-emerald-500 mb-1">Charlie</div>
                    Thanks Alice! Excited to start building this real-time app.
                  </div>
                  <div className="max-w-[70%] bg-primary text-primary-foreground p-3.5 rounded-2xl text-xs leading-relaxed self-end">
                    I will start working on the responsive mobile layout views.
                  </div>
                </div>

                <div className="flex gap-2 items-center mt-4 border-t border-border pt-4">
                  <div className="h-10 bg-input rounded-xl border border-border flex-1 w-full" />
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted bg-card/25 backdrop-blur-md">
        <p>© 2026 PrivateChat. Built with Next.js, Framer Motion, and Socket.IO.</p>
      </footer>
    </div>
  );
}
