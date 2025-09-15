// to setup mock env variables, copy contents of tests/.env.template to tests/.env and update them as needed
import * as dotenv from '@dotenvx/dotenvx'
import path from 'path'
import { beforeAll, expect } from 'vitest'
import { addEqualityTesters } from './src/set-up'

dotenv.config({ path: path.join(__dirname, '.env'), ignore: ['MISSING_ENV_FILE'], })

beforeAll(() => {
  addEqualityTesters({ expect })
})
