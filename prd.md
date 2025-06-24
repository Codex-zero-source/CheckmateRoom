# Magnus Chess dApp - Product Requirements Document (PRD)

## 1. Overview

Magnus is a decentralized application (dApp) built on the Avalanche blockchain that aims to create a vibrant community for chess enthusiasts. It combines the classic game of chess with a play-to-earn model, allowing users to earn `$magnus` tokens through various activities on the platform. The platform draws UI/UX inspiration from popular chess sites like chess.com and lichess.org.

## 2. Core Features

### 2.1. Play-to-Earn Chess

-   **Player vs. Player (PvP):** Users can play chess matches against each other. Winners earn `$magnus` tokens.
-   **Player vs. AI:** Users can play against a range of specialized AI engines with different playing styles and strengths (similar to chess.com's bots). Winning against AI also yields `$magnus` tokens.
-   **AI Engine Integration:** Integrate strong open-source engines like Stockfish 17 and Leela Chess Zero. Also, include human-like engines that can provide explanations for their moves.

### 2.2. Puzzle and Learning

-   **Chess Puzzles:** Users can solve chess puzzles of varying difficulty to earn `$magnus` tokens.
-   **Group Puzzles:** A feature for users to solve complex puzzles together in a group chat, sharing the reward.
-   **Study Lessons:** Access to chess lessons and tutorials. Completing lessons can also be a way to earn tokens.

### 2.3. Community and Social Features

-   **Chat System:** A built-in chat for users to communicate.
    -   **Direct Messages:** One-on-one private chats.
    -   **Group Chats:** Themed group chats (e.g., for puzzle solving, tournament discussions).
    -   **Earn by Interacting:** A system to reward active and positive community members with tokens for their engagement.
-   **User Profiles & Followers:** Users can have profiles, see their stats, and amass followers.
-   **Streaming:** An option for users to stream their games to their followers and earn tokens through tips or other mechanisms.

### 2.4. Tokenomics and Betting (`$magnus` Token)

-   **$magnus Token:** An ERC20 token on the Avalanche C-Chain that serves as the primary currency of the platform.
-   **Purpose:** Used for rewards, betting, and potentially governance in the future.
-   **Betting System:**
    -   Users can stake `$magnus` tokens on their PvP matches.
    -   Options for "winner-takes-all" or other gambling formats.
    -   Support for betting in both single matches and tournament formats.

## 3. Technical Architecture

-   **Blockchain:** Avalanche C-Chain (for EVM compatibility).
-   **Smart Contracts:** Written in Solidity for tokenomics, game results, and betting.
-   **Frontend:** A modern web framework (e.g., React, Vue) for a responsive and interactive user experience.
-   **Backend:** A hybrid approach with a centralized backend for non-critical operations like chat (to save on gas fees) and game state management, while critical logic (token transfers, match results) is handled by smart contracts.
-   **Chess Engine:** Integration of JavaScript-compatible engines like `stockfish.js`.

## 4. Deployment

-   **Initial Deployment:** Deploy to an Avalanche testnet (Fuji) for thorough testing.
-   **Mainnet Launch:** Plan for a mainnet launch after successful testing and security audits. 