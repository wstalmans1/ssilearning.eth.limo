import { useState, useMemo, useCallback } from 'react'
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI } from '../contracts/did-registry'
import { sha256Hex } from '../lib/hash'
import { buildDIDDocument } from '../lib/did-document'
import { HelpCallout } from '../components/HelpCallout'
import { CollapsibleHelp } from '../components/CollapsibleHelp'
import { useTransactionOverlay } from '../hooks/useTransactionOverlay'

function friendlyError(msg: string): string {
  if (msg.includes('DID already registered')) return 'This DID is already taken. Each DID can only be registered once.'
  if (msg.includes('Address already has a DID')) return 'Your wallet already has a DID. One address can only control one DID in this registry.'
  if (msg.includes('documentURI cannot be empty')) return 'Document URI is required. Enter the IPFS URI where you stored your document.'
  if (msg.includes('user rejected')) return 'Transaction was cancelled.'
  if (msg.includes('insufficient funds')) return 'You need Sepolia ETH to pay for gas. Get test ETH from a faucet.'
  return msg
}

export function RegisterDID() {
  const { address, isConnected } = useAccount()
  const [did, setDid] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [customJson, setCustomJson] = useState('')
  const [useCustomJson, setUseCustomJson] = useState(false)
  const [documentURI, setDocumentURI] = useState('')
  const [error, setError] = useState('')
  const [computedHash, setComputedHash] = useState<`0x${string}` | null>(null)

  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const resetForm = useCallback(() => {
    setDid('')
    setServiceUrl('')
    setCustomJson('')
    setUseCustomJson(false)
    setDocumentURI('')
    setError('')
    setComputedHash(null)
  }, [])
  useTransactionOverlay({ isPending, isConfirming, isSuccess, hash, onSuccessDismiss: resetForm })

  const isWrongChain = chainId !== sepolia.id

  const fillMyDid = () => {
    if (address) setDid(`did:ethr:${address}`)
  }

  const templateDocument = useMemo(() => {
    if (!did.trim()) return ''
    return buildDIDDocument(did.trim(), {
      service: serviceUrl.trim() || undefined,
      note: 'Created with SSI Learning DID Registry'
    })
  }, [did, serviceUrl])

  const documentToHash = useCustomJson ? customJson : templateDocument
  const canComputeHash = documentToHash.trim().length > 0

  const handleComputeHash = async () => {
    setError('')
    if (!canComputeHash) return
    try {
      const hash = await sha256Hex(documentToHash.trim())
      setComputedHash(hash)
    } catch {
      setError('Invalid JSON. Fix the document and try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!address || !isConnected) {
      setError('Connect your wallet first.')
      return
    }

    const trimmedDid = did.trim()
    const trimmedUri = documentURI.trim()

    if (!trimmedDid) {
      setError('Please enter your DID.')
      return
    }
    if (!trimmedDid.startsWith('did:ethr:')) {
      setError('DID must start with did:ethr: (e.g. did:ethr:0xYourAddress).')
      return
    }
    if (!trimmedUri) {
      setError('Enter the document URI (e.g. ipfs://Qm...) where you stored your DID document.')
      return
    }
    if (!computedHash) {
      setError('Click "Compute hash" first to generate the document hash.')
      return
    }

    try {
      writeContract({
        address: DID_REGISTRY_ADDRESS,
        abi: DID_REGISTRY_ABI,
        functionName: 'registerDID',
        args: [trimmedDid, computedHash, trimmedUri],
        chainId: sepolia.id
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyError(err.message) : 'Transaction failed.')
    }
  }

  const isComplete = hash && !isConfirming && !writeError

  const downloadDocument = () => {
    const blob = new Blob([documentToHash || '{}'], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'did-document.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const copyDocument = () => {
    navigator.clipboard.writeText(documentToHash || '{}')
  }

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-400">Register your DID</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Create your DID document, store it on IPFS, then register it on-chain.
      </p>

      <CollapsibleHelp title="How does this work?">
        Your <strong>DID Document</strong> is a JSON file that describes your identity (keys, services).
        It lives off-chain (e.g. on IPFS). We only store a <em>hash</em> of it on-chain — that lets anyone
        verify the document hasn&apos;t been tampered with. The flow: 1) Create the document, 2) Hash it,
        3) Store it on IPFS, 4) Register (DID + hash + URI) on-chain.
      </CollapsibleHelp>

      {!isConnected ? (
        <HelpCallout title="Step 1: Connect your wallet" variant="tip">
          Click &quot;Connect Wallet&quot; in the top-right. You need Sepolia test ETH to pay for the registration.
        </HelpCallout>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Step 1: DID */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Step 1: Your DID</label>
              <button
                type="button"
                onClick={fillMyDid}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Use my wallet address
              </button>
            </div>
            <input
              type="text"
              placeholder="did:ethr:0x..."
              value={did}
              onChange={e => { setDid(e.target.value); setComputedHash(null) }}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Your DID. Format: <code>did:ethr:0x</code> + your Ethereum address.
            </p>
          </div>

          {/* Step 2: Create DID Document */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Step 2: Create your DID document</label>
            <div className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="useCustom"
                checked={useCustomJson}
                onChange={e => { setUseCustomJson(e.target.checked); setComputedHash(null) }}
              />
              <label htmlFor="useCustom" className="text-xs text-zinc-400">
                I&apos;ll paste my own JSON (advanced)
              </label>
            </div>

            {useCustomJson ? (
              <textarea
                placeholder='{"@context":["https://www.w3.org/ns/did/v1"],"id":"did:ethr:0x...",...}'
                value={customJson}
                onChange={e => { setCustomJson(e.target.value); setComputedHash(null) }}
                rows={10}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            ) : (
              <>
                <div className="mb-2 space-y-2">
                  <input
                    type="url"
                    placeholder="Service URL (optional) e.g. https://myapp.com"
                    value={serviceUrl}
                    onChange={e => { setServiceUrl(e.target.value); setComputedHash(null) }}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm"
                  />
                </div>
                <div className="rounded-lg border border-zinc-600 bg-zinc-800/50 p-3">
                  <pre className="overflow-x-auto text-xs font-mono text-zinc-300">
                    {templateDocument || 'Enter your DID above to see the template.'}
                  </pre>
                </div>
              </>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleComputeHash}
                disabled={!canComputeHash}
                className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600 disabled:opacity-50"
              >
                Compute hash
              </button>
              <button type="button" onClick={downloadDocument} disabled={!canComputeHash} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50">
                Download JSON
              </button>
              <button type="button" onClick={copyDocument} disabled={!canComputeHash} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50">
                Copy JSON
              </button>
            </div>

            {computedHash && (
              <p className="mt-2 text-xs text-emerald-400">
                Hash computed: <code className="break-all">{computedHash}</code>
              </p>
            )}
          </div>

          {/* Step 3: Store on IPFS */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Step 3: Store the document on IPFS</label>
            <HelpCallout title="How to store on IPFS" variant="info">
              <p className="mb-2">Download the JSON above, then:</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li><strong>If you have an IPFS node:</strong> Run <code>ipfs add did-document.json</code>. You&apos;ll get a CID (e.g. QmXyz...). Your document URI is <code>ipfs://QmXyz...</code></li>
                <li><strong>Or use a pinning service:</strong> Upload the file to <a href="https://app.pinata.cloud/" target="_blank" rel="noopener noreferrer">Pinata</a>, <a href="https://web3.storage/" target="_blank" rel="noopener noreferrer">web3.storage</a>, or <a href="https://nft.storage/" target="_blank" rel="noopener noreferrer">NFT.Storage</a>. They&apos;ll give you an IPFS URI.</li>
              </ul>
              <p className="mt-2 text-xs">The hash we computed must match the file you upload. Don&apos;t change the JSON after computing the hash.</p>
            </HelpCallout>
          </div>

          {/* Step 4: Document URI */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Step 4: Document URI (from IPFS)</label>
            <input
              type="text"
              placeholder="ipfs://Qm... or https://dweb.link/ipfs/Qm..."
              value={documentURI}
              onChange={e => setDocumentURI(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              IPFS URI or gateway URL (e.g. <code>ipfs://Qm...</code> or <code>https://dweb.link/ipfs/Qm...</code>).
            </p>
          </div>

          {isWrongChain && (
            <HelpCallout title="Wrong network" variant="warning">
              MetaMask must be on Sepolia testnet. Switch your network first, then try again.
              <button
                type="button"
                onClick={() => switchChain?.({ chainId: sepolia.id })}
                className="mt-2 block rounded bg-amber-600 px-3 py-1.5 text-sm hover:bg-amber-500"
              >
                Switch to Sepolia
              </button>
            </HelpCallout>
          )}

          {(error || writeError) && (
            <HelpCallout title="Something went wrong" variant="warning">
              {friendlyError(error || writeError?.message || '')}
            </HelpCallout>
          )}

          {isComplete && hash && (
            <HelpCallout title="Success!" variant="tip">
              Your DID is registered. Switch to &quot;My DID&quot; to view it, or{' '}
              <a
                href={`https://eth-sepolia.blockscout.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                view the transaction on Blockscout
              </a>
              .
            </HelpCallout>
          )}

          <button
            type="submit"
            disabled={isPending || isConfirming || !computedHash || isWrongChain}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWrongChain
              ? 'Switch to Sepolia first'
              : isPending || isConfirming
                ? 'Confirm in wallet…'
                : !computedHash
                  ? 'Compute hash first (Step 2)'
                  : 'Step 5: Register on-chain'}
          </button>
        </form>
      )}
    </section>
  )
}
