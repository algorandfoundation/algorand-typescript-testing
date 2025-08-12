import type { TestExecutionContext } from '../test-execution-context'

/** @internal */
export class ContextManager {
  private static _instance: TestExecutionContext | undefined

  static set instance(ctx: TestExecutionContext) {
    if (this._instance !== undefined) throw new Error('Execution context has already been set')
    this._instance = ctx
  }
  static get instance() {
    if (this._instance === undefined) throw new Error('No execution context has been set')
    return this._instance
  }
  static reset() {
    this._instance = undefined
  }
}
