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

const somnia = {
    chainId: 50312,
    name: 'Somnia Testnet',
    currency: 'STT',
    explorerUrl: 'https://explorer.somnia.network',
    rpcUrl: 'https://dream-rpc.somnia.network',
    nativeCurrency: {
        name: 'STT',
        symbol: 'STT',
        decimals: 18
    },
    contracts: {
        STT: '0xB0eA5876b0eD682DCf907D41D926Ce5F0F2B44ac',
        ChessGame: '0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016'
    }
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
  rpcUrl: 'https://rpc.somnia.network', // used for the Coinbase SDK
  defaultChainId: 50312, // used for the Coinbase SDK
})

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [somnia, mainnet],
  projectId,
  enableAnalytics: true // Optional - defaults to your Cloud configuration
})
