import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

// PLEASE NOTE:
// For this project, you'll need to add a .env file to the packages/contracts directory.
// This file should contain:
// FUJI_PRIVATE_KEY="YOUR_FUJI_TESTNET_PRIVATE_KEY"
// AVALANCHE_API_KEY="YOUR_AVALANCHE_EXPLORER_API_KEY"
// You can get a private key from your MetaMask wallet (create a new test account).
// You can get an Avalanche API key from the Snowtrace (Avalanche Explorer) website.

import * as dotenv from "dotenv";
dotenv.config();

const { SOMNIA_PRIVATE_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    somnia: {
      url: `https://dream-rpc.somnia.network`,
      chainId: 50312,
      accounts: SOMNIA_PRIVATE_KEY ? [SOMNIA_PRIVATE_KEY] : [],
      verify: {
        etherscan: {
          apiUrl: 'https://explorer.somnia.network'
        }
      }
    }
  },
  etherscan: {
    // Somnia explorer doesn't require an API key
    apiKey: {
      somnia: "no-api-key-required"
    }
  },
};

export default config;
