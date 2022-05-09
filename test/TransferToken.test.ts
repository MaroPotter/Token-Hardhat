import {ethers as hardhatEthers} from 'hardhat';
import {BigNumber, ethers} from 'ethers';
import {parseUnits} from 'ethers/lib/utils';

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
    let ownerAddress: string;
    let userAddress: string;
    let transferTokenAddress: string;

    before(async () => {
        await instantiateTokenAAndTokenB();
        await instantiateTransferTokenAndAssignAddress();
        await fetchSignersAndAssignAddresses();
    });

    it('Tokens A & B own appropriate names & decimals', async () => {
        await areNamesOfTokensEqual('Ala', 'Bla');
        await areDecimalsOfTokensEqual(4, 3);
    });

    it('owner got 1000 A-tokens and 1000 B-tokens', async () => {
        await areBalancesEqual(ownerAddress, 1000, 1000);
    });

    it('owner approved TransferToken and called function deposit()', async () => {
        await approveAndDepositTokens(owner, tokenB, 250);

        await areBalancesEqual(ownerAddress, 1000, 750);
        await areBalancesEqual(transferTokenAddress, 0, 250);
    });

    it('owner sent a certain amount of tokenA to user', async () => {
        await tokenA.transfer(userAddress, parseUnits('500', 4));

        await areBalancesEqual(ownerAddress, 500, 750);
        await areBalancesEqual(userAddress, 500, 0);
    });

    it('owner set an allowance to transferToken and exchanged tokenA for tokenB', async () => {
        await approveAndExchangeTokens(user, tokenA, 500);

        await areBalancesEqual(userAddress, 0, 250);
        await areBalancesEqual(transferTokenAddress, 500, 0);
    });

    it('owner called updatePrice and user exchanged tokens for the new price', async () => {
        await updatePrice(2.1112, 4);
        await approveAndExchangeTokens(user, tokenB, 100);

        await areBalancesEqual(userAddress, 211.12, 150);
        await areBalancesEqual(transferTokenAddress, 288.88, 100);
    });

    it('owner called updatePrice and user exchanged tokens once more - checked high precision)', async () => {
        await updatePrice(3, 2);
        await approveAndExchangeTokens(user, tokenA, 200);

        await areBalancesEqual(userAddress, 11.122, 216.666);
        await areBalancesEqual(transferTokenAddress, 488.878, 33.334);
    });

    it('cannot call function deposit with inappropriate address of token', async () => {
        await transferToken.deposit(userAddress, 250000).should.be.rejectedWith(
            Error,
            'VM Exception while processing transaction: reverted with reason string \'First argument'
            + ' of TransferToken.deposit() can be either address of token A or address of token B',
        );
    });

    it('transferToken didn\'t exchange tokens due to insufficient balance', async () => {
        await transferToken.connect(user).exchange(tokenB.address, parseUnits('2000', 3))
            .should.be.rejectedWith(Error, 'Transaction reverted without a reason string');
    });

    /* ------------------------AUXILIARY FUNCTIONS--------------------------------

     -----------------------------------------------------------------------------
     The following functions wrap initializations of instances of contracts
     in order to move insignificant details from the 'before' block
     ---------------------------------------------------------------------------*/

    async function instantiateTokenAAndTokenB() {
        const nameTokenA: string = 'Ala';
        const symbolTokenA: string = 'AL';
        const decimalsTokenA: number = 4;
        const nameTokenB: string = 'Bla';
        const symbolTokenB: string = 'BL';
        const decimalsTokenB: number = 3;

        tokenA = await instantiateToken(nameTokenA, symbolTokenA, decimalsTokenA);
        tokenB = await instantiateToken(nameTokenB, symbolTokenB, decimalsTokenB);
    }

    async function instantiateToken(name: string, symbol: string, decimals: number): Promise<ethers.Contract> {
        if (!Token) {
            Token = await hardhatEthers.getContractFactory('Token');
        }

        return Token.deploy(name, symbol, decimals);
    }

    async function instantiateTransferTokenAndAssignAddress() {
        const price: BigNumber = parseUnits('2', 2);

        transferToken = await instantiateTransferToken(tokenA.address, tokenB.address, price);
        transferTokenAddress = transferToken.address;
    }

    async function instantiateTransferToken(addressFirstToken: string, addressSecondToken: string, price: BigNumber)
        : Promise<ethers.Contract> {
        if (!TransferToken) {
            TransferToken = await hardhatEthers.getContractFactory('TransferToken');
        }
        return TransferToken.deploy(addressFirstToken, addressSecondToken, price);
    }

    async function fetchSignersAndAssignAddresses() {
        [owner, user] = await hardhatEthers.getSigners();
        ownerAddress = await owner.getAddress();
        userAddress = await user.getAddress();
    }

    /*----------------------------------------------------------------------------
     The following functions wrap methods of TransferToken and Token contracts,
     significantly improving readability of the test code
     ----------------------------------------------------------------------------*/

    async function areNamesOfTokensEqual(expectedNameOfTokenA: string, expectedNameOfTokenB: string) {
        await isNameOfTokenEqual(tokenA, expectedNameOfTokenA);
        await isNameOfTokenEqual(tokenB, expectedNameOfTokenB);
    }

    async function areDecimalsOfTokensEqual(expectedDecimalsOfTokenA: number, expectedDecimalsOfTokenB: number) {
        await isDecimalsOfTokenEqual(tokenA, expectedDecimalsOfTokenA);
        await isDecimalsOfTokenEqual(tokenB, expectedDecimalsOfTokenB);
    }

    async function areBalancesEqual(address: string, expectedBalanceOfTokenA: number, expectedBalanceOfTokenB: number) {
        await isBalanceCorrect(address, tokenA, expectedBalanceOfTokenA);
        await isBalanceCorrect(address, tokenB, expectedBalanceOfTokenB);
    }

    async function approveAndDepositTokens(account: ethers.Signer, token: ethers.Contract, amount: number) {
        const actualAmount: BigNumber = parseUnits(amount.toString(), await token.decimals());
        await token.connect(account).approve(transferTokenAddress, actualAmount);
        await transferToken.deposit(token.address, actualAmount);
    }

    async function updatePrice(price: number, priceDecimals: number) {
        const parsedPrice: BigNumber = parseUnits(price.toString(), priceDecimals);
        await transferToken.updatePrice(parsedPrice, priceDecimals);
    }

    async function approveAndExchangeTokens(account: ethers.Signer, token: ethers.Contract, amount: number) {
        const actualAmount: BigNumber = parseUnits(amount.toString(), await token.decimals());

        await token.connect(account).approve(transferTokenAddress, actualAmount);
        await transferToken.connect(account).exchange(token.address, actualAmount);
    }
});

async function isBalanceCorrect(address: string, token: ethers.Contract, amount: number) {
    const balance: BigNumber = await token.balanceOf(address);
    const tokenDecimals: number = await token.decimals();
    const parsedAmount: BigNumber = parseUnits(amount.toString(), tokenDecimals);

    balance.should.equal(parsedAmount);
}

async function isNameOfTokenEqual(token: ethers.Contract, expectedName: string) {
    const actualName = await token.name();
    actualName.should.equal(expectedName);
}

async function isDecimalsOfTokenEqual(token: ethers.Contract, expectedDecimals: number) {
    const actualDecimals = await token.decimals();
    actualDecimals.should.equal(expectedDecimals);
}
