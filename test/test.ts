import { ethers as hardhatEthers } from 'hardhat';
import { describe } from 'mocha';
import { BigNumber, ethers } from 'ethers';
import {
  parseUnits,
} from 'ethers/lib/utils';

require('chai')
  .use(require('chai-as-promised'))
  .should();

// @ts-ignore
async function testIfAccountBalanceHasExpectedValue(address: string, token: hardhatEthers.ContractFactory, amount: number) {
  const balance: BigNumber = await token.balanceOf(address);
  const tokenDecimals: number = await token.decimals();
  const parsedAmount: BigNumber = parseUnits(amount.toString(), tokenDecimals);

  balance.should.equal(parsedAmount);
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
  // let price: number;
  let addressTransferToken: string;
  let owner: ethers.Signer;
  let user: ethers.Signer;
  let ownerAddress: string;
  let userAddress: string;

  before(async () => {
    Token = await hardhatEthers.getContractFactory('Token');
    TransferToken = await hardhatEthers.getContractFactory('TransferToken');
    tokenA = await Token.deploy('Ala', 'AL', 4);
    tokenB = await Token.deploy('Bla', 'BL', 3);
    addressTokenA = tokenA.address;
    addressTokenB = tokenB.address;
    transferToken = await TransferToken.deploy(addressTokenA, addressTokenB, parseUnits('2', 2)); /// ppppooooteeem
    addressTransferToken = transferToken.address;
    [owner, user] = await hardhatEthers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();

    // owner = await transferToken.owner();
  });
  it('Created tokens A & B with appropriate names', async () => {
    (await tokenA.name()).should.equal('Ala');
    (await tokenB.name()).should.equal('Bla');
    (await tokenA.decimals()).should.equal(4);
    (await tokenB.decimals()).should.equal(3);
  });

  it('owner got 1000 A-tokens and 1000 B-tokens', async () => {
    await testIfAccountBalanceHasExpectedValue(ownerAddress, tokenA, 1000);
    await testIfAccountBalanceHasExpectedValue(ownerAddress, tokenB, 1000);
  });
  it('owner approved TransferToken and called function deposit()', async () => {
    await tokenA.approve(addressTransferToken, parseUnits('500', 4));
    await tokenB.approve(addressTransferToken, parseUnits('250', 3));
    await transferToken.deposit(addressTokenB, parseUnits('250', 3));
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 250);
    await transferToken.deposit(userAddress, parseUnits('250', 3)).should.be.rejectedWith(Error, "VM Exception while processing transaction: reverted with reason string 'First argument can be either address of token A or address of token B");
  });

  it('owner sent a certain amount of tokenA to user, user set an allowance to transferToken', async () => {
    await tokenA.transfer(userAddress, parseUnits('500', 4));
    await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, 500);

    await tokenA.connect(user).approve(addressTransferToken, parseUnits('500', 4));
  });

  it('user exchanged tokenA for tokenB', async () => {
    await transferToken.connect(user).exchange(addressTokenA, parseUnits('500', 4));

    await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, 0);
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, 500);
    await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, 250);
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 0);
  });

  it('owner called updatePrice and user exchanged tokens for the new price', async () => {
    await transferToken.updatePrice(parseUnits('2.1112', 4), 4);

    await tokenB.connect(user).approve(addressTransferToken, parseUnits('100', 3));
    await transferToken.connect(user).exchange(addressTokenB, parseUnits('100', 3));

    await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, 211.12);
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, 288.88);
    await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, 150);
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 100);

    await transferToken.updatePrice(parseUnits('3', 2), 2);

    await tokenA.connect(user).approve(addressTransferToken, parseUnits('200', 4));
    await transferToken.connect(user).exchange(addressTokenA, parseUnits('200', 4));

    await testIfAccountBalanceHasExpectedValue(userAddress, tokenA, 11.122);
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, 488.878);
    await testIfAccountBalanceHasExpectedValue(userAddress, tokenB, 216.666);
    await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 33.334);

    await transferToken.updatePrice(parseUnits('2.02', 4), 4);
  });
  it('transferToken didn\'t exchange tokens due to insufficient balance', async () => {
    await transferToken.connect(user).exchange(addressTokenB, parseUnits('2000', 3))
      .should.be.rejectedWith(Error, 'Transaction reverted without a reason string');
  });
});
