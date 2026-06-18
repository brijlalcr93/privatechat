'use client';

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Search, Check, Loader2, Upload } from 'lucide-react';

interface UserType {
  id: string;
  username: string;
  avatar: string;
}

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: (newChat: any) => void;
}

const AVATAR_PRESETS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FF5E62"/><stop offset="100%" stop-color="%23FF9966"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234A00E0"/><stop offset="100%" stop-color="%238E2DE2"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2311998e"/><stop offset="100%" stop-color="%2338ef7d"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/></svg>',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(AVATAR_PRESETS[0]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await api.get<UserType[]>('/users');
        setUsers(list);
      } catch (err: any) {
        console.error('Failed to load users for group creation', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!groupName.trim()) {
      setErrorMsg('Group Name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setErrorMsg('Please select at least one member to add');
      return;
    }

    setSubmitting(true);
    try {
      const newChat = await api.post('/chats/group', {
        groupName: groupName.trim(),
        groupDescription: description.trim(),
        groupAvatar,
        participantIds: selectedUsers,
      });
      onSuccess(newChat);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card/20">
          <h3 className="font-semibold text-lg">Create Group Chat</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary text-muted hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          {/* Group Avatar & Name */}
          <div className="flex gap-4 items-center">
            <img
              src={groupAvatar}
              alt="Group Avatar"
              className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0"
            />
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Name"
                className="w-full px-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
              />
              <div className="flex gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGroupAvatar(preset)}
                    className={`w-6 h-6 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                      groupAvatar === preset ? 'border-primary' : 'border-transparent opacity-80'
                    }`}
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
                <label className="text-[10px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload
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

          {/* Group Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="w-full px-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40 resize-none"
            />
          </div>

          {/* User Checklist */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Add Members
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-opacity-40"
              />
            </div>

            <div className="border border-border rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-card/5">
              {loadingUsers ? (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">No users found</div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUserSelection(user.id)}
                      className="w-full flex items-center justify-between px-4 py-3 border-b border-border/40 hover:bg-secondary/40 last:border-b-0 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-7.5 h-7.5 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-7.5 h-7.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium">{user.username}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Group...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default CreateGroupModal;
