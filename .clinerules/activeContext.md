# Active Context

## Current Work Focus
*   **Blockchain Migration to Somnia Network**: Refactoring the smart contracts to use the native Somnia test token (STT) instead of a custom ERC20 token.

## Recent Changes
*   `hardhat.config.ts` updated with Somnia network configuration.
*   `.env` updated with Somnia RPC URL and private key.
*   `MagnusToken.sol` and `MagnusToken.ts` deployment script removed.
*   `ChessGame.sol` refactored to use native STT for transactions (removed MagnusToken import, made functions payable, used msg.value, removed adminMint, updated transfers). Docstring errors fixed.
*   `DeployChess.ts` updated to deploy only `ChessGame.sol`.
*   Attempted to deploy `ChessGame.sol` to Somnia testnet, but it failed with "ProviderError: account does not exist".

## Next Steps
*   **Requires User Intervention**: The deployment to Somnia testnet failed with "ProviderError: account does not exist". This indicates an issue with the private key configuration or funding on the Somnia network. Need user assistance to debug this deployment issue.
*   Update backend and frontend to interact with Somnia network (after contracts are deployed).

## Important Patterns and Preferences
*   The project is migrating from Avalanche to Somnia.
*   The project will use the native Somnia test token (STT) for all transactions, removing the need for the `MagnusToken` ERC20 contract.
*   The user prefers to keep the project simple and chess-centered.

## Learnings and Project Insights
*   The deployment error "ProviderError: account does not exist" is a persistent issue, suggesting a problem with the private key or account setup on the target network (Somnia).
