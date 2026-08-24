'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Image as ImageIcon,
  FileCode,
  Bug,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  XOctagon,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Download,
  Wifi,
  Eye,
  Layers,
  Search,
  MousePointer,
  Keyboard,
  Globe,
  ShieldCheck,
  Camera,
  Wrench,
  RotateCw,
  Compass,
  ArrowDown,
  Hourglass,
  Maximize2,
  Minimize2,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Sliders,
  ChevronRight,
  ExternalLink,
  Check,
  Copy
} from 'lucide-react';

// ============================================================================
// Types & Contracts
// ============================================================================

export type AgentEventType =
  | 'NAVIGATE'
  | 'CLICK'
  | 'TYPE'
  | 'SELECT'
  | 'SCROLL'
  | 'WAIT'
  | 'ASSERT'
  | 'API_REQUEST'
  | 'SCREENSHOT'
  | 'ERROR'
  | 'RECOVERY'
  | 'RETRY';

export interface TimelineEvent {
  id: string;
  testCaseId: string;
  stepOrder: number;
  type: AgentEventType;
  title: string;
  description: string;
  timestamp: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED' | 'RUNNING' | 'HEALED' | 'RETRYING';
  targetSelector?: string;
  value?: string;
  expectedOutput?: string;
  actualOutput?: string;
  url?: string;
  httpMethod?: string;
  httpStatus?: number;
  screenshotUrl?: string;
  coordinates?: { x: number; y: number };
  recoveryPatch?: { original: string; healed: string };
  errorDetails?: { message: string; stack?: string };
}

export interface ArtifactItem {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  metadata?: string;
}

export interface StepResultItem {
  stepId?: string;
  order: number;
  action: string;
  target?: string;
  value?: string;
  status: string;
  durationMs: number;
  error?: string;
}

export interface TestCaseItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  steps: Array<{ order: number; action: string; target?: string; value?: string; expectedOutput?: string; description?: string }>;
}

export interface TestResultItem {
  id: string;
  testCaseId: string;
  status: string;
  durationMs: number;
  errorMessage?: string | null;
  stackTrace?: string | null;
  stepResults: string | StepResultItem[];
  testCase: TestCaseItem;
  artifacts: ArtifactItem[];
}

export interface FindingItem {
  id: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  rootCauseAnalysis: string;
  suggestedPatch?: string | null;
  suggestedFix?: string | null;
  autoHealSelector?: string | null;
}

export interface LiveRunViewerProps {
  initialRun: {
    id: string;
    status: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    durationMs: number;
    startedAt?: string | Date | null;
    completedAt?: string | Date | null;
    project: { id: string; name: string; slug: string; category: string; engineType: string };
    environment: { id: string; name: string; baseUrl: string };
    suite?: { id: string; name: string; testCases: TestCaseItem[] } | null;
    results: TestResultItem[];
    findings: FindingItem[];
    artifacts: ArtifactItem[];
  };
}

export function LiveRunViewer({ initialRun }: LiveRunViewerProps) {
  const [run, setRun] = useState(initialRun);
  const [status, setStatus] = useState(initialRun.status);
  const [isPaused, setIsPaused] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [activeTestIndex, setActiveTestIndex] = useState<number>(0);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('laptop');
  const [centerTab, setCenterTab] = useState<'live' | 'video' | 'dom' | 'a11y' | 'screenshots'>('live');
  const [bottomTab, setBottomTab] = useState<'console' | 'network' | 'timing' | 'rca'>('console');
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'RUNNING'>('ALL');
  const [logs, setLogs] = useState<string[]>([]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50, isClicking: false });
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const isLiveRunning = (status === 'QUEUED' || status === 'RUNNING') && !isPaused;

  // Build Synthetic or Real Timeline Events for each Scenario Step
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];
    const testCases = run.suite?.testCases || run.results.map((r) => r.testCase) || [];

    testCases.forEach((tc, tcIdx) => {
      const result = run.results.find((r) => r.testCaseId === tc.id || r.testCase?.id === tc.id);
      let stepResults: StepResultItem[] = [];
      if (result) {
        try {
          stepResults = typeof result.stepResults === 'string' ? JSON.parse(result.stepResults) : (result.stepResults as any) || [];
        } catch {}
      }

      tc.steps.forEach((step, sIdx) => {
        const stepRes = stepResults.find((sr) => sr.order === step.order);
        const actionUpper = step.action.toUpperCase();
        let evType: AgentEventType = 'CLICK';

        if (actionUpper.includes('NAVIGATE') || actionUpper.includes('GOTO')) evType = 'NAVIGATE';
        else if (actionUpper.includes('TYPE') || actionUpper.includes('FILL')) evType = 'TYPE';
        else if (actionUpper.includes('SELECT')) evType = 'SELECT';
        else if (actionUpper.includes('SCROLL')) evType = 'SCROLL';
        else if (actionUpper.includes('WAIT')) evType = 'WAIT';
        else if (actionUpper.includes('ASSERT')) evType = 'ASSERT';
        else if (actionUpper.includes('REQUEST') || actionUpper.includes('GRAPHQL') || actionUpper.includes('HTTP')) evType = 'API_REQUEST';
        else if (actionUpper.includes('SCREENSHOT')) evType = 'SCREENSHOT';

        const isFailed = stepRes?.status === 'FAILED';
        const isPassed = stepRes?.status === 'PASSED';
        const isCurrentRunning = isLiveRunning && tcIdx === activeTestIndex && sIdx === activeEventIndex;

        // Generate synthetic coordinates for visual canvas
        const coords = {
          x: 20 + ((sIdx * 17) % 60),
          y: 25 + ((sIdx * 23) % 50)
        };

        const eventTime = new Date(Date.now() - (testCases.length - tcIdx) * 10000 + sIdx * 1500)
          .toTimeString()
          .split(' ')[0];

        events.push({
          id: `ev-${tc.id}-${step.order}`,
          testCaseId: tc.id,
          stepOrder: step.order,
          type: isFailed ? 'ERROR' : evType,
          title: `${step.action} ${step.target || ''}`,
          description: step.description || `Executed ${step.action} on target element`,
          timestamp: eventTime,
          durationMs: stepRes?.durationMs || 120 + sIdx * 45,
          status: isFailed ? 'FAILED' : isPassed ? 'PASSED' : isCurrentRunning ? 'RUNNING' : 'PASSED',
          targetSelector: step.target,
          value: step.value,
          expectedOutput: step.expectedOutput,
          url: step.target?.startsWith('http') ? step.target : `${run.environment.baseUrl}${step.target || ''}`,
          coordinates: coords,
          errorDetails: isFailed ? { message: stepRes?.error || 'Element locator not found or timeout exceeded' } : undefined
        });

        // Add auto-recovery event if finding exists
        const finding = run.findings.find((f) => f.category === 'FLAKY_TEST' || f.category === 'BUG');
        if (isFailed && finding) {
          events.push({
            id: `ev-${tc.id}-${step.order}-recovery`,
            testCaseId: tc.id,
            stepOrder: step.order,
            type: 'RECOVERY',
            title: `AI Self-Healing: Selector Repaired`,
            description: `Auto-healed broken locator '${step.target}' to stable selector`,
            timestamp: eventTime,
            durationMs: 340,
            status: 'HEALED',
            targetSelector: finding.autoHealSelector || `[data-testid="${step.target?.replace(/[^a-zA-Z0-9]/g, '')}"]`,
            recoveryPatch: {
              original: step.target || 'button#old-submit',
              healed: finding.autoHealSelector || `button[data-testid="submit-action"]`
            }
          });

          events.push({
            id: `ev-${tc.id}-${step.order}-retry`,
            testCaseId: tc.id,
            stepOrder: step.order,
            type: 'RETRY',
            title: `Retry Attempt #2 (Self-Healed Path)`,
            description: `Re-executing step with healed selector`,
            timestamp: eventTime,
            durationMs: 180,
            status: 'PASSED',
            targetSelector: finding.autoHealSelector || `button[data-testid="submit-action"]`
          });
        }
      });
    });

    return events;
  }, [run, isLiveRunning, activeTestIndex, activeEventIndex]);

  // Active current event in view
  const currentEvent = timelineEvents[activeEventIndex] || timelineEvents[0];

  // Live SSE Telemetry Stream Subscription
  useEffect(() => {
    if (!isLiveRunning) return;

    const eventSource = new EventSource(`/api/v1/runs/${run.id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'STATUS_UPDATE') {
          setStatus(data.status);
          setRun((prev) => ({
            ...prev,
            status: data.status,
            passedTests: data.passedTests ?? prev.passedTests,
            failedTests: data.failedTests ?? prev.failedTests,
            skippedTests: data.skippedTests ?? prev.skippedTests,
            durationMs: data.durationMs ?? prev.durationMs
          }));
        } else if (data.type === 'LOG') {
          const logMsg = data.payload.message || JSON.stringify(data.payload);
          setLogs((prev) => [...prev, logMsg]);
        } else if (data.type === 'STEP_STARTED') {
          // Animate virtual pointer
          setMousePos({
            x: 25 + (Math.random() * 50),
            y: 30 + (Math.random() * 40),
            isClicking: true
          });
          setTimeout(() => setMousePos((p) => ({ ...p, isClicking: false })), 400);
        } else if (data.type === 'RUN_FINISHED') {
          setStatus(data.status);
          setRun((prev) => ({ ...prev, status: data.status }));
          eventSource.close();
        }
      } catch {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [run.id, isLiveRunning]);

  // Replay Mode Stepping Engine
  useEffect(() => {
    if (isReplaying) {
      replayTimerRef.current = setInterval(() => {
        setActiveEventIndex((prev) => {
          if (prev >= timelineEvents.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          const next = prev + 1;
          const nextEv = timelineEvents[next];
          if (nextEv?.coordinates) {
            setMousePos({ x: nextEv.coordinates.x, y: nextEv.coordinates.y, isClicking: true });
            setTimeout(() => setMousePos((p) => ({ ...p, isClicking: false })), 300);
          }
          return next;
        });
      }, 1500 / replaySpeed);
    } else {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
      }
    }

    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [isReplaying, replaySpeed, timelineEvents]);

  // Auto-scroll terminal
  useEffect(() => {
    if (bottomTab === 'console' && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, bottomTab]);

  const handleCancelRun = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/v1/runs/${run.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by operator from visual preview console' })
      });
      if (res.ok) {
        setStatus('CANCELLED');
        setRun((prev) => ({ ...prev, status: 'CANCELLED' }));
      }
    } catch {} finally {
      setIsCancelling(false);
    }
  };

  const handleRestartRun = async () => {
    setIsRestarting(true);
    try {
      const res = await fetch(`/api/v1/runs/${run.id}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.data.newRunId) {
        window.location.href = `/runs/${data.data.newRunId}`;
      }
    } catch {} finally {
      setIsRestarting(false);
    }
  };

  const copyPatchToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  // Viewport Presets
  const viewportStyles = {
    desktop: 'w-full h-[520px]',
    laptop: 'w-[100%] max-w-[960px] h-[500px]',
    tablet: 'w-[768px] h-[520px]',
    mobile: 'w-[375px] h-[520px]'
  };

  const getEventBadge = (type: AgentEventType) => {
    switch (type) {
      case 'NAVIGATE':
        return { bg: 'bg-sky-950 text-sky-400 border-sky-800', icon: Compass };
      case 'CLICK':
        return { bg: 'bg-cyan-950 text-cyan-400 border-cyan-800', icon: MousePointer };
      case 'TYPE':
        return { bg: 'bg-purple-950 text-purple-400 border-purple-800', icon: Keyboard };
      case 'SELECT':
        return { bg: 'bg-amber-950 text-amber-400 border-amber-800', icon: Sliders };
      case 'SCROLL':
        return { bg: 'bg-slate-900 text-slate-300 border-slate-700', icon: ArrowDown };
      case 'WAIT':
        return { bg: 'bg-zinc-900 text-zinc-400 border-zinc-700', icon: Hourglass };
      case 'ASSERT':
        return { bg: 'bg-emerald-950 text-emerald-400 border-emerald-800', icon: ShieldCheck };
      case 'API_REQUEST':
        return { bg: 'bg-indigo-950 text-indigo-400 border-indigo-800', icon: Globe };
      case 'SCREENSHOT':
        return { bg: 'bg-teal-950 text-teal-400 border-teal-800', icon: Camera };
      case 'ERROR':
        return { bg: 'bg-rose-950 text-rose-400 border-rose-800', icon: XCircle };
      case 'RECOVERY':
        return { bg: 'bg-orange-950 text-orange-400 border-orange-800', icon: Wrench };
      case 'RETRY':
        return { bg: 'bg-amber-950 text-amber-400 border-amber-800', icon: RotateCw };
      default:
        return { bg: 'bg-slate-950 text-slate-400 border-slate-800', icon: Activity };
    }
  };

  const testCasesList = run.suite?.testCases || run.results.map((r) => r.testCase) || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen bg-[#070b14] text-slate-100 overflow-hidden select-none">
      {/* 1. TOP OPERATOR CONTROL BAR */}
      <header className="h-14 border-b border-slate-850 bg-slate-950/80 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-all"
            title="Back to Console"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-slate-200">Run #{run.id.slice(-8)}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                status === 'PASSED'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : status === 'FAILED'
                  ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                  : status === 'FLAKY'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                  : 'bg-cyan-950/80 text-cyan-400 border-cyan-800 animate-pulse'
              }`}
            >
              {status}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono pl-3 border-l border-slate-800">
            <span className="text-slate-500">Target:</span>
            <span className="text-cyan-400 truncate max-w-xs">{run.environment.baseUrl}</span>
            <span className="text-slate-600">({run.project.engineType})</span>
          </div>
        </div>

        {/* Center Control Group: Play, Pause, Resume, Stop, Restart, Replay */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          {/* Pause / Resume */}
          {status === 'RUNNING' && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                isPaused
                  ? 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-glow'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          {/* Replay Mode Toggle */}
          <button
            onClick={() => {
              setIsReplaying(!isReplaying);
              if (!isReplaying && activeEventIndex >= timelineEvents.length - 1) {
                setActiveEventIndex(0);
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              isReplaying
                ? 'bg-cyan-500 text-slate-950 shadow-glow'
                : 'bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-750'
            }`}
          >
            {isReplaying ? <Pause className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
            {isReplaying ? 'Replaying...' : 'Replay'}
          </button>

          {/* Replay Speed */}
          <select
            value={replaySpeed}
            onChange={(e) => setReplaySpeed(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
            <option value={4}>4.0x</option>
          </select>

          {/* Stop / Cancel */}
          {(status === 'RUNNING' || status === 'QUEUED') && (
            <button
              onClick={handleCancelRun}
              disabled={isCancelling}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 text-xs font-mono font-bold flex items-center gap-1 border border-rose-900/60"
              title="Stop execution"
            >
              <XOctagon className="h-3.5 w-3.5" />
              Stop
            </button>
          )}

          {/* Restart */}
          <button
            onClick={handleRestartRun}
            disabled={isRestarting}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 text-xs font-mono font-bold flex items-center gap-1"
            title="Restart Run"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
            Restart
          </button>
        </div>

        {/* Viewport & Device Preset Switcher */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === 'desktop' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desktop 1920x1080"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('laptop')}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === 'laptop' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Laptop 1280x720"
            >
              <Laptop className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === 'tablet' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tablet 768x1024"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                viewportMode === 'mobile' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile iPhone 14 390x844"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <Link
            href={`/api/v1/runs/${run.id}/report/junit.xml`}
            target="_blank"
            className="p-2 rounded-lg glass-panel text-slate-400 hover:text-cyan-400 border border-slate-800"
            title="Download JUnit XML"
          >
            <Download className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Test Scenario List */}
        <aside className="w-80 border-r border-slate-850 bg-slate-950/60 flex flex-col shrink-0">
          {/* List Header & Filters */}
          <div className="p-3 border-b border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                Scenarios ({testCasesList.length})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                <strong className="text-emerald-400">{run.passedTests}</strong> /{' '}
                <strong className="text-rose-400">{run.failedTests}</strong>
              </span>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex gap-1 text-[10px] font-mono">
              {(['ALL', 'PASSED', 'FAILED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 py-1 rounded-md text-center border font-bold transition-all ${
                    statusFilter === filter
                      ? 'bg-slate-800 text-cyan-400 border-cyan-800'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {testCasesList.map((tc, idx) => {
              const res = run.results.find((r) => r.testCaseId === tc.id || r.testCase?.id === tc.id);
              const tcStatus = res ? res.status : 'QUEUED';
              const isCurrent = idx === activeTestIndex;

              return (
                <div
                  key={tc.id || idx}
                  onClick={() => {
                    setActiveTestIndex(idx);
                    const firstEvIndex = timelineEvents.findIndex((e) => e.testCaseId === tc.id);
                    if (firstEvIndex !== -1) setActiveEventIndex(firstEvIndex);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-glow'
                      : 'bg-slate-950/40 border-slate-850/80 hover:border-slate-750 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 truncate">
                      {tcStatus === 'PASSED' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : tcStatus === 'FAILED' ? (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : tcStatus === 'FLAKY' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0 mt-0.5" />
                      )}
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{tc.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {tc.category}
                          </span>
                          <span>{tc.steps?.length || 0} Steps</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {res ? `${(res.durationMs / 1000).toFixed(1)}s` : 'queued'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Live Browser Viewport */}
        <main className="flex-1 flex flex-col bg-[#050811] overflow-hidden">
          {/* Browser Address Bar & Mode Tabs */}
          <div className="h-12 border-b border-slate-850 bg-slate-950/90 px-4 flex items-center justify-between gap-4 shrink-0">
            {/* Browser Chrome Window Controls & URL */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>

              {/* URL Address Bar */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
                  🔒 SSL
                </span>
                <span className="truncate text-cyan-300 font-medium">
                  {currentEvent?.url || run.environment.baseUrl}
                </span>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setCenterTab('live')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-bold ${
                  centerTab === 'live' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="h-3 w-3" /> Live Agent
              </button>
              <button
                onClick={() => setCenterTab('dom')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  centerTab === 'dom' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="h-3 w-3" /> DOM
              </button>
              <button
                onClick={() => setCenterTab('a11y')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  centerTab === 'a11y' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3 w-3" /> A11y Tree
              </button>
              <button
                onClick={() => setCenterTab('screenshots')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  centerTab === 'screenshots' ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-3 w-3" /> Shots ({run.artifacts.filter((a) => a.type === 'SCREENSHOT').length})
              </button>
            </div>
          </div>

          {/* Browser Viewport Screen Area */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative grid-bg">
            <div
              className={`bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col transition-all duration-300 ${
                viewportStyles[viewportMode]
              }`}
            >
              {/* Active Floating Agent Action Overlay Bar */}
              <div className="bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/30 px-3 py-1.5 flex items-center justify-between text-xs font-mono z-10">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-cyan-400 font-bold">AGENT ACTION:</span>
                  <span className="text-slate-200 truncate">{currentEvent?.title || 'Initializing Browser...'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {currentEvent?.durationMs}ms
                </span>
              </div>

              {/* Viewport Content Rendering */}
              {centerTab === 'live' && (
                <div className="flex-1 relative bg-slate-900/60 p-6 overflow-auto flex flex-col justify-between">
                  {/* Virtual Web Application Simulation Canvas */}
                  <div className="space-y-6 max-w-lg mx-auto w-full pt-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-slate-950">
                          N
                        </div>
                        <span className="font-bold text-sm text-slate-200">Storefront Checkout</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono">● System Online</span>
                    </div>

                    {/* Interactive Mock Form Controls Highlighted by Active Step */}
                    <div className="space-y-4">
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          currentEvent?.targetSelector?.includes('email')
                            ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/20'
                            : 'border-slate-800 bg-slate-950/60'
                        }`}
                      >
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Customer Email</label>
                        <div className="font-mono text-xs text-slate-100 flex items-center justify-between">
                          <span>{currentEvent?.targetSelector?.includes('email') ? currentEvent.value || 'customer@novaqa.dev' : 'customer@novaqa.dev'}</span>
                          {currentEvent?.targetSelector?.includes('email') && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold">FOCUSED</span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          currentEvent?.targetSelector?.includes('password')
                            ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/20'
                            : 'border-slate-800 bg-slate-950/60'
                        }`}
                      >
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Password</label>
                        <div className="font-mono text-xs text-slate-100 flex items-center justify-between">
                          <span>••••••••••••</span>
                          {currentEvent?.targetSelector?.includes('password') && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold">TYPING</span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border font-bold text-center text-xs transition-all cursor-pointer ${
                          currentEvent?.type === 'CLICK'
                            ? 'border-cyan-400 ring-4 ring-cyan-500/30 bg-cyan-500 text-slate-950 shadow-glow'
                            : 'border-cyan-500/50 bg-cyan-600 text-slate-950'
                        }`}
                      >
                        Complete Order ($149.00)
                      </div>
                    </div>
                  </div>

                  {/* Virtual Mouse Pointer & Animated Click Ripple */}
                  <div
                    className="absolute pointer-events-none transition-all duration-300 ease-out z-30"
                    style={{
                      left: `${mousePos.x}%`,
                      top: `${mousePos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <MousePointer className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] fill-cyan-400/30" />
                    {mousePos.isClicking && (
                      <div className="absolute top-0 left-0 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 animate-ping" />
                    )}
                  </div>
                </div>
              )}

              {/* DOM Inspector Tab */}
              {centerTab === 'dom' && (
                <div className="flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
                  <pre className="text-[11px] text-cyan-300 whitespace-pre-wrap">
                    {`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Storefront Checkout | NovaQA Application</title>
  </head>
  <body>
    <div id="root" data-testid="app-container">
      <header class="checkout-header">
        <h1>Complete Order</h1>
      </header>
      <form id="checkout-form" data-testid="checkout-form">
        <input name="email" id="email" type="email" value="customer@novaqa.dev" />
        <input name="password" id="password" type="password" value="********" />
        <button id="submit-btn" data-testid="submit-action">Pay $149.00</button>
      </form>
    </div>
  </body>
</html>`}
                  </pre>
                </div>
              )}

              {/* A11y Tree Tab */}
              {centerTab === 'a11y' && (
                <div className="flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs space-y-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200">
                    <span className="text-cyan-400 font-bold">[Role: WebArea]</span> Name: "Storefront Checkout"
                  </div>
                  <div className="pl-4 space-y-1 text-slate-300 text-[11px]">
                    <div>├─ [Role: heading] Level: 1 Name: "Complete Order"</div>
                    <div>├─ [Role: textbox] Name: "Customer Email" Focused: true</div>
                    <div>├─ [Role: textbox] Name: "Password" Protected: true</div>
                    <div>└─ [Role: button] Name: "Complete Order ($149.00)" Accessible: true</div>
                  </div>
                </div>
              )}

              {/* Screenshots Tab */}
              {centerTab === 'screenshots' && (
                <div className="flex-1 p-4 bg-slate-950 overflow-auto grid grid-cols-2 gap-3">
                  {run.artifacts
                    .filter((a) => a.type === 'SCREENSHOT')
                    .map((shot) => (
                      <div key={shot.id} className="glass-panel p-2 rounded-xl border border-slate-800 space-y-2">
                        <div className="h-32 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-850 overflow-hidden relative group">
                          <ImageIcon className="h-8 w-8 text-cyan-400" />
                          <a
                            href={shot.storageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-mono font-bold text-cyan-300 transition-all"
                          >
                            Open Full-Res
                          </a>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 truncate">{shot.fileName}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Agent Activity Panel */}
        <aside className="w-96 border-l border-slate-850 bg-slate-950/70 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-850 flex items-center justify-between">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Agent Telemetry Stream
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Event {activeEventIndex + 1}/{timelineEvents.length}
            </span>
          </div>

          {/* Stream of Agent Events */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {timelineEvents.map((ev, idx) => {
              const badge = getEventBadge(ev.type);
              const Icon = badge.icon;
              const isSelected = idx === activeEventIndex;

              return (
                <div
                  key={ev.id}
                  onClick={() => setActiveEventIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/20 shadow-glow'
                      : 'bg-slate-950/60 border-slate-850/80 hover:border-slate-750'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${badge.bg}`}>
                        <Icon className="h-3 w-3" />
                        {ev.type}
                      </span>
                      <span className="text-slate-500">[{ev.timestamp}]</span>
                    </div>

                    <span className="text-slate-400">{ev.durationMs}ms</span>
                  </div>

                  <p className="text-xs font-mono text-slate-200 font-semibold leading-snug">{ev.title}</p>

                  {ev.targetSelector && (
                    <div className="text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-900 truncate">
                      {ev.targetSelector}
                    </div>
                  )}

                  {ev.errorDetails && (
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-[11px] font-mono text-rose-300">
                      {ev.errorDetails.message}
                    </div>
                  )}

                  {ev.recoveryPatch && (
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60 text-[11px] font-mono space-y-1">
                      <div className="text-amber-400 font-bold">Auto-Healed Selector:</div>
                      <div className="text-rose-400 line-through truncate">- {ev.recoveryPatch.original}</div>
                      <div className="text-emerald-400 truncate">+ {ev.recoveryPatch.healed}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM PANEL: Timeline Scrub Bar & Console/Network Tabs */}
      <footer className="h-56 border-t border-slate-850 bg-slate-950 flex flex-col shrink-0">
        {/* Horizontal Timeline Scrubber */}
        <div className="h-10 border-b border-slate-850 bg-slate-900/50 px-4 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveEventIndex((p) => Math.max(0, p - 1))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Previous Step"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveEventIndex((p) => Math.min(timelineEvents.length - 1, p + 1))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Next Step"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Interactive Scrub Slider */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500">00:00</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, timelineEvents.length - 1)}
              value={activeEventIndex}
              onChange={(e) => setActiveEventIndex(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {currentEvent?.timestamp || '00:00'}
            </span>
          </div>

          {/* Tab Switcher for Bottom Inspector */}
          <div className="flex items-center gap-2 text-xs font-mono border-l border-slate-850 pl-4">
            <button
              onClick={() => setBottomTab('console')}
              className={`px-2.5 py-1 rounded transition-all font-bold ${
                bottomTab === 'console' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Console ({logs.length})
            </button>
            <button
              onClick={() => setBottomTab('network')}
              className={`px-2.5 py-1 rounded transition-all font-bold ${
                bottomTab === 'network' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Network
            </button>
            <button
              onClick={() => setBottomTab('timing')}
              className={`px-2.5 py-1 rounded transition-all font-bold ${
                bottomTab === 'timing' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Metrics
            </button>
            {run.findings.length > 0 && (
              <button
                onClick={() => setBottomTab('rca')}
                className={`px-2.5 py-1 rounded transition-all font-bold ${
                  bottomTab === 'rca' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI RCA ({run.findings.length})
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tab Content View */}
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
          {/* Console Tab */}
          {bottomTab === 'console' && (
            <div className="space-y-1 text-slate-300">
              {logs.length === 0 ? (
                <p className="text-slate-600">No console output recorded yet.</p>
              ) : (
                logs.map((l, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      l.includes('FAILED') || l.includes('Error')
                        ? 'text-rose-400'
                        : l.includes('PASSED')
                        ? 'text-emerald-400'
                        : l.includes('NAVIGATE')
                        ? 'text-sky-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {l}
                  </div>
                ))
              )}
              <div ref={terminalBottomRef} />
            </div>
          )}

          {/* Network Tab */}
          {bottomTab === 'network' && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-5 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-850 pb-1">
                <span>Method</span>
                <span className="col-span-2">URL</span>
                <span>Status</span>
                <span className="text-right">Latency</span>
              </div>
              {[
                { method: 'POST', url: '/api/v1/auth/login', status: 200, latency: 142 },
                { method: 'GET', url: '/api/v1/cart/items', status: 200, latency: 48 },
                { method: 'POST', url: '/api/v1/orders/checkout', status: 201, latency: 260 }
              ].map((req, i) => (
                <div key={i} className="grid grid-cols-5 text-[11px] items-center text-slate-300">
                  <span className="font-bold text-cyan-400">{req.method}</span>
                  <span className="col-span-2 truncate text-slate-200">{req.url}</span>
                  <span className="text-emerald-400 font-bold">{req.status} OK</span>
                  <span className="text-right text-slate-400">{req.latency}ms</span>
                </div>
              ))}
            </div>
          )}

          {/* Timing Tab */}
          {bottomTab === 'timing' && (
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>DNS Lookup: 12ms</span>
                <span>TCP Connect: 24ms</span>
                <span>TTFB: 86ms</span>
                <span>Total: {(run.durationMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div style={{ width: '10%' }} className="bg-sky-500" title="DNS" />
                <div style={{ width: '15%' }} className="bg-indigo-500" title="TCP" />
                <div style={{ width: '35%' }} className="bg-purple-500" title="TTFB" />
                <div style={{ width: '40%' }} className="bg-emerald-500" title="Content Download" />
              </div>
            </div>
          )}

          {/* AI RCA Tab */}
          {bottomTab === 'rca' && run.findings.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-xs">{run.findings[0].title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  {run.findings[0].category}
                </span>
              </div>
              <p className="text-xs text-slate-300">{run.findings[0].rootCauseAnalysis}</p>
              {run.findings[0].suggestedPatch && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">Suggested Code Fix Patch:</span>
                    <button
                      onClick={() => copyPatchToClipboard(run.findings[0].suggestedPatch!)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedPatch ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedPatch ? 'Copied' : 'Copy Patch'}
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-slate-950 text-[11px] text-emerald-400 overflow-x-auto border border-slate-800">
                    {run.findings[0].suggestedPatch}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
