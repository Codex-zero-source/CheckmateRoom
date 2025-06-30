import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dracula' | 'classic' | 'neon' | 'cyberpunk' | 'midnight';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  pieceSet: string;
  setPieceSet: (pieceSet: string) => void;
  boardTheme: string;
  setBoardTheme: (boardTheme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = {
  dracula: {
    '--background-color': '#282a36',
    '--surface-color': '#44475a',
    '--primary-color': '#bd93f9',
    '--secondary-color': '#ff79c6',
    '--accent-color': '#50fa7b',
    '--text-color': '#f8f8f2',
    '--text-secondary': '#6272a4',
    '--border-color': '#6272a4',
    '--success-color': '#50fa7b',
    '--warning-color': '#ffb86c',
    '--error-color': '#ff5555',
    '--neon-glow': '0 0 10px rgba(189, 147, 249, 0.5)',
    '--neon-glow-strong': '0 0 20px rgba(189, 147, 249, 0.8)',
  },
  classic: {
    '--background-color': '#1a1a1a',
    '--surface-color': '#2d2d2d',
    '--primary-color': '#00a8ff',
    '--secondary-color': '#0097e6',
    '--accent-color': '#00d2d3',
    '--text-color': '#ffffff',
    '--text-secondary': '#b2bec3',
    '--border-color': '#636e72',
    '--success-color': '#00b894',
    '--warning-color': '#fdcb6e',
    '--error-color': '#e17055',
    '--neon-glow': '0 0 10px rgba(0, 168, 255, 0.5)',
    '--neon-glow-strong': '0 0 20px rgba(0, 168, 255, 0.8)',
  },
  neon: {
    '--background-color': '#0a0a0a',
    '--surface-color': '#1a1a1a',
    '--primary-color': '#00ff88',
    '--secondary-color': '#ff0080',
    '--accent-color': '#00ffff',
    '--text-color': '#ffffff',
    '--text-secondary': '#888888',
    '--border-color': '#333333',
    '--success-color': '#00ff88',
    '--warning-color': '#ffaa00',
    '--error-color': '#ff0040',
    '--neon-glow': '0 0 15px rgba(0, 255, 136, 0.6)',
    '--neon-glow-strong': '0 0 25px rgba(0, 255, 136, 0.9)',
  },
  cyberpunk: {
    '--background-color': '#0d1117',
    '--surface-color': '#161b22',
    '--primary-color': '#ff6b6b',
    '--secondary-color': '#4ecdc4',
    '--accent-color': '#45b7d1',
    '--text-color': '#f0f6fc',
    '--text-secondary': '#8b949e',
    '--border-color': '#30363d',
    '--success-color': '#7ee787',
    '--warning-color': '#f0883e',
    '--error-color': '#f85149',
    '--neon-glow': '0 0 12px rgba(255, 107, 107, 0.6)',
    '--neon-glow-strong': '0 0 22px rgba(255, 107, 107, 0.9)',
  },
  midnight: {
    '--background-color': '#0f1419',
    '--surface-color': '#1e2328',
    '--primary-color': '#7c3aed',
    '--secondary-color': '#a855f7',
    '--accent-color': '#06b6d4',
    '--text-color': '#f1f5f9',
    '--text-secondary': '#64748b',
    '--border-color': '#334155',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--error-color': '#ef4444',
    '--neon-glow': '0 0 12px rgba(124, 58, 237, 0.6)',
    '--neon-glow-strong': '0 0 22px rgba(124, 58, 237, 0.9)',
  },
};

const pieceSets = [
  'default',
  'alpha',
  'uscf',
  'cases',
  'chess7',
  'chess24',
  'condal',
  'dubrovny',
  'fantasy',
  'spatial',
  'tournament',
];

const boardThemes = [
  'brown',
  'green',
  'blue',
  'gray',
  'purple',
  'wood',
  'marble',
  'neon',
  'cyber',
  'classic',
];

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('neon');
  const [pieceSet, setPieceSet] = useState('default');
  const [boardTheme, setBoardTheme] = useState('neon');

  useEffect(() => {
    const root = document.documentElement;
    const themeColors = themes[theme];
    
    Object.entries(themeColors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      pieceSet,
      setPieceSet,
      boardTheme,
      setBoardTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { themes, pieceSets, boardThemes }; 