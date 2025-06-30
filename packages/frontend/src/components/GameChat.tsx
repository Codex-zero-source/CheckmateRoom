import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import './GameChat.css';

interface ChatMessage {
    id: string;
    user: string;
    message: string;
    timestamp: number;
    type: 'player' | 'spectator' | 'system';
    userType: 'white' | 'black' | 'spectator';
}

interface GameChatProps {
    socket: Socket;
    gameId: string;
    userAccount: string | null;
    userType: 'white' | 'black' | 'spectator';
    isConnected: boolean;
}

const GameChat: React.FC<GameChatProps> = ({
    socket,
    gameId,
    userAccount,
    userType,
    isConnected
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket || !gameId) return;

        // Join game chat room
        socket.emit('joinGameChat', { gameId });

        // Listen for chat messages
        socket.on('chatMessage', (data: ChatMessage) => {
            setMessages(prev => [...prev, data]);
        });

        // Listen for system messages
        socket.on('systemMessage', (data: { message: string; timestamp: number }) => {
            const systemMessage: ChatMessage = {
                id: `system-${Date.now()}`,
                user: 'System',
                message: data.message,
                timestamp: data.timestamp,
                type: 'system',
                userType: 'spectator'
            };
            setMessages(prev => [...prev, systemMessage]);
        });

        // Listen for typing indicators
        socket.on('userTyping', (data: { user: string; isTyping: boolean }) => {
            if (data.isTyping) {
                setTypingUsers(prev => [...new Set([...prev, data.user])]);
            } else {
                setTypingUsers(prev => prev.filter(user => user !== data.user));
            }
        });

        // Listen for user joined/left messages
        socket.on('userJoinedChat', (data: { user: string; userType: string }) => {
            const joinMessage: ChatMessage = {
                id: `join-${Date.now()}`,
                user: 'System',
                message: `${data.user} joined the chat`,
                timestamp: Date.now(),
                type: 'system',
                userType: 'spectator'
            };
            setMessages(prev => [...prev, joinMessage]);
        });

        socket.on('userLeftChat', (data: { user: string }) => {
            const leaveMessage: ChatMessage = {
                id: `leave-${Date.now()}`,
                user: 'System',
                message: `${data.user} left the chat`,
                timestamp: Date.now(),
                type: 'system',
                userType: 'spectator'
            };
            setMessages(prev => [...prev, leaveMessage]);
        });

        return () => {
            socket.off('chatMessage');
            socket.off('systemMessage');
            socket.off('userTyping');
            socket.off('userJoinedChat');
            socket.off('userLeftChat');
            socket.emit('leaveGameChat', { gameId });
        };
    }, [socket, gameId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !isConnected || !userAccount) return;

        const messageData: Omit<ChatMessage, 'id'> = {
            user: userAccount,
            message: newMessage.trim(),
            timestamp: Date.now(),
            type: userType === 'spectator' ? 'spectator' : 'player',
            userType: userType
        };

        socket.emit('sendChatMessage', {
            gameId,
            ...messageData
        });

        setNewMessage('');
        setIsTyping(false);
        socket.emit('userTyping', { gameId, user: userAccount, isTyping: false });
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        
        if (!isConnected || !userAccount) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('userTyping', { gameId, user: userAccount, isTyping: true });
        }

        // Clear typing indicator after 2 seconds of no typing
        setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                socket.emit('userTyping', { gameId, user: userAccount, isTyping: false });
            }
        }, 2000);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getDisplayName = (user: string) => {
        if (user === 'System') return 'System';
        return `${user.substring(0, 6)}...${user.substring(user.length - 4)}`;
    };

    const getUserTypeIcon = (userType: string) => {
        switch (userType) {
            case 'white': return '♔';
            case 'black': return '♚';
            case 'spectator': return '👁️';
            default: return '👤';
        }
    };

    const getUserTypeColor = (userType: string) => {
        switch (userType) {
            case 'white': return '#ffffff';
            case 'black': return '#000000';
            case 'spectator': return '#4ecdc4';
            default: return '#888888';
        }
    };

    return (
        <div className="game-chat">
            <div className="chat-header">
                <h3>💬 Game Chat</h3>
                <div className="chat-status">
                    <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢' : '🔴'}
                    </span>
                    <span className="status-text">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="chat-messages" ref={chatContainerRef}>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div 
                            key={message.id} 
                            className={`chat-message ${message.type} ${message.user === userAccount ? 'own-message' : ''}`}
                        >
                            {message.type === 'system' ? (
                                <div className="system-message">
                                    <span className="system-icon">🔔</span>
                                    <span className="message-text">{message.message}</span>
                                    <span className="message-time">{formatTime(message.timestamp)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="message-header">
                                        <span 
                                            className="user-icon"
                                            style={{ color: getUserTypeColor(message.userType) }}
                                        >
                                            {getUserTypeIcon(message.userType)}
                                        </span>
                                        <span className="user-name">
                                            {getDisplayName(message.user)}
                                        </span>
                                        <span className="message-time">
                                            {formatTime(message.timestamp)}
                                        </span>
                                    </div>
                                    <div className="message-content">
                                        {message.message}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
                
                {typingUsers.length > 0 && (
                    <div className="typing-indicator">
                        <span className="typing-text">
                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                        <span className="typing-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <div className="input-container">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder={isConnected ? "Type your message..." : "Connecting..."}
                        disabled={!isConnected}
                        maxLength={200}
                    />
                    <button 
                        type="submit" 
                        disabled={!isConnected || !newMessage.trim()}
                        className="send-button"
                    >
                        <span className="send-icon">📤</span>
                    </button>
                </div>
                <div className="input-info">
                    <span className="character-count">
                        {newMessage.length}/200
                    </span>
                    <span className="user-type-badge" style={{ color: getUserTypeColor(userType) }}>
                        {getUserTypeIcon(userType)} {userType}
                    </span>
                </div>
            </form>
        </div>
    );
};

export default GameChat; 