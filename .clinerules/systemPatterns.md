# System Patterns

## How the System is Built

### Monorepo Architecture
The system follows a monorepo pattern with three distinct packages:

```
ChessXCrypto/
├── packages/
│   ├── frontend/     # React + TypeScript client
│   ├── backend/      # Express.js + Socket.IO server
│   └── contracts/    # Solidity smart contracts
```

This structure enables:
- Shared dependencies and configurations
- Coordinated deployment strategies
- Type sharing between packages
- Unified development workflow

### Hybrid On-Chain/Off-Chain Pattern
The system employs a hybrid approach balancing blockchain benefits with performance needs:

**On-Chain Components:**
- Game outcomes and rewards
- Betting pools and payouts
- Ownership and permissions

**Off-Chain Components:**
- Real-time game state
- Move validation and chess logic
- User authentication and profiles
- Lobby and matchmaking

### Event-Driven Architecture
The system is built around event-driven patterns:

**Frontend Events:**
- Wallet connection/disconnection
- Move submissions
- Game joining/creation
- Bet placement

**Backend Events:**
- Socket.IO real-time communications
- Game state changes
- Player connections/disconnections
- Database updates

**Blockchain Events:**
- Token transfers
- Game completions
- Bet settlements

## Key Technical Decisions

### Blockchain Choice: Somnia Network
**Decision**: Use Somnia Network testnet for smart contracts (migrated from Avalanche)
**Rationale**: 
- Gaming-optimized blockchain with sub-second finality
- Extremely low transaction fees ideal for frequent gaming interactions
- Built specifically for real-time gaming applications
- EVM compatibility maintains existing contract code
- Superior performance for chess gaming use case

### Real-Time Communication: Socket.IO
**Decision**: Use Socket.IO for game communication instead of pure blockchain
**Rationale**:
- Chess requires sub-second response times
- Blockchain transactions too slow for real-time moves
- Reduces gas costs significantly
- Better user experience

### State Management Strategy
**Decision**: Dual-state system with eventual consistency
**Implementation**:
- **Game State**: Managed off-chain via Socket.IO for speed
- **Economic State**: Managed on-chain for security and transparency
- **Reconciliation**: Game outcomes trigger blockchain transactions

### AI Agent Integration Strategy
**Decision**: Replace hardcoded gambling responses with configurable AI agents
**Implementation**:
- **User-Configurable**: Players provide their own system prompts and API keys
- **Multi-Model Support**: Support for various AI providers (OpenAI, Anthropic, etc.)
- **Contextual Analysis**: AI agents analyze game state and provide strategic insights
- **Betting Recommendations**: Intelligent analysis of odds and game dynamics
- **Privacy-First**: User API keys stored locally, not on servers

### Database Strategy
**Decision**: Redis for all data
**Rationale**:
- Redis provides a simple and fast in-memory database solution.
- For the scope of this project, a single Redis instance is sufficient for both caching and persistence.

## Architecture Patterns

### Frontend Patterns

**Component Architecture:**
- Functional components with hooks
- Context API for global state
- Custom hooks for blockchain interactions
- AI agent integration components
- Separation of UI and business logic

**State Management:**
```typescript
// Global app state via Context
const AppContext = {
  wallet: WalletState,
  user: UserState,
  game: GameState,
  contract: ContractState,
  aiAgent: AIAgentState
}
```

**Real-time Updates:**
- Socket.IO client maintains persistent connection
- Event listeners update React state
- Optimistic updates with rollback capability

### Backend Patterns

**Layered Architecture:**
```
Routes → Handlers → Services → Database
```

**Socket.IO Pattern:**
- Connection authentication via JWT
- Room-based game isolation
- Event-driven game state management
- Graceful disconnection handling

**Game State Machine:**
```
WAITING → ACTIVE → COMPLETED
   ↓        ↓         ↓
 Players  Moves   Rewards
```

### Smart Contract Patterns

**Pull Payment Pattern:**
- Players/spectators withdraw winnings
- Prevents reentrancy attacks
- Gas cost distribution

**Circuit Breaker Pattern:**
- Emergency pause functionality
- Owner can halt operations if needed
- Protects against exploits

### Security Patterns

**Authentication Chain:**
1. Wallet signature verification
2. JWT token validation
3. Socket.IO connection authorization
4. Smart contract permission checks

**Input Validation:**
- Frontend: TypeScript types + form validation
- Backend: Express validators + chess.js verification
- Blockchain: Solidity modifiers and requires

**Rate Limiting:**
- Express middleware for API endpoints
- Socket.IO connection limits
- Smart contract cooldown periods

### Scalability Patterns

**Horizontal Scaling Preparation:**
- Stateless backend design
- Redis for shared session storage
- Database connection pooling
- Load balancer compatibility

**Caching Strategy:**
- Redis for active game sessions
- Frontend caching of static data
- Smart contract call optimization

**Error Handling:**
- Graceful degradation on network issues
- Retry mechanisms for blockchain calls
- User-friendly error messages
- Comprehensive logging
