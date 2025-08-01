// Magnus Chess dApp Environment Configuration

// Contract Addresses (Somnia Testnet)
export const CHESS_GAME_ADDRESS = "0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016";
export const STT_TOKEN_ADDRESS = "0xB0eA5876b0eD682DCf907D41D926Ce5F0F2B44ac"; // Somnia STT Token

// Backend Server URL
export const BACKEND_URL = "http://localhost:3001";

// Network Configuration
export const NETWORK_ID = 50312;
export const NETWORK_NAME = "Somnia Testnet";

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
    { label: "1 STT", value: 1 },
    { label: "5 STT", value: 5 },
    { label: "10 STT", value: 10 },
    { label: "25 STT", value: 25 },
    { label: "50 STT", value: 50 },
];
