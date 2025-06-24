import { useState, useEffect } from "react";
import type { FC } from 'react';
import { ethers, Contract } from "ethers";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MagnusTokenABI from "./artifacts/MagnusToken.json";
import ChessGameABI from "./artifacts/ChessGame.json";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import PuzzlesPage from "./pages/PuzzlesPage";
import StudyPage from "./pages/StudyPage";
import "./App.css";

// Deployed contract addresses on Fuji Testnet
const MAGNUS_TOKEN_ADDRESS = "0x8BA03d3d164B343DEb8404Ca8dD87236ED11BBfb";
const CHESS_GAME_ADDRESS = "0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016";

// Cast the router components to a compatible type
const RoutesComponent: FC<any> = Routes as any;
const RouteComponent: FC<any> = Route as any;

function App() {
  const [userAccount, setUserAccount] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [chessGameContract, setChessGameContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);

      const signer = await newProvider.getSigner();
      const accounts = await newProvider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        setUserAccount(accounts[0]);
        const gameContract = new ethers.Contract(CHESS_GAME_ADDRESS, ChessGameABI.abi, signer);
        setChessGameContract(gameContract);
      }
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!userAccount || !provider) return;
      const contract = new ethers.Contract(MAGNUS_TOKEN_ADDRESS, MagnusTokenABI.abi, provider);
      const balance = await contract.balanceOf(userAccount);
      setTokenBalance(ethers.formatUnits(balance, 18));
    };

    if (userAccount && provider) {
        fetchBalance();
    }
  }, [userAccount, provider, tokenBalance]);


  return (
    <Router>
      <div className="App">
        <Navbar />
        {/* Wallet connection button can be moved to the Navbar or kept here */}
        <div className="top-right-controls">
            {userAccount ? (
                <div className="account-info-small">
                    <span className="mono">{userAccount.substring(0, 6)}...{userAccount.substring(userAccount.length - 4)}</span>
                    <span className="mono"> | $MAG: {parseFloat(tokenBalance || '0').toFixed(2)}</span>
                </div>
            ) : (
                <button onClick={connectWallet} className="connect-wallet-btn-small">
                    Connect
                </button>
            )}
        </div>
        <RoutesComponent>
          <RouteComponent path="/" element={<HomePage />} />
          <RouteComponent path="/play" element={<PlayPage chessGameContract={chessGameContract} userAccount={userAccount} />} />
          <RouteComponent path="/puzzles" element={<PuzzlesPage />} />
          <RouteComponent path="/study" element={<StudyPage />} />
        </RoutesComponent>
      </div>
    </Router>
  );
}

export default App;
