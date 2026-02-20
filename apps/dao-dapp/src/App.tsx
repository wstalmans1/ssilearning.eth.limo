import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ResolveDID } from './pages/ResolveDID'
import { RegisterDID } from './pages/RegisterDID'
import { MyDID } from './pages/MyDID'
import { HelpCallout } from './components/HelpCallout'
import { ModalManager } from './components/ModalManager'

type Tab = 'resolve' | 'register' | 'my'

const TAB_INFO: Record<Tab, { label: string; hint: string }> = {
  resolve: { label: 'Resolve', hint: 'Look up any DID' },
  register: { label: 'Register', hint: 'Create your DID' },
  my: { label: 'My DID', hint: 'View & manage yours' }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('resolve')
  const [dismissBanner, setDismissBanner] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SSI Learning
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              DID Registry on Sepolia
            </p>
          </div>
          <ConnectButton />
        </header>

        {!dismissBanner && (
          <div className="mb-6">
          <HelpCallout title="Welcome" variant="tip">
            This app lets you register and resolve <strong>DIDs</strong> (Decentralized Identifiers) on Sepolia testnet.
            Start with <strong>Resolve</strong> to look up a DID, or <strong>Register</strong> to create your own.
            You&apos;ll need Sepolia ETH — get it from a <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noopener noreferrer">faucet</a>.
            <button
              type="button"
              onClick={() => setDismissBanner(true)}
              className="ml-2 text-xs text-zinc-500 hover:text-zinc-400"
            >
              Dismiss
            </button>
          </HelpCallout>
          </div>
        )}

        <nav className="mb-6 flex gap-1 rounded-xl bg-zinc-900/80 p-1">
          {(['resolve', 'register', 'my'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{TAB_INFO[id].label}</span>
              <span className="ml-1.5 hidden text-xs opacity-80 sm:inline">{TAB_INFO[id].hint}</span>
            </button>
          ))}
        </nav>

        <main>
          {tab === 'resolve' && <ResolveDID />}
          {tab === 'register' && <RegisterDID />}
          {tab === 'my' && <MyDID />}
        </main>

        <footer className="mt-12 text-center text-xs text-zinc-600">
          Phase 2 — Self-Sovereign Identity Learning
        </footer>
      </div>
      <ModalManager />
    </div>
  )
}
