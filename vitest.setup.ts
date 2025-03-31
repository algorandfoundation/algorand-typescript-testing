import { beforeAll, expect } from 'vitest'
import { addEqualityTesters } from './src/set-up'

beforeAll(() => {
  addEqualityTesters({ expect })
})
