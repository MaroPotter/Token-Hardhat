import {ethers as hardhatEthers} from 'hardhat';
import {describe} from 'mocha';
import {BigNumber, ethers} from 'ethers';
import {Token} from '../typechain-types';
import {Bytes, BytesLike, formatUnits, parseUnits} from "ethers/lib/utils";
import {BigNumberish} from "ethers/lib/ethers";

require('chai')
    // .use(require('chai-as-promised'))
    .should();

// @ts-ignore
async function testIfAccountBalanceHasExpectedValue(address: string, token: hardhatEthers.ContractFactory, price: number) {
    let balance: BigNumber = await token.balanceOf(address);
    let parsedPrice: BigNumber = parseUnits(price.toString(), await token.decimals());
    balance.should.equal(parsedPrice);
}

describe('testing Token', () => {
    // @ts-ignore
    let Token: hardhatEthers.ContractFactory;
    // @ts-ignore
    let TransferToken: hardhatEthers.ContractFactory;
    let tokenA: ethers.Contract;
    let tokenB: ethers.Contract;
    let transferToken: ethers.Contract;
    let addressTokenA: string;
    let addressTokenB: string;
    let price: number;
    let addressTransferToken: string;
    let owner: ethers.Signer;
    let user: ethers.Signer;
    let wallet: ethers.Wallet;
    let ownerAddress: string;
    let userAddress: string;
    let walletAddress: string;

    before(async () => {
        Token = await hardhatEthers.getContractFactory('Token');
        TransferToken = await hardhatEthers.getContractFactory('TransferToken');
        tokenA = await Token.deploy('Ala', 'AL', 6);
        tokenB = await Token.deploy('Bla', 'BL', 3);
        addressTokenA = tokenA.address;
        addressTokenB = tokenB.address;
        price = 2;
        transferToken = await TransferToken.deploy(addressTokenA, addressTokenB, price);
        addressTransferToken = transferToken.address;
        [owner, user] = await hardhatEthers.getSigners();
        wallet = await ethers.Wallet.createRandom();
        ownerAddress = await owner.getAddress();
        userAddress = await user.getAddress();
        walletAddress = await wallet.getAddress();

        // owner = await transferToken.owner();
    });
    it('Created tokens A & B with appropriate names', async () => {
        (await tokenA.name()).should.equal('Ala');
        (await tokenB.name()).should.equal('Bla');
        (await tokenA.decimals()).should.equal(6);
        (await tokenB.decimals()).should.equal(3);
    });

    it('owner got 1000 A-tokens and 1000 B-tokens', async () => {
        await testIfAccountBalanceHasExpectedValue(ownerAddress, tokenA, 1000);
        await testIfAccountBalanceHasExpectedValue(ownerAddress, tokenB, 1000);
    });
    it('owner approved TransferToken and called function deposit()', async () => {
        await tokenA._approve(addressTransferToken, 500); // parseUnits("500", 6)
        await tokenB._approve(addressTransferToken, 250); // parseUnits("250", 3)

        await transferToken.deposit(addressTokenB, 250); // parseUnits("250", 3)
        await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 250);
    });
    //
    // it('owner sent a certain amount of tokenA to user, user set an allowance to transferToken', async () => {
    //   await tokenA.transfer(userAddress, BigInt(500 * 1e6));
    //   console.log(ownerAddress);
    //   console.log(userAddress);
    //   await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, BigInt(500 * 1e6));
    //
    //   await tokenA.connect(user).approve(addressTransferToken, BigInt(500 * 1e6));
    // });
    //
    // it('user exchanged tokenA for tokenB', async () => {
    //   await transferToken.connect(user).exchange(addressTokenA, BigInt(500 * 1e6));
    //
    //   await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, BigInt(0));
    //   await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(500 * 1e6));
    //   await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, BigInt(250 * 1e2));
    //   await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(0));
    //   // await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, BigInt(17065)); // ~ 170.648 *1e2
    //   // await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(7935)); // 79.35 * 1e2
    // });

    // it('owner called updatePrice and user exchanged tokens for the new price', async function() {
    //
    //     price = BigInt(2.1112 * 1e18);
    //     await transferToken.updatePrice(price);
    //
    //     await tokenB.connect(user).approve(addressTransferToken, BigInt(170.65 * 1e2));
    //     await transferToken.connect(user).exchange(addressTokenB, BigInt(170.65 * 1e2));
    //
    //     await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, BigInt(360.276280 * 1e6));
    //     await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(139.723720 * 1e6));
    //     await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, BigInt(0));
    //     await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(7935) + BigInt(17065)); // 250.00 * 1e2
    // });
    //
    //
    //
    // it('transferToken didn\'t exchange tokens due to insufficient balance', async function() {
    //     transferToken.connect(user).exchange(addressTokenB, BigInt(100 * 1e18));
    //         //.should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");
    // });

    // it('Rejected deposit and exchange with wrong addresses', async function() {
    //
    //     transferToken.deposit(addressTransferToken, BigInt(500*1e18))
    //         .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");
    //     transferToken.exchange("0xrtknhth", BigInt(100 * 1e18))
    //         .should.be.rejectedWith(Error, "invalid address (argument=\"address\", value=\"0xrtknhth\"," +
    //         " code=INVALID_ARGUMENT, version=address/5.0.5) (argument=\"_tokenAddress\", value=\"0xrtknhth\"," +
    //         " code=INVALID_ARGUMENT, version=abi/5.0.7)");
    // });
    //
    //     it('Rejected owner\'s transaction when he didn\'t have enough funds', async function() {
    //         transferToken.deposit(addressTokenA, BigInt(1100 * 1e18))
    //             .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert ERC20:" +
    //             " transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.");
    //     });
});

//

//     // });
// });
