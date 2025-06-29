import { useState, useEffect } from "react";
import type { FC } from 'react';
import { ethers, Contract } from "ethers";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import MagnusTokenABI from "./artifacts/MagnusToken.json";
import ChessGameABI from "./artifacts/ChessGame.json";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import HistoryPage from "./pages/HistoryPage";
import PuzzlesPage from "./pages/PuzzlesPage";
import StudyPage from "./pages/StudyPage";
import AnalysisPage from "./pages/AnalysisPage";
import AdminMintPage from "./pages/AdminMintPage";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatBot from "./components/ChatBot";
import "./App.css";

// Deployed contract addresses on Fuji Testnet
const MAGNUS_TOKEN_ADDRESS = "0x8BA03d3d164B343DEb8404Ca8dD87236ED11BBfb";
const CHESS_GAME_ADDRESS = "0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016";

// Cast the router components to a compatible type
const RoutesComponent: FC<any> = Routes as any;
const RouteComponent: FC<any> = Route as any;

function App() {
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [chessGameContract, setChessGameContract] = useState<Contract | null>(null);

  useEffect(() => {
    const setupContract = async () => {
        if(isConnected && walletProvider) {
            const ethersProvider = new ethers.BrowserProvider(walletProvider)
            const signer = await ethersProvider.getSigner()
            const gameContract = new ethers.Contract(CHESS_GAME_ADDRESS, ChessGameABI.abi, signer);
            setChessGameContract(gameContract);
        }
    }
    setupContract();
  }, [isConnected, walletProvider])


  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !walletProvider) return;
      const ethersProvider = new ethers.BrowserProvider(walletProvider)
      const contract = new ethers.Contract(MAGNUS_TOKEN_ADDRESS, MagnusTokenABI.abi, ethersProvider);
      const balance = await contract.balanceOf(address);
      setTokenBalance(ethers.formatUnits(balance, 18));
    };

    if (address && walletProvider) {
        fetchBalance();
    }
  }, [address, walletProvider, tokenBalance]);


  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar 
              isConnected={isConnected}
              userAddress={address || null}
              tokenBalance={tokenBalance}
          />
          <ChatBot userAccount={address || null} />
          <RoutesComponent>
            <RouteComponent path="/" element={<HomePage />} />
            <RouteComponent path="/play" element={<PlayPage chessGameContract={chessGameContract} userAccount={address || null} />} />
            <RouteComponent path="/history" element={<HistoryPage userAccount={address || null} chessGameContract={chessGameContract} />} />
            <RouteComponent path="/puzzles" element={<PuzzlesPage />} />
            <RouteComponent path="/study" element={<StudyPage />} />
            <RouteComponent path="/analysis/:gameId" element={<AnalysisPage />} />
            <RouteComponent path="/admin" element={<AdminMintPage />} />
          </RoutesComponent>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
