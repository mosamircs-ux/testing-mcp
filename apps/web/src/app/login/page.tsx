'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Shield, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alice@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth context
      localStorage.setItem('novaqa_token', data.data.tokens.accessToken);
      localStorage.setItem('novaqa_refresh_token', data.data.tokens.refreshToken);
      localStorage.setItem('novaqa_user', JSON.stringify(data.data.user));
      if (data.data.organization) {
        localStorage.setItem('novaqa_active_org', JSON.stringify(data.data.organization));
      }

      setSuccessMsg(`Welcome back, ${data.data.user.name}! Redirecting...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to NovaQA authentication server');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/v1/auth/oauth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google_tester@novaqa.ai',
          name: 'Google Verified User'
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('novaqa_token', data.data.tokens.accessToken);
        localStorage.setItem('novaqa_user', JSON.stringify(data.data.user));
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Google OAuth connection simulation failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-radial-gradient">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-accent-500 items-center justify-center shadow-glow mb-4">
            <Cpu className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign in to NovaQA</h1>
          <p className="text-sm text-slate-400 mt-1">Autonomous AI testing for multi-tenant engineering teams</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Credentials */}
          <div className="mb-5 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              Demo Multi-Tenant Credentials:
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono mt-1">
              <button
                type="button"
                onClick={() => { setEmail('alice@acme.com'); setPassword('Password123!'); }}
                className="text-left px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300"
              >
                Owner: alice@acme.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('bob@acme.com'); setPassword('Password123!'); }}
                className="text-left px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300"
              >
                QA: bob@acme.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('charlie@acme.com'); setPassword('Password123!'); }}
                className="text-left px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300"
              >
                Dev: charlie@acme.com
              </button>
              <button
                type="button"
                onClick={() => { setEmail('eve@globex.com'); setPassword('Password123!'); }}
                className="text-left px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-300"
              >
                Tenant B: eve@globex.com
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-cyan-400 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 font-semibold text-sm hover:brightness-110 shadow-glow transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In with Email'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative px-3 bg-slate-950 text-xs text-slate-500">Or continue with</span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2 px-4 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
              />
            </svg>
            Sign In with Google (OAuth)
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cyan-400 font-semibold hover:underline">
              Create an organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
