import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';
import './Navbar.css';

interface NavbarProps {
    isConnected: boolean;
    userAddress: string | null;
    username: string | null;
}

// Cast NavLink to a compatible type for React Router v7
const NavLinkComponent = NavLink as any;

const Navbar = ({ isConnected, userAddress, username }: NavbarProps) => {
    const location = useLocation();
    const navigate = useNavigate();

    const getLinkClass = (path: string) => {
        return location.pathname === path ? 'navbar-link active' : 'navbar-link';
    };

    const handleDisconnect = async () => {
        try {
            // Clear wallet connection by refreshing the page
            // This is a simple approach since Web3Modal doesn't expose a direct disconnect method
            localStorage.removeItem('wagmi.wallet');
            localStorage.removeItem('wagmi.connected');
            localStorage.removeItem('wagmi.account');
            localStorage.removeItem('wagmi.chainId');
            
            // Redirect to home page after disconnect
            if (location.pathname === '/admin') {
                navigate('/');
            }
            
            // Refresh the page to reset the wallet state
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLinkComponent to="/" className="navbar-link">
                    <span className="brand-text">Checkmate</span>
                    <span className="brand-accent">Room</span>
                </NavLinkComponent>
            </div>
            <div className="navbar-links">
                <NavLinkComponent to="/play" className={getLinkClass('/play')}>Play</NavLinkComponent>
                <NavLinkComponent to="/history" className={getLinkClass('/history')}>History</NavLinkComponent>
                <NavLinkComponent to="/puzzles" className={getLinkClass('/puzzles')}>Puzzles</NavLinkComponent>
                <NavLinkComponent to="/study" className={getLinkClass('/study')}>Study</NavLinkComponent>
            </div>
            <div className="navbar-controls">
                {/* Wallet Info */}
                <div className="navbar-wallet">
                    {isConnected && userAddress ? (
                        <div className="account-info-container">
                        <div className="account-info-small">
                                {username ? (
                                    <span className="mono username-display">{username}</span>
                                ) : (
                                    <span className="mono username-display">{formatAddress(userAddress)}</span>
                                )}
                            </div>
                            <button 
                                className="disconnect-btn"
                                onClick={handleDisconnect}
                                title="Disconnect Wallet"
                            >
                                <span className="disconnect-icon">🔌</span>
                            </button>
                        </div>
                    ) : (
                        <w3m-button />
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
