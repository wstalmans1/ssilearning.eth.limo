import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI } from '../contracts/did-registry'
import { HelpCallout } from '../components/HelpCallout'
import { CollapsibleHelp } from '../components/CollapsibleHelp'

export function ResolveDID() {
  const [did, setDid] = useState('')
  const [resolvedDid, setResolvedDid] = useState('')

  const { data, isLoading, error } = useReadContract({
    address: resolvedDid ? DID_REGISTRY_ADDRESS : undefined,
    abi: DID_REGISTRY_ABI,
    functionName: 'resolveDID',
    args: resolvedDid ? [resolvedDid] : undefined
  })

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault()
    if (did.trim()) setResolvedDid(did.trim())
  }

  const [controller, documentHash, documentURI, registeredAt, updatedAt] = data ?? []
  const notFound = data && controller === '0x0000000000000000000000000000000000000000'

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-400">Resolve a DID</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Look up any DID to see who controls it and where its document lives.
      </p>

      <CollapsibleHelp title="What does &quot;resolve&quot; mean?">
        Resolving a DID is like looking up a phone number: you give the DID (e.g. <code>did:ethr:0x123...</code>)
        and get back the controller (owner), the document hash (for verification), and the document URI
        (where to fetch the actual DID document). Anyone can resolve any DID — it&apos;s public data.
      </CollapsibleHelp>

      <form onSubmit={handleResolve} className="mb-4 mt-4 flex gap-2">
        <input
          type="text"
          placeholder="did:ethr:0x..."
          value={did}
          onChange={e => setDid(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          Resolve
        </button>
      </form>

      <p className="mb-4 text-xs text-zinc-500">
        Tip: If you just registered a DID, paste it here (e.g. <code>did:ethr:0xYourAddress</code>) to verify it&apos;s on-chain.
      </p>

      {resolvedDid && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          {isLoading && <p className="text-zinc-400">Loading…</p>}
          {error && (
            <HelpCallout title="Could not resolve" variant="warning">
              {error.message}
            </HelpCallout>
          )}
          {data && (
            <>
              {notFound ? (
                <HelpCallout title="DID not found" variant="warning">
                  This DID is not registered on Sepolia. Check the spelling, or register it first in the Register tab.
                </HelpCallout>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Controller (owner)</dt>
                    <dd className="mt-0.5 break-all font-mono text-white">{controller}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Document hash</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs text-zinc-300">{documentHash}</dd>
                    <p className="mt-1 text-xs text-zinc-500">Used to verify the document hasn&apos;t been tampered with.</p>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Document URI</dt>
                    <dd className="mt-0.5">
                      <a
                        href={documentURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline"
                      >
                        {documentURI}
                      </a>
                    </dd>
                    <p className="mt-1 text-xs text-zinc-500">Where to fetch the DID document from.</p>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Registered</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {registeredAt ? new Date(Number(registeredAt) * 1000).toLocaleString() : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Last updated</dt>
                    <dd className="mt-0.5 text-zinc-300">
                      {updatedAt ? new Date(Number(updatedAt) * 1000).toLocaleString() : '-'}
                    </dd>
                  </div>
                </dl>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
