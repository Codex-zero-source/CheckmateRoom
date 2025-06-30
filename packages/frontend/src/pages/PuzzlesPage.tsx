import React, { useState, useEffect } from 'react';
import ChessPuzzle from '../components/ChessPuzzle';
import './PuzzlesPage.css';

interface PuzzleStats {
    total: number;
    byRating: { [key: string]: number };
    byTheme: { [key: string]: number };
    averageRating: number;
    mostPopularThemes: Array<{ theme: string; count: number }>;
}

const PuzzlesPage: React.FC = () => {
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('intermediate');
    const [showPuzzle, setShowPuzzle] = useState<boolean>(false);
    const [puzzleStats, setPuzzleStats] = useState<PuzzleStats | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [animateStats, setAnimateStats] = useState<boolean>(false);

    const difficulties = [
        { 
            id: 'beginner', 
            name: 'Beginner', 
            rating: '1000-1500', 
            color: '#4CAF50',
            icon: '🌱',
            description: 'Perfect for learning the basics'
        },
        { 
            id: 'intermediate', 
            name: 'Intermediate', 
            rating: '1500-2000', 
            color: '#FF9800',
            icon: '⚡',
            description: 'Challenge your tactical skills'
        },
        { 
            id: 'advanced', 
            name: 'Advanced', 
            rating: '2000-2500', 
            color: '#F44336',
            icon: '🔥',
            description: 'For experienced players'
        },
        { 
            id: 'expert', 
            name: 'Expert', 
            rating: '2500-3000', 
            color: '#9C27B0',
            icon: '👑',
            description: 'Master-level challenges'
        },
        { 
            id: 'master', 
            name: 'Master', 
            rating: '3000+', 
            color: '#FFD700',
            icon: '💎',
            description: 'Ultimate chess mastery'
        }
    ];

    useEffect(() => {
        fetchPuzzleStats();
        // Trigger animation after component mounts
        setTimeout(() => setAnimateStats(true), 500);
    }, []);

    const fetchPuzzleStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/puzzles/stats');
            if (response.ok) {
                const stats = await response.json();
                setPuzzleStats(stats);
            }
        } catch (error) {
            console.error('Failed to fetch puzzle stats:', error);
        }
    };

    const startPuzzle = (difficulty: string) => {
        setSelectedDifficulty(difficulty);
        setIsLoading(true);
        // Add a small delay for smooth transition
        setTimeout(() => {
            setShowPuzzle(true);
            setIsLoading(false);
        }, 300);
    };

    const handlePuzzleComplete = () => {
        setShowPuzzle(false);
        setIsLoading(false);
    };

    const handleBackToSelection = () => {
        setShowPuzzle(false);
        setIsLoading(false);
    };

    if (showPuzzle) {
        return (
            <div className="puzzles-page puzzle-active">
                <div className="puzzle-container">
                    <div className="puzzle-header">
                        <button 
                            className="back-button"
                            onClick={handleBackToSelection}
                        >
                            <span className="back-icon">←</span>
                            <span>Back to Selection</span>
                        </button>
                        <div className="puzzle-title">
                            <h2>Chess Puzzle</h2>
                            <div className="puzzle-info">
                                <span className="difficulty-badge" style={{ 
                                    backgroundColor: difficulties.find(d => d.id === selectedDifficulty)?.color 
                                }}>
                                    {difficulties.find(d => d.id === selectedDifficulty)?.icon}
                                    {difficulties.find(d => d.id === selectedDifficulty)?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <ChessPuzzle 
                        userAccount={null}
                        onPuzzleComplete={(puzzle, success, timeSpent) => {
                            console.log('Puzzle completed:', { puzzle, success, timeSpent });
                            handlePuzzleComplete();
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="puzzles-page">
            <div className="puzzles-container">
                <div className="puzzles-header">
                    <div className="header-content">
                        <h1 className="main-title">
                            <span className="title-icon">🧩</span>
                            Chess Puzzles
                        </h1>
                        <p className="subtitle">Sharpen your tactical skills with challenging chess puzzles</p>
                        <div className="header-decoration"></div>
                    </div>
                </div>

                <div className="puzzle-selection">
                    <div className="selection-section">
                        <h3 className="section-title">
                            <span className="section-icon">🎯</span>
                            Choose Your Challenge
                        </h3>
                        <div className="difficulty-grid">
                            {difficulties.map((difficulty, index) => (
                                <button
                                    key={difficulty.id}
                                    className={`difficulty-card ${isLoading ? 'loading' : ''}`}
                                    onClick={() => startPuzzle(difficulty.id)}
                                    disabled={isLoading}
                                    style={{ 
                                        borderColor: difficulty.color,
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    <div className="difficulty-icon">{difficulty.icon}</div>
                                    <div className="difficulty-content">
                                        <div className="difficulty-name">{difficulty.name}</div>
                                        <div className="difficulty-rating">{difficulty.rating}</div>
                                        <div className="difficulty-description">{difficulty.description}</div>
                                        {puzzleStats && (
                                            <div className="difficulty-count">
                                                {puzzleStats.byRating[difficulty.id]?.toLocaleString() || 0} puzzles available
                                            </div>
                                        )}
                                    </div>
                                    <div className="start-indicator">
                                        {isLoading ? (
                                            <span className="loading-spinner"></span>
                                        ) : (
                                            <span className="play-icon">▶</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {puzzleStats && (
                    <div className={`puzzle-stats ${animateStats ? 'animate' : ''}`}>
                        <h3 className="stats-title">
                            <span className="stats-icon">📊</span>
                            Puzzle Database
                        </h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">🧩</div>
                                <div className="stat-number">{puzzleStats.total.toLocaleString()}</div>
                                <div className="stat-label">Total Puzzles</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⭐</div>
                                <div className="stat-number">{puzzleStats.averageRating}</div>
                                <div className="stat-label">Average Rating</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🎨</div>
                                <div className="stat-number">{puzzleStats.mostPopularThemes.length}</div>
                                <div className="stat-label">Themes Available</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PuzzlesPage; 