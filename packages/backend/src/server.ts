import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow the frontend to connect
        methods: ["GET", "POST"]
    }
});

interface GameRoom {
    chess: Chess;
    players: {
        white?: string;
        black?: string;
    };
    playerSockets: {
        [walletAddress: string]: string;
    };
    timers: {
        white: number; // Time remaining in milliseconds
        black: number;
        activePlayer: 'white' | 'black' | null;
        startTime: number | null; // When the current turn started
        timeControl: number; // Initial time in milliseconds (e.g., 5 minutes = 300000ms)
        increment: number; // Increment in seconds (e.g., 2 seconds = 2000ms)
    };
    timerInterval: NodeJS.Timeout | null;
    stakes: {
        amount: number; // Betting amount in wei
        whiteBet: string | null; // White player's wallet address who placed bet
        blackBet: string | null; // Black player's wallet address who placed bet
        isLocked: boolean; // Whether bets are locked (game started)
    };
    moveHistory: Array<{
        move: string;
        notation: string;
        player: 'white' | 'black';
        timestamp: number;
    }>;
}

const games: { [key: string]: GameRoom } = {};
const activeGameIds: Set<string> = new Set();

function generateUniqueGameId(): string {
    let id;
    do {
        id = Math.random().toString(36).substr(2, 8).toUpperCase(); // 8-char alphanumeric
    } while (activeGameIds.has(id));
    return id;
}

// Timer management functions
function startTimer(gameId: string) {
    const game = games[gameId];
    if (!game || game.timers.activePlayer === null) return;

    // Clear any existing timer
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
    }

    // Set the start time for the current turn
    game.timers.startTime = Date.now();
    
    game.timerInterval = setInterval(() => {
        const activeColor = game.timers.activePlayer;
        if (!activeColor || !game.timers.startTime) return;

        const now = Date.now();
        const elapsed = now - game.timers.startTime;
        
        // Calculate remaining time for the active player
        const remainingTime = Math.max(0, game.timers[activeColor] - elapsed);

        // Check if time ran out
        if (remainingTime <= 0) {
            clearInterval(game.timerInterval!);
            game.timerInterval = null;
            
            // Game over - opponent wins on time
            const winner = activeColor === 'white' ? 'black' : 'white';
            console.log(`Time ran out for ${activeColor}. ${winner} wins on time.`);
            io.to(gameId).emit('gameOver', {
                reason: 'time',
                winner: winner,
                fen: game.chess.fen()
            });
            return;
        }

        // Create timer update object with current remaining times
        const timerUpdate = {
            white: game.timers.white,
            black: game.timers.black,
            activePlayer: game.timers.activePlayer
        };

        // Update the active player's time in the broadcast
        timerUpdate[activeColor] = remainingTime;

        // Broadcast updated timer to all players
        io.to(gameId).emit('timerUpdate', timerUpdate);
    }, 100); // Update every 100ms for smooth countdown
}

function stopTimer(gameId: string) {
    const game = games[gameId];
    if (!game || !game.timerInterval) return;

    clearInterval(game.timerInterval);
    game.timerInterval = null;
    game.timers.startTime = null;
}

function switchTimer(gameId: string) {
    const game = games[gameId];
    if (!game) return;

    // Stop current timer and update the time for the player who just moved
    if (game.timers.activePlayer && game.timers.startTime) {
        const elapsed = Date.now() - game.timers.startTime;
        const previousTime = game.timers[game.timers.activePlayer];
        const newTime = Math.max(0, game.timers[game.timers.activePlayer] - elapsed);
        // Add increment to the player who just moved
        game.timers[game.timers.activePlayer] = newTime + game.timers.increment;
        
        console.log(`Timer switch - ${game.timers.activePlayer}: ${previousTime}ms -> ${newTime}ms + ${game.timers.increment}ms increment = ${game.timers[game.timers.activePlayer]}ms (elapsed: ${elapsed}ms)`);
    }
    
    stopTimer(gameId);

    // Switch active player
    game.timers.activePlayer = game.timers.activePlayer === 'white' ? 'black' : 'white';
    console.log(`Switching timer to ${game.timers.activePlayer}`);

    // Start timer for new player
    startTimer(gameId);
}

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    socket.on('requestNewGameId', () => {
        const newId = generateUniqueGameId();
        socket.emit('newGameId', { gameId: newId });
    });

    socket.on('createGame', (data) => {
        const { walletAddress, timeControl = 5, increment = 0, onChainGameId } = data; // timeControl in minutes, increment in seconds
        
        // Check if wallet is connected
        if (!walletAddress) {
            socket.emit('gameCreationError', { 
                message: 'Wallet must be connected to create a game',
                type: 'wallet_required'
            });
            return;
        }
        
        // Use the on-chain game ID if provided, otherwise generate a new one
        const newId = onChainGameId || generateUniqueGameId();
        
        // Convert time control to milliseconds
        const timeInMs = timeControl * 60 * 1000;
        const incrementInMs = increment * 1000;
        
        // Randomly assign color to the creator
        const creatorColor = Math.random() < 0.5 ? 'white' : 'black';
        
        // Create the game room
        games[newId] = {
            chess: new Chess(),
            players: {},
            playerSockets: {},
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
            moveHistory: []
        };
        
        // Only add to activeGameIds if it's not an on-chain game ID
        if (!onChainGameId) {
            activeGameIds.add(newId);
        }
        
        // Join the socket to the game room
        socket.join(newId);
        
        // Assign the creator to their random color
        games[newId].players[creatorColor] = walletAddress;
        games[newId].playerSockets[walletAddress] = socket.id;
        
        console.log(`Game ${newId} created by ${walletAddress}${onChainGameId ? ' (on-chain)' : ' (off-chain)'} as ${creatorColor}`);
        
        // Emit success response
        socket.emit('gameCreated', { 
            gameId: newId,
            color: creatorColor,
            fen: games[newId].chess.fen(),
            timeControl: games[newId].timers.timeControl
        });
        
        // Update lobby for all clients
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
                    isStarted: game.timers.activePlayer !== null
                };
            })
        });
    });

    socket.on('getLobby', () => {
        const lobbyGames = Object.keys(games).map(gameId => {
            const game = games[gameId];
            return {
                gameId,
                whitePlayer: game.players.white || null,
                blackPlayer: game.players.black || null,
                stakes: game.stakes.amount,
                timeControl: game.timers.timeControl / (60 * 1000), // Convert to minutes
                increment: game.timers.increment / 1000, // Convert to seconds
                isFull: !!(game.players.white && game.players.black),
                isStarted: game.timers.activePlayer !== null
            };
        });
        socket.emit('lobbyUpdate', { games: lobbyGames });
    });

    socket.on('setStakes', (data) => {
        const { gameId, amount } = data; // amount in wei
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        if (game.stakes.isLocked) {
            socket.emit('error', { message: 'Cannot change stakes after game starts' });
            return;
        }
        
        game.stakes.amount = amount;
        io.to(gameId).emit('stakesUpdated', { amount });
        
        // Update lobby for all connected clients
        io.emit('lobbyUpdate', {
            games: Object.keys(games).map(gameId => {
                const game = games[gameId];
                return {
                    gameId,
                    whitePlayer: game.players.white || null,
                    blackPlayer: game.players.black || null,
                    stakes: game.stakes.amount,
                    timeControl: game.timers.timeControl / (60 * 1000),
                    increment: game.timers.increment / 1000, // Convert to seconds
                    isFull: !!(game.players.white && game.players.black),
                    isStarted: game.timers.activePlayer !== null
                };
            })
        });
    });

    socket.on('placeBet', (data) => {
        const { gameId, walletAddress, color } = data;
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        if (game.stakes.isLocked) {
            socket.emit('error', { message: 'Bets are locked, game has started' });
            return;
        }
        
        if (color === 'white') {
            game.stakes.whiteBet = walletAddress;
        } else if (color === 'black') {
            game.stakes.blackBet = walletAddress;
        }
        
        io.to(gameId).emit('betPlaced', { color, walletAddress });
    });

    socket.on('joinGame', (data) => {
        const { gameId, walletAddress } = data;
        
        if (!games[gameId]) {
            socket.emit('error', { message: 'Game not found.' });
            return;
        }
        
        if (!walletAddress) {
            socket.emit('error', { message: 'Wallet must be connected to join a game.' });
            return;
        }
        
        const game = games[gameId];
        
        // Check if game is full
        if (game.players.white && game.players.black) {
            socket.emit('error', { message: 'Game is full.' });
            return;
        }
        
        // Check if player is already in the game
        if (game.players.white === walletAddress || game.players.black === walletAddress) {
            socket.emit('error', { message: 'You are already in this game.' });
            return;
        }
        
        // Check if player has enough tokens for the stakes
        if (game.stakes.amount > 0) {
            // Emit event to check token balance on frontend
            socket.emit('checkTokenBalance', { 
                gameId, 
                requiredAmount: game.stakes.amount,
                walletAddress 
            });
            return;
        }
        
        socket.join(gameId);
        
        // Assign the joiner to the opposite color of the creator
        const availableColor = game.players.white ? 'black' : 'white';
        game.players[availableColor] = walletAddress;
        game.playerSockets[walletAddress] = socket.id;
        
        socket.emit('gameJoined', { gameId, color: availableColor, timeControl: game.timers.timeControl });
        
        // Notify all players in the game
        io.to(gameId).emit('gameState', {
            gameId,
            players: game.players,
            fen: game.chess.fen()
        });
        
        // If game is now full, start the timer
        if (game.players.white && game.players.black) {
            startTimer(gameId);
        }
        
        console.log(`Player ${walletAddress} joined game ${gameId} as ${availableColor}`);
    });

    socket.on('tokenBalanceConfirmed', (data) => {
        const { gameId, walletAddress, hasEnoughTokens } = data;
        
        if (!games[gameId]) {
            socket.emit('error', { message: 'Game not found.' });
            return;
        }
        
        if (!hasEnoughTokens) {
            socket.emit('error', { 
                message: 'Insufficient $MAG tokens to join this game.',
                type: 'insufficient_tokens'
            });
            return;
        }
        
        const game = games[gameId];
        
        socket.join(gameId);
        
        // Assign the joiner to the opposite color of the creator
        const availableColor = game.players.white ? 'black' : 'white';
        game.players[availableColor] = walletAddress;
        game.playerSockets[walletAddress] = socket.id;
        
        socket.emit('gameJoined', { gameId, color: availableColor, timeControl: game.timers.timeControl });
        
        // Notify all players in the game
        io.to(gameId).emit('gameState', {
            gameId,
            players: game.players,
            fen: game.chess.fen()
        });
        
        // If game is now full, start the timer
        if (game.players.white && game.players.black) {
            startTimer(gameId);
        }
        
        console.log(`Player ${walletAddress} joined game ${gameId} as ${availableColor} (tokens confirmed)`);
    });

    socket.on('makeMove', (data) => {
        const { gameId, move, walletAddress } = data;
        const game = games[gameId];

        if (!game || !walletAddress) {
            socket.emit('error', { message: 'Invalid game or wallet not connected' });
            return;
        }

        // Check if it's the player's turn
        const currentTurn = game.chess.turn() === 'w' ? 'white' : 'black';
        const playerColor = game.players.white === walletAddress ? 'white' : 
                           game.players.black === walletAddress ? 'black' : null;

        if (!playerColor || playerColor !== currentTurn) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        try {
            const result = game.chess.move(move);
            if (result) {
                // Lock bets on first move
                if (game.moveHistory.length === 0) {
                    game.stakes.isLocked = true;
                }
                
                // Track move history
                const moveData = {
                    move: `${result.from}-${result.to}`,
                    notation: result.san,
                    player: (game.chess.turn() === 'w' ? 'black' : 'white') as 'white' | 'black', // The player who just moved
                    timestamp: Date.now()
                };
                game.moveHistory.push(moveData);
                
                // Switch timer to the other player
                switchTimer(gameId);
                
                const isGameOver = game.chess.isGameOver();
                
                io.to(gameId).emit('moveMade', {
                    fen: game.chess.fen(),
                    move: result,
                    isGameOver: isGameOver,
                    moveHistory: game.moveHistory
                });
                
                // If game is over, stop the timer
                if (isGameOver) {
                    stopTimer(gameId);
                }
            } else {
                socket.emit('error', { message: 'Invalid move' });
            }
        } catch (error) {
            socket.emit('error', { message: 'Invalid move format' });
        }
    });

    socket.on('setTimeControl', (data) => {
        const { gameId, timeControl, increment = 0 } = data; // timeControl in minutes, increment in seconds
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        // Only allow setting time control before both players join
        if (game.players.white && game.players.black) {
            socket.emit('error', { message: 'Cannot change time control after game starts' });
            return;
        }
        
        const timeInMs = timeControl * 60 * 1000;
        const incrementInMs = increment * 1000;
        game.timers.timeControl = timeInMs;
        game.timers.increment = incrementInMs;
        game.timers.white = timeInMs;
        game.timers.black = timeInMs;
        
        io.to(gameId).emit('timeControlUpdated', { timeControl: timeInMs, increment: incrementInMs });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        
        // Clean up player references and timers
        for (const gameId in games) {
            const game = games[gameId];
            for (const [walletAddress, socketId] of Object.entries(game.playerSockets)) {
                if (socketId === socket.id) {
                    delete game.playerSockets[walletAddress];
                    console.log(`Player ${walletAddress} disconnected from game ${gameId}`);
                    
                    // If both players are gone, clean up the game
                    if (Object.keys(game.playerSockets).length === 0) {
                        stopTimer(gameId);
                        delete games[gameId];
                        activeGameIds.delete(gameId);
                        console.log(`Game ${gameId} cleaned up`);
                    }
                    break;
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on *:${PORT}`);
}); 