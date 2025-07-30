import { Chess } from 'chess.js';
import { Server } from 'socket.io';

let io: Server;

export const initGameService = (socketIo: Server) => {
    io = socketIo;
};

export interface GameRoom {
    chess: Chess;
    players: {
        white?: string;
        black?: string;
    };
    playerSockets: {
        [walletAddress: string]: string;
    };
    spectators: Array<{
        walletAddress: string;
        socketId: string;
        joinedAt: number;
    }>;
    timers: {
        white: number;
        black: number;
        activePlayer: 'white' | 'black' | null;
        startTime: number | null;
        timeControl: number;
        increment: number;
    };
    timerInterval: NodeJS.Timeout | null;
    stakes: {
        amount: bigint;
        whiteBet: string | null;
        blackBet: string | null;
        isLocked: boolean;
    };
    moveHistory: Array<{
        move: string;
        notation: string;
        player: 'white' | 'black';
        timestamp: number;
    }>;
    gameResult?: any;
    isFinished: boolean;
    drawOffer?: 'white' | 'black' | null;
    chatMessages: Array<{
        id: string;
        user: string;
        message: string;
        timestamp: number;
        type: 'player' | 'spectator' | 'system';
        userType: 'white' | 'black' | 'spectator';
    }>;
    typingUsers: Set<string>;
    lastActivity: number;
    createdAt: number;
}

export const games: { [key: string]: GameRoom } = {};
export const activeGameIds: Set<string> = new Set();

// Cleanup inactive games and connections
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const GAME_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

setInterval(() => {
    const now = Date.now();
    
    // Cleanup inactive games
    for (const [gameId, game] of Object.entries(games)) {
        if (now - game.lastActivity > GAME_TIMEOUT) {
            console.log(`Cleaning up inactive game: ${gameId}`);
            delete games[gameId];
            activeGameIds.delete(gameId);
            
            // Stop timer if running
            if (game.timerInterval) {
                clearInterval(game.timerInterval);
            }
        }
    }
}, CLEANUP_INTERVAL);

// Optimized timer management
export function startTimer(gameId: string) {
    const game = games[gameId];
    if (!game || game.timers.activePlayer === null) return;

    if (game.timerInterval) {
        clearInterval(game.timerInterval);
    }

    game.timers.startTime = Date.now();
    
    game.timerInterval = setInterval(() => {
        const activeColor = game.timers.activePlayer;
        if (!activeColor || !game.timers.startTime) return;

        const now = Date.now();
        const elapsed = now - game.timers.startTime;
        const remainingTime = Math.max(0, game.timers[activeColor] - elapsed);

        if (remainingTime <= 0) {
            clearInterval(game.timerInterval!);
            game.timerInterval = null;
            
            const winner = activeColor === 'white' ? 'black' : 'white';
            console.log(`Time ran out for ${activeColor}. ${winner} wins on time.`);
            
            io.to(gameId).emit('gameOver', {
                reason: 'time',
                winner: winner,
                fen: game.chess.fen()
            });
            return;
        }

        const timerUpdate = {
            white: game.timers.white,
            black: game.timers.black,
            activePlayer: game.timers.activePlayer
        };
        timerUpdate[activeColor] = remainingTime;

        io.to(gameId).emit('timerUpdate', timerUpdate);
    }, 100);
}

export function stopTimer(gameId: string) {
    const game = games[gameId];
    if (!game || !game.timerInterval) return;

    clearInterval(game.timerInterval);
    game.timerInterval = null;
    game.timers.startTime = null;

    if (game.timers.increment > 0) {
        if (game.timers.activePlayer === 'white') {
            game.timers.white += game.timers.increment;
        } else {
            game.timers.black += game.timers.increment;
        }
    }

    io.to(gameId).emit('timerUpdate', {
        whiteTime: game.timers.white,
        blackTime: game.timers.black,
        activePlayer: game.timers.activePlayer
    });
}

export function switchTimer(gameId: string) {
    const game = games[gameId];
    if (!game) return;

    if (game.timers.activePlayer && game.timers.startTime) {
        const elapsed = Date.now() - game.timers.startTime;
        if (game.timers.activePlayer === 'white') {
            game.timers.white = Math.max(0, game.timers.white - elapsed);
        } else {
            game.timers.black = Math.max(0, game.timers.black - elapsed);
        }
    }

    game.timers.activePlayer = game.timers.activePlayer === 'white' ? 'black' : 'white';
    game.timers.startTime = Date.now();

    if (game.timers.increment > 0) {
        if (game.timers.activePlayer === 'white') {
            game.timers.white += game.timers.increment;
        } else {
            game.timers.black += game.timers.increment;
        }
    }

    io.to(gameId).emit('timerUpdate', {
        whiteTime: game.timers.white,
        blackTime: game.timers.black,
        activePlayer: game.timers.activePlayer
    });
}
