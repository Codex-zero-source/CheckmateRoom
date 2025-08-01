import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { chessGameABI } from '../config/chessGameABI';

// Define Somnia chain
export const somnia = {
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

// Create public client
export const publicClient = createPublicClient({
  chain: somnia,
  transport: http(),
});

// Create wallet client
export function createGameWalletClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createWalletClient({
    account,
    chain: somnia,
    transport: http(),
  });
}

// Game contract interaction functions
export async function createGame(client: any, contractAddress: string, player1: string, player2: string) {
  const hash = await client.writeContract({
    address: contractAddress,
    abi: chessGameABI, // ChessGame ABI
    functionName: 'createGame',
    args: [player1, player2],
  });
  return hash;
}

export async function placeBet(client: any, contractAddress: string, gameId: bigint, isWhite: boolean) {
  const hash = await client.writeContract({
    address: contractAddress,
    abi: chessGameABI, // ChessGame ABI
    functionName: 'placeBet',
    args: [gameId, isWhite],
    value: parseEther('0.1'), // Bet amount in STT
  });
  return hash;
}

// Balance checking function
export async function getPlayerBalance(address: string) {
  const balance = await publicClient.getBalance({ address });
  return formatEther(balance);
}

// Gas estimation function
export async function estimateGameCreationGas(contractAddress: string, player1: string, player2: string) {
  const estimate = await publicClient.estimateContractGas({
    address: contractAddress,
    abi: [...], // ChessGame ABI
    functionName: 'createGame',
    args: [player1, player2],
  });
  return estimate;
}

// Transaction status checking
export async function checkTransactionStatus(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.status;
}
