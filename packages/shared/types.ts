export interface GameInfo {
  gameId: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  stakes: number; // DEMO: use number for seamless frontend/backend
  timeControl: number;
  increment: number;
  isFull: boolean;
  isStarted: boolean;
  spectatorCount?: number;
}
