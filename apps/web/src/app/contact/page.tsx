'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, Send, CheckCircle2, Phone, MapPin, Building2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    inquiryType: 'ENTERPRISE',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
          <Mail className="h-3.5 w-3.5" />
          GET IN TOUCH
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Talk with our engineering team.
        </h1>
        <p className="text-slate-400 text-sm">
          Have questions about our autonomous testing sandboxes, custom enterprise on-prem runner deployments, or the MCP protocol server? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info */}
        <div className="md:col-span-5 glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 bg-slate-900/40">
          <h2 className="text-lg font-bold text-white">Direct Channels</h2>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Engineering Support</span>
                <span className="text-slate-400 font-mono">support@novaqa.io</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Enterprise Inquiries</span>
                <span className="text-slate-400 font-mono">enterprise@novaqa.io</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Developer Community</span>
                <span className="text-slate-400 font-mono">discord.gg/novaqa</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Average response time: <strong>&lt; 2 hours</strong> for enterprise tickets.
          </div>
        </div>

        {/* Right: Interactive Form */}
        <div className="md:col-span-7 glass-panel p-8 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
          {isSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Message Dispatched</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Thank you for reaching out, <strong>{formData.name}</strong>. Our engineering lead will follow up shortly at <span className="font-mono text-cyan-400">{formData.email}</span>.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', organization: '', inquiryType: 'ENTERPRISE', message: '' });
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Organization Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Inquiry Type</label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ENTERPRISE">Enterprise Custom SLA / Private Runners</option>
                    <option value="TECHNICAL">Technical & MCP Integration Question</option>
                    <option value="BILLING">Billing & Paymob Payment Query</option>
                    <option value="PARTNERSHIP">Technology Partnership</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Message / Project Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us about your testing volume, platforms (Web, API, Mobile), and infrastructure requirements..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Message to Engineering
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
