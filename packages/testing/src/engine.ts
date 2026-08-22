import { TestCase, TestResult, TestResultStatus, TestStepResult } from '@novaqa/types';
import { ExecutionContext } from './context';

export interface TestEngineResult {
  status: TestResultStatus;
  durationMs: number;
  errorMessage?: string;
  stackTrace?: string;
  stepResults: TestStepResult[];
}

export interface TestEngine {
  readonly name: string;
  initialize(context: ExecutionContext): Promise<void>;
  executeTestCase(testCase: TestCase, context: ExecutionContext): Promise<TestEngineResult>;
  cleanup(): Promise<void>;
}
