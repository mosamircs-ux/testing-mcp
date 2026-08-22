export class TestAssertionError extends Error {
  constructor(
    public readonly expected: unknown,
    public readonly actual: unknown,
    message: string
  ) {
    super(message);
    this.name = 'TestAssertionError';
  }
}

export class Assertions {
  static equals<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new TestAssertionError(
        expected,
        actual,
        message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
      );
    }
  }

  static includes(actual: string, expectedSubstring: string, message?: string): void {
    if (!actual || !actual.includes(expectedSubstring)) {
      throw new TestAssertionError(
        expectedSubstring,
        actual,
        message || `Expected string to include '${expectedSubstring}'`
      );
    }
  }

  static isTrue(value: boolean, message?: string): void {
    if (!value) {
      throw new TestAssertionError(true, value, message || `Expected condition to be true`);
    }
  }

  static matchesJson(actual: Record<string, unknown>, expectedSubset: Record<string, unknown>): void {
    for (const [key, expectedVal] of Object.entries(expectedSubset)) {
      const actualVal = actual[key];
      if (actualVal !== expectedVal) {
        throw new TestAssertionError(
          expectedVal,
          actualVal,
          `JSON Property '${key}' mismatch: expected ${JSON.stringify(expectedVal)} but got ${JSON.stringify(actualVal)}`
        );
      }
    }
  }
}
