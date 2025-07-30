// Magnus Chess dApp Environment Configuration

// Contract Addresses (Somnia Testnet)
export const CHESS_GAME_ADDRESS = "0x8BA03d3d164B343DEb8404Ca8dD87236ED11BBfb";

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
    { label: "1 STT", value: 1000000000000000000n }, // 1 STT in wei
    { label: "5 STT", value: 5000000000000000000n }, // 5 STT in wei
    { label: "10 STT", value: 10000000000000000000n }, // 10 STT in wei
    { label: "25 STT", value: 25000000000000000000n }, // 25 STT in wei
    { label: "50 STT", value: 50000000000000000000n }, // 50 STT in wei
];
