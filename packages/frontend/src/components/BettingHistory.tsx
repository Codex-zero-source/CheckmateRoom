import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './BettingHistory.css';

interface BettingRecord {
  gameId: string;
  amount: number;
  color: 'white' | 'black';
  result: 'win' | 'loss' | 'draw' | 'pending';
  timestamp: number;
  opponent: string;
  pgn?: string;
}

interface BettingStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  winRate: number;
  averageBet: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number;
}

interface BettingHistoryProps {
  userAccount: string | null;
  chessGameContract: any;
}

const BettingHistory: React.FC<BettingHistoryProps> = ({ userAccount, chessGameContract }) => {
  const [bettingHistory, setBettingHistory] = useState<BettingRecord[]>([]);
  const [stats, setStats] = useState<BettingStats>({
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    averageBet: 0,
    biggestWin: 0,
    biggestLoss: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'draws'>('all');

  useEffect(() => {
    if (userAccount && chessGameContract) {
      loadBettingHistory();
    }
  }, [userAccount, chessGameContract]);

  const loadBettingHistory = async () => {
    if (!userAccount || !chessGameContract) return;

    setLoading(true);
    try {
      // For now, we'll simulate betting history
      // In a real implementation, this would query the blockchain for events
      const mockHistory: BettingRecord[] = [
        {
          gameId: '12345',
          amount: ethers.parseEther('10'),
          color: 'white',
          result: 'win',
          timestamp: Date.now() - 86400000, // 1 day ago
          opponent: '0x1234...5678',
          pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7'
        },
        {
          gameId: '12346',
          amount: ethers.parseEther('25'),
          color: 'black',
          result: 'loss',
          timestamp: Date.now() - 172800000, // 2 days ago
          opponent: '0x8765...4321',
          pgn: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4'
        },
        {
          gameId: '12347',
          amount: ethers.parseEther('15'),
          color: 'white',
          result: 'draw',
          timestamp: Date.now() - 259200000, // 3 days ago
          opponent: '0x9999...8888',
          pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O'
        }
      ];

      setBettingHistory(mockHistory);
      calculateStats(mockHistory);
    } catch (error) {
      console.error('Error loading betting history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (history: BettingRecord[]) => {
    const totalBets = history.length;
    const totalWagered = history.reduce((sum, bet) => sum + Number(ethers.formatEther(bet.amount)), 0);
    
    const wins = history.filter(bet => bet.result === 'win');
    const losses = history.filter(bet => bet.result === 'loss');
    const draws = history.filter(bet => bet.result === 'draw');
    
    const totalWon = wins.reduce((sum, bet) => sum + Number(ethers.formatEther(bet.amount)) * 2, 0); // Winner gets both bets
    const totalLost = losses.reduce((sum, bet) => sum + Number(ethers.formatEther(bet.amount)), 0);
    
    const winRate = totalBets > 0 ? (wins.length / totalBets) * 100 : 0;
    const averageBet = totalBets > 0 ? totalWagered / totalBets : 0;
    
    const biggestWin = wins.length > 0 ? Math.max(...wins.map(bet => Number(ethers.formatEther(bet.amount)) * 2)) : 0;
    const biggestLoss = losses.length > 0 ? Math.max(...losses.map(bet => Number(ethers.formatEther(bet.amount)))) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].result === 'win') {
        currentStreak++;
      } else if (history[i].result === 'loss') {
        currentStreak = 0;
        break;
      } else {
        break; // Draw breaks the streak
      }
    }

    setStats({
      totalBets,
      totalWagered,
      totalWon,
      totalLost,
      winRate,
      averageBet,
      biggestWin,
      biggestLoss,
      currentStreak
    });
  };

  const filteredHistory = bettingHistory.filter(bet => {
    if (filter === 'all') return true;
    return bet.result === filter;
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'win': return '🏆';
      case 'loss': return '💔';
      case 'draw': return '🤝';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'win';
      case 'loss': return 'loss';
      case 'draw': return 'draw';
      case 'pending': return 'pending';
      default: return '';
    }
  };

  if (!userAccount) {
    return (
      <div className="betting-history">
        <div className="no-wallet-message">
          <p>Connect your wallet to view betting history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="betting-history">
      <h2>Betting History & Analytics</h2>
      
      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-value">{stats.totalBets}</div>
          <div className="stat-label">Total Bets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.winRate.toFixed(1)}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalWagered.toFixed(2)} MAG</div>
          <div className="stat-label">Total Wagered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalWon.toFixed(2)} MAG</div>
          <div className="stat-label">Total Won</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Win Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.averageBet.toFixed(2)} MAG</div>
          <div className="stat-label">Avg Bet</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({bettingHistory.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'wins' ? 'active' : ''}`}
          onClick={() => setFilter('wins')}
        >
          Wins ({bettingHistory.filter(b => b.result === 'win').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'losses' ? 'active' : ''}`}
          onClick={() => setFilter('losses')}
        >
          Losses ({bettingHistory.filter(b => b.result === 'loss').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'draws' ? 'active' : ''}`}
          onClick={() => setFilter('draws')}
        >
          Draws ({bettingHistory.filter(b => b.result === 'draw').length})
        </button>
      </div>

      {/* Betting History Table */}
      <div className="history-table-container">
        {loading ? (
          <div className="loading">Loading betting history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="no-history">
            <p>No betting history found</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Game ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Color</th>
                <th>Opponent</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((bet) => (
                <tr key={bet.gameId} className={getResultColor(bet.result)}>
                  <td>#{bet.gameId}</td>
                  <td>{formatDate(bet.timestamp)}</td>
                  <td>{ethers.formatEther(bet.amount)} MAG</td>
                  <td>
                    <span className={`color-indicator ${bet.color}`}>
                      {bet.color === 'white' ? '⚪' : '⚫'} {bet.color}
                    </span>
                  </td>
                  <td>{formatAddress(bet.opponent)}</td>
                  <td>
                    <span className={`result-badge ${bet.result}`}>
                      {getResultIcon(bet.result)} {bet.result.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {bet.pgn && (
                      <button 
                        className="view-game-btn"
                        onClick={() => window.open(`/analysis/${bet.gameId}`, '_blank')}
                      >
                        View Game
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BettingHistory; 