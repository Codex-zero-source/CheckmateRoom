// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MagnusToken
 * @dev The ERC20 token for the Magnus Chess dApp ecosystem.
 * The contract owner has the sole authority to mint new tokens.
 */
contract MagnusToken is ERC20, Ownable {
    /**
     * @dev Sets the values for {name} and {symbol}.
     * The deployer is set as the initial owner.
     * Mints an initial supply of 1,000,000 tokens to the owner.
     */
    constructor(address initialOwner) ERC20("Magnus Token", "MAG") Ownable(initialOwner) {
        _mint(owner(), 1_000_000 * 10 ** decimals());
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `to`.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - The caller must be the contract owner.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 