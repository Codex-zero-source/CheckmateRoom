import React, { useState, useEffect, useRef } from 'react';
import { housePersonality } from '../services/gamblerChat';
import { useWalletError } from '../contexts/WalletErrorContext';
import './ChatBot.css';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'bot';
  timestamp: Date;
  type: 'greeting' | 'betting' | 'game_event' | 'encouragement' | 'reaction' | 'move_comment' | 'puzzle_event';
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
  puzzleState?: {
    isActive: boolean;
    currentPuzzle: any;
    difficulty: string;
    moveIndex: number;
    totalMoves: number;
    timeSpent: number;
    success: boolean;
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

const ChatBot: React.FC<ChatBotProps> = ({ 
  gameState, 
  puzzleState, 
  userAccount, 
  onBetSuggestion, 
  moveHistory = [] 
}) => {
  const { walletError } = useWalletError();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastGameStateRef = useRef(gameState);
  const lastPuzzleStateRef = useRef(puzzleState);
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
      setMessages([]);
      lastUserAccountRef.current = userAccount;
      setTimeout(() => {
        addBotMessage(housePersonality.getGreeting(), 'greeting');
      }, 500);
    } else if (!userAccount && lastUserAccountRef.current) {
      lastUserAccountRef.current = null;
      addBotMessage(housePersonality.getLoginWarning(), 'greeting');
    }
  }, [userAccount]);

  // React to wallet errors
  useEffect(() => {
    if (!walletError) return;
    if (walletError.includes('wallet')) {
      addBotMessage(housePersonality.getLoginWarning(), 'greeting');
    } else if (walletError.includes('Insufficient $MAG tokens')) {
      addBotMessage(housePersonality.getInsufficientTokenMessage(), 'reaction');
    } else if (walletError.includes('Checking your token balance')) {
      addBotMessage(housePersonality.getTokenCheckMessage(), 'game_event');
    }
  }, [walletError]);

  // Track moves and add timely comments
  useEffect(() => {
    if (moveHistory && moveHistory.length > lastMoveCountRef.current) {
      const newMoves = moveHistory.slice(lastMoveCountRef.current);
      lastMoveCountRef.current = moveHistory.length;
      newMoves.forEach((move, index) => {
        setTimeout(() => {
          const moveComment = housePersonality.getMoveComment(move, gameState?.playerColor || null);
          addBotMessage(moveComment, 'move_comment');
        }, 1000 + (index * 2000));
      });
    }
  }, [moveHistory, gameState?.playerColor]);

  // React to game state changes
  useEffect(() => {
    const prevState = lastGameStateRef.current;
    const currentState = gameState;
    if (prevState && currentState && !prevState.isGameActive && currentState.isGameActive) {
      setTimeout(() => {
        addBotMessage(housePersonality.getGameStartMessage(currentState.currentStakes), 'game_event');
      }, 1500);
    }
    if (prevState && currentState && prevState.isGameActive && currentState.gameOver) {
      setTimeout(() => {
        addBotMessage(housePersonality.getGameOverMessage(currentState.gameOver), 'reaction');
      }, 2000);
    }
    if (prevState && currentState && prevState.currentStakes !== currentState.currentStakes) {
      setTimeout(() => {
        addBotMessage(housePersonality.getStakesChangeMessage(currentState.currentStakes), 'betting');
      }, 1000);
    }
    if (prevState && currentState && currentState.moveCount > prevState.moveCount && currentState.moveCount % 5 === 0) {
      setTimeout(() => {
        addBotMessage(housePersonality.getEncouragementMessage(currentState.moveCount), 'encouragement');
      }, 1500);
    }
    lastGameStateRef.current = currentState;
  }, [gameState]);

  // React to puzzle state changes
  useEffect(() => {
    const prevState = lastPuzzleStateRef.current;
    const currentState = puzzleState;
    if (prevState && currentState && !prevState.isActive && currentState.isActive) {
      setTimeout(() => {
        const puzzleMessage = housePersonality.getPuzzleStartMessage(currentState.difficulty);
        addBotMessage(puzzleMessage, 'puzzle_event');
        if (currentState.currentPuzzle?.themes?.length > 0) {
          setTimeout(() => {
            const themeMessage = housePersonality.getPuzzleThemeMessage(currentState.currentPuzzle.themes[0]);
            addBotMessage(themeMessage, 'puzzle_event');
          }, 2000);
        }
      }, 1500);
    }
    if (prevState && currentState && prevState.isActive && !currentState.isActive) {
      setTimeout(() => {
        if (currentState.success) {
          const successMessage = housePersonality.getPuzzleSuccessMessage(currentState.timeSpent);
          addBotMessage(successMessage, 'puzzle_event');
        } else {
          const failureMessage = housePersonality.getPuzzleFailureMessage();
          addBotMessage(failureMessage, 'puzzle_event');
        }
      }, 1000);
    }
    lastPuzzleStateRef.current = currentState;
  }, [puzzleState]);

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
    }, 2000 + Math.random() * 3000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chatbot ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="chatbot-title">
          <span className="chatbot-icon">🏛️</span>
          <span className="chatbot-name">The House</span>
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
                  <TypewriterMessage 
                    text={message.text} 
                    delay={typingMessageId === message.id ? 50 : 0}
                  />
                </div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <div className="message-content">
                  <span className="typing-indicator">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot; 