import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/env';

// Connection states
export const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
} as const;

export type ConnectionState = typeof ConnectionState[keyof typeof ConnectionState];

// Socket event types
export interface SocketEvents {
    // Game events
    'gameCreated': (data: { gameId: string; color: string; fen: string; timeControl: number }) => void;
    'gameJoined': (data: { gameId: string; color: string; walletAddress: string }) => void;
    'gameState': (data: { gameId: string; players: { white?: string; black?: string } }) => void;
    'gameOver': (data: { reason: string; winner: string; fen: string }) => void;
    'moveMade': (data: { fen: string; isGameOver: boolean }) => void;
    'timerUpdate': (data: { whiteTime: number; blackTime: number; activePlayer: string }) => void;
    
    // Lobby events
    'lobbyUpdate': (data: { games: any[] }) => void;
    
    // Betting events
    'stakesUpdated': (data: { amount: number }) => void;
    'betPlaced': (data: { color: string; walletAddress: string }) => void;
    'betsLocked': (data: { gameId: string; whiteBet: string; blackBet: string }) => void;
    
    // Chat events
    'chatMessageReceived': (data: { id: string; sender: string; message: string; timestamp: number; type: string }) => void;
    'userTyping': (data: { user: string; isTyping: boolean }) => void;
    
    // Spectator events
    'spectatorJoined': (data: { gameId: string; game: any }) => void;
    'spectatorBetPlaced': (data: { spectator: string; amount: number; onPlayer: string; timestamp: number }) => void;
    'spectatorReward': (data: { spectator: string; reward: number; originalBet: number }) => void;
    
    // Error events
    'error': (data: { message: string }) => void;
    'gameCreationError': (data: { message: string; type: string }) => void;
    
    // Draw events
    'drawOffered': (data: { offeredBy: string }) => void;
    'drawDeclined': (data: { declinedBy: string }) => void;
    'gameEnd': (data: { reason: string; winner: string }) => void;
}

class SocketService {
    private socket: Socket | null = null;
    private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private eventListeners: Map<string, Set<Function>> = new Map();
    private connectionCallbacks: Set<(state: ConnectionState) => void> = new Set();

    constructor() {
        this.setupConnection();
    }

    private setupConnection(): void {
        this.socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            forceNew: false,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            autoConnect: false
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected');
            this.connectionState = ConnectionState.CONNECTED;
            this.reconnectAttempts = 0;
            this.notifyConnectionStateChange();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            this.connectionState = ConnectionState.DISCONNECTED;
            this.notifyConnectionStateChange();
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 Socket connection error:', error);
            this.connectionState = ConnectionState.ERROR;
            this.notifyConnectionStateChange();
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
            this.connectionState = ConnectionState.CONNECTED;
            this.reconnectAttempts = 0;
            this.notifyConnectionStateChange();
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔌 Socket reconnection attempt:', attemptNumber);
            this.connectionState = ConnectionState.RECONNECTING;
            this.reconnectAttempts = attemptNumber;
            this.notifyConnectionStateChange();
        });
    }

    // Connect to the server
    public connect(walletAddress: string, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket) {
                this.socket.disconnect();
            }

            this.socket = io(BACKEND_URL, {
                auth: {
                    walletAddress,
                    token,
                },
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                timeout: 20000,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                autoConnect: false
            });

            this.setupEventHandlers();

            if (this.connectionState === ConnectionState.CONNECTED) {
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);

            const onConnect = () => {
                clearTimeout(timeout);
                this.socket?.off('connect', onConnect);
                this.socket?.off('connect_error', onError);
                resolve();
            };

            const onError = (error: any) => {
                clearTimeout(timeout);
                this.socket?.off('connect', onConnect);
                this.socket?.off('connect_error', onError);
                reject(error);
            };

            this.socket.once('connect', onConnect);
            this.socket.once('connect_error', onError);
            this.socket.connect();
        });
    }

    // Disconnect from the server
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connectionState = ConnectionState.DISCONNECTED;
            this.notifyConnectionStateChange();
        }
    }

    // Emit an event to the server
    public emit<T = any>(event: string, data?: T): void {
        if (!this.socket || this.connectionState !== ConnectionState.CONNECTED) {
            console.warn('Socket not connected, cannot emit event:', event);
            return;
        }
        this.socket.emit(event, data);
    }

    // Listen to an event from the server
    public on(event: string, callback: (...args: any[]) => void): void {
        if (!this.socket) return;

        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);

        this.socket.on(event, callback);
    }

    // Remove event listener
    public off(event: string, callback?: (...args: any[]) => void): void {
        if (!this.socket) return;

        if (callback) {
            this.socket.off(event, callback);
            this.eventListeners.get(event)?.delete(callback);
        } else {
            this.socket.off(event);
            this.eventListeners.delete(event);
        }
    }

    // Join a room
    public joinRoom(room: string): void {
        if (!this.socket || this.connectionState !== ConnectionState.CONNECTED) {
            console.warn('Socket not connected, cannot join room:', room);
            return;
        }
        this.socket.emit('joinRoom', { room });
    }

    // Leave a room
    public leaveRoom(room: string): void {
        if (!this.socket || this.connectionState !== ConnectionState.CONNECTED) {
            console.warn('Socket not connected, cannot leave room:', room);
            return;
        }
        this.socket.emit('leaveRoom', { room });
    }

    // Get current connection state
    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    // Subscribe to connection state changes
    public onConnectionStateChange(callback: (state: ConnectionState) => void): void {
        this.connectionCallbacks.add(callback);
    }

    // Unsubscribe from connection state changes
    public offConnectionStateChange(callback: (state: ConnectionState) => void): void {
        this.connectionCallbacks.delete(callback);
    }

    // Notify all connection state change subscribers
    private notifyConnectionStateChange(): void {
        this.connectionCallbacks.forEach(callback => {
            try {
                callback(this.connectionState);
            } catch (error) {
                console.error('Error in connection state callback:', error);
            }
        });
    }

    // Clean up all listeners and disconnect
    public cleanup(): void {
        if (this.socket) {
            this.eventListeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    this.socket?.off(event, callback as any);
                });
            });
            this.eventListeners.clear();
            this.connectionCallbacks.clear();
            this.disconnect();
        }
    }

    // Get socket instance (for advanced usage)
    public getSocket(): Socket | null {
        return this.socket;
    }

    // Check if socket is connected
    public isConnected(): boolean {
        return this.connectionState === ConnectionState.CONNECTED;
    }
}

// Create singleton instance
const socketService = new SocketService();


// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        socketService.cleanup();
    });
}

export default socketService;
