import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MagnusTokenModule = buildModule("MagnusTokenModule", (m) => {
  // Get the deployer account
  const initialOwner = m.getAccount(0);

  // Deploy the MagnusToken contract
  const magnusToken = m.contract("MagnusToken", [initialOwner]);

  return { magnusToken };
});

export default MagnusTokenModule;
