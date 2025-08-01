import { Abi } from 'viem'

export const chessGameABI = [
  {
    inputs: [{ internalType: "address", name: "initialOwner", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "games",
    outputs: [
      { internalType: "address", name: "player1", type: "address" },
      { internalType: "address", name: "player2", type: "address" },
      { internalType: "uint256", name: "betAmount", type: "uint256" },
      { internalType: "address", name: "whiteBet", type: "address" },
      { internalType: "address", name: "blackBet", type: "address" },
      { internalType: "bool", name: "betsLocked", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "placeBet",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "gameId", type: "uint256" }],
    name: "lockBets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "gameId", type: "uint256" },
      { internalType: "address", name: "winner", type: "address" },
      { internalType: "string", name: "pgn", type: "string" }
    ],
    name: "submitResult",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const satisfies Abi;