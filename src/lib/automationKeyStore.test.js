// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { getOrCreateDeviceKey } from './automationKeyStore'

beforeAll(() => {
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('indexedDB', undefined)
})

describe('automation device keystore', () => {
  it('fails closed with a typed error when IndexedDB is unavailable', async () => {
    await expect(getOrCreateDeviceKey()).rejects.toMatchObject({
      name: 'CredentialProtectionError',
      code: 'KEYSTORE_UNAVAILABLE',
    })
  })
})
