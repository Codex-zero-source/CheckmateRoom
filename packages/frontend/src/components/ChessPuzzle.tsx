import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './ChessPuzzle.css';

interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl: string;
  openingTags: string[];
}

interface ChessPuzzleProps {
  userAccount: string | null;
  onPuzzleComplete?: (puzzle: Puzzle, success: boolean, timeSpent: number) => void;
}

const ChessPuzzle: React.FC<ChessPuzzleProps> = ({ userAccount, onPuzzleComplete }) => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [currentFen, setCurrentFen] = useState<string>('');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState<string>('');
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [puzzleSuccess, setPuzzleSuccess] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string>('intermediate');
  const [theme, setTheme] = useState<string>('');

  // Lichess API key
  const LICHESS_API_KEY = "lip_rzWLlQP0fIoPjvxzsKKO";

  useEffect(() => {
    loadPuzzle();
  }, [difficulty, theme]);

  // Function to replace "api" with the API key in Lichess URLs
  const getModifiedGameUrl = (originalUrl: string): string => {
    if (!originalUrl) return '';
    return originalUrl.replace(/\/api\//, `/${LICHESS_API_KEY}/`);
  };

  const loadPuzzle = async () => {
    setIsLoading(true);
    setError(null);
    setPuzzleComplete(false);
    setCurrentMoveIndex(0);
    setShowHint(false);
    setHint('');

    try {
      const params = new URLSearchParams();
      if (difficulty) params.append('ratingRange', difficulty);
      if (theme) params.append('theme', theme);

      const response = await fetch(`http://localhost:3001/api/puzzles/random?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load puzzle');
      }

      const puzzleData: Puzzle = await response.json();
      console.log('Loaded puzzle:', puzzleData);
      console.log('FEN:', puzzleData.fen);
      
      setPuzzle(puzzleData);
      
      // Validate and load the FEN
      if (!puzzleData.fen) {
        throw new Error('Invalid puzzle: No FEN position provided');
      }
      
      const newChess = new Chess();
      try {
        newChess.load(puzzleData.fen);
        console.log('Chess instance loaded with FEN:', newChess.fen());
        setChess(newChess);
        setStartTime(Date.now());
        setCurrentFen(newChess.fen());
      } catch (fenError) {
        console.error('Error loading FEN:', fenError);
        throw new Error(`Invalid FEN position: ${puzzleData.fen}`);
      }
    } catch (err) {
      console.error('Error loading puzzle:', err);
      setError(err instanceof Error ? err.message : 'Failed to load puzzle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = (sourceSquare: string, targetSquare: string) => {
    if (!chess || !puzzle || puzzleComplete) return;

    const move = `${sourceSquare}${targetSquare}`;
    const expectedMove = puzzle.moves[currentMoveIndex];

    if (move === expectedMove) {
      // Correct move
      const result = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (result) {
        const newChess = new Chess(chess.fen());
        setChess(newChess);
        setCurrentFen(newChess.fen());
        console.log('Move made, new FEN:', newChess.fen());
        setCurrentMoveIndex(prev => prev + 1);

        // Check if puzzle is complete
        if (currentMoveIndex + 1 >= puzzle.moves.length) {
          const finalTimeSpent = Date.now() - startTime;
          setTimeSpent(finalTimeSpent);
          setPuzzleComplete(true);
          setPuzzleSuccess(true);
          
          if (onPuzzleComplete) {
            onPuzzleComplete(puzzle, true, finalTimeSpent);
          }
        }
      }
    } else {
      // Wrong move
      const finalTimeSpent = Date.now() - startTime;
      setTimeSpent(finalTimeSpent);
      setPuzzleComplete(true);
      setPuzzleSuccess(false);
      
      if (onPuzzleComplete) {
        onPuzzleComplete(puzzle, false, finalTimeSpent);
      }
    }
  };

  const getHint = async () => {
    if (!puzzle) return;

    try {
      const response = await fetch(`http://localhost:3001/api/puzzles/hint/${puzzle.id}?moveIndex=${currentMoveIndex}`);
      if (response.ok) {
        const data = await response.json();
        setHint(data.hint);
        setShowHint(true);
      }
    } catch (err) {
      console.error('Failed to get hint:', err);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating < 1000) return '#4CAF50'; // Green for beginner
    if (rating < 1500) return '#2196F3'; // Blue for intermediate
    if (rating < 2000) return '#FF9800'; // Orange for advanced
    if (rating < 2500) return '#F44336'; // Red for expert
    return '#9C27B0'; // Purple for master
  };

  const getRatingLabel = (rating: number) => {
    if (rating < 1000) return 'Beginner';
    if (rating < 1500) return 'Intermediate';
    if (rating < 2000) return 'Advanced';
    if (rating < 2500) return 'Expert';
    return 'Master';
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="chess-puzzle">
        <div className="puzzle-loading">
          <div className="loading-spinner"></div>
          <p>Loading puzzle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chess-puzzle">
        <div className="puzzle-error">
          <p>Error: {error}</p>
          <button onClick={loadPuzzle} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!puzzle || !chess) {
    return (
      <div className="chess-puzzle">
        <div className="puzzle-error">
          <p>No puzzle available</p>
          <button onClick={loadPuzzle} className="retry-btn">Load New Puzzle</button>
        </div>
      </div>
    );
  }

  console.log('Rendering chessboard with FEN:', currentFen);

  return (
    <div className="chess-puzzle">
      <div className="puzzle-header">
        <div className="puzzle-info">
          <h3>Chess Puzzle #{puzzle.id}</h3>
          <div className="puzzle-meta">
            <span 
              className="rating-badge"
              style={{ backgroundColor: getRatingColor(puzzle.rating) }}
            >
              {puzzle.rating} ({getRatingLabel(puzzle.rating)})
            </span>
            <span className="popularity-badge">
              ⭐ {puzzle.popularity}
            </span>
            <span className="plays-badge">
              🎮 {puzzle.nbPlays.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="puzzle-controls">
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="difficulty-select"
          >
            <option value="">Any Difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
            <option value="master">Master</option>
          </select>
          
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="theme-select"
          >
            <option value="">Any Theme</option>
            <option value="crushing">Crushing</option>
            <option value="hangingPiece">Hanging Piece</option>
            <option value="middlegame">Middlegame</option>
            <option value="endgame">Endgame</option>
            <option value="short">Short</option>
            <option value="long">Long</option>
            <option value="advantage">Advantage</option>
          </select>
          
          <button onClick={loadPuzzle} className="new-puzzle-btn">
            🎲 New Puzzle
          </button>
        </div>
      </div>

      <div className="puzzle-board-container">
        <div className="puzzle-board">
          <Chessboard
            position={currentFen}
            onPieceDrop={handleMove}
            boardWidth={400}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
        
        <div className="puzzle-sidebar">
          <div className="puzzle-progress">
            <h4>Progress</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(currentMoveIndex / puzzle.moves.length) * 100}%` }}
              ></div>
            </div>
            <p>Move {currentMoveIndex + 1} of {puzzle.moves.length}</p>
          </div>

          <div className="puzzle-themes">
            <h4>Themes</h4>
            <div className="theme-tags">
              {puzzle.themes.map((theme, index) => (
                <span key={index} className="theme-tag">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          <div className="puzzle-actions">
            <button 
              onClick={getHint} 
              className="hint-btn"
              disabled={showHint}
            >
              💡 Get Hint
            </button>
            
            {showHint && hint && (
              <div className="hint-display">
                <p>{hint}</p>
              </div>
            )}
          </div>

          {puzzleComplete && (
            <div className={`puzzle-result ${puzzleSuccess ? 'success' : 'failure'}`}>
              <h4>{puzzleSuccess ? '🎉 Puzzle Solved!' : '❌ Incorrect Move'}</h4>
              <p>Time: {formatTime(timeSpent)}</p>
              {puzzleSuccess && (
                <div className="success-details">
                  <p>Rating: +{Math.max(1, Math.floor(puzzle.rating / 100))}</p>
                  <p>Great job! You found the solution.</p>
                </div>
              )}
              {!puzzleSuccess && (
                <div className="failure-details">
                  <p>The correct move was: {puzzle.moves[currentMoveIndex]}</p>
                  <p>Keep practicing!</p>
                </div>
              )}
              <button onClick={loadPuzzle} className="next-puzzle-btn">
                Next Puzzle
              </button>
            </div>
          )}
        </div>
      </div>

      {puzzle.gameUrl && (
        <div className="puzzle-source">
          <a href={getModifiedGameUrl(puzzle.gameUrl)} target="_blank" rel="noopener noreferrer">
            View Original Game
          </a>
        </div>
      )}
    </div>
  );
};

export default ChessPuzzle; 