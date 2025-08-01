import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChessGameModule = buildModule("ChessGameModule", (m) => {
  const initialOwner = m.getAccount(0);

  // Deploy the ChessGame contract (using native STT)
  const chessGame = m.contract("ChessGame", [initialOwner]);

  return { chessGame };
});

export default ChessGameModule;
