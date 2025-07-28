# Technical Context

This document outlines the technologies, setup, and technical details of the ChessXCrypto project.

## Technology Stack

### Root
- **Package Manager**: npm with Workspaces
- **Linters/Formatters**: ESLint, Prettier
- **Blockchain Interaction**: ethers.js, Web3Modal

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, CSS Modules
- **Routing**: React Router
- **State Management**: React Hooks and Context API
- **Real-time Communication**: Socket.IO Client
- **Chess Interface**: `react-chessboard`
- **Blockchain Interaction**: `ethers`

### Backend
- **Framework**: Express.js with TypeScript
- **Real-time Communication**: Socket.IO
- **Database**: MongoDB with Mongoose
- **Caching/Message Brokering**: Redis
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: Helmet, express-rate-limit
- **Chess Logic**: `chess.js`

### Smart Contracts
- **Language**: Solidity
- **Framework**: Hardhat
- **Standard**: Native Token (STT)
- **Libraries**: OpenZeppelin Contracts

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- Docker and Docker Compose
- MetaMask browser extension

### Installation
1.  Clone the repository.
2.  Run `npm install` in the root directory to install all dependencies for all workspaces.

### Running the Application
1.  **Start the backend**: `npm run start:backend`
2.  **Start the frontend**: `npm run start:frontend`
3.  **Compile contracts**: `npm run compile:contracts`
4.  **Test contracts**: `npm run test:contracts`

### Environment Variables
A `.env` file is required in the root directory with the following variables:

```
# Backend Configuration
PORT=3001
HOST=localhost
DATABASE_URL=mongodb://localhost:27017/chessxcrypto
JWT_SECRET=your_jwt_secret
SOCKET_CORS_ORIGIN=http://localhost:5173

# Frontend Configuration
BACKEND_URL=http://localhost:3001

# Smart Contract Configuration
FUJI_PRIVATE_KEY=your_fuji_testnet_private_key
AVALANCHE_API_KEY=your_avalanche_explorer_api_key

# Contract Addresses (Fuji Testnet)
MAGNUS_TOKEN_ADDRESS=0x0264e02480D8549BE91541Fc8c12047335Ad1237
CHESS_GAME_ADDRESS=0xe8aeA4505bBf1156cb9a76D86b8F2DC5ed11E6C8

# Admin Wallet Address
ADMIN_WALLET_ADDRESS=0x32d35e6a1fddbc29ac11276a22bfad03aaa1dc83
```

## Technical Constraints

-   **Network**: The application is configured to run on the Somnia testnet.
-   **Gas Fees**: Somnia is designed for extremely low transaction fees, which is ideal for frequent gaming interactions.
-   **Real-time Latency**: The use of Socket.IO mitigates the latency of blockchain transactions for real-time gameplay, and Somnia's sub-second finality further enhances this.
