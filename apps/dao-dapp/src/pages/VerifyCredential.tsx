import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { CREDENTIAL_REGISTRY_ADDRESS, CREDENTIAL_REGISTRY_ABI } from '../contracts/credential-registry'
import {
  validateVCStructure,
  getCredentialHashFromVC,
  credentialHashAsMessage,
  type VerifiableCredential
} from '../lib/vc'
import { verifyMessage } from 'viem'
import { HelpCallout } from '../components/HelpCallout'
import { CollapsibleHelp } from '../components/CollapsibleHelp'

const ZERO = '0x0000000000000000000000000000000000000000' as const

function didToAddress(did: string): string | null {
  if (did.startsWith('did:ethr:')) {
    const addr = did.slice(9)
    if (/^0x[0-9a-fA-F]{40}$/.test(addr)) return addr
  }
  return null
}

export function VerifyCredential() {
  const [vcJson, setVcJson] = useState('')
  const [result, setResult] = useState<{
    valid: boolean
    reason?: string
    claims?: Record<string, unknown>
    issuer?: string
    credentialHash?: `0x${string}`
  } | null>(null)
  const [error, setError] = useState('')

  const hasNoRegistry = CREDENTIAL_REGISTRY_ADDRESS === ZERO

  const { data: isRevoked, isLoading: revocationLoading } = useReadContract({
    address: result?.valid && result?.credentialHash && !hasNoRegistry ? CREDENTIAL_REGISTRY_ADDRESS : undefined,
    abi: CREDENTIAL_REGISTRY_ABI,
    functionName: 'isRevoked',
    args: result?.credentialHash ? [result.credentialHash] : undefined
  })

  const handleVerify = async () => {
    setError('')
    setResult(null)

    if (hasNoRegistry) {
      setError('Credential Registry not deployed. Set VITE_CREDENTIAL_REGISTRY_ADDRESS.')
      return
    }

    let vc: unknown
    try {
      vc = JSON.parse(vcJson.trim())
    } catch {
      setError('Invalid JSON. Paste a Verifiable Credential (JSON).')
      return
    }

    if (!validateVCStructure(vc)) {
      setResult({ valid: false, reason: 'Invalid VC structure: missing required fields' })
      return
    }

    const credential = vc as VerifiableCredential
    const issuerAddr = didToAddress(credential.issuer)
    if (!issuerAddr) {
      setResult({ valid: false, reason: 'Issuer DID must be did:ethr:0x...' })
      return
    }

    try {
      const hash = await getCredentialHashFromVC(credential)
      const message = credentialHashAsMessage(hash)
      const valid = await verifyMessage({
        address: issuerAddr as `0x${string}`,
        message,
        signature: credential.proof.signature
      })

      if (!valid) {
        setResult({ valid: false, reason: 'Invalid signature' })
        return
      }

      setResult({
        valid: true,
        claims: credential.credentialSubject,
        issuer: credential.issuer,
        credentialHash: hash
      })
    } catch (err: unknown) {
      setResult({ valid: false, reason: err instanceof Error ? err.message : 'Verification failed' })
    }
  }

  const checkRevocation = result?.valid && result?.credentialHash && !hasNoRegistry
  const revoked = checkRevocation && isRevoked === true

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-400">Verify Credential</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Paste a Verifiable Credential to check its signature and revocation status.
      </p>

      <CollapsibleHelp title="What do we verify?">
        We check: 1) Valid VC structure, 2) Issuer&apos;s cryptographic signature, 3) Credential not revoked on-chain.
        The issuer must use did:ethr:0x... format.
      </CollapsibleHelp>

      {hasNoRegistry && (
        <HelpCallout title="Credential Registry not configured" variant="warning">
          Set VITE_CREDENTIAL_REGISTRY_ADDRESS to verify revocation.
        </HelpCallout>
      )}

      {error && <HelpCallout title="Error" variant="warning">{error}</HelpCallout>}

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Credential JSON</label>
          <textarea
            placeholder='{"@context":["https://www.w3.org/2018/credentials/v1"],"type":["VerifiableCredential"],...}'
            value={vcJson}
            onChange={e => setVcJson(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={handleVerify}
          disabled={hasNoRegistry}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Verify
        </button>
      </div>

      {result && (
        <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          {result.valid && revocationLoading && checkRevocation ? (
            <HelpCallout title="Verifying..." variant="info">
              Checking revocation status on-chain…
            </HelpCallout>
          ) : result.valid && !revoked ? (
            <HelpCallout title="Valid credential" variant="tip">
              <p className="mb-2">Signature is valid. Credential is not revoked.</p>
              {result.issuer && <p className="text-xs text-zinc-500">Issuer: {result.issuer}</p>}
              {result.claims && Object.keys(result.claims).length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Claims:</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-zinc-900 p-2 text-xs">{JSON.stringify(result.claims, null, 2)}</pre>
                </div>
              )}
            </HelpCallout>
          ) : result.valid && revoked ? (
            <HelpCallout title="Revoked" variant="warning">
              This credential was valid but has been revoked by the issuer.
            </HelpCallout>
          ) : (
            <HelpCallout title="Invalid" variant="warning">
              {result.reason}
            </HelpCallout>
          )}
        </div>
      )}
    </section>
  )
}
