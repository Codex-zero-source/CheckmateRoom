import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import { initSocket } from './socket/socket';
import { initGameService } from './services/game.service';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { 
    SERVER_PORT, 
    SERVER_HOST, 
    SOCKET_CORS_ORIGIN,
    DATABASE_URL,
    JWT_SECRET
} from './config/env';

async function main() {
    // --- Environment Variable Validation ---
    if (!DATABASE_URL || !JWT_SECRET) {
        console.error('FATAL ERROR: DATABASE_URL and JWT_SECRET must be defined in the environment.');
        process.exit(1);
    }

    const app = express();
    const server = createServer(app);

    // Middleware to parse JSON bodies
    app.use(express.json());

    // --- Security Middlewares ---
    // Set security-related HTTP headers
    app.use(helmet());

    // Generic API rate-limiter (per IP)
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api/', apiLimiter);

    // --- Database Connection ---
    const redisClient = createClient({ url: DATABASE_URL });
    try {
        await redisClient.connect();
        console.log('✅ Redis connected successfully.');
    } catch (err) {
        console.error('❌ Redis connection error:', err);
        process.exit(1); // Exit if cannot connect to DB
    }

    // CORS configuration
    app.use(cors({
        origin: SOCKET_CORS_ORIGIN,
        credentials: true
    }));

    // Socket.IO setup with optimized configuration
    const io = new Server(server, {
        cors: {
            origin: SOCKET_CORS_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true
        },
        // Performance optimizations
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 10000,
        allowUpgrades: true,
        transports: ['websocket', 'polling'],
        // Connection management
        maxHttpBufferSize: 1e6, // 1MB
        allowEIO3: true,
    });
    
    const pubClient = createClient({ url: 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();

    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
    } catch (err) {
        console.error('❌ Redis connection error:', err);
        process.exit(1);
    }

    initGameService(io);

    // --- Socket Security Middleware ---
    const ipRateMap = new Map<string, { count: number; timestamp: number }>();
    const RATE_WINDOW_MS = 60 * 1000; // 1 minute
    const MAX_CONN_PER_WINDOW = 20;

    io.use((socket, next) => {
      const ip = socket.handshake.address || 'unknown';
      const now = Date.now();
      
      const record = ipRateMap.get(ip) || { count: 0, timestamp: now };
      if (now - record.timestamp > RATE_WINDOW_MS) {
        record.count = 0;
        record.timestamp = now;
      }
      record.count += 1;
      ipRateMap.set(ip, record);
      if (record.count > MAX_CONN_PER_WINDOW) {
        return next(new Error('Rate limit exceeded'));
      }

      // JWT-based authentication (expects walletAddress + token in handshake.auth)
      const { walletAddress, token } = socket.handshake.auth as {
        walletAddress?: string;
        token?: string;
      };

      if (!walletAddress || !token) {
        return next(new Error('Unauthorized'));
      }

      try {
        const payload = jwt.verify(token, JWT_SECRET!) as { walletAddress: string };
        if (payload.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          return next(new Error('Unauthorized'));
        }
        // attach verified wallet to socket data for downstream use
        (socket as any).walletAddress = walletAddress.toLowerCase();
        return next();
      } catch (err) {
        return next(new Error('Unauthorized'));
      }
    });

    initSocket(io);

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString()
        });
    });

    // --- API Endpoints for User management ---
    app.use('/api/user', userRoutes);
    app.use('/api/auth', authRoutes);

    // Start server
    const PORT = Number(process.env.PORT) || SERVER_PORT;

    server.listen(PORT, () => {
        console.log(`🚀 Magnus Chess Server running on http://${SERVER_HOST}:${PORT}`);
        console.log(`🌐 CORS Origin: ${SOCKET_CORS_ORIGIN}`);
        console.log(`🔌 Socket.IO configured with Redis adapter`);
    });
}

main().catch(err => {
    console.error("FATAL ERROR in main execution:", err);
    process.exit(1);
});
