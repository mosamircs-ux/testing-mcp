'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<any>({
    name: 'Alice (Acme Owner)',
    email: 'alice@acme.com',
    role: 'OWNER',
    isEmailVerified: true
  });
  const [activeOrg, setActiveOrg] = useState<any>({ name: 'Acme Corporation', tier: 'ENTERPRISE' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load local auth context if present
    const userStr = localStorage.getItem('novaqa_user');
    const orgStr = localStorage.getItem('novaqa_active_org');
    if (userStr) {
      try {
        setProfile(JSON.parse(userStr));
      } catch {}
    }
    if (orgStr) {
      try {
        setActiveOrg(JSON.parse(orgStr));
      } catch {}
    }
  }, []);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Profile & Account</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your personal details, email preferences, and password</p>
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Account Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              General Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-900/50 border border-slate-800 text-slate-300 cursor-not-allowed"
                  />
                  {profile.isEmailVerified ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-medium shrink-0 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-xs font-medium shrink-0 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-cyan-400" />
              Change Password
            </h2>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/40 text-xs font-semibold transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Organization Context */}
        <div>
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Active Workspace
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Organization:</span>
                <span className="font-semibold text-slate-200">{activeOrg.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Your Role:</span>
                <span className="font-mono text-cyan-400 font-semibold">{profile.role || 'OWNER'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Subscription Tier:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                  {activeOrg.tier || 'ENTERPRISE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
