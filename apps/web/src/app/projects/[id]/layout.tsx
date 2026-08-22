'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Map,
  Navigation,
  Server,
  Sparkles,
  Shield,
  Sliders,
  FileCheck2,
  Activity,
  ArrowLeft
} from 'lucide-react';

const TABS = [
  { href: 'overview', label: 'Overview', icon: Layers },
  { href: 'planning', label: 'AI Test Plan', icon: FileCheck2, badge: 'AI Engine' },
  { href: 'discovery', label: 'Live Discovery', icon: Sparkles, badge: 'Real-Time' },
  { href: 'map', label: 'Application Map', icon: Map },
  { href: 'routes', label: 'Routes Map', icon: Navigation },
  { href: 'apis', label: 'API Map', icon: Server },
  { href: 'features', label: 'Feature Map', icon: Activity },
  { href: 'roles', label: 'Roles & RBAC', icon: Shield },
  { href: 'environments', label: 'Environments', icon: Sliders }
];

export default function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const projectId = params.id;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects List
        </Link>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const href = `/projects/${projectId}/${tab.href}`;
          const isActive = pathname.endsWith(`/${tab.href}`) || (tab.href === 'overview' && pathname.endsWith(projectId));

          return (
            <Link
              key={tab.href}
              href={href}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-950 text-accent-400 border border-accent-800 text-[9px] font-mono font-bold">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sub-page content */}
      <div className="pt-2">{children}</div>
    </div>
  );
}
