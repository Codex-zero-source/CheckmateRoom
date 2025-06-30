import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './HomePage.css';

const LinkComponent: FC<any> = Link as any;

const HomePage: FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeFeature, setActiveFeature] = useState<number | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        {
            id: 1,
            title: "Play-to-Earn",
            description: "Win matches against players or AI to earn $MAG tokens.",
            icon: "♟️",
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        },
        {
            id: 2,
            title: "Solve Puzzles",
            description: "Sharpen your skills and get rewarded for solving chess puzzles.",
            icon: "🧩",
            color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        },
        {
            id: 3,
            title: "Community Driven",
            description: "Engage with a vibrant community of chess lovers.",
            icon: "👥",
            color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        }
    ];

    return (
        <div className={`homepage ${isVisible ? 'visible' : ''}`}>
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="glitch" data-text="Checkmate Room">Checkmate Room</h1>
                    <p className="subtitle">The Decentralized Chess Universe. Play. Earn. Conquer.</p>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">10K+</span>
                            <span className="stat-label">Players</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">$2M+</span>
                            <span className="stat-label">Prize Pool</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">50K+</span>
                            <span className="stat-label">Games Played</span>
                        </div>
                    </div>
                    <LinkComponent to="/play" className="cta-button">
                        <span className="cta-text">Enter the Arena</span>
                        <span className="cta-icon">⚔️</span>
                    </LinkComponent>
                </div>
                <div className="hero-visual">
                    <div className="floating-chess-pieces">
                        <div className="piece" style={{ animationDelay: '0s' }}>♔</div>
                        <div className="piece" style={{ animationDelay: '1s' }}>♕</div>
                        <div className="piece" style={{ animationDelay: '2s' }}>♖</div>
                        <div className="piece" style={{ animationDelay: '3s' }}>♗</div>
                        <div className="piece" style={{ animationDelay: '4s' }}>♘</div>
                        <div className="piece" style={{ animationDelay: '5s' }}>♙</div>
                    </div>
                </div>
            </div>
            
            <div className="features-section">
                {features.map((feature, index) => (
                    <div 
                        key={feature.id}
                        className={`feature-card ${activeFeature === feature.id ? 'active' : ''}`}
                        style={{ 
                            background: feature.color,
                            animationDelay: `${index * 0.2}s`
                        }}
                        onMouseEnter={() => setActiveFeature(feature.id)}
                        onMouseLeave={() => setActiveFeature(null)}
                    >
                        <div className="feature-icon">{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                        <div className="feature-glow"></div>
                    </div>
                ))}
            </div>

            <div className="cta-section">
                <div className="cta-card">
                    <h2>Ready to Start Your Journey?</h2>
                    <p>Join thousands of players in the ultimate chess experience</p>
                    <div className="cta-buttons">
                        <LinkComponent to="/play" className="primary-btn">
                            Start Playing
                        </LinkComponent>
                        <LinkComponent to="/puzzles" className="secondary-btn">
                            Try Puzzles
                        </LinkComponent>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage; 