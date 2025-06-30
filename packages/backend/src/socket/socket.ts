import { Server, Socket } from 'socket.io';
import { registerGameHandlers } from './game.handler';
import { activeConnections } from '../services/connection.service';
import { games } from '../services/game.service';

const GAME_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export const initSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        activeConnections.set(socket.id, {
            socketId: socket.id,
            walletAddress: (socket as any).walletAddress || null,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            rooms: new Set()
        });

        socket.onAny(() => {
            const connection = activeConnections.get(socket.id);
            if (connection) {
                connection.lastActivity = Date.now();
            }
        });

        registerGameHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            const connection = activeConnections.get(socket.id);
            if (connection) {
                for (const room of connection.rooms) {
                    io.sockets.sockets.get(socket.id)?.leave(room);
                }
                activeConnections.delete(socket.id);
            }

            for (const [gameId, game] of Object.entries(games)) {
                if (game.playerSockets[connection?.walletAddress || ''] === socket.id) {
                    delete game.playerSockets[connection?.walletAddress || ''];
                    if (Object.keys(game.playerSockets).length === 0) {
                        game.lastActivity = Date.now() - GAME_TIMEOUT + 60000; // Mark for cleanup
                    }
                }
                game.spectators = game.spectators.filter(spec => spec.socketId !== socket.id);
            }
        });
    });
}; 