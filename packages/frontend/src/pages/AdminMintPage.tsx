import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MagnusTokenAbi from '../artifacts/MagnusToken.json';

// Deployed contract address on Fuji Testnet (same as in App.tsx)
const MAGNUS_TOKEN_ADDRESS = "0x8BA03d3d164B343DEb8404Ca8dD87236ED11BBfb";

const AdminMintPage: React.FC = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Connect wallet and get provider/signer/account
  useEffect(() => {
    const connect = async () => {
      if ((window as any).ethereum) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(browserProvider);
        const signer = await browserProvider.getSigner();
        setSigner(signer);
        const address = await signer.getAddress();
        setAccount(address);
        setRecipient(address);
        // Check if owner
        const token = new ethers.Contract(MAGNUS_TOKEN_ADDRESS, MagnusTokenAbi.abi, signer);
        const owner = await token.owner();
        setIsOwner(owner.toLowerCase() === address.toLowerCase());
      }
    };
    connect();
  }, []);

  const handleMint = async (to: string) => {
    setStatus('');
    setError('');
    if (!signer) return;
    try {
      const token = new ethers.Contract(MAGNUS_TOKEN_ADDRESS, MagnusTokenAbi.abi, signer);
      const decimals = await token.decimals();
      const value = ethers.parseUnits(amount, decimals);
      const tx = await token.mint(to, value);
      setStatus('Transaction sent. Waiting for confirmation...');
      await tx.wait();
      setStatus('Mint successful!');
    } catch (err: any) {
      setError(err.message || 'Mint failed');
    }
  };

  if (!account) {
    return <div style={{ padding: 32 }}>Connect your wallet to access admin minting.</div>;
  }
  if (!isOwner) {
    return <div style={{ padding: 32, color: 'red' }}>You are not the contract owner. Admin minting is restricted.</div>;
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Admin Token Mint</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Amount (MAG)</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: '100%', marginTop: 4 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => handleMint(account)} style={{ flex: 1 }}>Mint to Self</button>
        <button onClick={() => handleMint(recipient)} style={{ flex: 1 }}>Mint to Address</button>
      </div>
      {status && <div style={{ color: 'green', marginBottom: 8 }}>{status}</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
    </div>
  );
};

export default AdminMintPage; 