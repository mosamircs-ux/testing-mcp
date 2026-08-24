import { describe, it, expect, vi } from 'vitest';
import { orchestrator } from './runner.js';
import { ExecutionTelemetryEvent } from '@novaqa/testing';

describe('Test Execution Orchestrator', () => {
  it('should subscribe and receive live telemetry events', () => {
    const receivedEvents: ExecutionTelemetryEvent[] = [];
    const runId = 'test-run-telemetry-1';

    const unsubscribe = orchestrator.subscribeTelemetry(runId, (event) => {
      receivedEvents.push(event);
    });

    // Trigger internal dispatch
    (orchestrator as any).dispatchTelemetry({
      runId,
      type: 'LOG',
      payload: { message: 'Test execution started' },
      timestamp: new Date().toISOString()
    });

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].type).toBe('LOG');
    expect(receivedEvents[0].payload.message).toBe('Test execution started');

    unsubscribe();

    // After unsubscribe, no further events received
    (orchestrator as any).dispatchTelemetry({
      runId,
      type: 'LOG',
      payload: { message: 'Second message' },
      timestamp: new Date().toISOString()
    });

    expect(receivedEvents.length).toBe(1);
  });

  it('should support run cancellation', async () => {
    const runId = 'test-run-cancel-1';
    const result = await orchestrator.cancelRun(runId, 'User clicked cancel');
    expect(result).toBe(true);
  });
});
