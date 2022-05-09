import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

import {task} from "hardhat/config";
// task action function receives the Hardhat Runtime Environment as second argument
task(
    "blockNumber",
    "Prints the current block number",
    async (_, { ethers }) => {
        await ethers.provider.getBlockNumber().then((blockNumber) => {
            console.log("Current block number: " + blockNumber);
        });
    }
);

module.exports = {
    solidity: "0.8.12",
};