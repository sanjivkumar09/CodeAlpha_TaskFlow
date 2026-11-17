import React, { useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Check,
  Shield,
  Save,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVATAR_SEEDS = ['Alex', 'Sarah', 'Marcus', 'Elena', 'David', 'Oliver', 'Zoe', 'Leo'];

const Settings = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'notifications'
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    taskAssigned: user?.notificationPreferences?.taskAssigned ?? true,
    statusChanges: user?.notificationPreferences?.statusChanges ?? true,
    comments: user?.notificationPreferences?.comments ?? true,
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg({ type: '', text: '' });
      const res = await userApi.updateProfile(profileData);
      updateUser(res.data.user);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotifSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg({ type: '', text: '' });
      const res = await userApi.updateProfile({ notificationPreferences: notifPrefs });
      updateUser(res.data.user);
      setMsg({ type: 'success', text: 'Notification preferences saved!' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal profile, security credentials and communication settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'notifications', label: 'Preferences', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMsg({ type: '', text: '' });
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Alert Banner */}
      {msg.text && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {msg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6 shadow-sm">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                <img
                  src={
                    profileData.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name || 'User'}`
                  }
                  alt={profileData.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-brand-500/60 bg-slate-800"
                />
                <div>
                  <p className="text-[11px] text-slate-400 mb-2">Choose an avatar preset or provide image URL:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_SEEDS.map((seed) => {
                      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                      return (
                        <button
                          key={seed}
                          type="button"
                          onClick={() => setProfileData({ ...profileData, avatar: url })}
                          className={`w-7 h-7 rounded-full overflow-hidden border transition ${
                            profileData.avatar === url ? 'ring-2 ring-brand-500 border-white' : 'border-slate-700'
                          }`}
                        >
                          <img src={url} alt={seed} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Email addresses are tied to authentication and cannot be changed directly.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Bio / Role Description</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                placeholder="Brief description of your responsibilities or interests..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                required
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 outline-none focus:border-brand-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleNotifSubmit} className="space-y-5">
            <div className="space-y-3">
              {[
                {
                  key: 'taskAssigned',
                  title: 'Task Assignments',
                  desc: 'Receive alerts when you are assigned a new task by team members.',
                },
                {
                  key: 'statusChanges',
                  title: 'Status Updates',
                  desc: 'Notify when tasks in your projects are moved between workflow columns.',
                },
                {
                  key: 'comments',
                  title: 'Task Comments & Mentions',
                  desc: 'Get notified when someone comments on your assigned tasks.',
                },
                {
                  key: 'email',
                  title: 'Email Summary Digest',
                  desc: 'Send a daily summary of high priority and overdue tasks.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs[item.key]}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                    className="w-4 h-4 accent-brand-600 rounded mt-0.5 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings;
