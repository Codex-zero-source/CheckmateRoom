# Magnus Chess dApp - TODO List

This list breaks down the development of the Magnus dApp into manageable tasks.

## Phase 1: Project Setup & Core Smart Contracts

-   [ ] **1. Initialize Project Structure:**
    -   [ ] Create a monorepo structure with separate packages for `contracts`, `frontend`, and `backend`.
    -   [ ] Initialize a Node.js project (`package.json`).
    -   [ ] Set up tooling: TypeScript, Prettier, ESLint.

-   [ ] **2. Develop `$magnus` Token Smart Contract:**
    -   [ ] Set up a Hardhat development environment for our smart contracts.
    -   [ ] Write the `MagnusToken.sol` contract (ERC20 standard).
    -   [ ] Write tests for the token contract.
    -   [ ] Write a script to deploy the token to the Avalanche Fuji testnet.

-   [ ] **3. Basic Frontend Scaffolding:**
    -   [ ] Set up a new React application using Vite.
    -   [ ] Create a basic UI with a "Connect Wallet" button.
    -   [ ] Implement the logic to connect to a user's MetaMask wallet.
    -   [ ] Display the user's wallet address and their `$magnus` token balance.

## Phase 2: Chess Gameplay & Rewards

-   [ ] **4. Game Logic Smart Contract:**
    -   [ ] Design and write `ChessGame.sol` to manage game state and outcomes.
    -   [ ] Implement a function to report a game's winner.
    -   [ ] Implement the logic to distribute `$magnus` tokens from a prize pool to the winner.
    -   [ ] Write tests for the game logic.

-   [ ] **5. Frontend Chessboard Implementation:**
    -   [ ] Integrate a chessboard library (e.g., `react-chessboard`).
    -   [ ] Implement move validation using a library like `chess.js`.
    -   [ ] Connect the frontend game to the `ChessGame.sol` smart contract to report results.
    -   [ ] Implement Player vs. Player (PvP) logic (two players on the same screen for now).

## Phase 3: AI Opponent & Advanced Features (Future)

-   [ ] **6. AI Integration**
-   [ ] **7. Betting System**
-   [ ] **8. Chat System**
-   [ ] **9. User Profiles & Streaming**

---
*We will focus on Phase 1 first.* 