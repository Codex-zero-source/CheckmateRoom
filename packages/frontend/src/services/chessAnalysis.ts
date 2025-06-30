import { Chess } from 'chess.js';

export interface MoveAnalysis {
  move: string;
  notation: string;
  evaluation: number;
  explanation: string;
  position: string;
  bestMove?: string;
  alternatives?: string[];
}

export interface GameAnalysis {
  gameId: string;
  pgn: string;
  moves: MoveAnalysis[];
  finalResult: string;
  whitePlayer: string;
  blackPlayer: string;
  overallAssessment: string;
}

export class ChessAnalysisService {
  private static instance: ChessAnalysisService;
  private chess: Chess;

  private constructor() {
    this.chess = new Chess();
  }

  public static getInstance(): ChessAnalysisService {
    if (!ChessAnalysisService.instance) {
      ChessAnalysisService.instance = new ChessAnalysisService();
    }
    return ChessAnalysisService.instance;
  }

  /**
   * Analyzes a complete game and returns detailed move-by-move analysis
   */
  public async analyzeGame(gameId: string, pgn: string, whitePlayer: string, blackPlayer: string): Promise<GameAnalysis> {
    try {
      this.chess.loadPgn(pgn);
      const moves = this.chess.history();
      const result = this.chess.pgn().split(' ').pop() || '*';
      
      const moveAnalysis: MoveAnalysis[] = [];
      const chess = new Chess();

      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const analysis = await this.analyzeMove(chess, move, i);
        moveAnalysis.push(analysis);
        chess.move(move);
      }

      const overallAssessment = this.generateOverallAssessment(moveAnalysis, result);

      return {
        gameId,
        pgn,
        moves: moveAnalysis,
        finalResult: result,
        whitePlayer,
        blackPlayer,
        overallAssessment
      };
    } catch (error) {
      console.error('Error analyzing game:', error);
      throw new Error('Failed to analyze game');
    }
  }

  /**
   * Analyzes a single move in the context of the current position
   */
  private async analyzeMove(chess: Chess, move: string, moveIndex: number): Promise<MoveAnalysis> {
    const notation = this.getMoveNotation(chess, move);
    const evaluation = this.evaluatePosition(chess);
    const explanation = this.generateMoveExplanation(chess, move, moveIndex, evaluation);
    const position = chess.fen();

    return {
      move,
      notation,
      evaluation,
      explanation,
      position
    };
  }

  /**
   * Evaluates the current position (simplified evaluation)
   */
  private evaluatePosition(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -10 : 10; // Black/White wins
    }
    if (chess.isDraw()) {
      return 0;
    }

    // Simple material evaluation
    const fen = chess.fen();
    const pieces = fen.split(' ')[0];
    
    let evaluation = 0;
    const pieceValues: { [key: string]: number } = {
      'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
      'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': 0
    };

    for (const char of pieces) {
      if (pieceValues[char] !== undefined) {
        evaluation += pieceValues[char];
      }
    }

    // Add positional bonuses
    evaluation += this.getPositionalBonus(chess);

    return evaluation / 10; // Normalize to reasonable range
  }

  /**
   * Gets positional bonus based on piece placement
   */
  private getPositionalBonus(chess: Chess): number {
    let bonus = 0;
    
    // Center control bonus
    const centerSquares = ['d4', 'e4', 'd5', 'e5'];
    for (const square of centerSquares) {
      const piece = chess.get(square as any);
      if (piece) {
        bonus += piece.color === 'w' ? 0.1 : -0.1;
      }
    }

    // Development bonus
    const whitePieces = chess.board().flat().filter(p => p && p.color === 'w');
    const blackPieces = chess.board().flat().filter(p => p && p.color === 'b');
    
    bonus += (whitePieces.length - blackPieces.length) * 0.05;

    return bonus;
  }

  /**
   * Generates explanation for a move
   */
  private generateMoveExplanation(chess: Chess, move: string, moveIndex: number, evaluation: number): string {
    const moveNumber = Math.floor(moveIndex / 2) + 1;
    const isWhiteMove = moveIndex % 2 === 0;
    const player = isWhiteMove ? 'White' : 'Black';

    // Check for special moves
    if (chess.isCheckmate()) {
      return `${player} delivers checkmate with ${move}!`;
    }
    if (chess.isCheck()) {
      return `${player} gives check with ${move}.`;
    }
    if (chess.isDraw()) {
      return `${player}'s move ${move} leads to a draw.`;
    }

    // Analyze move type
    const moveObj = chess.move(move);
    chess.undo();

    let explanation = `${player} plays ${move}`;

    if (moveObj.captured) {
      explanation += `, capturing ${moveObj.captured}`;
    }
    if (moveObj.promotion) {
      explanation += `, promoting to ${moveObj.promotion}`;
    }
    if (moveObj.san?.includes('O-O')) {
      explanation += `, castling kingside`;
    }
    if (moveObj.san?.includes('O-O-O')) {
      explanation += `, castling queenside`;
    }

    explanation += '. ';

    // Add strategic commentary
    if (evaluation > 1) {
      explanation += `${player} gains a significant advantage.`;
    } else if (evaluation > 0.5) {
      explanation += `${player} gains a slight advantage.`;
    } else if (evaluation < -1) {
      explanation += `${player} falls behind.`;
    } else if (evaluation < -0.5) {
      explanation += `${player} loses a slight advantage.`;
    } else {
      explanation += `The position remains roughly equal.`;
    }

    return explanation;
  }

  /**
   * Gets the standard algebraic notation for a move
   */
  private getMoveNotation(chess: Chess, move: string): string {
    try {
      const moveObj = chess.move(move);
      chess.undo();
      return moveObj.san || move;
    } catch {
      return move;
    }
  }

  /**
   * Generates overall assessment of the game
   */
  private generateOverallAssessment(moves: MoveAnalysis[], result: string): string {
    if (result === '1-0') {
      return 'White won this game through superior play.';
    } else if (result === '0-1') {
      return 'Black won this game through superior play.';
    } else if (result === '1/2-1/2') {
      return 'The game ended in a draw.';
    } else {
      return 'The game was not completed.';
    }
  }

  /**
   * Gets the best move for a given position (placeholder for engine integration)
   */
  public async getBestMove(fen: string): Promise<string> {
    // This would integrate with a chess engine like Stockfish
    // For now, return a placeholder
    return 'e4';
  }

  /**
   * Gets alternative moves for a position
   */
  public async getAlternativeMoves(fen: string): Promise<string[]> {
    // This would integrate with a chess engine
    // For now, return placeholders
    return ['e4', 'd4', 'Nf3'];
  }
}

export default ChessAnalysisService; 