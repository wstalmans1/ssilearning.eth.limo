import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function App() {
  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">SSI Learning</h1>
        <ConnectButton />
      </header>
    </div>
  )
}
