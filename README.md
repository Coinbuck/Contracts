# Buck Token

This project contains the Solidity code for an ERC-20 compliant token on the Ethereum blockchain. The ERC-20 standard defines a set of rules for tokens to implement on Ethereum, ensuring compatibility with various wallets, exchanges, and other contracts.

## Features
ERC-20 Compliance: Implements the ERC-20 standard interface for Ethereum tokens.
Total Supply: The token has a fixed 
Transfers: Users can transfer tokens between addresses.
Balances: Check balances of token holders.
Allowances: Allowances can be set to enable spending tokens on behalf of another address.
Events: Emits events for various token-related activities.
BlackListing: Token contract owner can blacklist address 
Burn :user can burn tokens and supply will decrease

## Getting Started
Prerequisites
Solidity Compiler: Use Solidity to compile the smart contracts.
Truffle or Remix IDE: Deploy and interact with the contract using Truffle Suite or Remix.
Ganache: Use Ganache for local development and testing.


## Installation
```shell
#Clone the repository
git clone https://github.com/Coinbuck/Contracts.git
#Latest branch
git checkout development
# install deps
npm install
```


<br />

## How do I test?

1. If you want to run tests in a single file for example the buck.test.js you can run `sh test.sh`