// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Token.sol";

contract TransferToken is Ownable {
    using SafeERC20 for ERC20;
    address private tokenAddressA;
    address private tokenAddressB;
    uint private priceForTokenB;
    uint8 private decimalsPrice;

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
    }

    function withdraw(address tokenAddress, uint amount) public onlyOwner {
        checkIfTokenAddressIsCorrect(tokenAddress, "withdraw");
        ERC20 token = ERC20(tokenAddress);
        token.safeTransfer(owner(), amount);
    }

    function exchange(address tokenAddress, uint amountToken) external {
        ERC20 tokenA = ERC20(tokenAddressA);
        ERC20 tokenB = ERC20(tokenAddressB);
        uint exchangedAmountToken;
        uint preciseAmountTokenA;
        uint8 decimalsTokenA = tokenA.decimals();
        uint8 decimalsTokenB = tokenB.decimals();
        uint8 sumDecimalsUnsigned;
        int8 sumDecimals = int8(decimalsPrice) + int8(decimalsTokenB) - int8(decimalsTokenA);

        checkIfTokenAddressIsCorrect(tokenAddress, "exchange");

        if (tokenAddress == tokenAddressA) {

            if (sumDecimals >= 0) {
                sumDecimalsUnsigned = uint8(sumDecimals);
                exchangedAmountToken = (amountToken * 10 ** sumDecimalsUnsigned) / priceForTokenB;
                preciseAmountTokenA = (exchangedAmountToken * priceForTokenB) / 10 ** sumDecimalsUnsigned;
            }
            if(sumDecimals < 0) {
                sumDecimalsUnsigned = uint8(-sumDecimals);
                exchangedAmountToken = amountToken / (priceForTokenB * 10 ** sumDecimalsUnsigned);
                preciseAmountTokenA = (exchangedAmountToken * priceForTokenB) * 10 ** sumDecimalsUnsigned;
            }

            tokenA.safeTransferFrom(msg.sender, address(this), preciseAmountTokenA);
            tokenB.safeTransfer(msg.sender, exchangedAmountToken);
        }

        if (tokenAddress == tokenAddressB) {

            if(sumDecimals >= 0) {
                sumDecimalsUnsigned = uint8(sumDecimals);
                exchangedAmountToken = amountToken * priceForTokenB / (10 ** sumDecimalsUnsigned);
            }
            if(sumDecimals < 0) {
                sumDecimalsUnsigned = uint8(-sumDecimals);
                exchangedAmountToken = amountToken * priceForTokenB * 10 ** sumDecimalsUnsigned;
            }

            tokenB.safeTransferFrom(msg.sender, address(this), amountToken);
            tokenA.safeTransfer(msg.sender, exchangedAmountToken);
        }
    }

    function checkIfTokenAddressIsCorrect(address tokenAddress, string memory callingMethodName) private view {
        string memory errorText = string.concat(
            "First argument of TransferToken.",
             callingMethodName,
            "() can be either address of token A or address of token B");

        require(tokenAddress == tokenAddressA || tokenAddress == tokenAddressB, errorText);
    }
}