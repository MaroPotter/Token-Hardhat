// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
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
    uint priceForTokenB;
    uint8 decimalsPrice;


    constructor(address newTokenAddressA, address newTokenAddressB, uint newPriceTokenB) {
        tokenAddressA = newTokenAddressA;
        tokenAddressB = newTokenAddressB;
        priceForTokenB = newPriceTokenB;
        decimalsPrice = 2;
    }

    function updatePrice(uint newPriceForTokenB, uint8 newDecimalsPrice) public onlyOwner {
        priceForTokenB = newPriceForTokenB;
        decimalsPrice = newDecimalsPrice;
    }

    function deposit(address tokenAddress, uint amount) public onlyOwner {
        checkIfTokenAddressIsCorrect(tokenAddress, "deposit");

        ERC20 token = ERC20(tokenAddress);
        token.safeTransferFrom(owner(), address(this), amount);

        if (tokenAddress == tokenAddressA) {
            amountTokenA += amount;
        }
        if (tokenAddress == tokenAddressB) {
            amountTokenB += amount;
        }
    }

    function exchange(address tokenAddress, uint amountToken) external {
        ERC20 tokenA = ERC20(tokenAddressA);
        ERC20 tokenB = ERC20(tokenAddressB);
        uint exchangedAmountTokenB;
        uint exchangedAmountTokenA;
        uint preciseAmountTokenA;
        uint8 decimalsTokenA = tokenA.decimals();
        uint8 decimalsTokenB = tokenB.decimals();
        uint8 sumDecimalsUnsigned;
        int8 sumDecimals = int8(decimalsPrice) + int8(decimalsTokenB) - int8(decimalsTokenA);

        checkIfTokenAddressIsCorrect(tokenAddress, "exchange");
        if (tokenAddress == tokenAddressA) {
            if (sumDecimals >= 0) {
                sumDecimalsUnsigned = uint8(sumDecimals); // decimalsPrice + decimalsTokenB - decimalsTokenA;
                exchangedAmountTokenB = (amountToken * 10 ** sumDecimalsUnsigned) / priceForTokenB;
                preciseAmountTokenA = (exchangedAmountTokenB * priceForTokenB) / 10 ** sumDecimalsUnsigned;
            }
            if(sumDecimals < 0) {
                sumDecimalsUnsigned = uint8(-sumDecimals); // decimalsTokenA - decimalsPrice - decimalsTokenB;
                exchangedAmountTokenB = amountToken / (priceForTokenB * 10 ** sumDecimalsUnsigned);
                preciseAmountTokenA = (exchangedAmountTokenB * priceForTokenB) * 10 ** sumDecimalsUnsigned;
            }

            require(exchangedAmountTokenB <= amountTokenB);

            tokenA.safeTransferFrom(msg.sender, address(this), preciseAmountTokenA);
            amountTokenA += preciseAmountTokenA;
            tokenB.safeTransfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if (tokenAddress == tokenAddressB) {
            if(sumDecimals >= 0) {
                sumDecimalsUnsigned = uint8(sumDecimals); // decimalsPrice + decimalsTokenB - decimalsTokenA;
                exchangedAmountTokenA = amountToken * priceForTokenB / (10 ** sumDecimalsUnsigned);
            }
            if(sumDecimals < 0) {
                sumDecimalsUnsigned = uint8(-sumDecimals); // decimalsTokenA - decimalsPrice - decimalsTokenB;
                exchangedAmountTokenA = amountToken * priceForTokenB * 10 ** sumDecimalsUnsigned;
            }

            require(exchangedAmountTokenA <= amountTokenA);

            tokenB.safeTransferFrom(msg.sender, address(this), amountToken);
            amountTokenB += amountToken;
            tokenA.safeTransfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }

    function checkIfTokenAddressIsCorrect(address tokenAddress, string memory callingMethodName) private view {
        string memory errorText = string.concat(
            "First argument of TransferToken.",
             callingMethodName,
            "() can be either address of token A or address of token B");

        require(tokenAddress == tokenAddressA || tokenAddress == tokenAddressB, errorText);
    }

//    function exchangeTokens(address _tokenAddress, uint _preciseAmountToken ,uint _exchangedAmountToken) private {
//        ERC20 tokenA = ERC20(tokenAddressA);
//        ERC20 tokenB = ERC20(tokenAddressB);
//
//        if(_tokenAddress == tokenAddressA) {
//            tokenA.safeTransferFrom(msg.sender, address(this), _preciseAmountToken);
//            amountTokenA += _preciseAmountToken;
//            tokenB.safeTransfer(msg.sender, _exchangedAmountToken);
//            amountTokenB -= _exchangedAmountToken;
//        }
//
//        if(_tokenAddress == tokenAddressB) {
//            tokenB.safeTransferFrom(msg.sender, address(this), _preciseAmountToken);
//            amountTokenB += _preciseAmountToken;
//            tokenA.safeTransfer(msg.sender, _exchangedAmountToken);
//            amountTokenA -= _exchangedAmountToken;
//        }
//
//    }


}