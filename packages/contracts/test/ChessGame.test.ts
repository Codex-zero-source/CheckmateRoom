import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MagnusToken, ChessGame } from "../typechain-types";

describe("ChessGame", function () {
  async function deployContractsFixture() {
    const [owner, player1, player2] = await ethers.getSigners();

    // Deploy MagnusToken
    const MagnusTokenFactory = await ethers.getContractFactory("MagnusToken");
    const magnusToken = await MagnusTokenFactory.deploy(owner.address);

    // Deploy ChessGame, linking it to the MagnusToken
    const ChessGameFactory = await ethers.getContractFactory("ChessGame");
    const chessGame = await ChessGameFactory.deploy(await magnusToken.getAddress(), owner.address);

    // Grant the Minter role to the ChessGame contract
    const minterRole = await magnusToken.MINTER_ROLE();
    await magnusToken.grantRole(minterRole, await chessGame.getAddress());

    return { chessGame, magnusToken, owner, player1, player2 };
  }

  describe("Game Management", function () {
    it("Should allow the owner to create a new game", async function () {
      const { chessGame, player1, player2 } = await loadFixture(deployContractsFixture);

      await expect(chessGame.createGame(player1.address, player2.address))
        .to.emit(chessGame, "GameCreated")
        .withArgs(0, player1.address, player2.address);
      
      const game = await chessGame.games(0);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(player2.address);
      expect(game.isFinished).to.be.false;
    });

    it("Should not allow non-owners to create a game", async function () {
      const { chessGame, player1, player2 } = await loadFixture(deployContractsFixture);

      await expect(
        chessGame.connect(player1).createGame(player1.address, player2.address)
      ).to.be.revertedWithCustomError(chessGame, "OwnableUnauthorizedAccount");
    });
  });

  describe("Reporting Winner and Rewards", function () {
    it("Should allow the owner to report a winner and mint tokens", async function () {
      const { chessGame, magnusToken, player1, player2 } = await loadFixture(deployContractsFixture);
      await chessGame.createGame(player1.address, player2.address);

      const rewardAmount = await chessGame.winReward();
      const pgn = "1. e4 e5 2. Nf3 Nc6";

      await expect(chessGame.reportWinner(0, player1.address, pgn))
        .to.emit(chessGame, "GameFinished")
        .withArgs(0, player1.address);
      
      const game = await chessGame.games(0);
      expect(game.winner).to.equal(player1.address);
      expect(game.isFinished).to.be.true;
      expect(game.pgn).to.equal(pgn);

      const player1Balance = await magnusToken.balanceOf(player1.address);
      expect(player1Balance).to.equal(rewardAmount);
    });

    it("Should fail if the winner is not one of the players", async function () {
        const { chessGame, owner, player1, player2 } = await loadFixture(deployContractsFixture);
        await chessGame.createGame(player1.address, player2.address);
        const pgn = "1. e4 e5";

        await expect(
            chessGame.reportWinner(0, owner.address, pgn) // Owner was not in the game
        ).to.be.revertedWith("Winner must be one of the players");
    });

    it("Should fail if the game is already finished", async function () {
        const { chessGame, player1, player2 } = await loadFixture(deployContractsFixture);
        await chessGame.createGame(player1.address, player2.address);
        const pgn = "1. e4";
        await chessGame.reportWinner(0, player1.address, pgn); // Finish the game

        // Try to report again
        await expect(
            chessGame.reportWinner(0, player2.address, pgn)
        ).to.be.revertedWith("Game is already finished");
    });

    it("Should allow the owner to set a new win reward", async function () {
        const { chessGame } = await loadFixture(deployContractsFixture);
        const newReward = ethers.parseUnits("25", 18); // 25 MAG

        await chessGame.setWinReward(newReward);
        
        expect(await chessGame.winReward()).to.equal(newReward);
    });
  });
}); 