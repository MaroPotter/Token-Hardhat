import {ethers as hardhatEthers} from "hardhat";
import {describe} from "mocha";
import {ethers} from "ethers";
import {Token} from "../typechain-types";

require('chai')
    .use(require('chai-as-promised'))
    .should();

// This is a workaround till BigInt is fully supported by the standard
// If this is not done, then a JSON.stringify(BigInt) throws
// "TypeError: Do not know how to serialize a BigInt"
//
// @ts-ignore
async function testIfAccountBalanceHasExpectedValue (_address: string, _token: hardhatEthers.ContractFactory, _amount: BigInt) {
    (BigInt(await (_token.balanceOf(_address)))).should.equal(_amount);
}

describe('testing Token',() => {
    // @ts-ignore
    let Token: hardhatEthers.ContractFactory;
    // @ts-ignore
    let TransferToken: hardhatEthers.ContractFactory;
    let tokenA: ethers.Contract;
    let tokenB: ethers.Contract;
    let transferToken: ethers.Contract;
    let addressTokenA: string;
    let addressTokenB: string;
    let price: BigInt;
    let addressTransferToken: string;
    let owner: ethers.Signer, user: ethers.Signer, wallet: ethers.Wallet;
    let ownerAddress: string, userAddress: string, walletAddress: string;


    before(async () => {
            Token = await hardhatEthers.getContractFactory('Token');
            TransferToken = await hardhatEthers.getContractFactory('TransferToken');
            tokenA = await Token.deploy('Ala', 'AL', 6);
            tokenB = await Token.deploy('Bla', 'BL', 2);
            addressTokenA = tokenA.address;
            addressTokenB = tokenB.address;
            price = BigInt(2.93 * 1e18);
            transferToken = await TransferToken.deploy(addressTokenA, addressTokenB, price);
            addressTransferToken = transferToken.address;
            [owner, user] = await hardhatEthers.getSigners();
            wallet = await ethers.Wallet.createRandom();
            ownerAddress = await owner.getAddress();
            userAddress = await user.getAddress();
            walletAddress = await wallet.getAddress();

            // owner = await transferToken.owner();

    });
        it('Created tokens A & B with appropriate names', async function () {
            const expectedNameA = 'Ala';
            const expectedNameB = 'Bla';
            const tokenA = await Token.deploy('Ala', 'AL', 6);
            const tokenB = await Token.deploy('Bla', 'BL', 2);
            (await tokenA.name()).should.equal(expectedNameA);
            (await tokenB.name()).should.equal(expectedNameB);
        });

    it('owner got 1000 A-tokens and 1000 B-tokens', async function() {
        await testIfAccountBalanceHasExpectedValue(ownerAddress, tokenA, BigInt(1000 * 1e6));
        await testIfAccountBalanceHasExpectedValue(ownerAddress, tokenB, BigInt(1000 * 1e2));
    });
        it('owner approved TransferToken and called function deposit()', async function() {
            await tokenA.approve(addressTransferToken, BigInt(500 * 1e6));
            await tokenB.approve(addressTransferToken, BigInt(250 * 1e2));

            await transferToken.deposit(addressTokenB, BigInt(250 * 1e2));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(250 * 1e2));
        });

        it('owner sent a certain amount of tokenA to user, user set an allowance to transferToken', async function() {
            await tokenA.transfer(userAddress, BigInt(500 * 1e6));
            console.log(ownerAddress);
            console.log(userAddress);
            await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, BigInt(500 * 1e6));

            await tokenA.connect(user).approve(addressTransferToken, BigInt(500 * 1e6));
        });

        it('user exchanged tokenA for tokenB', async function() {

            await transferToken.connect(user).exchange(addressTokenA, BigInt(500 * 1e6));

            await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, BigInt(0));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(500 * 1e6));
            await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, BigInt(17065)); // ~ 170.648 *1e2
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(7935)); // 79.35 * 1e2
        });

    it('owner called updatePrice and user exchanged tokens for the new price', async function() {

        price = BigInt(2.1112 * 1e18);
        await transferToken.updatePrice(price);

        await tokenB.connect(user).approve(addressTransferToken, BigInt(170.65 * 1e2));
        await transferToken.connect(user).exchange(addressTokenB, BigInt(170.65 * 1e2));

        await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, BigInt(360.276280 * 1e6));
        await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(139.723720 * 1e6));
        await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, BigInt(0));
        await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(7935) + BigInt(17065)); // 250.00 * 1e2
    });



    it('transferToken didn\'t exchange tokens due to insufficient balance', async function() {
        transferToken.connect(user).exchange(addressTokenB, BigInt(100 * 1e18));
            //.should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");
    });


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

