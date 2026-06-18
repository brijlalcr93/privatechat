'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../utils/api';
import Navbar from '../../../components/Navbar';
import GlassCard from '../../../components/GlassCard';
import {
  Users, MessageSquare, ShieldAlert, Trash2, Edit2, CheckCircle,
  UserX, UserCheck, PlusCircle, Search, FileText, Loader2,
  Calendar, Lock, Mail, User as UserIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserType {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  isOnline: boolean;
  createdAt: string;
}

interface ChatType {
  _id: string;
  type: string;
  groupName?: string;
  participants: Array<{ username: string; email: string }>;
  createdAt: string;
}

interface LogType {
  _id: string;
  action: string;
  details: string;
  username?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { admin, user, loading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'chats' | 'logs'>('analytics');

  // Stats and data
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [chatsList, setChatsList] = useState<ChatType[]>([]);
  const [logs, setLogs] = useState<LogType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // User Action states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  
  // Add User Form
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Edit User Form
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editStatus, setEditStatus] = useState('active');

  const [logsSearch, setLogsSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security route checks
  useEffect(() => {
    if (!loading) {
      const isSystemAdmin = user && user.role === 'admin';
      const isExplicitAdmin = !!admin;
      if (!isSystemAdmin && !isExplicitAdmin) {
        router.push('/admin/login');
      }
    }
  }, [admin, user, loading, router]);

  // Load dashboard details
  const loadDashboardData = async () => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      // Fetch stats
      const statsResponse = await api.get<any>('/admin/stats', true);
      setStats(statsResponse.stats);
      setChartData(statsResponse.chartData);
      setLogs(statsResponse.recentLogs);

      // Fetch users list
      const usersList = await api.get<UserType[]>('/admin/users', true);
      setUsers(usersList);

      // Fetch chats list
      const chatsResponse = await api.get<ChatType[]>('/admin/chats', true);
      setChatsList(chatsResponse);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve admin dashboard records');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const isSystemAdmin = user && user.role === 'admin';
    const isExplicitAdmin = !!admin;
    if (isSystemAdmin || isExplicitAdmin) {
      loadDashboardData();
    }
  }, [admin, user]);

  // Toggle user suspension state
  const handleToggleSuspension = async (targetUser: UserType) => {
    const nextStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.put(`/admin/users/${targetUser._id}`, { status: nextStatus }, true);
      
      // Real-time suspension kick: Emit event to Socket.IO if user was suspended
      if (nextStatus === 'suspended' && socket) {
        socket.emit('admin-kick-user', targetUser._id);
      }

      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? All their conversations will be removed.')) return;
    try {
      await api.delete(`/admin/users/${userId}`, true);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Add User
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newUsername || !newEmail || !newPassword) {
      setErrorMsg('Please enter all fields');
      return;
    }

    try {
      await api.post('/admin/users', {
        username: newUsername.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
      }, true);
      
      // Clear forms
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setShowAddUserModal(false);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    }
  };

  // Edit User
  const openEditModal = (targetUser: UserType) => {
    setEditingUserId(targetUser._id);
    setEditUsername(targetUser.username);
    setEditEmail(targetUser.email);
    setEditRole(targetUser.role);
    setEditStatus(targetUser.status);
    setShowEditUserModal(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!editUsername || !editEmail) {
      setErrorMsg('Username and Email are required');
      return;
    }

    try {
      await api.put(`/admin/users/${editingUserId}`, {
        username: editUsername.trim(),
        email: editEmail.trim(),
        role: editRole,
        status: editStatus,
      }, true);

      // Real-time kick if edited user to suspended
      if (editStatus === 'suspended' && socket && editingUserId) {
        socket.emit('admin-kick-user', editingUserId);
      }

      setEditingUserId(null);
      setShowEditUserModal(false);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user');
    }
  };

  // Find max chart count to scale heights dynamically
  const maxChartCount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.count), 1) : 1;

  // Filter lists based on inputs
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(usersSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(usersSearch.toLowerCase())
  );

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(logsSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(logsSearch.toLowerCase()) ||
    (log.username && log.username.toLowerCase().includes(logsSearch.toLowerCase()))
  );

  if (loading || loadingData || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-8 w-full flex flex-col gap-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted">Supervise users, analyze analytics, and inspect audit trails.</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent hover:text-accent-foreground border border-border transition-all cursor-pointer"
          >
            Refresh Records
          </button>
        </div>

        {/* Analytics metrics summary row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted">Total Users</div>
              <div className="text-xl font-bold">{stats.totalUsers}</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted">Active Now</div>
              <div className="text-xl font-bold flex items-center gap-1.5">
                {stats.activeUsers}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted">Sent Today</div>
              <div className="text-xl font-bold">{stats.messagesToday}</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted">Total Msgs</div>
              <div className="text-xl font-bold">{stats.totalMessages}</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 col-span-2 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted">Groups</div>
              <div className="text-xl font-bold">{stats.totalGroups}</div>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-border/60 gap-1.5">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Dashboard Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'users' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            User Controller
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'chats' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Conversations Viewer
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'logs' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Activity Audit Logs
          </button>
        </div>

        {/* Panels Content switcher */}
        <div className="flex-1 min-h-[400px]">
          
          {/* TAB 1: Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
              
              {/* Messages per day CSS bar graph */}
              <GlassCard className="col-span-2 border border-border flex flex-col gap-6">
                <div>
                  <h3 className="font-bold text-sm">7-Day Messaging Volumetric Analysis</h3>
                  <p className="text-[11px] text-muted">Daily breakdown of total message logs</p>
                </div>
                
                {/* CSS Bar Chart */}
                <div className="flex-1 flex items-end justify-between gap-4 h-64 border-b border-border pb-4 pt-10">
                  {chartData.map((day, idx) => {
                    const percentage = (day.count / maxChartCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="text-[10px] font-semibold text-primary">{day.count}</div>
                        <div
                          style={{ height: `${percentage}%` }}
                          className="w-full max-w-[40px] bg-gradient-to-t from-primary/80 to-primary rounded-t-lg transition-all duration-500 shadow-lg shadow-primary/10"
                        />
                        <div className="text-[10px] font-bold text-muted">{day.label}</div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Mini logs feed sidebar */}
              <GlassCard className="border border-border flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm">Recent Activity</h3>
                  <FileText className="w-4 h-4 text-muted" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[300px] pr-1">
                  {logs.slice(0, 8).map((log) => (
                    <div key={log._id} className="flex flex-col border-b border-border/40 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[10px] font-bold text-primary">{log.action}</span>
                        <span className="text-[9px] text-muted">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-tight">{log.details}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* TAB 2: Users Management Panel */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                  />
                </div>

                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  <PlusCircle className="w-4.5 h-4.5" /> Add New User
                </button>
              </div>

              {/* User management table */}
              <GlassCard className="border border-border/75 p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/60 font-semibold text-muted text-[10px] uppercase tracking-wider">
                        <th className="p-4">User</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted">No users found</td>
                        </tr>
                      ) : (
                        filteredUsers.map((item) => (
                          <tr key={item._id} className="hover:bg-secondary/15 transition-all">
                            <td className="p-4 flex items-center gap-3">
                              <div className="relative">
                                {item.avatar ? (
                                  <img src={item.avatar} alt={item.username} className="w-8 h-8 rounded-full object-cover border border-border" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{item.username.slice(0,2).toUpperCase()}</div>
                                )}
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                                  item.isOnline ? 'bg-emerald-500' : 'bg-muted'
                                }`} />
                              </div>
                              <span className="font-semibold">{item.username}</span>
                            </td>
                            <td className="p-4 text-muted">{item.email}</td>
                            <td className="p-4 text-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {item.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4 text-right flex items-center justify-end gap-1.5">
                              {/* Toggle Suspension status */}
                              <button
                                onClick={() => handleToggleSuspension(item)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  item.status === 'suspended'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                }`}
                                title={item.status === 'suspended' ? 'Activate account' : 'Suspend account'}
                              >
                                {item.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>

                              {/* Edit details */}
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted hover:text-foreground transition-all cursor-pointer"
                                title="Edit properties"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete account */}
                              <button
                                onClick={() => handleDeleteUser(item._id)}
                                className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-500 transition-all cursor-pointer"
                                title="Delete account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}

          {/* TAB 3: Chats & Groups Supervision */}
          {activeTab === 'chats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {chatsList.length === 0 ? (
                <div className="col-span-2 text-center text-muted p-12">No conversation chats registered.</div>
              ) : (
                chatsList.map((chat) => (
                  <GlassCard key={chat._id} className="border border-border/70 flex flex-col gap-3">
                    <div className="flex justify-between items-baseline border-b border-border/40 pb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        chat.type === 'group' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'
                      }`}>
                        {chat.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted">{new Date(chat.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h4 className="font-bold text-sm">
                      {chat.type === 'group' ? chat.groupName : 'One-to-One Private Chat'}
                    </h4>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Participants</span>
                      <div className="flex flex-wrap gap-1">
                        {chat.participants.map((p, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-secondary/80 text-[10px] font-medium border border-border/45">
                            {p.username}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Audit Activity Trails */}
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  placeholder="Filter logs (e.g. USER_LOGIN)..."
                  className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
                />
              </div>

              <GlassCard className="border border-border/70 p-0 overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/60 font-semibold text-muted text-[10px] uppercase tracking-wider">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Action Event</th>
                        <th className="p-4">Operator</th>
                        <th className="p-4">Details Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted">No audit logs found</td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-secondary/10 transition-all text-[11px]">
                            <td className="p-4 text-muted font-normal shrink-0">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4 font-bold text-primary">{log.action}</td>
                            <td className="p-4 font-semibold text-muted">{log.username || 'System'}</td>
                            <td className="p-4 text-muted">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Add User Dialog */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel rounded-3xl overflow-hidden border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-card/20">
                <h3 className="font-semibold text-sm">Add New Member</h3>
                <button onClick={() => setShowAddUserModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="p-6 flex flex-col gap-4">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. Alice"
                      className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="name@apple.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Assign password"
                      className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  Create Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Edit User Dialog */}
      <AnimatePresence>
        {showEditUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel rounded-3xl overflow-hidden border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-card/20">
                <h3 className="font-semibold text-sm">Edit User Properties</h3>
                <button onClick={() => setShowEditUserModal(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="p-6 flex flex-col gap-4">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                  >
                    <option value="user">User</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-xs focus:outline-none bg-opacity-40"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-95 shadow-md shadow-primary/10 cursor-pointer"
                >
                  Save Properties
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
