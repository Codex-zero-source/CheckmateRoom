import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * Integration test for the new joinGame() flow added to ChessGame.sol.
 */
describe("ChessGame – create & join", function () {
  async function deployFixture() {
    const [owner, player1, player2] = await ethers.getSigners();

    // Deploy the ChessGame contract – constructor takes the initial owner
    const ChessGameFactory = await ethers.getContractFactory("ChessGame");
    const chessGame = await ChessGameFactory.deploy();

    return { chessGame, owner, player1, player2 };
  }

  it("allows a game to be created with an open player2 slot and then joined", async function () {
    const { chessGame, player1, player2 } = await loadFixture(deployFixture);

    // Player1 (owner) creates a game, leaving player2 open (address(0))
    await expect(chessGame.connect(player1).createGame(player1.address, ethers.ZeroAddress))
      .to.emit(chessGame, "GameCreated")
      .withArgs(0, player1.address, ethers.ZeroAddress);

    let game = await chessGame.games(0);
    expect(game.player1).to.equal(player1.address);
    expect(game.player2).to.equal(ethers.ZeroAddress);

    // Player2 joins the open slot
    await expect(chessGame.connect(player2).joinGame(0))
      .to.emit(chessGame, "PlayerJoined")
      .withArgs(0, player2.address);

    game = await chessGame.games(0);
    expect(game.player2).to.equal(player2.address);
  });
});
