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

  static notEquals<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new TestAssertionError(
        `not ${JSON.stringify(expected)}`,
        actual,
        message || `Expected value to not equal ${JSON.stringify(expected)}`
      );
    }
  }

  static includes(actual: string, expectedSubstring: string, message?: string): void {
    if (actual === undefined || actual === null || !String(actual).includes(expectedSubstring)) {
      throw new TestAssertionError(
        expectedSubstring,
        actual,
        message || `Expected string to include '${expectedSubstring}'`
      );
    }
  }

  static notIncludes(actual: string, substring: string, message?: string): void {
    if (actual && String(actual).includes(substring)) {
      throw new TestAssertionError(
        `not to include ${substring}`,
        actual,
        message || `Expected string to NOT include '${substring}'`
      );
    }
  }

  static matchesRegex(actual: string, pattern: RegExp | string, message?: string): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    if (!actual || !regex.test(String(actual))) {
      throw new TestAssertionError(
        regex.toString(),
        actual,
        message || `Expected '${actual}' to match pattern ${regex.toString()}`
      );
    }
  }

  static isTrue(value: boolean, message?: string): void {
    if (!value) {
      throw new TestAssertionError(true, value, message || `Expected condition to be true`);
    }
  }

  static isFalse(value: boolean, message?: string): void {
    if (value) {
      throw new TestAssertionError(false, value, message || `Expected condition to be false`);
    }
  }

  static isGreaterThan(actual: number, threshold: number, message?: string): void {
    if (actual <= threshold) {
      throw new TestAssertionError(
        `> ${threshold}`,
        actual,
        message || `Expected ${actual} to be greater than ${threshold}`
      );
    }
  }

  static isLessThan(actual: number, threshold: number, message?: string): void {
    if (actual >= threshold) {
      throw new TestAssertionError(
        `< ${threshold}`,
        actual,
        message || `Expected ${actual} to be less than ${threshold}`
      );
    }
  }

  static matchesJson(actual: any, expectedSubset: Record<string, unknown>): void {
    if (!actual || typeof actual !== 'object') {
      throw new TestAssertionError(expectedSubset, actual, 'Expected object for JSON comparison');
    }
    for (const [key, expectedVal] of Object.entries(expectedSubset)) {
      const actualVal = actual[key];
      if (typeof expectedVal === 'object' && expectedVal !== null && actualVal !== null) {
        Assertions.matchesJson(actualVal, expectedVal as Record<string, unknown>);
      } else if (actualVal !== expectedVal) {
        throw new TestAssertionError(
          expectedVal,
          actualVal,
          `JSON Property '${key}' mismatch: expected ${JSON.stringify(expectedVal)} but got ${JSON.stringify(actualVal)}`
        );
      }
    }
  }

  static validateSchema(actual: any, schema: Record<string, unknown>): void {
    if (!actual || typeof actual !== 'object') {
      throw new TestAssertionError('object', typeof actual, 'Schema validation failed: target is not an object');
    }

    if (Array.isArray(schema.required)) {
      for (const requiredProp of schema.required as string[]) {
        if (!(requiredProp in actual)) {
          throw new TestAssertionError(
            `property '${requiredProp}' to be present`,
            'undefined',
            `Schema validation failed: Missing required property '${requiredProp}'`
          );
        }
      }
    }

    if (schema.properties && typeof schema.properties === 'object') {
      for (const [prop, propSchema] of Object.entries(schema.properties as Record<string, any>)) {
        if (prop in actual && propSchema.type) {
          const val = actual[prop];
          const actualType = Array.isArray(val) ? 'array' : typeof val;
          if (propSchema.type !== actualType) {
            throw new TestAssertionError(
              propSchema.type,
              actualType,
              `Property '${prop}' type mismatch: expected ${propSchema.type} but got ${actualType}`
            );
          }
        }
      }
    }
  }
}

