import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI } from '../contracts/did-registry'
import { sha256Hex, isValidBytes32Hex } from '../lib/hash'
import { HelpCallout } from '../components/HelpCallout'
import { CollapsibleHelp } from '../components/CollapsibleHelp'
import { useTransactionOverlay } from '../hooks/useTransactionOverlay'

export function MyDID() {
  const { address, isConnected } = useAccount()
  const [showUpdate, setShowUpdate] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [newHash, setNewHash] = useState('')
  const [useHashInput, setUseHashInput] = useState(false)
  const [newURI, setNewURI] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [error, setError] = useState('')

  const { data: myDid, refetch: refetchDid } = useReadContract({
    address: address ? DID_REGISTRY_ADDRESS : undefined,
    abi: DID_REGISTRY_ABI,
    functionName: 'getDIDByController',
    args: address ? [address] : undefined
  })

  const { data: resolved } = useReadContract({
    address: myDid ? DID_REGISTRY_ADDRESS : undefined,
    abi: DID_REGISTRY_ABI,
    functionName: 'resolveDID',
    args: myDid ? [myDid] : undefined
  })

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  useTransactionOverlay({ isPending, isConfirming, isSuccess, hash: txHash })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!myDid || !address) return

    let documentHash: `0x${string}`
    if (useHashInput) {
      if (!isValidBytes32Hex(newHash.trim())) {
        setError('Hash must be 0x + 64 hex characters.')
        return
      }
      documentHash = newHash.trim() as `0x${string}`
    } else {
      documentHash = await sha256Hex(newHash.trim() || '{}')
    }

    const uri = newURI.trim()
    if (!uri) {
      setError('Document URI is required.')
      return
    }

    writeContract({
      address: DID_REGISTRY_ADDRESS,
      abi: DID_REGISTRY_ABI,
      functionName: 'updateDIDDocument',
      args: [myDid, documentHash, uri]
    })
    setShowUpdate(false)
    setNewHash('')
    setNewURI('')
    refetchDid()
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!myDid || !transferTo.trim()) return

    if (!/^0x[0-9a-fA-F]{40}$/.test(transferTo.trim())) {
      setError('Enter a valid Ethereum address (0x + 40 hex characters).')
      return
    }

    writeContract({
      address: DID_REGISTRY_ADDRESS,
      abi: DID_REGISTRY_ABI,
      functionName: 'transferDIDOwnership',
      args: [myDid, transferTo.trim() as `0x${string}`]
    })
    setShowTransfer(false)
    setTransferTo('')
    refetchDid()
  }

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-emerald-400">My DID</h2>
        <HelpCallout title="Connect your wallet" variant="tip">
          Connect the same wallet you used to register your DID. We&apos;ll look up the DID controlled by that address.
        </HelpCallout>
      </section>
    )
  }

  if (!myDid || myDid === '') {
    return (
      <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-emerald-400">My DID</h2>
        <HelpCallout title="No DID yet" variant="info">
          This wallet doesn&apos;t have a registered DID. Go to the <strong>Register</strong> tab to create one.
          You&apos;ll need your DID (e.g. <code>did:ethr:0xYourAddress</code>), a document hash, and a document URI.
        </HelpCallout>
      </section>
    )
  }

  const [, documentHash, documentURI] = resolved ?? []

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-400">My DID</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Your registered DID and options to update or transfer it.
      </p>

      <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Your DID</span>
          <p className="mt-0.5 break-all font-mono text-white">{myDid}</p>
          <p className="mt-1 text-xs text-zinc-500">Use this in the Resolve tab or share it with others.</p>
        </div>
        {resolved && (
          <>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Document hash</span>
              <p className="mt-0.5 break-all font-mono text-xs text-zinc-300">{documentHash}</p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Document URI</span>
              <p className="mt-0.5">
                <a
                  href={documentURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  {documentURI}
                </a>
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => { setShowUpdate(!showUpdate); setShowTransfer(false); setError('') }}
          className="rounded-lg border border-emerald-600 bg-emerald-600/20 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-600/30"
        >
          Update document
        </button>
        <button
          onClick={() => { setShowTransfer(!showTransfer); setShowUpdate(false); setError('') }}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          Transfer ownership
        </button>
      </div>

      {(error || writeError) && (
        <HelpCallout title="Error" variant="warning">
          {error || writeError?.message}
        </HelpCallout>
      )}

      {showUpdate && (
        <form onSubmit={handleUpdate} className="mt-4 space-y-3 rounded-lg border border-zinc-700 p-4">
          <h3 className="font-medium text-zinc-300">Update DID document</h3>
          <CollapsibleHelp title="When would I update?">
            Update when your DID document changes (new keys, services) or when you move it to a new location (e.g. new IPFS CID).
            The hash must match the new document content.
          </CollapsibleHelp>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useHash"
              checked={useHashInput}
              onChange={e => setUseHashInput(e.target.checked)}
            />
            <label htmlFor="useHash" className="text-sm text-zinc-400">I have a pre-computed hash</label>
          </div>
          <input
            type="text"
            placeholder={useHashInput ? '0x + 64 hex chars' : 'New document content or {}'}
            value={newHash}
            onChange={e => setNewHash(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm"
          />
          <input
            type="url"
            placeholder="New document URI"
            value={newURI}
            onChange={e => setNewURI(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-500 disabled:opacity-50"
          >
            Update
          </button>
        </form>
      )}

      {showTransfer && (
        <form onSubmit={handleTransfer} className="mt-4 space-y-3 rounded-lg border border-zinc-700 p-4">
          <h3 className="font-medium text-amber-400">Transfer ownership</h3>
          <CollapsibleHelp title="What does transfer do?">
            Transfers control of your DID to a new address. The new owner will be able to update or transfer it.
            <strong> This cannot be undone.</strong> The new address must not already have a DID.
          </CollapsibleHelp>
          <input
            type="text"
            placeholder="0x new controller address"
            value={transferTo}
            onChange={e => setTransferTo(e.target.value)}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm hover:bg-amber-500 disabled:opacity-50"
          >
            Transfer
          </button>
        </form>
      )}
    </section>
  )
}
