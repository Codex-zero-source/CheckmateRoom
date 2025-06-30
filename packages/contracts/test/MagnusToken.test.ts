import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MagnusToken } from "../typechain-types";

describe("MagnusToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const MagnusTokenFactory = await ethers.getContractFactory("MagnusToken");
    const magnusToken = await MagnusTokenFactory.deploy(owner.address);

    return { magnusToken, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { magnusToken } = await loadFixture(deployTokenFixture);
      expect(await magnusToken.name()).to.equal("Magnus Token");
      expect(await magnusToken.symbol()).to.equal("MAG");
    });

    it("Should assign the total supply of tokens to the owner and grant roles", async function () {
      const { magnusToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await magnusToken.balanceOf(owner.address);
      const expectedSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens with 18 decimals
      expect(await magnusToken.totalSupply()).to.equal(expectedSupply);
      expect(ownerBalance).to.equal(expectedSupply);

      const adminRole = await magnusToken.DEFAULT_ADMIN_ROLE();
      const minterRole = await magnusToken.MINTER_ROLE();
      expect(await magnusToken.hasRole(adminRole, owner.address)).to.be.true;
      expect(await magnusToken.hasRole(minterRole, owner.address)).to.be.true;
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { magnusToken, owner, otherAccount } = await loadFixture(
        deployTokenFixture
      );

      // Transfer 50 tokens from owner to otherAccount
      await expect(
        magnusToken.transfer(otherAccount.address, ethers.parseUnits("50", 18))
      ).to.changeTokenBalances(
        magnusToken,
        [owner, otherAccount],
        [ethers.parseUnits("-50", 18), ethers.parseUnits("50", 18)]
      );
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { magnusToken, owner, otherAccount } = await loadFixture(
        deployTokenFixture
      );
      const initialOwnerBalance = await magnusToken.balanceOf(owner.address);

      // Try to send 1 token from otherAccount (0 tokens) to owner (1,000,000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        magnusToken.connect(otherAccount).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(magnusToken, "ERC20InsufficientBalance");

      // Owner balance shouldn't have changed.
      expect(await magnusToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Minting", function () {
    it("Should allow accounts with MINTER_ROLE to mint new tokens", async function () {
        const { magnusToken, owner, otherAccount } = await loadFixture(deployTokenFixture);
        const amountToMint = ethers.parseUnits("1000", 18);

        await expect(magnusToken.mint(otherAccount.address, amountToMint))
            .to.changeTokenBalance(magnusToken, otherAccount, amountToMint);
        
        const newTotalSupply = ethers.parseUnits("1001000", 18);
        expect(await magnusToken.totalSupply()).to.equal(newTotalSupply);
    });

    it("Should not allow accounts without MINTER_ROLE to mint new tokens", async function () {
        const { magnusToken, otherAccount } = await loadFixture(deployTokenFixture);
        const amountToMint = ethers.parseUnits("1000", 18);
        const minterRole = await magnusToken.MINTER_ROLE();

        await expect(
            magnusToken.connect(otherAccount).mint(otherAccount.address, amountToMint)
        ).to.be.revertedWithCustomError(magnusToken, "AccessControlUnauthorizedAccount")
         .withArgs(otherAccount.address, minterRole);
    });
  });
}); 