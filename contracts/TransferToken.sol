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
    uint[19] priceString;



    constructor(address _tokenAddressA, address _tokenAddressB, uint _priceTokenB) {
        tokenAddressA = _tokenAddressA;
        tokenAddressB = _tokenAddressB;
        priceTokenB = _priceTokenB;
    }

    function updatePrice(uint _newPriceTokenB) public onlyOwner {
        priceTokenB = _newPriceTokenB;
    }

    function deposit(address _tokenAddress, uint _amount) public onlyOwner {
        ERC20 token = ERC20(_tokenAddress); //tu był problem
        token.safeTransferFrom(owner(), address(this), _amount);

        if(_tokenAddress == tokenAddressA) {
            amountTokenA += _amount;
        }
        if(_tokenAddress == tokenAddressB) {
            amountTokenB += _amount;
        }
    }

    function exchange(address _tokenAddress, uint _amountToken) external {
        ERC20 tokenA = ERC20(tokenAddressA);
        ERC20 tokenB = ERC20(tokenAddressB);
        uint numberOfDecimals_tokenA = tokenA.decimals();
        uint numberOfDecimals_tokenB= tokenB.decimals();
        uint numberOfZerosInPrice = countZeros(priceTokenB);

        if (_tokenAddress == tokenAddressA) {
            uint exchangedAmountTokenBBeforeRounding = (_amountToken * 10 **(18 - numberOfDecimals_tokenA) / (priceTokenB / 10 **(numberOfZerosInPrice))) / 10 ** (numberOfZerosInPrice - numberOfDecimals_tokenB - 1);
            uint exchangedAmountTokenB = roundPrice(exchangedAmountTokenBBeforeRounding);
            require(exchangedAmountTokenB <= amountTokenB);

            tokenA.safeTransferFrom(msg.sender, address(this), _amountToken);
            amountTokenA += _amountToken;
            tokenB.safeTransfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if(_tokenAddress == tokenAddressB ) {
            uint exchangedAmountTokenABeforeRounding = (_amountToken * 10 **(18-numberOfDecimals_tokenB) * (priceTokenB / 10 **numberOfZerosInPrice)) / (10 ** (18 - numberOfZerosInPrice) * 10 ** (18 - numberOfDecimals_tokenA - 1));
            uint exchangedAmountTokenA = roundPrice(exchangedAmountTokenABeforeRounding);
            require(exchangedAmountTokenA <= amountTokenA);

            tokenB.safeTransferFrom(msg.sender, address(this), _amountToken);
            amountTokenB += _amountToken;
            tokenA.safeTransfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }
    
    function countZeros(uint _price) private returns (uint) {
        for(uint i = 19; i > 0; i--) {
            priceString[i-1] = _price%10;
            _price /= 10;
        }

        uint counterZeros = 0;
        uint j = 18;
        while(priceString[j] == 0 && j > 0) {
            counterZeros++;
            j--;
        }

        return counterZeros;
    }
    
    function roundPrice(uint _price) private pure returns (uint) {
        uint lastDigit = _price%10;
        _price /= 10;
        if (lastDigit >= 5) {
            _price += 1;
        }

        return _price;
    }
}