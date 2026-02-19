/**
 * Compute SHA-256 hash of text and return as 0x-prefixed hex (bytes32)
 */
export async function sha256Hex(text: string): Promise<`0x${string}`> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `0x${hashHex}` as `0x${string}`
}

/**
 * Validate bytes32 hex string (0x + 64 hex chars)
 */
export function isValidBytes32Hex(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value)
}
