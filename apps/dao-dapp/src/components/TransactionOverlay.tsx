import type { TransactionOverlayType } from '../stores/modalStore'

interface TransactionOverlayProps {
  isVisible: boolean
  type: TransactionOverlayType
  title?: string
  message?: string
}

const DEFAULT_TITLES: Record<TransactionOverlayType, string> = {
  pending: 'Waiting for Signature',
  confirming: 'Processing Transaction'
}

const DEFAULT_MESSAGES: Record<TransactionOverlayType, string> = {
  pending: 'Please confirm the transaction in your wallet. Check your mobile wallet if connected there.',
  confirming: 'Your transaction is being processed on the blockchain. Please wait...'
}

export function TransactionOverlay({
  isVisible,
  type,
  title,
  message
}: TransactionOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="tx-overlay-title"
      aria-modal="true"
    >
      <div className="mx-4 max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-8 shadow-2xl">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/10">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
              aria-hidden
            />
          </div>
          <div>
            <h2 id="tx-overlay-title" className="text-xl font-bold text-white">
              {title ?? DEFAULT_TITLES[type]}
            </h2>
            <p className="mt-2 text-zinc-400">
              {message ?? DEFAULT_MESSAGES[type]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
