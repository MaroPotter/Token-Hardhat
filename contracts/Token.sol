// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Token is ERC20 {
    uint8 decimalPoints;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) ERC20(_name, _symbol)  {
        decimalPoints = _decimals;
        _mint(msg.sender, 1000 * 10 ** _decimals);
    }

    function decimals() public view override returns (uint8) {
        return decimalPoints;
    }

}