import React, { useState, useEffect } from 'react';
import BettingHistory from '../components/BettingHistory';
import './HistoryPage.css';

interface HistoryPageProps {
  userAccount: string | null;
  chessGameContract: any;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ userAccount, chessGameContract }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const tabs = [
    { id: 'history', label: 'Betting History', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' }
  ];

  return (
    <div className={`history-page ${isVisible ? 'visible' : ''}`}>
      <div className="history-container">
        <div className="history-header">
          <div className="header-content">
            <h1 className="page-title">Betting History & Analytics</h1>
            <p className="page-subtitle">Track your betting performance and analyze your chess game results</p>
            <div className="header-stats">
              <div className="stat-card">
                <span className="stat-icon">💰</span>
                <div className="stat-info">
                  <span className="stat-value">$2,450</span>
                  <span className="stat-label">Total Winnings</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎯</span>
                <div className="stat-info">
                  <span className="stat-value">68%</span>
                  <span className="stat-label">Win Rate</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⚡</span>
                <div className="stat-info">
                  <span className="stat-value">127</span>
                  <span className="stat-label">Games Played</span>
                </div>
              </div>
            </div>
          </div>
          <div className="header-visual">
            <div className="floating-chart">
              <div className="chart-bar" style={{ height: '60%', animationDelay: '0s' }}></div>
              <div className="chart-bar" style={{ height: '80%', animationDelay: '0.2s' }}></div>
              <div className="chart-bar" style={{ height: '45%', animationDelay: '0.4s' }}></div>
              <div className="chart-bar" style={{ height: '90%', animationDelay: '0.6s' }}></div>
              <div className="chart-bar" style={{ height: '70%', animationDelay: '0.8s' }}></div>
              <div className="chart-bar" style={{ height: '85%', animationDelay: '1s' }}></div>
              <div className="chart-bar" style={{ height: '55%', animationDelay: '1.2s' }}></div>
            </div>
          </div>
        </div>

        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'history' && (
            <div className="content-section">
              <BettingHistory 
                userAccount={userAccount}
                chessGameContract={chessGameContract}
              />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="content-section">
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Performance Trends</h3>
                  <div className="trend-chart">
                    <div className="trend-line"></div>
                    <div className="trend-points">
                      <div className="point" style={{ left: '10%', bottom: '20%' }}></div>
                      <div className="point" style={{ left: '30%', bottom: '40%' }}></div>
                      <div className="point" style={{ left: '50%', bottom: '60%' }}></div>
                      <div className="point" style={{ left: '70%', bottom: '80%' }}></div>
                      <div className="point" style={{ left: '90%', bottom: '90%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>Betting Distribution</h3>
                  <div className="pie-chart">
                    <div className="pie-segment" style={{ transform: 'rotate(0deg)', background: 'conic-gradient(from 0deg, #00ff95 0deg, #00ff95 120deg, transparent 120deg)' }}></div>
                    <div className="pie-segment" style={{ transform: 'rotate(120deg)', background: 'conic-gradient(from 120deg, #ff6b6b 120deg, #ff6b6b 240deg, transparent 240deg)' }}></div>
                    <div className="pie-segment" style={{ transform: 'rotate(240deg)', background: 'conic-gradient(from 240deg, #4ecdc4 240deg, #4ecdc4 360deg, transparent 360deg)' }}></div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>Monthly Summary</h3>
                  <div className="summary-stats">
                    <div className="summary-item">
                      <span className="summary-label">Best Month</span>
                      <span className="summary-value">March 2024</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Average Bet</span>
                      <span className="summary-value">$45.20</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Longest Streak</span>
                      <span className="summary-value">8 Wins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="content-section">
              <div className="achievements-grid">
                <div className="achievement-card unlocked">
                  <div className="achievement-icon">🥇</div>
                  <h4>First Victory</h4>
                  <p>Win your first chess game</p>
                  <div className="achievement-progress">
                    <div className="progress-bar" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div className="achievement-card unlocked">
                  <div className="achievement-icon">💰</div>
                  <h4>High Roller</h4>
                  <p>Place a bet of $100 or more</p>
                  <div className="achievement-progress">
                    <div className="progress-bar" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div className="achievement-card locked">
                  <div className="achievement-icon">🔥</div>
                  <h4>Win Streak</h4>
                  <p>Win 10 games in a row</p>
                  <div className="achievement-progress">
                    <div className="progress-bar" style={{ width: '60%' }}></div>
                    <span className="progress-text">6/10</span>
                  </div>
                </div>
                
                <div className="achievement-card locked">
                  <div className="achievement-icon">🎯</div>
                  <h4>Sharpshooter</h4>
                  <p>Achieve 80% win rate</p>
                  <div className="achievement-progress">
                    <div className="progress-bar" style={{ width: '68%' }}></div>
                    <span className="progress-text">68%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage; 