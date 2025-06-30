import { Server, Socket } from 'socket.io';
import Joi from 'joi';
import { games, activeGameIds } from '../services/game.service';
import { Chess } from 'chess.js';
import User from '../models/User';
import { activeConnections } from '../services/connection.service';

// Validation schema for creating a game
const createGameSchema = Joi.object({
    walletAddress: Joi.string().required(),
    timeControl: Joi.number().integer().min(1).max(60).optional().default(5),
    increment: Joi.number().integer().min(0).max(60).optional().default(0),
    onChainGameId: Joi.string().optional(),
});

function generateUniqueGameId(): string {
    let id;
    do {
        id = Math.random().toString(36).substr(2, 8).toUpperCase();
    } while (activeGameIds.has(id));
    return id;
}

export const registerGameHandlers = (io: Server, socket: Socket) => {
    // Get lobby games
    socket.on('getLobby', () => {
        const lobbyGames = Object.keys(games).map(gameId => {
            const game = games[gameId];
            return {
                gameId,
                whitePlayer: game.players.white || null,
                blackPlayer: game.players.black || null,
                stakes: game.stakes.amount,
                timeControl: game.timers.timeControl / (60 * 1000),
                increment: game.timers.increment / 1000,
                isFull: !!(game.players.white && game.players.black),
                isStarted: game.timers.activePlayer !== null,
                spectatorCount: game.spectators.length
            };
        });
        socket.emit('lobbyUpdate', { games: lobbyGames });
    });

    // Create a new game
    socket.on('createGame', async (data) => {
        const { error, value } = createGameSchema.validate(data);

        if (error) {
            socket.emit('gameCreationError', {
                message: `Invalid game creation data: ${error.details[0].message}`,
                type: 'validation_error'
            });
            return;
        }

        const { walletAddress, timeControl, increment, onChainGameId } = value;
        
        const newId = onChainGameId || generateUniqueGameId();
        const timeInMs = timeControl * 60 * 1000;
        const incrementInMs = increment * 1000;
        const creatorColor = Math.random() < 0.5 ? 'white' : 'black';
        
        games[newId] = {
            chess: new Chess(),
            players: {},
            playerSockets: {},
            spectators: [],
            timers: {
                white: timeInMs,
                black: timeInMs,
                activePlayer: null,
                startTime: null,
                timeControl: timeInMs,
                increment: incrementInMs
            },
            timerInterval: null,
            stakes: {
                amount: 0,
                whiteBet: null,
                blackBet: null,
                isLocked: false
            },
            moveHistory: [],
            isFinished: false,
            drawOffer: null,
            chatMessages: [],
            typingUsers: new Set(),
            lastActivity: Date.now(),
            createdAt: Date.now()
        };
        
        if (!onChainGameId) {
            activeGameIds.add(newId);
        }
        
        socket.join(newId);
        games[newId].players[creatorColor] = walletAddress;
        games[newId].playerSockets[walletAddress] = socket.id;
        
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.walletAddress = walletAddress;
            connection.rooms.add(newId);
            
            User.findOne({ walletAddress: walletAddress.toLowerCase() }).then(user => {
                if (user) {
                    (socket as any).username = user.username;
                    console.log(`User ${user.username} (${walletAddress}) authenticated for socket ${socket.id}`);
                }
            });
        }
        
        console.log(`Game ${newId} created by ${walletAddress} as ${creatorColor}`);
        
        socket.emit('gameCreated', { 
            gameId: newId,
            color: creatorColor,
            fen: games[newId].chess.fen(),
            timeControl: games[newId].timers.timeControl
        });
        
        io.emit('lobbyUpdate', {
            games: Object.keys(games).map(gameId => {
                const game = games[gameId];
                return {
                    gameId,
                    whitePlayer: game.players.white || null,
                    blackPlayer: game.players.black || null,
                    stakes: game.stakes.amount,
                    timeControl: game.timers.timeControl / (60 * 1000),
                    increment: game.timers.increment / 1000,
                    isFull: !!(game.players.white && game.players.black),
                    isStarted: game.timers.activePlayer !== null,
                    spectatorCount: game.spectators.length
                };
            })
        });
    });

    // Join a game
    socket.on('joinGame', (data) => {
        const { gameId, walletAddress } = data;
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        if (game.isFinished) {
            socket.emit('error', { message: 'Game is already finished' });
            return;
        }

        if (game.players.white && game.players.black) {
            socket.emit('error', { message: 'Game is full' });
            return;
        }

        if (game.players.white === walletAddress || game.players.black === walletAddress) {
            socket.emit('error', { message: 'You are already in this game' });
            return;
        }

        let color: 'white' | 'black';
        if (!game.players.white) {
            game.players.white = walletAddress;
            color = 'white';
        } else {
            game.players.black = walletAddress;
            color = 'black';
        }

        socket.join(gameId);
        game.playerSockets[walletAddress] = socket.id;
        game.lastActivity = Date.now();
        
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.walletAddress = walletAddress;
            connection.rooms.add(gameId);
        }
        
        console.log(`${walletAddress} joined game ${gameId} as ${color}`);
        
        io.to(gameId).emit('gameJoined', { 
            gameId, 
            color, 
            walletAddress 
        });

        io.emit('lobbyUpdate', {
            games: Object.keys(games).map(gameId => {
                const game = games[gameId];
                return {
                    gameId,
                    whitePlayer: game.players.white || null,
                    blackPlayer: game.players.black || null,
                    stakes: game.stakes.amount,
                    timeControl: game.timers.timeControl / (60 * 1000),
                    increment: game.timers.increment / 1000,
                    isFull: !!(game.players.white && game.players.black),
                    isStarted: game.timers.activePlayer !== null,
                    spectatorCount: game.spectators.length
                };
            })
        });
    });
}; 