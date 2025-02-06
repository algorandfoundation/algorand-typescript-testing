import type { bytes } from '@algorandfoundation/algorand-typescript'
import { createHash, randomUUID } from 'crypto'
import fs from 'fs'
import { globIterateSync } from 'glob'
import os from 'os'
import upath from 'upath'
import type { BytesCls, StubBigUintCompat, StubBytesCompat } from '../src/impl/primitives'
import { BigUintCls, Bytes } from '../src/impl/primitives'
import { asUint8Array } from '../src/util'

class InvariantError extends Error {}
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new InvariantError(message)
  }
}
export const padUint8Array = (arr: Uint8Array, padSize: number): Uint8Array => {
  const paddedUint8Array = new Uint8Array(arr.length + padSize)
  arr.forEach((v, i) => (paddedUint8Array[padSize + i] = v))
  return paddedUint8Array
}

export const base64Encode = (value: StubBytesCompat): bytes => Bytes(Buffer.from(asUint8Array(value)).toString('base64'))

export const base64UrlEncode = (value: StubBytesCompat): bytes => Bytes(Buffer.from(asUint8Array(value)).toString('base64url'))

export const getSha256Hash = (value: Uint8Array): Uint8Array => new Uint8Array(createHash('sha256').update(value).digest())

export const getPaddedBytes = (padSize: number, value: StubBytesCompat): bytes => {
  const uint8ArrayValue = asUint8Array(value)
  const result = new Uint8Array(padSize + uint8ArrayValue.length)
  result.set([...Array(padSize).fill(0x00), ...uint8ArrayValue])
  return Bytes(result)
}

export const intToBytes = (value: StubBigUintCompat): BytesCls => BigUintCls.fromCompat(value).toBytes()

export type TempDir = {
  readonly dirPath: string
  files(): IterableIterator<string>
} & Disposable
function mkDirIfNotExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
function ensureTempDir(): string {
  const tempDir = upath.join(os.tmpdir(), 'puya-ts')
  mkDirIfNotExists(tempDir)
  return tempDir
}

export function generateTempDir(): TempDir {
  const dirPath = upath.join(ensureTempDir(), `${randomUUID()}`)
  mkDirIfNotExists(dirPath)

  return {
    get dirPath() {
      return dirPath
    },
    *files(): IterableIterator<string> {
      for (const p of globIterateSync(upath.join(dirPath, '**'), {
        nodir: true,
      })) {
        yield p
      }
    },
    [Symbol.dispose]() {
      fs.rmSync(dirPath, { recursive: true, force: true })
    },
  }
}
