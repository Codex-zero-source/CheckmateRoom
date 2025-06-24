// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MagnusToken.sol";

/**
 * @title ChessGame
 * @dev Manages the state and rewards for chess matches.
 */
contract ChessGame is Ownable {
    MagnusToken public magnusToken;

    struct Game {
        address player1;
        address player2;
        address winner;
        bool isFinished;
    }

    mapping(uint256 => Game) public games;
    uint256 public nextGameId;

    uint256 public winReward = 10 * 10 ** 18; // 10 MAG tokens

    event GameCreated(uint256 gameId, address player1, address player2);
    event GameFinished(uint256 gameId, address winner);

    /**
     * @dev Sets the address of the MagnusToken contract.
     * @param _tokenAddress The address of the deployed MagnusToken.
     */
    constructor(address _tokenAddress, address initialOwner) Ownable(initialOwner) {
        magnusToken = MagnusToken(_tokenAddress);
    }

    /**
     * @dev Creates a new game. Only callable by the owner for now.
     * In the future, this could be opened up for players to initiate games.
     */
    function createGame(address player1, address player2) public onlyOwner {
        games[nextGameId] = Game({
            player1: player1,
            player2: player2,
            winner: address(0),
            isFinished: false
        });
        emit GameCreated(nextGameId, player1, player2);
        nextGameId++;
    }

    /**
     * @dev Reports the winner of a game and distributes the reward.
     * For now, only the owner can report the winner to keep it simple.
     * This will be updated later to allow players to report results.
     */
    function reportWinner(uint256 gameId, address winner) public onlyOwner {
        Game storage game = games[gameId];
        
        require(!game.isFinished, "Game is already finished");
        require(winner == game.player1 || winner == game.player2, "Winner must be one of the players");

        game.winner = winner;
        game.isFinished = true;

        // Mint reward tokens to the winner
        magnusToken.mint(winner, winReward);

        emit GameFinished(gameId, winner);
    }

    /**
     * @dev Allows the owner to change the reward amount for winning a game.
     */
    function setWinReward(uint256 _newReward) public onlyOwner {
        winReward = _newReward;
    }
} 