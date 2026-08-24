import { EventEmitter } from 'events';
import { TestCase, TestStepResult, TestResultStatus, ArtifactType, NetworkInterceptionEntry, NetworkTimingMetrics } from '@novaqa/types';

export interface ConsoleLogEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: string;
  location?: string;
}

export interface ExecutionArtifact {
  type: ArtifactType;
  name: string;
  buffer: Buffer;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionTelemetryEvent {
  runId: string;
  testCaseId?: string;
  type:
    | 'RUN_STARTED'
    | 'TEST_STARTED'
    | 'STEP_STARTED'
    | 'STEP_COMPLETED'
    | 'STEP_FAILED'
    | 'TEST_COMPLETED'
    | 'RUN_COMPLETED'
    | 'LOG'
    | 'ARTIFACT_GENERATED'
    | 'TIMING_METRIC'
    | 'STATUS_UPDATE';
  payload: Record<string, unknown>;
  timestamp: string;
}

export class ExecutionContext extends EventEmitter {
  public logs: string[] = [];
  public consoleLogs: ConsoleLogEntry[] = [];
  public networkEntries: NetworkInterceptionEntry[] = [];
  public artifacts: ExecutionArtifact[] = [];
  public variables: Record<string, string> = {};
  public cookies: Record<string, string> = {};
  public headers: Record<string, string> = {};
  public isCancelled = false;
  private abortController = new AbortController();

  constructor(
    public readonly runId: string,
    public readonly environmentBaseUrl: string,
    initialVariables: Record<string, string> = {}
  ) {
    super();
    this.variables = { ...initialVariables };
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  cancel(reason = 'Execution cancelled by user') {
    this.isCancelled = true;
    this.abortController.abort(reason);
    this.log(`⚠️ Execution cancelled: ${reason}`);
    this.emitEvent('STATUS_UPDATE', { status: 'CANCELLED', reason });
  }

  checkCancellation() {
    if (this.isCancelled || this.signal.aborted) {
      throw new Error(`Execution was cancelled: ${this.signal.reason || 'Cancelled'}`);
    }
  }

  setVariable(key: string, value: string) {
    this.variables[key] = value;
    this.log(`Variable stored: {{${key}}} = ${value.length > 50 ? value.substring(0, 47) + '...' : value}`);
  }

  getVariable(key: string): string | undefined {
    return this.variables[key];
  }

  interpolate(input: string): string {
    if (!input || typeof input !== 'string') return input;
    return input.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (match, varName) => {
      if (varName in this.variables) {
        return this.variables[varName];
      }
      return match;
    });
  }

  setCookie(name: string, value: string) {
    this.cookies[name] = value;
  }

  getCookieHeader(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('; ');
  }

  log(message: string, meta?: Record<string, unknown>) {
    const formatted = `[${new Date().toISOString()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
    this.logs.push(formatted);
    this.emitEvent('LOG', { message: formatted });
  }

  addConsoleLog(type: ConsoleLogEntry['type'], text: string, location?: string) {
    const entry: ConsoleLogEntry = {
      type,
      text,
      timestamp: new Date().toISOString(),
      location
    };
    this.consoleLogs.push(entry);
    this.log(`[Browser Console ${type.toUpperCase()}]: ${text}`);
  }

  addNetworkEntry(entry: NetworkInterceptionEntry) {
    this.networkEntries.push(entry);
  }

  addArtifact(
    type: ArtifactType,
    name: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, unknown>
  ) {
    const art: ExecutionArtifact = { type, name, buffer, mimeType, metadata };
    this.artifacts.push(art);
    this.emitEvent('ARTIFACT_GENERATED', {
      type,
      name,
      mimeType,
      sizeBytes: buffer.length,
      metadata
    });
  }

  emitEvent(type: ExecutionTelemetryEvent['type'], payload: Record<string, unknown>) {
    const event: ExecutionTelemetryEvent = {
      runId: this.runId,
      testCaseId: (payload.testCaseId as string) || undefined,
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    this.emit('telemetry', event);
  }
}

