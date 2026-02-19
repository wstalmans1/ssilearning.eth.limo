import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'SSI Learning',
  projectId: import.meta.env.VITE_WALLETCONNECT_ID!,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC ?? 'https://rpc.sepolia.org')
  },
  ssr: false
})
