/**
 * Raised when an `err` op is encountered, or when the testing VM is asked to do something that would cause
 * the AVM to fail.
 */
export class AvmError extends Error {
  constructor(message: string) {
    super(message)
  }
}
export function avmError(message: string): never {
  throw new AvmError(message)
}

export function avmInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new AvmError(message)
  }
}
/**
 * Raised when an assertion fails
 */
export class AssertError extends AvmError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * Raised when testing code errors
 */
export class InternalError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

/**
 * Raised when unsupported user code is encountered
 */
export class CodeError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not available in test context. Mock using your preferred testing framework.`)
  }
}

export function testInvariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new InternalError(message)
  }
}
