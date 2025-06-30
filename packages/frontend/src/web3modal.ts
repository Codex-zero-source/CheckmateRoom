import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = '8c73edff85c2f05754676506d9bb75e4'

// 2. Set chains
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

const fuji = {
    chainId: 43113,
    name: 'Avalanche Fuji',
    currency: 'AVAX',
    explorerUrl: 'https://testnet.snowtrace.io',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc'
}

// 3. Create a metadata object
const metadata = {
  name: 'Magnus Chess dApp',
  description: 'A chess dApp on Avalanche to earn tokens by playing, learning, and interacting.',
  url: 'http://localhost:5173', // origin must match your domain & subdomain
  icons: ['']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 43113, // used for the Coinbase SDK
})

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [fuji, mainnet],
  projectId,
  enableAnalytics: true // Optional - defaults to your Cloud configuration
}) 