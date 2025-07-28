// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title ChessGame
 * @dev Manages the state and rewards for chess matches with spectator betting.
 */
contract ChessGame is Ownable {

    struct SpectatorBet {
        address spectator;
        uint256 amount;
        bool isWhite; // true if betting on white, false for black
        bool isPaid;
    }

    struct Game {
        address player1;
        address player2;
        address winner;
        bool isFinished;
        string pgn;
        uint256 betAmount; // Amount in STT
        address whiteBet; // White player's wallet who placed bet
        address blackBet; // Black player's wallet who placed bet
        bool betsLocked; // Whether bets are locked (game started)
        
        // Spectator betting
        SpectatorBet[] spectatorBets;
        uint256 totalWhiteBets; // Total amount bet on white by spectators
        uint256 totalBlackBets; // Total amount bet on black by spectators
        mapping(address => bool) hasSpectatorBet; // Track if address has already bet
    }

    mapping(uint256 => Game) public games;
    uint256 public nextGameId;

    uint256 public fixedReward = 5 * 10 ** 18; // 5 STT fixed reward
    uint256 public houseFee = 50; // 0.5% house fee (50 basis points)
    uint256 public constant BASIS_POINTS = 10000;

    event GameCreated(uint256 gameId, address player1, address player2);
    event GameFinished(uint256 gameId, address winner);
    event BetPlaced(uint256 gameId, address player, uint256 amount);
    event SpectatorBetPlaced(uint256 gameId, address spectator, uint256 amount, bool isWhite);
    event BetsLocked(uint256 gameId);
    event SpectatorRewardsDistributed(uint256 gameId, uint256 totalWhiteBets, uint256 totalBlackBets);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Creates a new game. Only callable by the owner for now.
     * In the future, this could be opened up for players to initiate games.
     */
    function createGame(address player1, address player2) public onlyOwner {
        Game storage newGame = games[nextGameId];
        newGame.player1 = player1;
        newGame.player2 = player2;
        newGame.winner = address(0);
        newGame.isFinished = false;
        newGame.pgn = "";
        newGame.betAmount = 0;
        newGame.whiteBet = address(0);
        newGame.blackBet = address(0);
        newGame.betsLocked = false;
        newGame.totalWhiteBets = 0;
        newGame.totalBlackBets = 0;

        emit GameCreated(nextGameId, player1, player2);
        nextGameId++;
    }

    /**
     * @dev Allows the owner to change the fixed reward amount for winning a game.
     */
    function setFixedReward(uint256 _newReward) public onlyOwner {
        fixedReward = _newReward;
    }

    /**
     * @dev Allows the owner to change the house fee percentage.
     */
    function setHouseFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 1000, "House fee cannot exceed 10%");
        houseFee = _newFee;
    }

    /**
     * @dev Places a bet for a game using STT.
     * @param gameId The ID of the game to bet on.
     * @param isWhite True if betting on white, false for black.
     */
    function placeBet(uint256 gameId, bool isWhite) public payable {
        Game storage game = games[gameId];
        
        require(!game.isFinished, "Game is already finished");
        require(!game.betsLocked, "Bets are locked");
        require(msg.value > 0, "Bet amount must be greater than 0");
        
        if (isWhite) {
            require(game.whiteBet == address(0), "White bet already placed");
            game.whiteBet = msg.sender;
        } else {
            require(game.blackBet == address(0), "Black bet already placed");
            game.blackBet = msg.sender;
        }
        
        game.betAmount = msg.value;
        emit BetPlaced(gameId, msg.sender, msg.value);
    }

    /**
     * @dev Places a spectator bet on a game.
     * @param gameId The ID of the game to bet on.
     * @param isWhite True if betting on white, false for black.
     */
    function placeSpectatorBet(uint256 gameId, bool isWhite) public payable {
        Game storage game = games[gameId];
        
        require(!game.isFinished, "Game is already finished");
        require(!game.betsLocked, "Bets are locked");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(!game.hasSpectatorBet[msg.sender], "Spectator already placed a bet");
        require(msg.sender != game.player1 && msg.sender != game.player2, "Players cannot place spectator bets");
        
        // Add spectator bet
        game.spectatorBets.push(SpectatorBet({
            spectator: msg.sender,
            amount: msg.value,
            isWhite: isWhite,
            isPaid: false
        }));
        
        // Update totals
        if (isWhite) {
            game.totalWhiteBets += msg.value;
        } else {
            game.totalBlackBets += msg.value;
        }
        
        game.hasSpectatorBet[msg.sender] = true;
        
        emit SpectatorBetPlaced(gameId, msg.sender, msg.value, isWhite);
    }

    /**
     * @dev Locks bets for a game (called when game starts).
     * @param gameId The ID of the game.
     */
    function lockBets(uint256 gameId) public {
        Game storage game = games[gameId];
        
        require(!game.isFinished, "Game is already finished");
        require(!game.betsLocked, "Bets already locked");
        require(game.whiteBet != address(0) && game.blackBet != address(0), "Both players must place bets");
        
        game.betsLocked = true;
        emit BetsLocked(gameId);
    }

    /**
     * @dev Reports the winner of a game, stores the game's PGN, and distributes the reward and bets.
     * Players can report results for games they participated in.
     * Winner receives: total stakes (both players' bets)
     */
    function reportWinner(uint256 gameId, address winner, string calldata pgn) public {
        Game storage game = games[gameId];
        
        require(!game.isFinished, "Game is already finished");
        require(winner == game.player1 || winner == game.player2, "Winner must be one of the players");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Only game participants can report results");

        game.winner = winner;
        game.isFinished = true;
        game.pgn = pgn;

        // Distribute bet winnings if bets were placed
        if (game.betsLocked && game.betAmount > 0) {
            address winnerBet = (winner == game.player1) ? game.whiteBet : game.blackBet;
            uint256 totalPot = game.betAmount * 2; // Both players' bets
            payable(winnerBet).transfer(totalPot);
        }

        // Distribute spectator bet winnings
        if (game.spectatorBets.length > 0) {
            _distributeSpectatorRewards(gameId, winner);
        }

        emit GameFinished(gameId, winner);
    }

    /**
     * @dev Distributes rewards to spectators based on the game outcome.
     * @param gameId The ID of the game.
     * @param winner The address of the winning player.
     */
    function _distributeSpectatorRewards(uint256 gameId, address winner) internal {
        Game storage game = games[gameId];
        
        bool whiteWon = (winner == game.player1);
        uint256 winningSideTotal = whiteWon ? game.totalWhiteBets : game.totalBlackBets;
        uint256 losingSideTotal = whiteWon ? game.totalBlackBets : game.totalWhiteBets;
        
        if (winningSideTotal == 0) {
            // No one bet on the winning side, return all bets to spectators
            for (uint i = 0; i < game.spectatorBets.length; i++) {
                SpectatorBet storage bet = game.spectatorBets[i];
                if (!bet.isPaid) {
                    payable(bet.spectator).transfer(bet.amount);
                    bet.isPaid = true;
                }
            }
            return;
        }

        // Calculate house fee
        uint256 totalPot = winningSideTotal + losingSideTotal;
        uint256 houseFeeAmount = (totalPot * houseFee) / BASIS_POINTS;
        uint256 netPot = totalPot - houseFeeAmount;

        // Distribute winnings to spectators who bet on the winning side
        for (uint i = 0; i < game.spectatorBets.length; i++) {
            SpectatorBet storage bet = game.spectatorBets[i];
            if (!bet.isPaid) {
                if (bet.isWhite == whiteWon) {
                    // Winner - calculate proportional reward
                    uint256 reward = (bet.amount * netPot) / winningSideTotal;
                    payable(bet.spectator).transfer(reward);
                }
                bet.isPaid = true;
            }
        }

        emit SpectatorRewardsDistributed(gameId, game.totalWhiteBets, game.totalBlackBets);
    }

    /**
     * @dev Gets spectator bet information for a game.
     * @param gameId The ID of the game.
     * @return totalWhiteBets Total amount bet on white by spectators.
     * @return totalBlackBets Total amount bet on black by spectators.
     * @return spectatorCount Number of spectators who placed bets.
     */
    function getSpectatorBetInfo(uint256 gameId) public view returns (
        uint256 totalWhiteBets,
        uint256 totalBlackBets,
        uint256 spectatorCount
    ) {
        Game storage game = games[gameId];
        return (game.totalWhiteBets, game.totalBlackBets, game.spectatorBets.length);
    }

    /**
     * @dev Gets a specific spectator bet by index.
     * @param gameId The ID of the game.
     * @param index The index of the spectator bet.
     */
    function getSpectatorBet(uint256 gameId, uint256 index) public view returns (
        address spectator,
        uint256 amount,
        bool isWhite,
        bool isPaid
    ) {
        Game storage game = games[gameId];
        require(index < game.spectatorBets.length, "Invalid bet index");
        
        SpectatorBet storage bet = game.spectatorBets[index];
        return (bet.spectator, bet.amount, bet.isWhite, bet.isPaid);
    }

    /**
     * @dev Gets the total number of spectator bets for a game.
     * @param gameId The ID of the game.
     */
    function getSpectatorBetCount(uint256 gameId) public view returns (uint256) {
        return games[gameId].spectatorBets.length;
    }

    /**
     * @dev Allows the owner to withdraw accumulated house fees.
     */
    function withdrawHouseFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
}
