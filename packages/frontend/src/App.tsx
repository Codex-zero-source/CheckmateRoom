import { useState, useEffect, useCallback } from "react";
import type { FC } from 'react';
import { ethers, Contract } from "ethers";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import axios from 'axios';
import ChessGameABI from "./artifacts/ChessGame.json";
import Navbar from "./components/Navbar";
import UsernameModal from "./components/UsernameModal";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import HistoryPage from "./pages/HistoryPage";
import PuzzlesPage from "./pages/PuzzlesPage";
import StudyPage from "./pages/StudyPage";
import AnalysisPage from "./pages/AnalysisPage";
import SpectatePage from "./pages/SpectatePage";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatBot from "./components/ChatBot";
import socketService from "./services/socketService";
import { CHESS_GAME_ADDRESS, BACKEND_URL } from "./config/env";
import "./App.css";

// Cast the router components to a compatible type
const RoutesComponent: FC<any> = Routes as any;
const RouteComponent: FC<any> = Route as any;

interface AppProps {}

const App: FC<AppProps> = () => {
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  const [chessGameContract, setChessGameContract] = useState<Contract | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null); // State to store JWT token
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  // --- JWT Token Logic ---
  const fetchJwtToken = useCallback(async () => {
    if (!address) return;
    try {
      // Assuming the backend has an endpoint to get a token based on wallet address
      const response = await axios.post(`${BACKEND_URL}/api/auth/token`, { walletAddress: address });
      setJwtToken(response.data.token);
    } catch (error: any) {
      console.error("Error fetching JWT token:", error);
      // Handle error, e.g., show a message to the user
    }
  }, [address]);

  useEffect(() => {
    // Fetch JWT token when address and username are available
    if (isConnected && address && username && jwtToken) {
      socketService.connect(address, jwtToken);
    }
  }, [isConnected, address, username, jwtToken]);

  // --- User Profile & Username Logic ---
  useEffect(() => {
    const checkUser = async () => {
      if (isConnected && address) {
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
        setUsername(null);
        setJwtToken(null); // Clear token on disconnect
      }
    };
    checkUser();
    // Fetch JWT token if address is available, even if username is not set yet
    if (isConnected && address) {
      fetchJwtToken();
    }
  }, [isConnected, address, fetchJwtToken]);

  const handleUsernameSubmit = async (newUsername: string) => {
    if (!address) throw new Error("Wallet not connected.");
    
    try {
      // First, fetch the JWT token if it's not already available
      if (!jwtToken) {
        await fetchJwtToken();
      }

      // If token is still not available after fetch, throw an error
      if (!jwtToken) {
        throw new Error("Authentication token not available.");
      }

      const response = await axios.post(`${BACKEND_URL}/api/user/username`, {
        username: newUsername,
      }, {
        headers: {
          Authorization: `Bearer ${jwtToken}`, // Include JWT token in headers
        },
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

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Navbar 
              isConnected={isConnected}
              userAddress={address || null}
              username={username}
          />
          <ChatBot userAccount={address || null} />
          <UsernameModal
            isOpen={isUsernameModalOpen}
            onClose={() => setIsUsernameModalOpen(false)}
            onSubmit={handleUsernameSubmit}
          />
          <RoutesComponent>
            <RouteComponent path="/" element={<HomePage />} />
            <RouteComponent path="/play" element={<PlayPage chessGameContract={chessGameContract} userAccount={address || null} />} />
            <RouteComponent path="/history" element={<HistoryPage userAccount={address || null} chessGameContract={chessGameContract} />} />
            <RouteComponent path="/puzzles" element={<PuzzlesPage />} />
            <RouteComponent path="/study" element={<StudyPage />} />
            <RouteComponent path="/analysis" element={<AnalysisPage />} />
            <RouteComponent path="/spectate/:gameId" element={<SpectatePage chessGameContract={chessGameContract} userAccount={address || null} isConnected={isConnected} />} />
          </RoutesComponent>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
