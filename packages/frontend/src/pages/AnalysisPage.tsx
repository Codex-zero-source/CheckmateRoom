import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useTheme } from '../contexts/ThemeContext';
import ChessAnalysisService from '../services/chessAnalysis';
import type { GameAnalysis } from '../services/chessAnalysis';
import './AnalysisPage.css';

// Explicitly type the Chessboard component
const ChessboardComponent: any = Chessboard as any;

const AnalysisPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { pieceSet, boardTheme } = useTheme();
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [game, setGame] = useState<Chess | null>(null);
  const [fen, setFen] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const fetchGameAnalysis = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch the game data from your backend
        // For now, we'll use a sample PGN and simulate the analysis
        const samplePgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. O-O O-O 6. Nc3 d6 7. Bg5 h6 8. Bh4 g5 9. Bg3 Nh5 10. Nxe5 Nxg3 11. hxg3 Nxe5 12. Qh5 Qf6 13. Qxf7+ Rxf7 14. Bxf7+ Kxf7 15. Nxe5+ dxe5 16. Rxf6+ Kxf6 17. Rf1+ Kg6 18. Rf7 1-0';
        
        const analysisService = ChessAnalysisService.getInstance();
        const gameAnalysis = await analysisService.analyzeGame(
          gameId,
          samplePgn,
          '0x1234...5678', // White player
          '0x8765...4321'  // Black player
        );
        
        setAnalysis(gameAnalysis);
        
        // Initialize chess game with the PGN
        const chess = new Chess();
        chess.loadPgn(gameAnalysis.pgn);
        setGame(chess);
        setFen(chess.fen());
        
      } catch (err) {
        setError('Failed to load game analysis');
        console.error('Error loading analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameAnalysis();
  }, [gameId]);

  const goToMove = (index: number) => {
    if (!game || !analysis) return;

    const chess = new Chess();
    chess.loadPgn(analysis.pgn);
    
    // Go to the specific move
    const moves = chess.history();
    if (index >= -1 && index < moves.length) {
      if (index === -1) {
        // Initial position
        chess.reset();
      } else {
        // Go to specific move
        for (let i = 0; i <= index; i++) {
          chess.move(moves[i]);
        }
      }
      setCurrentMoveIndex(index);
      setFen(chess.fen());
    }
  };

  const nextMove = () => {
    if (currentMoveIndex < (analysis?.moves.length || 0) - 1) {
      goToMove(currentMoveIndex + 1);
    }
  };

  const previousMove = () => {
    if (currentMoveIndex > -1) {
      goToMove(currentMoveIndex - 1);
    }
  };

  const getCurrentMoveAnalysis = () => {
    if (currentMoveIndex >= 0 && currentMoveIndex < (analysis?.moves.length || 0)) {
      return analysis?.moves[currentMoveIndex];
    }
    return null;
  };

  const getEvaluationText = (evaluation: number) => {
    if (evaluation > 2) return 'White is winning decisively';
    if (evaluation > 1) return 'White is winning';
    if (evaluation > 0.5) return 'White is better';
    if (evaluation > 0.2) return 'White is slightly better';
    if (evaluation > -0.2) return 'Equal position';
    if (evaluation > -0.5) return 'Black is slightly better';
    if (evaluation > -1) return 'Black is better';
    if (evaluation > -2) return 'Black is winning';
    return 'Black is winning decisively';
  };

  if (loading) {
    return (
      <div className="analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing game...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="analysis-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Game not found'}</p>
        </div>
      </div>
    );
  }

  const currentAnalysis = getCurrentMoveAnalysis();

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <h1>Game Analysis #{analysis.gameId}</h1>
        <div className="game-info">
          <p><strong>White:</strong> {analysis.whitePlayer}</p>
          <p><strong>Black:</strong> {analysis.blackPlayer}</p>
          <p><strong>Result:</strong> {analysis.finalResult}</p>
        </div>
        <div className="overall-assessment">
          <p><strong>Assessment:</strong> {analysis.overallAssessment}</p>
        </div>
      </div>

      <div className="analysis-content">
        <div className="board-section">
          <div className="board-container">
            <ChessboardComponent
              position={fen}
              boardWidth={500}
              pieces={pieceSet}
              boardTheme={boardTheme}
            />
          </div>
          
          <div className="move-controls">
            <button 
              onClick={() => goToMove(-1)}
              className={`control-btn ${currentMoveIndex === -1 ? 'active' : ''}`}
            >
              Start
            </button>
            <button onClick={previousMove} className="control-btn">
              ← Previous
            </button>
            <button onClick={nextMove} className="control-btn">
              Next →
            </button>
            <button 
              onClick={() => goToMove(analysis.moves.length - 1)}
              className={`control-btn ${currentMoveIndex === analysis.moves.length - 1 ? 'active' : ''}`}
            >
              End
            </button>
          </div>
        </div>

        <div className="analysis-panel">
          <div className="move-analysis">
            {currentMoveIndex === -1 ? (
              <div className="initial-position">
                <h3>Initial Position</h3>
                <p>Ready to begin the game analysis. Click "Next" to see the first move.</p>
              </div>
            ) : currentAnalysis ? (
              <>
                <div className="move-header">
                  <h3>Move {currentMoveIndex + 1}: {currentAnalysis.notation}</h3>
                  <div className="evaluation">
                    <span className="eval-score">{currentAnalysis.evaluation > 0 ? '+' : ''}{currentAnalysis.evaluation.toFixed(1)}</span>
                    <span className="eval-text">{getEvaluationText(currentAnalysis.evaluation)}</span>
                  </div>
                </div>
                
                <div className="move-explanation">
                  <h4>Analysis</h4>
                  <p>{currentAnalysis.explanation}</p>
                </div>

                <div className="position-details">
                  <h4>Position Details</h4>
                  <p><strong>FEN:</strong> {currentAnalysis.position}</p>
                </div>
              </>
            ) : (
              <div className="game-end">
                <h3>Game Complete</h3>
                <p>Final result: {analysis.finalResult}</p>
              </div>
            )}
          </div>

          <div className="move-list">
            <h3>Move List</h3>
            <div className="moves-container">
              {analysis.moves.map((move, index) => (
                <div
                  key={index}
                  className={`move-item ${currentMoveIndex === index ? 'current' : ''}`}
                  onClick={() => goToMove(index)}
                >
                  <span className="move-number">{index + 1}.</span>
                  <span className="move-notation">{move.notation}</span>
                  <span className="move-eval">{move.evaluation > 0 ? '+' : ''}{move.evaluation.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage; 