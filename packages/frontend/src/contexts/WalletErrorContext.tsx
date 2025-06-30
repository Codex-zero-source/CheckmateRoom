import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface WalletErrorContextType {
  walletError: string | null;
  setWalletError: (error: string | null) => void;
}

const WalletErrorContext = createContext<WalletErrorContextType | undefined>(undefined);

export const useWalletError = () => {
  const context = useContext(WalletErrorContext);
  if (context === undefined) {
    throw new Error('useWalletError must be used within a WalletErrorProvider');
  }
  return context;
};

interface WalletErrorProviderProps {
  children: ReactNode;
}

export const WalletErrorProvider: React.FC<WalletErrorProviderProps> = ({ children }) => {
  const [walletError, setWalletError] = useState<string | null>(null);

  return (
    <WalletErrorContext.Provider value={{ walletError, setWalletError }}>
      {children}
    </WalletErrorContext.Provider>
  );
}; 