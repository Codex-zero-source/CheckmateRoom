# ChessXCrypto - Blockchain Chess Platform

ChessXCrypto is a decentralized chess platform that combines traditional chess gameplay with blockchain technology, enabling secure gameplay, betting, and tournament management.

## Features

- 🎮 Real-time chess gameplay with WebSocket integration
- 💰 Secure betting system using smart contracts
- 🔒 Signature verification for all critical actions
- ⏱️ Multiple time control options
- 🏆 Tournament support with smart contract prize pools
- 📊 Comprehensive game metrics and monitoring
- 🔄 Automatic game recovery and reconnection handling
- 💬 In-game chat with typing indicators

## Architecture

### Backend (Node.js/TypeScript)
- Express.js server with Socket.IO for real-time communication
- Rate limiting and DDoS protection
- Comprehensive error handling and monitoring
- Smart contract integration with retry mechanisms
- Type-safe implementation with TypeScript

### Smart Contracts (Solidity)
- Game state management
- Betting system
- Tournament management
- Secure reward distribution
- Gas-optimized implementations

### Frontend (React/TypeScript)
- Responsive chess board implementation
- Real-time game updates
- Web3 wallet integration
- Tournament brackets visualization
- Game analysis tools

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Ethereum wallet (MetaMask recommended)
- Somnia Network access
- STT tokens for gameplay

### Somnia Network Setup

1. Add Somnia Network to MetaMask:
   - Network Name: Somnia Testnet
   - RPC URL: https://dream-rpc.somnia.network
   - Chain ID: 50312
   - Currency Symbol: STT
   - Block Explorer URL: https://explorer.somnia.network

2. Get STT Tokens:
   - Visit the Somnia faucet
   - Request test STT tokens
   - Wait for confirmation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ChessXCrypto.git
cd ChessXCrypto
```

2. Install dependencies:
```bash
npm install
cd packages/frontend && npm install
cd ../backend && npm install
cd ../contracts && npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chesscrypto
JWT_SECRET=your_jwt_secret
RPC_URL=https://dream-rpc.somnia.network
CHESS_GAME_ADDRESS=0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016
STT_TOKEN_ADDRESS=0xB0eA5876b0eD682DCf907D41D926Ce5F0F2B44ac

# Frontend (.env)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_CHESS_GAME_ADDRESS=0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016
VITE_STT_TOKEN_ADDRESS=0xB0eA5876b0eD682DCf907D41D926Ce5F0F2B44ac
VITE_NETWORK_ID=50312
VITE_NETWORK_NAME="Somnia Testnet"
```

4. Deploy smart contracts:
```bash
cd packages/contracts
npx hardhat compile
npx hardhat deploy --network fuji
```

5. Start the development servers:
```bash
# Backend
cd packages/backend
npm run dev

# Frontend
cd packages/frontend
npm run dev
```

## Security Features

- Signature verification for all game actions
- Rate limiting per IP and wallet address
- DDoS protection
- Smart contract state validation
- Secure random color assignment
- Transaction retry mechanism with exponential backoff
- Comprehensive error handling and monitoring

## Smart Contract Integration

The platform uses two main smart contracts:
1. ChessGame.sol: Manages game state and betting
2. MagnusToken.sol: ERC20 token for platform transactions

### Key Contract Functions

```solidity
function placeBet(uint256 gameId, uint256 amount) external
function lockBets(uint256 gameId) external
function submitResult(uint256 gameId, address winner, string memory pgn) external
```

## Error Handling

The platform implements a comprehensive error handling system:

```typescript
class GameError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'GameError';
    }
}

// Usage examples:
throw new GameError('Invalid move', 'INVALID_MOVE');
throw new GameError('Insufficient funds', 'INSUFFICIENT_FUNDS');
```

## Monitoring

Real-time monitoring of:
- Active games
- Connected players
- Transaction success/failure rates
- Average game duration
- Error frequencies
- Smart contract interactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

## Somnia Network Integration

### Token Integration
The platform uses STT tokens for all transactions on the Somnia network:
- Game bets
- Spectator bets
- Rewards distribution
- Tournament prizes

### Contract Addresses
- ChessGame: `0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016`
- STT Token: `0xB0eA5876b0eD682DCf907D41D926Ce5F0F2B44ac`

### Transaction Flow
1. Approve STT token spending:
```typescript
await sttToken.approve(CHESS_GAME_ADDRESS, amount);
```

2. Place a bet:
```typescript
await chessGame.placeBet(gameId, amount, isWhite);
```

3. Spectator betting:
```typescript
await chessGame.placeSpectatorBet(gameId, amount, isWhite);
```

4. Claim rewards:
- Automatic distribution on game end
- Winners receive bet amount + house fee
- Spectators receive proportional rewards

### Security Features
- ReentrancyGuard for all token operations
- Pausable contract for emergency stops
- Owner-only admin functions
- Token recovery function for emergencies

## Testing

```bash
# Run backend tests
cd packages/backend
npm test

# Run contract tests
cd packages/contracts
npx hardhat test

# Run frontend tests
cd packages/frontend
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions and support, please open an issue in the GitHub repository.