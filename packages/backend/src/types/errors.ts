export class GameError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'GameError';
    }
}

export class ContractError extends GameError {
    constructor(message: string, code: string = 'CONTRACT_ERROR') {
        super(message, code);
        this.name = 'ContractError';
    }
}

export class ValidationError extends GameError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class RateLimitError extends GameError {
    constructor(message: string = 'Too many requests') {
        super(message, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
    }
}
