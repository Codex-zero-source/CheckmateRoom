// Magnus Chess dApp Backend Environment Configuration

// Server Configuration
export const SERVER_PORT = process.env.PORT || 3001;
export const SERVER_HOST = process.env.HOST || 'localhost';

// Contract Addresses (Fuji Testnet)
export const MAGNUS_TOKEN_ADDRESS = "0x0264e02480D8549BE91541Fc8c12047335Ad1237";
export const CHESS_GAME_ADDRESS = "0xe8aeA4505bBf1156cb9a76D86b8F2DC5ed11E6C8";

// Admin Wallet Address - Replace with actual admin address
export const ADMIN_WALLET_ADDRESS = "0x32d35e6a1fddbc29ac11276a22bfad03aaa1dc83";

// Network Configuration
export const NETWORK_ID = 43113;
export const NETWORK_NAME = "Fuji Testnet";
export const RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";

// Database Configuration
export const DATABASE_URL = process.env.DATABASE_URL;

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = "24h";

// Socket Configuration
export const SOCKET_CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || "http://localhost:5173";

// Game Configuration
export const MAX_GAME_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const MAX_SPECTATORS_PER_GAME = 100;
export const MAX_CHAT_MESSAGES_PER_GAME = 1000;

// Betting Configuration
export const MIN_BET_AMOUNT = 0.1; // 0.1 MAG
export const MAX_BET_AMOUNT = 100; // 100 MAG
export const HOUSE_FEE_PERCENTAGE = 2.5; // 2.5%

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
    { label: "1 MAG", value: 1000000000000000000 }, // 1 MAG in wei
    { label: "5 MAG", value: 5000000000000000000 }, // 5 MAG in wei
    { label: "10 MAG", value: 10000000000000000000 }, // 10 MAG in wei
    { label: "25 MAG", value: 25000000000000000000 }, // 25 MAG in wei
    { label: "50 MAG", value: 50000000000000000000 }, // 50 MAG in wei
]; 