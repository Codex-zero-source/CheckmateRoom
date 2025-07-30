export interface GameInfo {
  gameId: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  stakes: string; // Stored as string to handle bigint across JSON serialization
  timeControl: number;
  increment: number;
  isFull: boolean;
  isStarted: boolean;
  spectatorCount?: number;
}
