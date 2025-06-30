import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { WalletErrorProvider } from './contexts/WalletErrorContext.tsx'
import './index.css'
import './web3modal.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WalletErrorProvider>
        <App />
      </WalletErrorProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
