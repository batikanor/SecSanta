// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ConfidentialFungibleToken} from "@openzeppelin/confidential-contracts/token/ConfidentialFungibleToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BirthdayConfidentialToken is ConfidentialFungibleToken, Ownable, SepoliaConfig {
    using FHE for *;

   
    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_
    )
        ConfidentialFungibleToken(name_, symbol_, uri_)
        Ownable(msg.sender)
    {
    }

    /// @notice Mint new confidential tokens; only owner (or a minter role) can do this
    function mint(address to, externalEuint64 amount, bytes memory inputProof)
        public
        onlyOwner
    {
        _mint(to, amount.fromExternal(inputProof));
    }

    /// @notice Burn confidential tokens; only owner (or privileged) can do this
    function burn(address from, externalEuint64 amount, bytes memory inputProof)
        public
        onlyOwner
    {
        _burn(from, amount.fromExternal(inputProof));
    }
    

}
