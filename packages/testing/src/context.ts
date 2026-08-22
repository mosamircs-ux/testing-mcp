import { EventEmitter } from 'events';
import { TestCase, TestStepResult, TestResultStatus, ArtifactType } from '@novaqa/types';

export interface ExecutionTelemetryEvent {
  runId: string;
  testCaseId: string;
  type: 'RUN_STARTED' | 'TEST_STARTED' | 'STEP_STARTED' | 'STEP_COMPLETED' | 'STEP_FAILED' | 'TEST_COMPLETED' | 'RUN_COMPLETED' | 'LOG';
  payload: Record<string, unknown>;
  timestamp: string;
}

export class ExecutionContext extends EventEmitter {
  public logs: string[] = [];
  public artifacts: Array<{ type: ArtifactType; name: string; buffer: Buffer; mimeType: string }> = [];

  constructor(
    public readonly runId: string,
    public readonly environmentBaseUrl: string,
    public readonly variables: Record<string, string> = {}
  ) {
    super();
  }

  log(message: string, meta?: Record<string, unknown>) {
    const formatted = `[${new Date().toISOString()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
    this.logs.push(formatted);
    this.emitEvent('LOG', { message: formatted });
  }

  addArtifact(type: ArtifactType, name: string, buffer: Buffer, mimeType: string) {
    this.artifacts.push({ type, name, buffer, mimeType });
  }

  emitEvent(type: ExecutionTelemetryEvent['type'], payload: Record<string, unknown>) {
    const event: ExecutionTelemetryEvent = {
      runId: this.runId,
      testCaseId: (payload.testCaseId as string) || '',
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    this.emit('telemetry', event);
  }
}
