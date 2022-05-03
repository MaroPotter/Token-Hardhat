// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";
//import "prb-math/contracts/PRBMathSD59x18.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Token.sol";
import "hardhat/console.sol";


contract TransferToken is Ownable {
    using SafeERC20 for ERC20;
    address tokenAddressA;
    address tokenAddressB;
    uint amountTokenA;
    uint amountTokenB;
    uint priceTokenB;
    uint8 decimalsPrice;
    //    uint[19] priceString;



    constructor(address _tokenAddressA, address _tokenAddressB, uint _priceTokenB) {
        tokenAddressA = _tokenAddressA;
        tokenAddressB = _tokenAddressB;
        priceTokenB = _priceTokenB;
        decimalsPrice = 2;
    }

    function updatePrice(uint _priceTokenB, uint8 _decimalsPrice) public onlyOwner {
        priceTokenB = _priceTokenB;
        decimalsPrice = _decimalsPrice;
    }

    function deposit(address _tokenAddress, uint _amount) public onlyOwner {
        require(_tokenAddress == tokenAddressA || _tokenAddress == tokenAddressB, "First argument can be either address of token A or address of token B");
        ERC20 token = ERC20(_tokenAddress);

        token.safeTransferFrom(owner(), address(this), _amount);

        if (_tokenAddress == tokenAddressA) {
            amountTokenA += _amount;
        }
        if (_tokenAddress == tokenAddressB) {
            amountTokenB += _amount;
        }
    }

    function exchange(address _tokenAddress, uint _amountToken) external {
        require(_tokenAddress == tokenAddressA || _tokenAddress == tokenAddressB, "First argument can be either address of token A or address of token B");

        ERC20 tokenA = ERC20(tokenAddressA);
        ERC20 tokenB = ERC20(tokenAddressB);
        uint8 decimalsTokenA = tokenA.decimals();
        uint8 decimalsTokenB = tokenB.decimals();
        uint exchangedAmountTokenB;
        uint exchangedAmountTokenA;
        uint preciseAmountToken;


        if (_tokenAddress == tokenAddressA) {

            if (int8(decimalsPrice) + int8(decimalsTokenB) - int8(decimalsTokenA) >= 0) {
                exchangedAmountTokenB = (_amountToken * 10 ** (decimalsPrice + decimalsTokenB - decimalsTokenA)) / priceTokenB;
                preciseAmountToken = (exchangedAmountTokenB * priceTokenB) / 10 ** (decimalsPrice + decimalsTokenB - decimalsTokenA);
            } else {
                exchangedAmountTokenB = _amountToken / (priceTokenB * 10 ** (decimalsTokenA - decimalsPrice - decimalsTokenB));
                preciseAmountToken = (exchangedAmountTokenB * priceTokenB) * 10 ** (decimalsTokenA - decimalsPrice - decimalsTokenB );
            }

            require(exchangedAmountTokenB <= amountTokenB);

            tokenA.safeTransferFrom(msg.sender, address(this), preciseAmountToken);
            amountTokenA += preciseAmountToken;
            tokenB.safeTransfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if (_tokenAddress == tokenAddressB) {
            if (int8(decimalsTokenA) - int8(decimalsTokenB) - int8(decimalsPrice) >= 0)
                exchangedAmountTokenA = _amountToken * priceTokenB * 10 ** (decimalsTokenA - decimalsTokenB - decimalsPrice);
            else // if (decimalsTokenA - decimalsTokenB - decimalsPrice < 0)
                exchangedAmountTokenA = _amountToken * priceTokenB / (10 ** (decimalsTokenB + decimalsPrice - decimalsTokenA));

            require(exchangedAmountTokenA <= amountTokenA);

            tokenB.safeTransferFrom(msg.sender, address(this), _amountToken);
            amountTokenB += _amountToken;
            tokenA.safeTransfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }


}