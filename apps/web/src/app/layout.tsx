import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Cpu,
  Layers,
  Activity,
  Shield,
  FileCode2,
  Play,
  Bug,
  Terminal,
  LogIn,
  Settings,
  Sparkles,
  BookOpen,
  HelpCircle,
  Mail,
  ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'NovaQA | Autonomous AI Software Testing & Verification Platform',
  description:
    'Your AI coding agent builds it. Our AI testing agent proves it. Autonomous testing for web apps, APIs, dashboards, mobile applications, and full-stack systems.',
  keywords: [
    'AI software testing',
    'autonomous QA agent',
    'Model Context Protocol',
    'MCP testing server',
    'Playwright AI testing',
    'API testing automation',
    'Mobile testing emulator',
    'Self-healing test selectors',
    'Defensive security DAST'
  ],
  authors: [{ name: 'NovaQA Autonomous Engineering' }],
  creator: 'NovaQA',
  publisher: 'NovaQA Inc.',
  metadataBase: new URL('https://novaqa.io'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'NovaQA | Autonomous AI Software Testing & Verification Platform',
    description:
      'Your AI coding agent builds it. Our AI testing agent proves it. Autonomous end-to-end testing, failure root-cause analysis, and self-healing test automation.',
    url: 'https://novaqa.io',
    siteName: 'NovaQA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NovaQA Autonomous AI Testing Platform'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaQA | Autonomous AI Software Testing Platform',
    description:
      'Your AI coding agent builds it. Our AI testing agent proves it. Autonomous web, API, mobile, and security testing.',
    creator: '@novaqa_io',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NovaQA',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Cloud, Web, Linux, macOS, Windows',
  offers: {
    '@type': 'Offer',
    price: '0.00',
    priceCurrency: 'USD'
  },
  description:
    'Autonomous AI Software Testing Platform. Proves application correctness through continuous automated test discovery, multi-engine execution, AI failure analysis, and self-healing automation.',
  url: 'https://novaqa.io'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 md:px-8 py-3.5 backdrop-blur-xl bg-slate-950/80">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Cpu className="h-5 w-5 text-slate-950 font-bold" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-white">
                  Nova<span className="text-cyan-400">QA</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                    AI AGENT
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Autonomous Quality Engine
                </span>
              </div>
            </Link>

            {/* Public Links */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
              <Link
                href="/features"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1"
              >
                <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                Docs
              </Link>
              <Link
                href="/security"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                Security
              </Link>
              <Link
                href="/about"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
              >
                Contact
              </Link>
            </nav>

            {/* Workspace & Auth CTAs */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800/70 border border-slate-700/60 transition flex items-center gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" />
                Console
              </Link>
              <Link
                href="/admin"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-purple-300 bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/40 transition flex items-center gap-1"
                title="Platform Owner Dashboard"
              >
                Admin
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-accent-500 text-slate-950 hover:brightness-110 shadow-glow transition flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Start Testing Free
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-12 px-6 bg-slate-950 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-accent-500 flex items-center justify-center">
                    <Cpu className="h-4 w-4 text-slate-950 font-bold" />
                  </div>
                  <span className="font-bold text-base text-white">NovaQA</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Autonomous AI Software Testing & Verification Engine. Proves web apps, APIs, mobile binaries, and full-stack systems with multi-engine sandbox execution.
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  © 2026 NovaQA Inc. All rights reserved.
                </span>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider">Product</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/features" className="hover:text-cyan-400">Core Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-cyan-400">Pricing Plans</Link></li>
                  <li><Link href="/security" className="hover:text-cyan-400">Defensive Security</Link></li>
                  <li><Link href="/settings/mcp" className="hover:text-cyan-400">MCP Protocol Server</Link></li>
                  <li><Link href="/dashboard" className="hover:text-cyan-400">App Console</Link></li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider">Developers</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/docs" className="hover:text-cyan-400">Documentation</Link></li>
                  <li><Link href="/docs#cli" className="hover:text-cyan-400">CLI Reference</Link></li>
                  <li><Link href="/docs#cicd" className="hover:text-cyan-400">CI/CD Integrations</Link></li>
                  <li><Link href="/docs#mcp" className="hover:text-cyan-400">AI Agent MCP Bridge</Link></li>
                  <li><Link href="/docs#api" className="hover:text-cyan-400">REST API Spec</Link></li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white uppercase text-[10px] font-mono tracking-wider">Company</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/about" className="hover:text-cyan-400">About NovaQA</Link></li>
                  <li><Link href="/contact" className="hover:text-cyan-400">Contact Engineering</Link></li>
                  <li><Link href="/admin" className="hover:text-cyan-400">Platform Admin</Link></li>
                  <li><Link href="/privacy" className="hover:text-cyan-400">Privacy & Terms</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
              <div>
                <span>Built for modern engineering teams pair programming with AI agents.</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Playwright • Chromium • Android • iOS • MCP • SQLite/PostgreSQL</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
