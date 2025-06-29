// Admin Token Minting Page
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';
import ChessGame from '../artifacts/ChessGame.json';
import { CHESS_GAME_ADDRESS } from '../config/env';
import './AdminMintPage.css';

interface AdminMintPageProps {
    updateBalance: () => void;
}

const AdminMintPage: React.FC<AdminMintPageProps> = ({ updateBalance }) => {
    const { address } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const getSigner = async () => {
            if (walletProvider) {
                const ethersProvider = new ethers.BrowserProvider(walletProvider);
                const signer = await ethersProvider.getSigner();
                setSigner(signer);
            } else {
                setSigner(null);
            }
        };
        getSigner();
    }, [walletProvider]);

    const executeMint = async (recipientAddress: string) => {
        if (!signer || !recipientAddress || !amount) {
            setError('Please fill in all fields and connect your wallet.');
            return;
        }

        setIsLoading(true);
        setStatus('Preparing transaction...');
        setError('');

        try {
            const gameContract = new ethers.Contract(CHESS_GAME_ADDRESS, ChessGame.abi, signer);
            const amountInWei = ethers.parseUnits(amount, 18);

            setStatus('Sending transaction to mint tokens...');
            const tx = await gameContract.adminMint(recipientAddress, amountInWei);

            setStatus('Waiting for transaction confirmation...');
            await tx.wait();

            setStatus(`Successfully minted ${amount} tokens to ${recipientAddress}!`);
            updateBalance();
            setRecipient('');
            setAmount('');
        } catch (err: any) {
            console.error('Minting failed:', err);
            const errorMessage = err.reason || err.message || 'An unknown error occurred.';
            setError(`Minting failed: ${errorMessage}`);
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMintToAddress = (e: React.FormEvent) => {
        e.preventDefault();
        executeMint(recipient);
    };

    const handleMintToSelf = () => {
        if (address) {
            executeMint(address);
        } else {
            setError('Wallet not connected.');
        }
    };

    return (
        <div className="admin-mint-container">
            <div className="admin-mint-card">
                <h1 className="admin-mint-title">Admin Token Minter</h1>
                <p className="admin-mint-description">
                    As the contract owner, you can mint new tokens to any address.
                </p>
                <form onSubmit={handleMintToAddress} className="admin-mint-form">
                    <div className="form-group">
                        <label htmlFor="recipient">Recipient Address</label>
                        <input
                            id="recipient"
                            type="text"
                            className="admin-mint-input"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="e.g., 0x..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="amount">Amount</label>
                        <input
                            id="amount"
                            type="text"
                            className="admin-mint-input"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 100"
                            required
                        />
                    </div>
                    <div className="button-group">
                        <button
                            type="submit"
                            className="admin-mint-button"
                            disabled={isLoading || !signer}
                        >
                            {isLoading ? 'Minting...' : 'Mint to Address'}
                        </button>
                        <button
                            type="button"
                            className="admin-mint-button self"
                            onClick={handleMintToSelf}
                            disabled={isLoading || !signer || !address || !amount}
                        >
                            {isLoading ? 'Minting...' : 'Mint to Self'}
                        </button>
                    </div>
                </form>

                {isLoading && (
                    <div className="status-message loading">
                        <div className="loader"></div>
                        <span>{status}</span>
                    </div>
                )}

                {!isLoading && status && !error && (
                    <div className="status-message success">
                        {status}
                    </div>
                )}

                {!isLoading && error && (
                    <div className="status-message error">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMintPage;