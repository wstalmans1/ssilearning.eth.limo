import { useState, useCallback } from 'react'
import { useAccount, useChainId, useSwitchChain, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI } from '../contracts/did-registry'
import { CREDENTIAL_REGISTRY_ADDRESS, CREDENTIAL_REGISTRY_ABI } from '../contracts/credential-registry'
import {
  createCredentialPayload,
  credentialHash,
  credentialHashAsMessage,
  buildSignedCredential,
  type VerifiableCredential
} from '../lib/vc'
import { HelpCallout } from '../components/HelpCallout'
import { CollapsibleHelp } from '../components/CollapsibleHelp'
import { useTransactionOverlay } from '../hooks/useTransactionOverlay'

const ZERO = '0x0000000000000000000000000000000000000000' as const

export function IssueCredential() {
  const { address, isConnected } = useAccount()
  const [subjectDid, setSubjectDid] = useState('')
  const [claimKey, setClaimKey] = useState('attestation')
  const [claimValue, setClaimValue] = useState('')
  const [error, setError] = useState('')
  const [signedVC, setSignedVC] = useState<VerifiableCredential | null>(null)

  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { signMessageAsync } = useSignMessage()
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  const onSuccessDismiss = useCallback(() => setSignedVC(null), [])
  useTransactionOverlay({ isPending, isConfirming, isSuccess, hash: txHash, onSuccessDismiss })

  const { data: myDid } = useReadContract({
    address: address ? DID_REGISTRY_ADDRESS : undefined,
    abi: DID_REGISTRY_ABI,
    functionName: 'getDIDByController',
    args: address ? [address] : undefined
  })

  const issuerDid = myDid && myDid !== '' ? myDid : null
  const hasNoRegistry = CREDENTIAL_REGISTRY_ADDRESS === ZERO
  const isWrongChain = chainId !== sepolia.id

  const fillSubjectWithMine = () => {
    if (address) setSubjectDid(`did:ethr:${address}`)
  }

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSignedVC(null)

    if (!address || !isConnected) {
      setError('Connect your wallet first.')
      return
    }
    if (!issuerDid) {
      setError('You need a DID to issue credentials. Register one in the Register tab.')
      return
    }
    if (hasNoRegistry) {
      setError('Credential Registry not deployed. Set VITE_CREDENTIAL_REGISTRY_ADDRESS after deploying.')
      return
    }
    const subj = subjectDid.trim()
    if (!subj || !subj.startsWith('did:ethr:')) {
      setError('Enter a valid subject DID (did:ethr:0x...).')
      return
    }

    try {
      const claims = claimKey.trim() ? { [claimKey.trim()]: claimValue.trim() || 'true' } : {}
      const payload = createCredentialPayload(issuerDid, subj, claims)
      const hash = await credentialHash(payload)
      const message = credentialHashAsMessage(hash)

      const signature = await signMessageAsync({
        message,
        account: address
      })

      const vc = buildSignedCredential(payload, hash, signature as `0x${string}`)

      await writeContract({
        address: CREDENTIAL_REGISTRY_ADDRESS,
        abi: CREDENTIAL_REGISTRY_ABI,
        functionName: 'registerCredential',
        args: [hash as `0x${string}`],
        chainId: sepolia.id
      })

      setSignedVC(vc)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue credential.')
    }
  }

  const copyVC = () => {
    if (signedVC) navigator.clipboard.writeText(JSON.stringify(signedVC, null, 2))
  }

  const downloadVC = () => {
    if (!signedVC) return
    const blob = new Blob([JSON.stringify(signedVC, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'credential.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-emerald-400">Issue Credential</h2>
        <HelpCallout title="Connect your wallet" variant="tip">
          Connect your wallet to issue Verifiable Credentials. You must have a registered DID (see Register tab).
        </HelpCallout>
      </section>
    )
  }

  if (!issuerDid) {
    return (
      <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-emerald-400">Issue Credential</h2>
        <HelpCallout title="Register a DID first" variant="info">
          You need a DID to issue credentials. Go to the <strong>Register</strong> tab and create your DID.
        </HelpCallout>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-400">Issue Credential</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Create and sign a Verifiable Credential. The hash is stored on-chain for revocation.
      </p>

      <CollapsibleHelp title="What happens when you issue?">
        You create a credential with claims about a subject (holder). You sign it with your wallet.
        The credential hash is registered on-chain so verifiers can check revocation. The full credential
        stays off-chain — give it to the holder (copy, download, or QR).
      </CollapsibleHelp>

      {hasNoRegistry && (
        <HelpCallout title="Credential Registry not configured" variant="warning">
          Deploy the CredentialRegistry contract and set <code>VITE_CREDENTIAL_REGISTRY_ADDRESS</code> in your .env.
          See docs/learning/05_PHASE_3_IMPLEMENTATION.md.
        </HelpCallout>
      )}

      {isWrongChain && (
        <HelpCallout title="Wrong network" variant="warning">
          Switch to Sepolia.
          <button type="button" onClick={() => switchChain?.({ chainId: sepolia.id })} className="mt-2 block rounded bg-amber-600 px-3 py-1.5 text-sm hover:bg-amber-500">
            Switch to Sepolia
          </button>
        </HelpCallout>
      )}

      {(error || writeError) && (
        <HelpCallout title="Error" variant="warning">
          {error || writeError?.message}
        </HelpCallout>
      )}

      {signedVC && (
        <HelpCallout title="Credential issued!" variant="tip">
          Give this credential to the holder. <button type="button" onClick={copyVC} className="underline">Copy</button>
          {' | '}
          <button type="button" onClick={downloadVC} className="underline">Download</button>
        </HelpCallout>
      )}

      <form onSubmit={handleIssue} className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Subject (holder) DID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="did:ethr:0x..."
              value={subjectDid}
              onChange={e => setSubjectDid(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button type="button" onClick={fillSubjectWithMine} className="rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800">Use mine</button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Claim (key)</label>
          <input
            type="text"
            placeholder="attestation"
            value={claimKey}
            onChange={e => setClaimKey(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Claim (value)</label>
          <input
            type="text"
            placeholder="e.g. I confirm completion of course"
            value={claimValue}
            onChange={e => setClaimValue(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || isConfirming || hasNoRegistry || isWrongChain}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? 'Confirm in wallet…' : 'Issue credential'}
        </button>
      </form>
    </section>
  )
}
