// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MagnusToken
 * @dev The ERC20 token for the Magnus Chess dApp ecosystem.
 * The owner of the contract can mint new tokens.
 */
contract MagnusToken is ERC20, Ownable {
    /**
     * @dev Sets the values for {name} and {symbol}.
     * The owner of the contract is set to the address that deploys it.
     * Mints an initial supply of 1,000,000 tokens to the contract owner.
     */
    constructor(address initialOwner) ERC20("Magnus Token", "MAG") Ownable(initialOwner) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `to`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - The caller must be the owner of the contract.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 