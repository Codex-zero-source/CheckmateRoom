import React, { useState } from 'react';
import './UsernameModal.css';

interface UsernameModalProps {
  onClose: () => void;
  onSubmit: (username: string) => Promise<void>;
  isOpen: boolean;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(username);
      setUsername(''); // Clear on success
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Choose Your Username</h2>
        <p className="modal-subtitle">This will be your unique identity in chat rooms and leaderboards.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., MagnusCarlsen"
              className="username-input"
              disabled={isLoading}
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Set Username'}
          </button>
        </form>
        
        <p className="modal-note">You can change this later in your profile settings.</p>
      </div>
    </div>
  );
};

export default UsernameModal; 