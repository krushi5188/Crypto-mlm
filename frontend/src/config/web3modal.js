import { createAppKit } from '@reown/appkit/react'
import { mainnet } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'

const projectId = '06f48c91ff87fb6f45cd8128c23a3a28'

const metadata = {
  name: 'Atlas Network',
  description: 'Atlas Network - Multi-Level Marketing Platform',
  url: 'https://atlas-network.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const ethersAdapter = new EthersAdapter({
  metadata,
  chains: [mainnet],
  providers: {
    injected: window.ethereum
  }
})

createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet],
  projectId,
  features: {
    analytics: true
  }
})

/**
 * Renders children within the configured Web3 modal / AppKit context.
 *
 * This component acts as the provider boundary for the Web3 modal integration initialized by this module.
 * It does not alter or wrap its children beyond establishing the module-level configuration.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Content to render inside the Web3 modal provider.
 * @returns {import('react').ReactNode} The passed `children` element(s).
 */
export function Web3ModalProvider({ children }) {
  return children
}