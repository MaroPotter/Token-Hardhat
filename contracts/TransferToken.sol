// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "@openzeppelin/contracts/access/Ownable.sol";
//import "prb-math/contracts/PRBMathSD59x18.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Token.sol";


contract TransferToken is Ownable {
    using SafeERC20 for ERC20;
    address tokenAddressA;
    address tokenAddressB;
    uint amountTokenA;
    uint amountTokenB;
    uint priceTokenB;
    uint decimalsPrice;
//    uint[19] priceString;



    constructor(address _tokenAddressA, address _tokenAddressB, uint _priceTokenB) {
        tokenAddressA = _tokenAddressA;
        tokenAddressB = _tokenAddressB;
        priceTokenB = _priceTokenB;
        decimalsPrice = 2;
    }

    function updatePrice(uint _newPriceTokenB, uint _decimalsPrice) public onlyOwner {
        priceTokenB = _newPriceTokenB;
        decimalsPrice = _decimalsPrice;
    }

    function deposit(address _tokenAddress, uint _amount) public onlyOwner {
        ERC20 token = ERC20(_tokenAddress);
        uint amount = _amount * 10 ** token.decimals();
        token.safeTransferFrom(owner(), address(this), amount);
        // require TO DO
        if(_tokenAddress == tokenAddressA) {
            amountTokenA += amount;
        }
        if(_tokenAddress == tokenAddressB) {
            amountTokenB += amount;
        }
    }

    function exchange(address _tokenAddress, uint _amountToken) external {
        ERC20 tokenA = ERC20(tokenAddressA);
        ERC20 tokenB = ERC20(tokenAddressB);
        uint decimalsTokenA = tokenA.decimals();
        uint decimalsTokenB = tokenB.decimals();
//        uint numberOfZerosInPrice = countZeros(priceTokenB);
        //require TO DO

        if (_tokenAddress == tokenAddressA) {

            uint exchangedAmountTokenB = (_amountToken * 10**(decimalsPrice + decimalsTokenB - decimalsTokenA)) / priceTokenB;

//            uint exchangedAmountTokenBBeforeRounding = (_amountToken * 10 **(18 - numberOfDecimals_tokenA) / (priceTokenB / 10 **(numberOfZerosInPrice))) / 10 ** (numberOfZerosInPrice - numberOfDecimals_tokenB - 1);
//            uint exchangedAmountTokenB = roundPrice(exchangedAmountTokenBBeforeRounding);
            require(exchangedAmountTokenB <= amountTokenB);

            tokenA.safeTransferFrom(msg.sender, address(this), _amountToken);
            amountTokenA += _amountToken;
            tokenB.safeTransfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if(_tokenAddress == tokenAddressB ) {
            uint exchangedAmountTokenA = (_amountToken * 10**(decimalsPrice + decimalsTokenA - decimalsTokenB)) * priceTokenB;// DO ZMIANY TRZEBA WYLICZYĆ NA KARTECE DRUGI PRZYPADEK!!!

            //            uint exchangedAmountTokenABeforeRounding = (_amountToken * 10 **(18-numberOfDecimals_tokenB) * (priceTokenB / 10 **numberOfZerosInPrice)) / (10 ** (18 - numberOfZerosInPrice) * 10 ** (18 - numberOfDecimals_tokenA - 1));
//            uint exchangedAmountTokenA = roundPrice(exchangedAmountTokenABeforeRounding);
            require(exchangedAmountTokenA <= amountTokenA);

            tokenB.safeTransferFrom(msg.sender, address(this), _amountToken);
            amountTokenB += _amountToken;
            tokenA.safeTransfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }

}