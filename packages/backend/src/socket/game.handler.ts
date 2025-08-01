import { Server, Socket } from 'socket.io';
import { safeEmit } from '../../../shared/safeEmit';
import Joi from 'joi';
import { games, activeGameIds, startTimer, GameRoom } from '../services/game.service';
import { Chess } from 'chess.js';
import { User, IUser } from '../models/User';
import { activeConnections } from '../services/connection.service';
import { createPublicClient, createWalletClient, http, verifyMessage, encodePacked } from 'viem';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { chessGameABI } from '../config/chessGameABI';
import { GameBlockchainService } from '../services/viem.service';

// Type definitions for contract interactions
interface OnChainGame {
    player1: string;
    player2: string;
    betAmount: bigint;
    whiteBet: string;
    blackBet: string;
    betsLocked: boolean;
}

// Rate limiter setup
const rateLimiter = new RateLimiterMemory({
    points: 10, // Number of actions
    duration: 1, // Per second
});

// Transaction retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Contract interfaces
interface ChessGameContract {
    games(gameId: string): Promise<{
        player1: string;
        player2: string;
        betAmount: bigint;
        whiteBet: string;
        blackBet: string;
        betsLocked: boolean;
    }>;
    placeBet(gameId: string, amount: bigint): Promise<any>;
    lockBets(gameId: string): Promise<any>;
    submitResult(gameId: string, winner: string | null, pgn: string): Promise<any>;
}

// Contract interaction helpers
async function validateContractState(gameId: string, walletAddress: string): Promise<boolean> {
    try {
        const game = games[gameId];
        if (!game?.onChainGameId) return true; // Not an on-chain game

        const gameBlockchain = new GameBlockchainService(game.onChainGameId);
        const client = gameBlockchain.getPublicClient();
        
        // Verify game exists on chain
        const onChainGame = await contract.games(game.onChainGameId);
        if (!onChainGame) {
            console.error(`Game ${game.onChainGameId} not found on chain`);
            return false;
        }

        // Verify player addresses
        if (onChainGame.player1.toLowerCase() !== game.players.white?.toLowerCase() &&
            onChainGame.player2.toLowerCase() !== game.players.black?.toLowerCase()) {
            console.error('Player addresses mismatch between chain and server');
            return false;
        }

        // Verify bet amounts match
        if (onChainGame.betAmount.toString() !== game.stakes.amount.toString()) {
            console.error('Bet amounts mismatch between chain and server');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Contract state validation failed:', error);
        return false;
    }
}

async function verifySignature(message: string, signature: string, walletAddress: string): Promise<boolean> {
    try {
        return await verifyMessage({
            message,
            signature,
            address: walletAddress
        });
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

interface GameMetrics {
    totalGames: number;
    activePlayers: number;
    totalBetsPlaced: number;
    avgGameDuration: number;
    successfulTransactions: number;
    failedTransactions: number;
}

const metrics: GameMetrics = {
    totalGames: 0,
    activePlayers: 0,
    totalBetsPlaced: 0,
    avgGameDuration: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
};

async function handleTransactionRetry(
    gameId: string,
    transactionType: string,
    operation: () => Promise<any>,
    attempt: number = 1
): Promise<any> {
    const startTime = Date.now();
    try {
        const result = await operation();
        metrics.successfulTransactions++;
        
        // Log successful transaction
        console.log(`Transaction ${transactionType} successful for game ${gameId}`, {
            attempt,
            duration: Date.now() - startTime,
            type: transactionType
        });
        
        return result;
    } catch (error: any) {
        metrics.failedTransactions++;
        
        // Log transaction failure with details
        console.error(`Transaction ${transactionType} failed for game ${gameId}`, {
            attempt,
            error: error.message,
            code: error.code,
            duration: Date.now() - startTime,
            type: transactionType
        });

        if (attempt >= MAX_RETRIES) {
            throw new Error(`Transaction failed after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleTransactionRetry(gameId, transactionType, operation, attempt + 1);
    }
}

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
        safeEmit(socket, 'lobbyUpdate', { games: lobbyGames });
    });

    // Create a new game
    socket.on('createGame', async (data) => {
        const { error, value } = createGameSchema.validate(data);

        if (error) {
            safeEmit(socket, 'gameCreationError', {
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
                amount: 0, // DEMO: use number instead of BigInt
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
            
            User.findOne({ walletAddress: walletAddress.toLowerCase() }).then((user: IUser | null) => {
                if (user) {
                    (socket as any).username = user.username;
                    console.log(`User ${user.username} (${walletAddress}) authenticated for socket ${socket.id}`);
                }
            });
        }
        
        console.log(`Game ${newId} created by ${walletAddress} as ${creatorColor}`);
        
        safeEmit(socket, 'gameCreated', { 
            gameId: newId,
            color: creatorColor,
            fen: games[newId].chess.fen(),
            timeControl: games[newId].timers.timeControl
        });
        
        safeEmit(io, 'lobbyUpdate', {
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
        
        safeEmit(io, 'gameJoined', { 
            gameId, 
            color, 
            walletAddress 
        });

        safeEmit(io, 'lobbyUpdate', {
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

    // Handle bet placement
    socket.on('placeBet', async (data: { 
        gameId: string; 
        walletAddress: string; 
        betAmount: string; 
        color: 'white' | 'black';
        signature: string;
        nonce: number;
    }) => {
        try {
            // Rate limiting
            await rateLimiter.consume(socket.id);
            
            const { gameId, walletAddress, betAmount, color, signature, nonce } = data;
            const currentGame = games[gameId];

            // Basic validations
            if (!currentGame) {
                safeEmit(socket, 'error', { message: 'Game not found' });
                return;
            }

            if (currentGame.isFinished) {
                safeEmit(socket, 'error', { message: 'Game is already finished' });
                return;
            }

            if (currentGame.stakes.isLocked) {
                safeEmit(socket, 'error', { message: 'Betting is locked for this game' });
                return;
            }

            // Verify player is in the game
            if (currentGame.players[color] !== walletAddress) {
                safeEmit(socket, 'error', { message: 'You are not playing this color' });
                return;
            }

            // Verify signature
            const message = encodePacked(
                ['string', 'uint256', 'string', 'uint256'],
                [gameId, betAmount, color, nonce]
            );
            
            if (!await verifySignature(message, signature, walletAddress)) {
                safeEmit(socket, 'error', { message: 'Invalid signature' });
                return;
            }

            // Validate contract state if this is an on-chain game
            if (currentGame.onChainGameId && !await validateContractState(gameId, walletAddress)) {
                safeEmit(socket, 'error', { message: 'Invalid contract state' });
                return;
            }

            // Place the bet with retry mechanism
            if (currentGame.onChainGameId) {
                try {
                    // TODO: chain placeBet integration pending bigint refactor
                } catch (error) {
                    safeEmit(socket, 'error', { 
                        message: 'Failed to place bet on chain', 
                        details: error.message 
                    });
                    return;
                }
            }

            // Update game state
            currentGame.stakes[color === 'white' ? 'whiteBet' : 'blackBet'] = betAmount;
            currentGame.stakes.amount = parseInt(betAmount, 10);

            // Broadcast bet placement
            io.to(gameId).emit('betPlaced', {
                color,
                amount: betAmount,
                walletAddress
            });

            // Check if both bets are placed
            if (currentGame.stakes.whiteBet && currentGame.stakes.blackBet) {
                io.to(gameId).emit('betsConfirmed');
                
                // Lock bets on chain if needed
                if (currentGame.onChainGameId) {
                    try {
                        await handleTransactionRetry(
                            gameId,
                            'lockBets',
                            async () => {
                                io.to(gameId).emit('contractTransaction', {
                                    type: 'lockBets',
                                    gameId: currentGame.onChainGameId
                                });
                            }
                        );
                    } catch (error) {
                        console.error('Failed to lock bets on chain:', error);
                        safeEmit(socket, 'error', { 
                            message: 'Failed to lock bets on chain', 
                            details: error.message 
                        });
                    }
                }
            }
        } catch (error) {
            if (error.name === 'RateLimitError') {
                safeEmit(socket, 'error', { 
                    message: 'Too many requests, please try again later',
                    type: 'rate_limit'
                });
            } else {
                console.error('Bet placement error:', error);
                safeEmit(socket, 'error', { 
                    message: 'Failed to place bet', 
                    details: error.message 
                });
            }
        }

    });

    // Handle contract bet confirmation
    socket.on('betConfirmedOnChain', (data) => {
        const { gameId, walletAddress, color, transactionHash } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        io.to(gameId).emit('betConfirmedOnChain', {
            color,
            walletAddress,
            transactionHash
        });
    });

    // Request current game state
    socket.on('requestGameState', (data) => {
        const { gameId } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        safeEmit(socket, 'gameState', {
            fen: game.chess.fen(),
            moveHistory: game.moveHistory,
            timers: {
                white: game.timers.white,
                black: game.timers.black,
                activePlayer: game.timers.activePlayer
            },
            stakes: {
                amount: game.stakes.amount,
                whiteBet: game.stakes.whiteBet,
                blackBet: game.stakes.blackBet,
                isLocked: game.stakes.isLocked
            },
            players: game.players,
            isFinished: game.isFinished,
            gameResult: game.gameResult
        });
    });

    // Handle game start
    socket.on('startGame', (data) => {
        const { gameId, walletAddress } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        if (game.isFinished) {
            safeEmit(socket, 'error', { message: 'Game is already finished' });
            return;
        }

        // Verify both players are present
        if (!game.players.white || !game.players.black) {
            safeEmit(socket, 'error', { message: 'Waiting for both players to join' });
            return;
        }

        // Verify bets are placed if required
        if (game.stakes.amount > 0 && (!game.stakes.whiteBet || !game.stakes.blackBet)) {
            safeEmit(socket, 'error', { message: 'Waiting for both players to place bets' });
            return;
        }

        // Initialize game state
        game.chess.reset();
        game.timers.startTime = Date.now();
        game.timers.activePlayer = 'white';
        game.stakes.isLocked = true; // Lock the stakes once game starts

        // Start the game timer
        startTimer(gameId);

        // Broadcast game start to all players
        io.to(gameId).emit('gameStart', {
            white: game.players.white,
            black: game.players.black,
            fen: game.chess.fen(),
            timeControl: game.timers.timeControl,
            increment: game.timers.increment,
            stakes: game.stakes.amount
        });

        // Update lobby status
        safeEmit(io, 'lobbyUpdate', {
            games: Object.keys(games).map(gId => ({
                gameId: gId,
                whitePlayer: games[gId].players.white || null,
                blackPlayer: games[gId].players.black || null,
                stakes: games[gId].stakes.amount,
                timeControl: games[gId].timers.timeControl / (60 * 1000),
                increment: games[gId].timers.increment / 1000,
                isFull: !!(games[gId].players.white && games[gId].players.black),
                isStarted: games[gId].timers.activePlayer !== null,
                spectatorCount: games[gId].spectators.length
            }))
        });
    });

    // Handle move making
    socket.on('makeMove', (data) => {
        const { gameId, move, walletAddress } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        if (game.isFinished) {
            safeEmit(socket, 'error', { message: 'Game is already finished' });
            return;
        }

        // Verify it's the player's turn
        const playerColor = game.players.white === walletAddress ? 'white' : 
                          game.players.black === walletAddress ? 'black' : null;
        
        if (!playerColor) {
            safeEmit(socket, 'error', { message: 'You are not a player in this game' });
            return;
        }

        if (game.chess.turn() === 'w' && playerColor !== 'white' ||
            game.chess.turn() === 'b' && playerColor !== 'black') {
            safeEmit(socket, 'error', { message: 'Not your turn' });
            return;
        }

        try {
            // Attempt to make the move
            const result = game.chess.move(move);
            
            if (!result) {
                safeEmit(socket, 'error', { message: 'Invalid move' });
                return;
            }

            // Record the move in history
            game.moveHistory.push({
                move: move.from + move.to,
                notation: result.san,
                player: playerColor,
                timestamp: Date.now()
            });

            // Update game state
            game.lastActivity = Date.now();

            // Start timer on first move
            if (game.timers.activePlayer === null) {
                game.timers.activePlayer = game.chess.turn() === 'w' ? 'white' : 'black';
                startTimer(gameId);
            } else {
                // Add increment to the player who just moved
                game.timers[playerColor] += game.timers.increment;
                game.timers.activePlayer = game.chess.turn() === 'w' ? 'white' : 'black';
                game.timers.startTime = Date.now();
            }

            // Check for game end conditions
            const gameEndStatus = {
                isCheckmate: game.chess.isCheckmate(),
                isDraw: game.chess.isDraw(),
                isStalemate: game.chess.isStalemate(),
                isThreefoldRepetition: game.chess.isThreefoldRepetition(),
                isInsufficientMaterial: game.chess.isInsufficientMaterial()
            };

            const isGameOver = Object.values(gameEndStatus).some(status => status);

            if (isGameOver) {
                game.isFinished = true;
                if (game.timerInterval) {
                    clearInterval(game.timerInterval);
                }

                const winner = gameEndStatus.isCheckmate ? 
                    (game.chess.turn() === 'w' ? 'black' : 'white') : 'draw';

                game.gameResult = {
                    result: winner,
                    reason: Object.entries(gameEndStatus)
                        .find(([_, value]) => value)?.[0]
                        .replace('is', '')
                        .toLowerCase()
                };

                // If this is an on-chain game, submit result to contract and emit progress
                if (game.onChainGameId) {
                    io.to(gameId).emit('contractTransaction', {
                        type: 'submitResult',
                        gameId: game.onChainGameId,
                        winner: winner === 'draw' ? null : game.players[winner],
                        pgn: game.chess.pgn(),
                        moveHistory: game.moveHistory
                    });
                }
            }

            // Broadcast the move to all players and spectators
            io.to(gameId).emit('moveMade', {
                fen: game.chess.fen(),
                move: result,
                moveHistory: game.moveHistory,
                isGameOver,
                gameResult: game.gameResult,
                timers: {
                    white: game.timers.white,
                    black: game.timers.black,
                    activePlayer: game.timers.activePlayer
                }
            });

        } catch (error) {
            console.error('Move error:', error);
            safeEmit(socket, 'error', { 
                message: 'Invalid move', 
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Handle draw offers
    socket.on('offerDraw', (data) => {
        const { gameId, walletAddress } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        if (game.isFinished) {
            safeEmit(socket, 'error', { message: 'Game is already finished' });
            return;
        }

        // Verify player is in the game
        const playerColor = game.players.white === walletAddress ? 'white' : 
                          game.players.black === walletAddress ? 'black' : null;
        
        if (!playerColor) {
            safeEmit(socket, 'error', { message: 'You are not a player in this game' });
            return;
        }

        // Set draw offer
        game.drawOffer = playerColor;

        // Notify opponent
        const opponentWallet = playerColor === 'white' ? game.players.black : game.players.white;
        if (opponentWallet && game.playerSockets[opponentWallet]) {
            io.to(gameId).emit('drawOffered', {
                by: playerColor,
                walletAddress
            });
        }
    });

    // Handle draw responses
    socket.on('respondToDraw', (data) => {
        const { gameId, walletAddress, accepted } = data;
        const game = games[gameId];

        if (!game || !game.drawOffer) {
            safeEmit(socket, 'error', { message: 'No active draw offer' });
            return;
        }

        const playerColor = game.players.white === walletAddress ? 'white' : 
                          game.players.black === walletAddress ? 'black' : null;

        if (!playerColor || playerColor === game.drawOffer) {
            safeEmit(socket, 'error', { message: 'Invalid draw response' });
            return;
        }

        if (accepted) {
            game.isFinished = true;
            game.gameResult = {
                result: 'draw',
                reason: 'agreement'
            };

            if (game.timerInterval) {
                clearInterval(game.timerInterval);
            }

            io.to(gameId).emit('gameEnded', {
                result: 'draw',
                reason: 'agreement',
                fen: game.chess.fen()
            });
        } else {
            game.drawOffer = null;
            io.to(gameId).emit('drawDeclined', { by: playerColor });
        }
    });

    // Handle resignations
    socket.on('resign', (data) => {
        const { gameId, walletAddress } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        if (game.isFinished) {
            safeEmit(socket, 'error', { message: 'Game is already finished' });
            return;
        }

        const playerColor = game.players.white === walletAddress ? 'white' : 
                          game.players.black === walletAddress ? 'black' : null;

        if (!playerColor) {
            safeEmit(socket, 'error', { message: 'You are not a player in this game' });
            return;
        }

        game.isFinished = true;
        game.gameResult = {
            result: playerColor === 'white' ? 'black' : 'white',
            reason: 'resignation'
        };

        if (game.timerInterval) {
            clearInterval(game.timerInterval);
        }

        io.to(gameId).emit('gameEnded', {
            result: playerColor === 'white' ? 'black' : 'white',
            reason: 'resignation',
            fen: game.chess.fen()
        });
    });

    // Handle disconnections and reconnections
    socket.on('disconnect', () => {
        const connection = activeConnections.get(socket.id);
        if (!connection) return;

        // Find all games the player is in
        connection.rooms.forEach(gameId => {
            const game = games[gameId];
            if (!game) return;

            const walletAddress = connection.walletAddress;
            if (!walletAddress) return;

            // If player was in an active game, handle disconnection
            if ((game.players.white === walletAddress || game.players.black === walletAddress) && !game.isFinished) {
                // Pause the timer
                if (game.timerInterval) {
                    clearInterval(game.timerInterval);
                    game.timers.startTime = null;
                }

                io.to(gameId).emit('playerDisconnected', {
                    color: game.players.white === walletAddress ? 'white' : 'black',
                    walletAddress
                });
            }
        });

        activeConnections.delete(socket.id);
    });

    // Handle contract transaction confirmations
    socket.on('contractTransactionComplete', (data: {
        gameId: string;
        transactionType: 'whiteBet' | 'blackBet' | 'lockBets' | 'result';
        transactionHash: string;
    }) => {
        const { gameId, transactionType, transactionHash } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        // Store transaction hash
        if (!game.contractTransactions) {
            game.contractTransactions = {};
        }

        game.contractTransactions[transactionType] = transactionHash;

        // Broadcast transaction confirmation
        io.to(gameId).emit('contractTransactionConfirmed', {
            type: transactionType,
            gameId,
            transactionHash
        });

        // If this was the result submission, distribute rewards
        if (transactionType === 'result' && game.gameResult) {
            io.to(gameId).emit('gameRewardsDistributed', {
                gameId,
                winner: game.gameResult.result,
                transactionHash
            });
        }
    });

    // Handle reconnection attempts
    socket.on('reconnectToGame', (data) => {
        const { gameId, walletAddress } = data;
        const game = games[gameId];

        if (!game) {
            safeEmit(socket, 'error', { message: 'Game not found' });
            return;
        }

        const playerColor = game.players.white === walletAddress ? 'white' : 
                          game.players.black === walletAddress ? 'black' : null;

        if (!playerColor) {
            safeEmit(socket, 'error', { message: 'You are not a player in this game' });
            return;
        }

        // Update socket information
        socket.join(gameId);
        game.playerSockets[walletAddress] = socket.id;
        
        const connection = activeConnections.get(socket.id);
        if (connection) {
            connection.walletAddress = walletAddress;
            connection.rooms.add(gameId);
        }

        // Resume the game if both players are now connected
        const bothPlayersConnected = Object.values(game.playerSockets).every(socketId => 
            activeConnections.has(socketId)
        );

        if (bothPlayersConnected && !game.isFinished && game.timers.activePlayer) {
            game.timers.startTime = Date.now();
            startTimer(gameId);
        }

        // Send current game state to reconnected player
        safeEmit(socket, 'gameState', {
            fen: game.chess.fen(),
            moveHistory: game.moveHistory,
            timers: {
                white: game.timers.white,
                black: game.timers.black,
                activePlayer: game.timers.activePlayer
            },
            stakes: {
                amount: game.stakes.amount,
                whiteBet: game.stakes.whiteBet,
                blackBet: game.stakes.blackBet,
                isLocked: game.stakes.isLocked
            },
            players: game.players,
            isFinished: game.isFinished,
            gameResult: game.gameResult,
            drawOffer: game.drawOffer
        });

        io.to(gameId).emit('playerReconnected', {
            color: playerColor,
            walletAddress
        });
    });
};
