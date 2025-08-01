// Magnus Chess dApp Backend Environment Configuration
import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
    // Server Configuration
    SERVER_PORT: process.env.PORT || 3001,
    SERVER_HOST: process.env.HOST || 'localhost',

    // Contract Addresses (Somnia Testnet)
    CHESS_GAME_ADDRESS: process.env.CHESS_GAME_ADDRESS || "0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016",

    // Network Configuration
    NETWORK_ID: Number(process.env.CHAIN_ID) || 50312,
    NETWORK_NAME: process.env.NETWORK_NAME || "Somnia Testnet",
    RPC_URL: process.env.RPC_URL || "https://dream-rpc.somnia.network",

    // Transaction Configuration
    MINIMUM_CONFIRMATIONS: Number(process.env.MINIMUM_CONFIRMATIONS) || 2,
    TRANSACTION_TIMEOUT: Number(process.env.TRANSACTION_TIMEOUT) || 60_000, // 60 seconds
    MAX_RETRIES: Number(process.env.MAX_RETRIES) || 3,
} as const;

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
export const MIN_BET_AMOUNT = 0.1; // 0.1 STT
export const MAX_BET_AMOUNT = 100; // 100 STT
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
export const { SERVER_PORT, SERVER_HOST } = env;

export const STAKES_OPTIONS = [
    { label: "No Stakes", value: 0 },
    { label: "1 STT", value: 1000000000000000000 }, // 1 STT in wei
    { label: "5 STT", value: 5000000000000000000 }, // 5 STT in wei
    { label: "10 STT", value: 10000000000000000000 }, // 10 STT in wei
    { label: "25 STT", value: 25000000000000000000 }, // 25 STT in wei
    { label: "50 STT", value: 50000000000000000000 }, // 50 STT in wei
];
