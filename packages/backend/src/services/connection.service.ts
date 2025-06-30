export const activeConnections = new Map<string, {
    socketId: string;
    walletAddress: string | null;
    connectedAt: number;
    lastActivity: number;
    rooms: Set<string>;
}>(); 