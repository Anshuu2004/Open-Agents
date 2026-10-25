const CREDENTIAL_FIELD = /^(api[_-]?key|token|secret|password|credential|authorization|auth)$/i

/**
 * Recursively remove credential-shaped fields before data crosses a durable
 * storage or export boundary. The encrypted automation vault is the only
 * reviewed exception; callers must encrypt its values before persistence.
 */
export function stripCredentialFields(value) {
  if (Array.isArray(value)) return value.map(stripCredentialFields)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !CREDENTIAL_FIELD.test(key))
      .map(([key, child]) => [key, stripCredentialFields(child)])
  )
}
