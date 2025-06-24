import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import MagnusTokenModule from "./MagnusToken";

const ChessGameModule = buildModule("ChessGameModule", (m) => {
  // Get the deployer account from the MagnusToken module
  const { magnusToken } = m.useModule(MagnusTokenModule);
  
  const initialOwner = m.getAccount(0);

  // Deploy the ChessGame contract, linking it to the MagnusToken
  const chessGame = m.contract("ChessGame", [magnusToken, initialOwner]);

  // Transfer ownership of MagnusToken to the ChessGame contract
  m.call(magnusToken, "transferOwnership", [chessGame]);

  return { chessGame, magnusToken };
});

export default ChessGameModule; 