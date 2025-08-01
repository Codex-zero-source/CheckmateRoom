// verify.ts
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

const contractAddress = "0x1EB8A3c03D6D7212bC50176cEa0eCc33F5f8a016";
const STT_TOKEN_ADDRESS = "0xB0eA5876b0eD682DCf907D41D926Ce5F0F2B44ac";

async function verifyContract() {
    console.log('Starting contract verification...');
    
    const command = `npx hardhat verify --network somnia ${contractAddress} ${process.env.OWNER_ADDRESS} ${STT_TOKEN_ADDRESS}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error during verification: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`Verification stderr: ${stderr}`);
            return;
        }
        console.log(`Verification stdout: ${stdout}`);
    });
}

verifyContract()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
