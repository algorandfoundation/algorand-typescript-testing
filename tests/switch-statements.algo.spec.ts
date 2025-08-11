import { beforeAll, describe } from 'vitest'
import { createArc4TestFixture } from './test-fixture'

describe('switch statements', () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/switch-statements/contract.algo.ts', { DemoContract: {} })
  beforeAll(async () => {
    await localnetFixture.newScope()
  })

  test('runs', async ({ appClientDemoContract }) => {
    await appClientDemoContract.send.call({ method: 'run', args: [] })
  })

  test('test_side_effects', async ({ appClientDemoContract }) => {
    await appClientDemoContract.send.call({ method: 'test_side_effects', args: [5] })
  })
})
