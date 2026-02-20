import { create } from 'zustand'

export type TransactionOverlayType = 'pending' | 'confirming'
export type ModalType = 'transaction' | 'success' | null

interface TransactionPayload {
  type: TransactionOverlayType
  hash?: `0x${string}`
}

interface SuccessPayload {
  hash: `0x${string}`
  onDismiss?: () => void
}

interface ModalState {
  current: ModalType
  transactionPayload: TransactionPayload | null
  successPayload: SuccessPayload | null
  openTransaction: (payload: TransactionPayload) => void
  openSuccess: (payload: SuccessPayload) => void
  close: () => void
}

export const useModalStore = create<ModalState>((set, get) => ({
  current: null,
  transactionPayload: null,
  successPayload: null,
  openTransaction: (payload) => set({
    current: 'transaction',
    transactionPayload: payload,
    successPayload: null
  }),
  openSuccess: (payload) => set({
    current: 'success',
    transactionPayload: null,
    successPayload: payload
  }),
  close: () => {
    const { successPayload } = get()
    successPayload?.onDismiss?.()
    set({
      current: null,
      transactionPayload: null,
      successPayload: null
    })
  }
}))
