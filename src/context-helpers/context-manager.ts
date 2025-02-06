import { AsyncLocalStorage } from 'node:async_hooks'
import type { TestExecutionContext } from '../test-execution-context'

export class ContextManager {
  private static asyncStore = new AsyncLocalStorage<TestExecutionContext>()

  static set instance(ctx: TestExecutionContext) {
    const instance = this.asyncStore.getStore()
    if (instance !== undefined) throw new Error('Execution context has already been set')
    this.asyncStore.enterWith(ctx)
  }
  static get instance() {
    const instance = this.asyncStore.getStore()
    if (instance === undefined) throw new Error('No execution context has been set')
    return instance
  }
  static reset() {
    this.asyncStore.disable()
  }
}
