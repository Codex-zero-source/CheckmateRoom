import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

const somnia = {
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Test Token',
    symbol: 'STT',
  },
  rpcUrls: {
    public: { http: ['https://dream-rpc.somnia.network'] },
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://testnet.somniascan.io' },
  },
  testnet: true,
};

const publicClient = createPublicClient({
  chain: somnia,
  transport: http(),
});

async function getAddressInfo(address: `0x${string}`) {
  try {
    const balance = await publicClient.getBalance({ address });
    const transactionCount = await publicClient.getTransactionCount({ address });
    const byteCode = await publicClient.getBytecode({ address });

    console.log(`Address: ${address}`);
    console.log(`Balance: ${formatEther(balance)} STT`);
    console.log(`Transaction Count (Nonce): ${transactionCount}`);
    console.log(`Is Smart Contract: ${byteCode !== undefined}`);
    
  } catch (error) {
    console.error('Error fetching address information:', error);
  }
}

const addressToFetch = '0x32D35e6A1fDdbc29aC11276A22bFAD03aAa1Dc83';
getAddressInfo(addressToFetch as `0x${string}`);
