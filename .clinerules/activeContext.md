# Active Context

## Current Work Focus
*   **Frontend Module Resolution**: Fixing the `Failed to resolve import "../../shared/types"` error in the frontend.

## Recent Changes
*   Created `packages/shared/types.ts` to define a shared `GameInfo` interface.
*   Updated `packages/frontend/src/pages/PlayPage.tsx` to use the shared `GameInfo` interface.
*   Updated `packages/backend/src/socket/game.handler.ts` to convert `stakes.amount` to a string for JSON serialization when sending `lobbyUpdate` events.
*   Updated `packages/backend/tsconfig.json` to target `es2020` for `bigint` support.
*   Updated `packages/backend/src/services/game.service.ts` to use `bigint` for `stakes.amount` in the `GameRoom` interface.
*   Updated `packages/frontend/tsconfig.app.json` to include a path mapping for `packages/shared`.
*   Updated `packages/frontend/vite.config.ts` to explicitly map `../../shared/types` to the correct absolute path (removed `.ts` extension from alias).
*   Verified that `packages/shared/types.ts` exists.
*   Cleared Vite cache in `packages/frontend/node_modules/.vite`.

## Next Steps
*   Run `npm install` in the root directory to ensure all dependencies and symlinks are correctly set up.
*   Implement game lobby display and joining logic in the frontend.
*   Ensure backend game state management with `chess.js`.
*   Implement real-time move validation and updates.
*   Implement backend timers and synchronization.
*   Ensure chessboard updates correctly with game state.
*   Implement move history display.
*   Display player information and timers.
*   Thoroughly test all new features.

## Important Patterns and Preferences
*   The project will use a unique game ID for each game.
*   Real-time updates will be handled via Socket.IO.
*   Game state will be managed on the backend using Redis.
*   Shared types are used for consistency between frontend and backend.
*   TypeScript path mapping and Vite aliases are essential for monorepo setups to resolve shared module imports.
*   Vite caching can sometimes interfere with module resolution, requiring manual cache clearing.
*   Proper `npm workspaces` setup and `npm install` are critical for monorepo module resolution.
*   Explicitly mapping full paths in Vite aliases can be necessary for specific module imports.

## Learnings and Project Insights
*   Consistent type definitions across frontend and backend are crucial for preventing type-related errors, especially when dealing with `bigint` values over JSON.
*   TypeScript path mapping and Vite aliases are essential for monorepo setups to resolve shared module imports.
*   Vite caching can sometimes interfere with module resolution, requiring manual cache clearing.
*   Proper `npm workspaces` setup and `npm install` are critical for monorepo module resolution.
*   Explicitly mapping full paths in Vite aliases can be necessary for specific module imports.
