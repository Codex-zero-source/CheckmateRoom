import { EventEmitter } from 'events';

export interface GameMetrics {
    totalGames: number;
    activePlayers: number;
    totalBetsPlaced: number;
    avgGameDuration: number;
    successfulTransactions: number;
    failedTransactions: number;
    errors: {
        [key: string]: number;
    };
}

class MonitoringService extends EventEmitter {
    private metrics: GameMetrics = {
        totalGames: 0,
        activePlayers: 0,
        totalBetsPlaced: 0,
        avgGameDuration: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        errors: {}
    };

    private gameDurations: number[] = [];

    constructor() {
        super();
        this.startPeriodicReport();
    }

    public recordGameStart(): void {
        this.metrics.totalGames++;
        this.emit('gameStarted', this.metrics.totalGames);
    }

    public recordPlayerJoin(): void {
        this.metrics.activePlayers++;
        this.emit('playerJoined', this.metrics.activePlayers);
    }

    public recordPlayerLeave(): void {
        this.metrics.activePlayers = Math.max(0, this.metrics.activePlayers - 1);
        this.emit('playerLeft', this.metrics.activePlayers);
    }

    public recordBetPlaced(): void {
        this.metrics.totalBetsPlaced++;
        this.emit('betPlaced', this.metrics.totalBetsPlaced);
    }

    public recordGameDuration(durationMs: number): void {
        this.gameDurations.push(durationMs);
        if (this.gameDurations.length > 100) {
            this.gameDurations.shift(); // Keep last 100 games
        }
        this.metrics.avgGameDuration = this.calculateAvgDuration();
    }

    public recordTransaction(success: boolean): void {
        if (success) {
            this.metrics.successfulTransactions++;
        } else {
            this.metrics.failedTransactions++;
        }
    }

    public recordError(errorCode: string): void {
        this.metrics.errors[errorCode] = (this.metrics.errors[errorCode] || 0) + 1;
    }

    public getMetrics(): GameMetrics {
        return { ...this.metrics };
    }

    private calculateAvgDuration(): number {
        if (this.gameDurations.length === 0) return 0;
        const sum = this.gameDurations.reduce((acc, val) => acc + val, 0);
        return sum / this.gameDurations.length;
    }

    private startPeriodicReport(): void {
        setInterval(() => {
            console.log('Game Metrics Report:', {
                ...this.metrics,
                timestamp: new Date().toISOString()
            });
        }, 5 * 60 * 1000); // Report every 5 minutes
    }
}

export const monitoring = new MonitoringService();
