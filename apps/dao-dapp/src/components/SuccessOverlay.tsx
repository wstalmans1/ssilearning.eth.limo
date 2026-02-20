interface SuccessOverlayProps {
  isVisible: boolean
  hash: `0x${string}`
  title?: string
  onClose: () => void
}

const SEPOLIA_EXPLORER = 'https://eth-sepolia.blockscout.com'

export function SuccessOverlay({
  isVisible,
  hash,
  title = 'Transaction confirmed',
  onClose
}: SuccessOverlayProps) {
  if (!isVisible) return null

  const explorerUrl = `${SEPOLIA_EXPLORER}/tx/${hash}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="success-overlay-title"
      aria-modal="true"
    >
      <div className="mx-4 max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-8 shadow-2xl">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/20">
            <svg
              className="h-8 w-8 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h2 id="success-overlay-title" className="text-xl font-bold text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Your transaction has been confirmed on-chain.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-600 bg-emerald-600/20 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
            >
              View on explorer
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
