import type { FC } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const LinkComponent: FC<any> = Link as any;

const HomePage: FC = () => {
    return (
        <div className="homepage">
            <div className="hero-section">
                <h1 className="glitch" data-text="ChessXCrypto">ChessXCrypto</h1>
                <p className="subtitle">The Decentralized Chess Universe. Play. Earn. Conquer.</p>
                <LinkComponent to="/play" className="cta-button">Enter the Arena</LinkComponent>
            </div>
            <div className="features-section">
                <div className="feature">
                    <h3>Play-to-Earn</h3>
                    <p>Win matches against players or AI to earn $MAG tokens.</p>
                </div>
                <div className="feature">
                    <h3>Solve Puzzles</h3>
                    <p>Sharpen your skills and get rewarded for solving chess puzzles.</p>
                </div>
                <div className="feature">
                    <h3>Community Driven</h3>
                    <p>Engage with a vibrant community of chess lovers.</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage; 