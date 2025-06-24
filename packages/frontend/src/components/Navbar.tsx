import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: FC = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLink to="/">ChessXCrypto</NavLink>
            </div>
            <div className="navbar-links">
                <NavLink to="/play">Play</NavLink>
                <NavLink to="/puzzles">Puzzles</NavLink>
                <NavLink to="/study">Study</NavLink>
            </div>
        </nav>
    );
}

export default Navbar; 