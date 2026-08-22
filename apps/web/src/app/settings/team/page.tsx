'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Shield, Check, Trash2, Mail, ShieldCheck, Info } from 'lucide-react';

const ROLE_DESCRIPTIONS: Record<string, { label: string; desc: string; badgeColor: string }> = {
  OWNER: {
    label: 'Owner',
    desc: 'Full administrative control over organization, billing, projects, tests, and team members.',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
  },
  ADMIN: {
    label: 'Admin',
    desc: 'Can manage projects, tests, suites, and team members, with billing read-only access.',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
  },
  QA_ENGINEER: {
    label: 'QA Engineer',
    desc: 'Can create and execute test runs, triage findings, trigger auto-healing, and manage test suites.',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
  },
  DEVELOPER: {
    label: 'Developer',
    desc: 'Can create projects, generate tests, and execute runs during feature development.',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
  },
  VIEWER: {
    label: 'Viewer',
    desc: 'Read-only access to projects, test runs, and triage reports.',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700'
  },
  BILLING_MANAGER: {
    label: 'Billing Manager',
    desc: 'Access to invoices, payment methods, and tier subscriptions.',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  }
};

export default function TeamSettingsPage() {
  const [members, setMembers] = useState([
    { id: 'm-1', name: 'Alice (Acme Owner)', email: 'alice@acme.com', role: 'OWNER', isEmailVerified: true },
    { id: 'm-2', name: 'Bob (Acme QA)', email: 'bob@acme.com', role: 'QA_ENGINEER', isEmailVerified: true },
    { id: 'm-3', name: 'Charlie (Acme Dev)', email: 'charlie@acme.com', role: 'DEVELOPER', isEmailVerified: true },
    { id: 'm-4', name: 'David (Acme Viewer)', email: 'david@acme.com', role: 'VIEWER', isEmailVerified: true },
    { id: 'm-5', name: 'Grace (Acme Billing)', email: 'grace@acme.com', role: 'BILLING_MANAGER', isEmailVerified: true }
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('QA_ENGINEER');
  const [msg, setMsg] = useState<string | null>(null);

  const handleRoleChange = (memberId: string, newRole: string) => {
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    setMsg('Member role updated successfully');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleRemove = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
    setMsg('Member removed from organization');
    setTimeout(() => setMsg(null), 3000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember = {
      id: `m-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      isEmailVerified: false
    };
    setMembers([...members, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    setMsg(`Invitation sent to ${inviteEmail}`);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Team & Multi-Tenant Access</h1>
          <p className="text-sm text-slate-400 mt-1">Manage team members, 6-tier RBAC roles, and granular tenant permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5 self-start"
        >
          <UserPlus className="h-4 w-4" />
          Invite Team Member
        </button>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Members List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            Organization Members ({members.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-800/60">
          {members.map((m) => {
            const roleInfo = ROLE_DESCRIPTIONS[m.role] || ROLE_DESCRIPTIONS.QA_ENGINEER;
            return (
              <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-900 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-sm">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {m.name}
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${roleInfo.badgeColor}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span>{m.email}</span>
                      <span>•</span>
                      <span className="text-slate-500 text-[11px]">{roleInfo.desc}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    disabled={m.role === 'OWNER'}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="QA_ENGINEER">QA Engineer</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="BILLING_MANAGER">Billing Manager</option>
                  </select>

                  {m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RBAC Granular Matrix Summary */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400" />
          RBAC Permissions Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, info]) => (
            <div key={roleKey} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono inline-block mb-1.5 ${info.badgeColor}`}>
                {info.label}
              </span>
              <p className="text-slate-400 leading-relaxed">{info.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Invite Member</h3>
            <p className="text-xs text-slate-400 mb-4">Add a team member and assign their tenant authorization role</p>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="colleague@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="QA_ENGINEER">QA Engineer</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="BILLING_MANAGER">Billing Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
