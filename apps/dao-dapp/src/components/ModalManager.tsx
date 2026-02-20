import { useModalStore } from '../stores/modalStore'
import { TransactionOverlay } from './TransactionOverlay'
import { SuccessOverlay } from './SuccessOverlay'

export function ModalManager() {
  const { current, transactionPayload, successPayload, close } = useModalStore()

  const showSuccess = current === 'success' && successPayload?.hash

  return (
    <>
      <TransactionOverlay
        isVisible={current === 'transaction' && !!transactionPayload}
        type={transactionPayload?.type ?? 'pending'}
      />
      {showSuccess && (
        <SuccessOverlay
          isVisible
          hash={successPayload.hash}
          onClose={close}
        />
      )}
    </>
  )
}
