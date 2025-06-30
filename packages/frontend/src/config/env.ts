// Magnus Chess dApp Environment Configuration

// Contract Addresses (Fuji Testnet)
export const MAGNUS_TOKEN_ADDRESS = "0x0264e02480D8549BE91541Fc8c12047335Ad1237";
export const CHESS_GAME_ADDRESS = "0xe8aeA4505bBf1156cb9a76D86b8F2DC5ed11E6C8";

// Admin Wallet Address - Replace with actual admin address
// This should be the wallet address that has admin privileges for minting tokens
export const ADMIN_WALLET_ADDRESS = "0x32d35e6a1fddbc29ac11276a22bfad03aaa1dc83";

// Backend Server URL
export const BACKEND_URL = "http://localhost:3001";

// Network Configuration
export const NETWORK_ID = 43113;
export const NETWORK_NAME = "Fuji Testnet";

// Time Control Options
export const TIME_CONTROL_OPTIONS = [
    { label: "1 min", value: 1, increment: 0 },
    { label: "3 min", value: 3, increment: 0 },
    { label: "5 min", value: 5, increment: 0 },
    { label: "10 min", value: 10, increment: 0 },
    { label: "15 min", value: 15, increment: 0 },
    { label: "30 min", value: 30, increment: 0 },
    { label: "1 min + 1s", value: 1, increment: 1 },
    { label: "3 min + 2s", value: 3, increment: 2 },
    { label: "5 min + 3s", value: 5, increment: 3 },
    { label: "10 min + 5s", value: 10, increment: 5 },
];

// Stakes Options
export const STAKES_OPTIONS = [
    { label: "No Stakes", value: 0 },
    { label: "1 MAG", value: 1000000000000000000n }, // 1 MAG in wei
    { label: "5 MAG", value: 5000000000000000000n }, // 5 MAG in wei
    { label: "10 MAG", value: 10000000000000000000n }, // 10 MAG in wei
    { label: "25 MAG", value: 25000000000000000000n }, // 25 MAG in wei
    { label: "50 MAG", value: 50000000000000000000n }, // 50 MAG in wei
]; 