import { useState, useEffect, useCallback } from "react";
import type { FC } from 'react';
import { ethers, Contract } from "ethers";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import axios from 'axios';
import MagnusTokenABI from "./artifacts/MagnusToken.json";
import ChessGameABI from "./artifacts/ChessGame.json";
import Navbar from "./components/Navbar";
import UsernameModal from "./components/UsernameModal";
import AdminNotification from "./components/AdminNotification";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import HistoryPage from "./pages/HistoryPage";
import PuzzlesPage from "./pages/PuzzlesPage";
import StudyPage from "./pages/StudyPage";
import AnalysisPage from "./pages/AnalysisPage";
import SpectatePage from "./pages/SpectatePage";
import AdminMintPage from "./pages/AdminMintPage";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatBot from "./components/ChatBot";
import { MAGNUS_TOKEN_ADDRESS, CHESS_GAME_ADDRESS, ADMIN_WALLET_ADDRESS, BACKEND_URL } from "./config/env";
import "./App.css";

// Cast the router components to a compatible type
const RoutesComponent: FC<any> = Routes as any;
const RouteComponent: FC<any> = Route as any;

interface AppProps {}

const App: FC<AppProps> = () => {
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [chessGameContract, setChessGameContract] = useState<Contract | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminNotification, setShowAdminNotification] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address || !walletProvider) return;
    try {
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const contract = new ethers.Contract(MAGNUS_TOKEN_ADDRESS, MagnusTokenABI.abi, ethersProvider);
      const balance = await contract.balanceOf(address);
      setTokenBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
    }
  }, [address, walletProvider]);

  // --- User Profile & Username Logic ---
  useEffect(() => {
    const checkUser = async () => {
      if (isConnected && address) {
        // Check if user is admin
        if (address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
          setIsAdmin(true);
          setShowAdminNotification(true);
        } else {
          setIsAdmin(false);
        }

        // Check for existing username
        try {
          const response = await axios.get(`${BACKEND_URL}/api/user/${address}`);
          setUsername(response.data.username);
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            // User not found, prompt for username
            setIsUsernameModalOpen(true);
          } else {
            console.error("Error fetching user profile:", error);
          }
        }
      } else {
        // Reset state on disconnect
        setIsAdmin(false);
        setUsername(null);
      }
    };
    checkUser();
  }, [isConnected, address]);

  const handleUsernameSubmit = async (newUsername: string) => {
    if (!address) throw new Error("Wallet not connected.");
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/user/username`, {
        walletAddress: address,
        username: newUsername,
      });
      setUsername(response.data.user.username);
      setIsUsernameModalOpen(false); // Close modal on success
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("An unexpected error occurred while setting username.");
    }
  };

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
    if (address && walletProvider) {
        fetchBalance();
    }
  }, [address, walletProvider, fetchBalance]);

  // Admin route protection component
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isConnected) {
      return <Navigate to="/" replace />;
    }
    
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar 
              isConnected={isConnected}
              userAddress={address || null}
              tokenBalance={tokenBalance}
              username={username}
          />
          <ChatBot userAccount={address || null} />
          <AdminNotification 
            isVisible={showAdminNotification}
            onClose={() => setShowAdminNotification(false)}
          />
          <UsernameModal
            isOpen={isUsernameModalOpen}
            onClose={() => setIsUsernameModalOpen(false)}
            onSubmit={handleUsernameSubmit}
          />
          <RoutesComponent>
            <RouteComponent path="/" element={<HomePage />} />
            <RouteComponent path="/play" element={<PlayPage chessGameContract={chessGameContract} userAccount={address || null} updateBalance={fetchBalance} />} />
            <RouteComponent path="/history" element={<HistoryPage userAccount={address || null} chessGameContract={chessGameContract} />} />
            <RouteComponent path="/puzzles" element={<PuzzlesPage />} />
            <RouteComponent path="/study" element={<StudyPage />} />
            <RouteComponent path="/analysis" element={<AnalysisPage />} />
            <RouteComponent path="/spectate/:gameId" element={<SpectatePage chessGameContract={chessGameContract} userAccount={address || null} isConnected={isConnected} updateBalance={fetchBalance} />} />
            <RouteComponent 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminMintPage updateBalance={fetchBalance} />
                </AdminRoute>
              } 
            />
          </RoutesComponent>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
