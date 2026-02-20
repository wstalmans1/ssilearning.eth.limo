import { useEffect } from 'react'
import { useModalStore } from '../stores/modalStore'

/**
 * Syncs Wagmi transaction state to the overlay store.
 * Call this in any component that uses useWriteContract + useWaitForTransactionReceipt.
 * @param onSuccessDismiss - Optional callback when user closes the success overlay
 */
export function useTransactionOverlay({
  isPending,
  isConfirming,
  isSuccess,
  hash,
  onSuccessDismiss
}: {
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  hash: `0x${string}` | undefined
  onSuccessDismiss?: () => void
}) {
  const { openTransaction, openSuccess, close } = useModalStore()

  useEffect(() => {
    if (isPending) {
      openTransaction({ type: 'pending' })
      return
    }
    if (hash) {
      if (isConfirming) {
        openTransaction({ type: 'confirming', hash })
        return
      }
      if (isSuccess) {
        openSuccess({ hash, onDismiss: onSuccessDismiss })
        return
      }
    }
    close()
  }, [isPending, isConfirming, isSuccess, hash, onSuccessDismiss, openTransaction, openSuccess, close])
}
