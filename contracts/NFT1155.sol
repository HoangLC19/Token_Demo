//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

contract NFT1155 is ERC1155URIStorage, Ownable {
    constructor() ERC1155("") {}

    function mintItem(address to, uint256 tokenId, uint256 amount, bytes memory data) public onlyOwner {
        _mint(to, tokenId, amount, data);
    }

}