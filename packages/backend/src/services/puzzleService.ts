import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

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

interface PuzzleOptions {
    ratingRange?: string;
    minRating?: number;
    maxRating?: number;
    theme?: string;
    minPopularity?: number;
}

interface PuzzleStats {
    total: number;
    byRating: { [key: string]: number };
    byTheme: { [key: string]: number };
    averageRating: number;
    mostPopularThemes: Array<{ theme: string; count: number }>;
}

class PuzzleService {
    private puzzles: Puzzle[] = [];
    private puzzlesByRating: Map<string, Puzzle[]> = new Map();
    private puzzlesByTheme: Map<string, Puzzle[]> = new Map();
    private loaded: boolean = false;

    constructor() {
        this.loadPuzzles();
    }

    async loadPuzzles(): Promise<void> {
        try {
            console.log('Loading puzzle database...');
            const csvPath = path.join(__dirname, '../../../lichess_db_puzzle.csv');
            
            return new Promise((resolve, reject) => {
                fs.createReadStream(csvPath)
                    .pipe(csv())
                    .on('data', (row: any) => {
                        const puzzle = this.parsePuzzleRow(row);
                        this.puzzles.push(puzzle);
                        
                        // Index by rating range
                        const ratingRange = this.getRatingRange(puzzle.rating);
                        if (!this.puzzlesByRating.has(ratingRange)) {
                            this.puzzlesByRating.set(ratingRange, []);
                        }
                        this.puzzlesByRating.get(ratingRange)!.push(puzzle);
                        
                        // Index by theme
                        if (puzzle.themes) {
                            puzzle.themes.forEach(theme => {
                                if (!this.puzzlesByTheme.has(theme)) {
                                    this.puzzlesByTheme.set(theme, []);
                                }
                                this.puzzlesByTheme.get(theme)!.push(puzzle);
                            });
                        }
                    })
                    .on('end', () => {
                        console.log(`Loaded ${this.puzzles.length} puzzles`);
                        this.loaded = true;
                        resolve();
                    })
                    .on('error', (error) => {
                        console.error('Error loading puzzles:', error);
                        reject(error);
                    });
            });
        } catch (error) {
            console.error('Error loading puzzle database:', error);
            this.loaded = false;
        }
    }

    private parsePuzzleRow(row: any): Puzzle {
        return {
            id: row.PuzzleId,
            fen: row.FEN,
            moves: row.Moves.split(' '),
            rating: parseInt(row.Rating) || 1500,
            ratingDeviation: parseInt(row.RatingDeviation) || 100,
            popularity: parseInt(row.Popularity) || 0,
            nbPlays: parseInt(row.NbPlays) || 0,
            themes: row.Themes ? row.Themes.split(' ') : [],
            gameUrl: row.GameUrl || '',
            openingTags: row.OpeningTags ? row.OpeningTags.split(' ') : []
        };
    }

    private getRatingRange(rating: number): string {
        if (rating < 1000) return 'beginner';
        if (rating < 1500) return 'intermediate';
        if (rating < 2000) return 'advanced';
        if (rating < 2500) return 'expert';
        return 'master';
    }

    getRandomPuzzle(options: PuzzleOptions = {}): Puzzle {
        if (!this.loaded) {
            throw new Error('Puzzle database not loaded');
        }

        let filteredPuzzles = this.puzzles;

        // Filter by rating range
        if (options.ratingRange) {
            filteredPuzzles = filteredPuzzles.filter(p => 
                this.getRatingRange(p.rating) === options.ratingRange
            );
        }

        // Filter by rating range (numeric)
        if (options.minRating !== undefined) {
            filteredPuzzles = filteredPuzzles.filter(p => p.rating >= options.minRating!);
        }
        if (options.maxRating !== undefined) {
            filteredPuzzles = filteredPuzzles.filter(p => p.rating <= options.maxRating!);
        }

        // Filter by theme
        if (options.theme) {
            filteredPuzzles = filteredPuzzles.filter(p => 
                p.themes.includes(options.theme!)
            );
        }

        // Filter by popularity
        if (options.minPopularity !== undefined) {
            filteredPuzzles = filteredPuzzles.filter(p => p.popularity >= options.minPopularity!);
        }

        if (filteredPuzzles.length === 0) {
            throw new Error('No puzzles match the specified criteria');
        }

        // Weight by popularity for better puzzles
        const weightedPuzzles = filteredPuzzles.map(puzzle => ({
            ...puzzle,
            weight: Math.log(puzzle.popularity + 1) * Math.log(puzzle.nbPlays + 1)
        }));

        // Select random puzzle with weight
        const totalWeight = weightedPuzzles.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const puzzle of weightedPuzzles) {
            random -= puzzle.weight;
            if (random <= 0) {
                return puzzle;
            }
        }

        return weightedPuzzles[0];
    }

    getPuzzleById(id: string): Puzzle | undefined {
        return this.puzzles.find(p => p.id === id);
    }

    getPuzzlesByTheme(theme: string, limit: number = 10): Puzzle[] {
        const themePuzzles = this.puzzlesByTheme.get(theme) || [];
        return themePuzzles.slice(0, limit);
    }

    getPuzzlesByRatingRange(ratingRange: string, limit: number = 10): Puzzle[] {
        const rangePuzzles = this.puzzlesByRating.get(ratingRange) || [];
        return rangePuzzles.slice(0, limit);
    }

    validateMove(puzzle: Puzzle, move: string): boolean {
        const expectedMoves = puzzle.moves;
        return expectedMoves.includes(move);
    }

    getNextMove(puzzle: Puzzle, currentMoveIndex: number): string | null {
        if (currentMoveIndex >= puzzle.moves.length) {
            return null; // Puzzle completed
        }
        return puzzle.moves[currentMoveIndex];
    }

    getPuzzleStats(): PuzzleStats {
        const stats: PuzzleStats = {
            total: this.puzzles.length,
            byRating: {},
            byTheme: {},
            averageRating: 0,
            mostPopularThemes: []
        };

        // Calculate average rating
        const totalRating = this.puzzles.reduce((sum, p) => sum + p.rating, 0);
        stats.averageRating = Math.round(totalRating / this.puzzles.length);

        // Count by rating range
        for (const [range, puzzles] of this.puzzlesByRating) {
            stats.byRating[range] = puzzles.length;
        }

        // Count by theme
        for (const [theme, puzzles] of this.puzzlesByTheme) {
            stats.byTheme[theme] = puzzles.length;
        }

        // Get most popular themes
        const themeCounts = Object.entries(stats.byTheme)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([theme, count]) => ({ theme, count }));

        stats.mostPopularThemes = themeCounts;

        return stats;
    }

    getDailyPuzzle(): Puzzle {
        // Use date as seed for consistent daily puzzle
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        // Simple seeded random selection
        const index = seed % this.puzzles.length;
        return this.puzzles[index];
    }

    getPuzzleHint(puzzle: Puzzle, currentMoveIndex: number): string {
        if (currentMoveIndex >= puzzle.moves.length) {
            return "Puzzle completed!";
        }

        const nextMove = puzzle.moves[currentMoveIndex];
        const hints = [
            "Look for tactical opportunities",
            "Consider piece coordination",
            "Check for forcing moves",
            "Look for discovered attacks",
            "Consider sacrifices",
            "Look for back rank weaknesses",
            "Check for pinning opportunities",
            "Consider the king's safety"
        ];

        return hints[currentMoveIndex % hints.length];
    }

    getPuzzleCommentary(puzzle: Puzzle, moveIndex: number): string {
        if (moveIndex >= puzzle.moves.length) {
            return "Excellent! You've solved the puzzle.";
        }

        const commentaries = [
            "A strong move that maintains the initiative.",
            "This move creates tactical opportunities.",
            "Well played! You're on the right track.",
            "Good tactical awareness shown here.",
            "This move sets up a winning combination.",
            "Excellent calculation and execution.",
            "You're demonstrating strong chess understanding.",
            "This move leads to a decisive advantage."
        ];

        return commentaries[moveIndex % commentaries.length];
    }

    isLoaded(): boolean {
        return this.loaded;
    }
}

export default new PuzzleService(); 