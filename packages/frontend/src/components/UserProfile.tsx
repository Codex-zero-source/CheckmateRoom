import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './UserProfile.css';

interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  averageBet: number;
  biggestWin: number;
  currentStreak: number;
  longestStreak: number;
  eloRating: number;
  gamesPlayed: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  reward?: number;
}

interface UserProfileProps {
  userAccount: string | null;
  tokenBalance: string | null;
  chessGameContract: any;
}

const UserProfile: React.FC<UserProfileProps> = ({ userAccount, tokenBalance, chessGameContract }) => {
  const [stats, setStats] = useState<UserStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    averageBet: 0,
    biggestWin: 0,
    currentStreak: 0,
    longestStreak: 0,
    eloRating: 1200,
    gamesPlayed: 0
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-win',
      name: 'First Victory',
      description: 'Win your first chess game',
      icon: '🏆',
      unlocked: false,
      reward: 10
    },
    {
      id: 'winning-streak-3',
      name: 'Hot Streak',
      description: 'Win 3 games in a row',
      icon: '🔥',
      unlocked: false,
      progress: 0,
      maxProgress: 3,
      reward: 25
    },
    {
      id: 'winning-streak-5',
      name: 'Unstoppable',
      description: 'Win 5 games in a row',
      icon: '⚡',
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      reward: 50
    },
    {
      id: 'big-bet',
      name: 'High Roller',
      description: 'Place a bet of 100 MAG or more',
      icon: '💰',
      unlocked: false,
      reward: 100
    },
    {
      id: 'games-10',
      name: 'Veteran Player',
      description: 'Play 10 games',
      icon: '🎯',
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      reward: 30
    },
    {
      id: 'games-50',
      name: 'Chess Master',
      description: 'Play 50 games',
      icon: '👑',
      unlocked: false,
      progress: 0,
      maxProgress: 50,
      reward: 150
    },
    {
      id: 'win-rate-70',
      name: 'Elite Player',
      description: 'Achieve a 70% win rate (minimum 10 games)',
      icon: '💎',
      unlocked: false,
      reward: 200
    },
    {
      id: 'perfect-game',
      name: 'Perfect Game',
      description: 'Win a game without losing any pieces',
      icon: '✨',
      unlocked: false,
      reward: 75
    },
    {
      id: 'comeback-king',
      name: 'Comeback King',
      description: 'Win a game after being down 2+ pieces',
      icon: '🔄',
      unlocked: false,
      reward: 100
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Win a game in under 10 moves',
      icon: '⚡',
      unlocked: false,
      reward: 50
    }
  ]);

  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userAccount) {
      loadUserData();
    }
  }, [userAccount]);

  const loadUserData = async () => {
    if (!userAccount) return;

    setLoading(true);
    try {
      // Simulate loading user data
      // In a real implementation, this would query the blockchain and backend
      const mockStats: UserStats = {
        totalGames: 15,
        wins: 9,
        losses: 4,
        draws: 2,
        winRate: 60,
        totalWagered: 250,
        totalWon: 180,
        totalLost: 70,
        averageBet: 16.67,
        biggestWin: 50,
        currentStreak: 2,
        longestStreak: 4,
        eloRating: 1350,
        gamesPlayed: 15
      };

      setStats(mockStats);
      checkAchievements(mockStats);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = (userStats: UserStats) => {
    const updatedAchievements = achievements.map(achievement => {
      let unlocked = false;
      let progress = achievement.progress || 0;

      switch (achievement.id) {
        case 'first-win':
          unlocked = userStats.wins > 0;
          break;
        case 'winning-streak-3':
          progress = Math.min(userStats.currentStreak, 3);
          unlocked = userStats.currentStreak >= 3;
          break;
        case 'winning-streak-5':
          progress = Math.min(userStats.currentStreak, 5);
          unlocked = userStats.currentStreak >= 5;
          break;
        case 'big-bet':
          unlocked = userStats.biggestWin >= 100;
          break;
        case 'games-10':
          progress = Math.min(userStats.gamesPlayed, 10);
          unlocked = userStats.gamesPlayed >= 10;
          break;
        case 'games-50':
          progress = Math.min(userStats.gamesPlayed, 50);
          unlocked = userStats.gamesPlayed >= 50;
          break;
        case 'win-rate-70':
          unlocked = userStats.winRate >= 70 && userStats.gamesPlayed >= 10;
          break;
        case 'perfect-game':
          // This would need to be tracked during gameplay
          unlocked = false;
          break;
        case 'comeback-king':
          // This would need to be tracked during gameplay
          unlocked = false;
          break;
        case 'speed-demon':
          // This would need to be tracked during gameplay
          unlocked = false;
          break;
      }

      return {
        ...achievement,
        unlocked,
        progress,
        unlockedAt: unlocked && !achievement.unlockedAt ? Date.now() : achievement.unlockedAt
      };
    });

    setAchievements(updatedAchievements);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankTitle = (elo: number) => {
    if (elo >= 2000) return 'Grandmaster';
    if (elo >= 1800) return 'International Master';
    if (elo >= 1600) return 'FIDE Master';
    if (elo >= 1400) return 'Candidate Master';
    if (elo >= 1200) return 'Class A';
    if (elo >= 1000) return 'Class B';
    if (elo >= 800) return 'Class C';
    return 'Beginner';
  };

  const getRankColor = (elo: number) => {
    if (elo >= 2000) return '#FFD700'; // Gold
    if (elo >= 1800) return '#C0C0C0'; // Silver
    if (elo >= 1600) return '#CD7F32'; // Bronze
    if (elo >= 1400) return '#FF6B6B'; // Red
    if (elo >= 1200) return '#4ECDC4'; // Teal
    if (elo >= 1000) return '#45B7D1'; // Blue
    if (elo >= 800) return '#96CEB4'; // Green
    return '#DDA0DD'; // Plum
  };

  if (!userAccount) {
    return (
      <div className="user-profile">
        <div className="no-wallet-message">
          <p>Connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {userAccount.slice(2, 4).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <h2>{formatAddress(userAccount)}</h2>
          <div className="rank-info">
            <span 
              className="rank-title"
              style={{ color: getRankColor(stats.eloRating) }}
            >
              {getRankTitle(stats.eloRating)}
            </span>
            <span className="elo-rating">({stats.eloRating} ELO)</span>
          </div>
          <div className="token-balance">
            <span className="balance-label">Balance:</span>
            <span className="balance-amount">{Number(tokenBalance || '0').toFixed(2)} MAG</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading ? (
          <div className="loading">Loading profile data...</div>
        ) : (
          <>
            {activeTab === 'stats' && (
              <div className="stats-content">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">🎮</div>
                    <div className="stat-value">{stats.totalGames}</div>
                    <div className="stat-label">Total Games</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{stats.wins}</div>
                    <div className="stat-label">Wins</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💔</div>
                    <div className="stat-value">{stats.losses}</div>
                    <div className="stat-label">Losses</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🤝</div>
                    <div className="stat-value">{stats.draws}</div>
                    <div className="stat-label">Draws</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-value">{stats.winRate}%</div>
                    <div className="stat-label">Win Rate</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-value">{stats.currentStreak}</div>
                    <div className="stat-label">Current Streak</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">{stats.totalWagered.toFixed(1)}</div>
                    <div className="stat-label">Total Wagered</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💎</div>
                    <div className="stat-value">{stats.totalWon.toFixed(1)}</div>
                    <div className="stat-label">Total Won</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="achievements-content">
                <div className="achievements-grid">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-info">
                        <h4>{achievement.name}</h4>
                        <p>{achievement.description}</p>
                        {achievement.maxProgress && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${(achievement.progress || 0) / achievement.maxProgress * 100}%` }}
                            ></div>
                            <span className="progress-text">
                              {achievement.progress || 0}/{achievement.maxProgress}
                            </span>
                          </div>
                        )}
                        {achievement.unlocked && achievement.reward && (
                          <div className="achievement-reward">
                            +{achievement.reward} MAG
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-content">
                <p>Game history will be displayed here. This would show recent games with results, opponents, and bet amounts.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 