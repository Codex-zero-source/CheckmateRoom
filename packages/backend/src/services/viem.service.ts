import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther,
  formatEther,
  type Hash,
  type PublicClient,
  type WalletClient,
  type TransactionReceipt
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { Chain } from 'viem/chains';

// Somnia chain configuration
export const somnia = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    public: { http: ['https://dream-rpc.somnia.network'] },
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
} satisfies Chain;
  testnet: true,
} as const;

// Public client for read operations
export const publicClient = createPublicClient({
  chain: somnia,
  transport: http(),
  batch: {
    multicall: true,
  },
});

// Game contract ABI (only needed functions)
export const chessGameAbi = [
  {
    inputs: [{ name: "gameId", type: "uint256" }, { name: "isWhite", type: "bool" }],
    name: "placeBet",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "gameId", type: "uint256" }],
    name: "lockBets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "gameId", type: "uint256" },
      { name: "winner", type: "address" },
      { name: "pgn", type: "string" }
    ],
    name: "submitResult",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// Transaction monitor class
export class TransactionMonitor {
  private client: PublicClient;
  private confirmations: number;
  private maxRetries: number;

  constructor(
    client: PublicClient = publicClient,
    confirmations = 2,
    maxRetries = 3
  ) {
    this.client = client;
    this.confirmations = confirmations;
    this.maxRetries = maxRetries;
  }

  async waitForTransaction(
    hash: Hash,
    timeoutMs = 60_000
  ): Promise<TransactionReceipt | null> {
    try {
      const receipt = await this.client.waitForTransactionReceipt({
        hash,
        confirmations: this.confirmations,
        timeout: timeoutMs,
        onReplaced: (replacement) => {
          console.log('Transaction replaced:', {
            reason: replacement.reason,
            oldHash: hash,
            newHash: replacement.transaction.hash,
          });
          return replacement.transaction.hash;
        },
      });
      return receipt;
    } catch (error) {
      console.error('Transaction monitoring error:', error);
      return null;
    }
  }

  async retryTransaction<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.maxRetries) throw error;
      
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryTransaction(operation, retryCount + 1);
    }
  }
}

// Game contract interactions
export class GameBlockchainService {
  private client: PublicClient;
  private monitor: TransactionMonitor;
  private contractAddress: `0x${string}`;

  constructor(contractAddress: string) {
    this.client = publicClient;
    this.monitor = new TransactionMonitor();
    this.contractAddress = contractAddress as `0x${string}`;
  }

  async placeBet(
    walletClient: WalletClient,
    gameId: bigint,
    amount: bigint,
    isWhite: boolean
  ): Promise<{ hash: Hash; receipt: TransactionReceipt | null }> {
    const hash = await this.monitor.retryTransaction(async () => {
      return await walletClient.writeContract({
        chain: somnia,
        address: this.contractAddress,
        abi: chessGameAbi,
        functionName: 'placeBet',
        args: [gameId, isWhite],
        value: amount,
      });
    });

    const receipt = await this.monitor.waitForTransaction(hash);
    return { hash, receipt };
  }

  async lockBets(
    walletClient: WalletClient,
    gameId: bigint
  ): Promise<{ hash: Hash; receipt: TransactionReceipt | null }> {
    const hash = await this.monitor.retryTransaction(async () => {
      return await walletClient.writeContract({
        chain: somnia,
        address: this.contractAddress,
        abi: chessGameAbi,
        functionName: 'lockBets',
        args: [gameId]
      });
    });
    const receipt = await this.monitor.waitForTransaction(hash);
    return { hash, receipt };
  }

  async submitResult(
    walletClient: WalletClient,
    gameId: bigint,
    winner: `0x${string}` | null,
    pgn: string
  ): Promise<{ hash: Hash; receipt: TransactionReceipt | null }> {
    const hash = await this.monitor.retryTransaction(async () => {
      return await walletClient.writeContract({
        chain: somnia,
        address: this.contractAddress,
        abi: chessGameAbi,
        functionName: 'submitResult',
        args: [gameId, winner ?? "0x0000000000000000000000000000000000000000", pgn]
      });
    });
    const receipt = await this.monitor.waitForTransaction(hash);
    return { hash, receipt };
  }
  
  async estimateBetGas(
    address: `0x${string}`,
    gameId: bigint,
    amount: bigint,
    isWhite: boolean
  ): Promise<bigint> {
    return await this.client.estimateContractGas({
      address: this.contractAddress,
      abi: chessGameAbi,
      functionName: 'placeBet',
      args: [gameId, isWhite],
      value: amount,
      account: address,
    });
  }

  async getBalance(address: `0x${string}`): Promise<bigint> {
    return await this.client.getBalance({ address });
  }

  createWalletClient(privateKey: string): WalletClient {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return createWalletClient({
      account,
      chain: somnia,
      transport: http(),
    });
  }
}
