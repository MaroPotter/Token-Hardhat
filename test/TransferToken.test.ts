import { ethers as hardhatEthers } from 'hardhat';
import { BigNumber, ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

require('chai')
    .use(require('chai-as-promised'))
    .should();

describe('testing Token', () => {
    let Token: ethers.ContractFactory;
    let TransferToken: ethers.ContractFactory;
    let tokenA: ethers.Contract;
    let tokenB: ethers.Contract;
    let transferToken: ethers.Contract;
    let owner: ethers.Signer;
    let user: ethers.Signer;
    let nameTokenA: string;
    let symbolTokenA: string;
    let decimalsTokenA: number;
    let addressTokenA: string;
    let nameTokenB: string;
    let symbolTokenB: string;
    let decimalsTokenB: number;
    let addressTokenB: string;
    let price: BigNumber;
    let addressTransferToken: string;
    let ownerAddress: string;
    let userAddress: string;


    before(async () => {
        await instantiateTokensAndFetchAddresses();
        price = parseUnits('2', 2);
        TransferToken = await hardhatEthers.getContractFactory('TransferToken');
        transferToken = await TransferToken.deploy(addressTokenA, addressTokenB, price);


        addressTransferToken = transferToken.address;
        [owner, user] = await hardhatEthers.getSigners();
        ownerAddress = await owner.getAddress();
        userAddress = await user.getAddress();
    });
    it('Tokens A & B own appropriate names & decimals', async () => {
        await doTokensNamesMatch('Ala', 'Bla');
        await doTokensDecimalsMatch(4, 3);
    });

    it('owner got 1000 A-tokens and 1000 B-tokens', async () => {
        await areBalancesEqual(ownerAddress, 1000, 1000);
    });
    it('owner approved TransferToken and called function deposit()', async () => {
        await approveAndDepositTokens(owner, tokenB, 250);

        await areBalancesEqual(ownerAddress, 1000, 750);
        await areBalancesEqual(addressTransferToken, 0, 250);
    });

    it('owner sent a certain amount of tokenA to user', async () => {
        await tokenA.connect(owner).transfer(userAddress, parseUnits('500', 4));

        await areBalancesEqual(ownerAddress, 500, 750);
        await areBalancesEqual(userAddress, 500, 0);
    });

    it('owner set an allowance to transferToken and exchanged tokenA for tokenB', async () => {
        await approveAndExchangeTokens(user, tokenA, 500);

        await areBalancesEqual(userAddress, 0, 250);
        await areBalancesEqual(addressTransferToken, 500, 0);
    });

    it('owner called updatePrice and user exchanged tokens for the new price', async () => {
        await updatePrice(2.1112, 4);
        await approveAndExchangeTokens(user, tokenB, 100);

        await areBalancesEqual(userAddress, 211.12, 150);
        await areBalancesEqual(addressTransferToken, 288.88, 100);
    });

    it('owner called updatePrice and user exchanged tokens once more - checked high precision)', async () => {
        await updatePrice(3, 2);
        await approveAndExchangeTokens(user, tokenA, 200);

        await areBalancesEqual(userAddress, 11.122, 216.666);
        await areBalancesEqual(addressTransferToken, 488.878, 33.334);
    });

    it('cannot call function deposit with inappropriate address of token', async () => {
        await transferToken.deposit(userAddress, 250000).should.be.rejectedWith(Error,
            "VM Exception while processing transaction: reverted with reason string 'First argument" +
            " of TransferToken.deposit() can be either address of token A or address of token B");
    });

    it('transferToken didn\'t exchange tokens due to insufficient balance', async () => {
        await transferToken.connect(user).exchange(addressTokenB, parseUnits('2000', 3))
            .should.be.rejectedWith(Error, 'Transaction reverted without a reason string');
    });



    /*------------------------AUXILIARY FUNCTIONS---------------------------------
    The following functions wrap methods of the TransferToken contract,
     significantly improving readability of the test code
      ---------------------------------------------------------------------------*/
    async function instantiateTokensAndFetchAddresses2() {             // PIERWSZE
        Token = await hardhatEthers.getContractFactory('Token');
        tokenA = await Token.deploy('Ala', 'Bla', 4);
        tokenB = await Token.deploy('Bla', 'BL', 3);
        addressTokenA = tokenA.address;
        addressTokenB = tokenB.address;
    }                                                                   //DOTĄD

    async function instantiateTokensAndFetchAddresses() {                    // DRUGIE
        tokenA = await instantiateToken('Ala', 'Bla', 4);
        tokenB = await instantiateToken('Bla', 'BL', 3);
        addressTokenA = tokenA.address;
        addressTokenB = tokenB.address;
    }
    async function instantiateToken(name: string, symbol: string, decimals: number) {

        if(!Token) {
            Token = await hardhatEthers.getContractFactory('Token');
        }

        return await Token.deploy(name, symbol, decimals);
    }                                                                   // DOTĄD
    //
    // async function instantiateTransferToken() {}
    async function doTokensNamesMatch(expectedNameOfTokenA: string, expectedNameOfTokenB: string) {
        await doesTokenNameMatch(tokenA, expectedNameOfTokenA);
        await doesTokenNameMatch(tokenB, expectedNameOfTokenB);
    }

    async function doTokensDecimalsMatch(expectedDecimalsOfTokenA: number, expectedDecimalsOfTokenB: number) {
        await doesTokenDecimalsMatch(tokenA, expectedDecimalsOfTokenA);
        await doesTokenDecimalsMatch(tokenB, expectedDecimalsOfTokenB);
    }

    async function areBalancesEqual(address: string, expectedBalanceOfTokenA: number, expectedBalanceOfTokenB: number) {
        await isBalanceCorrect(address, tokenA, expectedBalanceOfTokenA);
        await isBalanceCorrect(address, tokenB, expectedBalanceOfTokenB);
    }

    async function approveAndDepositTokens(account: ethers.Signer, token: ethers.Contract, amount: number) {
        const actualAmount: BigNumber = parseUnits(amount.toString(), await token.decimals());
        await token.connect(account).approve(addressTransferToken, actualAmount);
        await transferToken.deposit(token.address, actualAmount);
    }

    async function updatePrice(price: number, priceDecimals: number) {
        const parsedPrice: BigNumber = parseUnits(price.toString(), priceDecimals);
        await transferToken.updatePrice(parsedPrice, priceDecimals);
    }

    async function approveAndExchangeTokens(account: ethers.Signer, token: ethers.Contract, amount: number) {
        const actualAmount: BigNumber = parseUnits(amount.toString(), await token.decimals());

        await token.connect(account).approve(addressTransferToken, actualAmount);
        await transferToken.connect(account).exchange(token.address, actualAmount);
    }

});


async function isBalanceCorrect(address: string, token: ethers.Contract, amount: number) {
    const balance: BigNumber = await token.balanceOf(address);
    const tokenDecimals: number = await token.decimals();
    const parsedAmount: BigNumber = parseUnits(amount.toString(), tokenDecimals);

    balance.should.equal(parsedAmount);
}

async function doesTokenNameMatch(token: ethers.Contract, expectedName: string) {
    (await token.name()).should.equal(expectedName);
}

async function doesTokenDecimalsMatch(token: ethers.Contract, expectedDecimals: number) {
    (await token.decimals()).should.equal(expectedDecimals);
}



