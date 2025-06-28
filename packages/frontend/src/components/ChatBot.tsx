import React, { useState, useEffect, useRef } from 'react';
import { gamblerPersonality } from '../services/gamblerChat';
import { useWalletError } from '../contexts/WalletErrorContext';
import './ChatBot.css';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  type: 'greeting' | 'betting' | 'game_event' | 'encouragement' | 'reaction' | 'move_comment';
}

interface TypewriterMessageProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
}

const TypewriterMessage: React.FC<TypewriterMessageProps> = ({ text, onComplete, delay = 50 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay); // Configurable typing speed

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete, delay]);

  return <span>{displayText}</span>;
};

interface ChatBotProps {
  gameState?: {
    isGameActive: boolean;
    currentStakes: number;
    playerColor: string | null;
    gameOver: string;
    moveCount: number;
  };
  userAccount?: string | null;
  onBetSuggestion?: (amount: number) => void;
  moveHistory?: Array<{
    move: string;
    notation: string;
    player: 'white' | 'black';
    timestamp: number;
  }>;
}

const ChatBot: React.FC<ChatBotProps> = ({ gameState, userAccount, onBetSuggestion, moveHistory = [] }) => {
  const { walletError } = useWalletError();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastGameStateRef = useRef(gameState);
  const lastMoveCountRef = useRef(0);
  const lastUserAccountRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear chat and reset when wallet connects
  useEffect(() => {
    if (userAccount && lastUserAccountRef.current !== userAccount) {
      // Wallet just connected - clear previous chat
      setMessages([]);
      lastUserAccountRef.current = userAccount;
      
      // Add welcome message after a short delay
      setTimeout(() => {
        addBotMessage(gamblerPersonality.getGreeting(), 'greeting');
      }, 500);
    } else if (!userAccount && lastUserAccountRef.current) {
      // Wallet disconnected
      lastUserAccountRef.current = null;
      addBotMessage(gamblerPersonality.getLoginWarning(), 'greeting');
    }
  }, [userAccount]);

  // React to wallet errors
  useEffect(() => {
    if (!walletError) return;
    
    if (walletError.includes('wallet')) {
      addBotMessage(gamblerPersonality.getLoginWarning(), 'greeting');
    } else if (walletError.includes('Insufficient $MAG tokens')) {
      addBotMessage(gamblerPersonality.getInsufficientTokenMessage(), 'reaction');
    } else if (walletError.includes('Checking your token balance')) {
      addBotMessage(gamblerPersonality.getTokenCheckMessage(), 'game_event');
    }
  }, [walletError]);

  // Track moves and add timely comments
  useEffect(() => {
    if (moveHistory && moveHistory.length > lastMoveCountRef.current) {
      const newMoves = moveHistory.slice(lastMoveCountRef.current);
      lastMoveCountRef.current = moveHistory.length;
      
      // Add comments for each new move with delays
      newMoves.forEach((move, index) => {
        setTimeout(() => {
          const moveComment = gamblerPersonality.getMoveComment(move, gameState?.playerColor);
          addBotMessage(moveComment, 'move_comment');
        }, 1000 + (index * 2000)); // 1 second initial delay + 2 seconds between moves
      });
    }
  }, [moveHistory, gameState?.playerColor]);

  // React to game state changes
  useEffect(() => {
    const prevState = lastGameStateRef.current;
    const currentState = gameState;

    // Game started
    if (prevState && currentState && !prevState.isGameActive && currentState.isGameActive) {
      setTimeout(() => {
        addBotMessage(gamblerPersonality.getGameStartMessage(currentState.currentStakes), 'game_event');
      }, 1500); // Delay after game starts
    }

    // Game over
    if (prevState && currentState && prevState.isGameActive && currentState.gameOver) {
      setTimeout(() => {
        addBotMessage(gamblerPersonality.getGameOverMessage(currentState.gameOver), 'reaction');
      }, 2000); // Delay after game ends
    }

    // Stakes changed
    if (prevState && currentState && prevState.currentStakes !== currentState.currentStakes) {
      setTimeout(() => {
        addBotMessage(gamblerPersonality.getStakesChangeMessage(currentState.currentStakes), 'betting');
      }, 1000); // Delay after stakes change
    }

    // Move count increased (encourage betting)
    if (prevState && currentState && currentState.moveCount > prevState.moveCount && currentState.moveCount % 5 === 0) {
      setTimeout(() => {
        addBotMessage(gamblerPersonality.getEncouragementMessage(currentState.moveCount), 'encouragement');
      }, 1500); // Delay for encouragement messages
    }

    lastGameStateRef.current = currentState;
  }, [gameState]);

  const addBotMessage = (text: string, type: ChatMessage['type']) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      type
    };
    
    setIsTyping(true);
    setTypingMessageId(newMessage.id);
    setTimeout(() => {
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      setTypingMessageId(null);
    }, 2000 + Math.random() * 3000); // 2-5 second typing delay
  };

  const handleUserMessage = (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      type: 'greeting'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Bot response based on user input
    setTimeout(() => {
      const response = gamblerPersonality.getResponseToUserInput(text, gameState || {
        isGameActive: false,
        currentStakes: 0,
        playerColor: null,
        gameOver: '',
        moveCount: 0
      });
      addBotMessage(response, 'encouragement');
    }, 500);
  };

  const suggestBet = (amount: number) => {
    addBotMessage(gamblerPersonality.getBetSuggestion(amount), 'betting');
    onBetSuggestion?.(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="chatbot-title">
          <span className="bot-avatar">🎰</span>
          <span>Lucky Louie</span>
        </div>
        <div className="chatbot-controls">
          <button className="minimize-btn">
            {isMinimized ? '🔽' : '🔼'}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  <div className="message-text">
                    {message.sender === 'bot' && typingMessageId === message.id ? (
                      <TypewriterMessage text={message.text} delay={80} />
                    ) : (
                      message.text
                    )}
                  </div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-actions">
            <div className="quick-actions">
              <button 
                className="quick-bet-btn"
                onClick={() => suggestBet(10)}
              >
                Bet 10 MAG
              </button>
              <button 
                className="quick-bet-btn"
                onClick={() => suggestBet(50)}
              >
                Bet 50 MAG
              </button>
              <button 
                className="quick-bet-btn"
                onClick={() => suggestBet(100)}
              >
                Bet 100 MAG
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot; 