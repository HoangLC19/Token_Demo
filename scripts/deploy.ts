import { ethers, run, network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
// import {NFT721, NFT1155} from "../typechain-types";

async function main() {
  // console.log("Deploying NFT721 Contract...")
  // const NFT721 = await ethers.getContractFactory("NFT721");
  // const nft721 = await NFT721.deploy();
  // await nft721.deployed();
  // console.log("NFT721 Deployed Successfully to: ", nft721.address);

  // if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
  //   console.log("verify NFT721 contract...")
  //   await verify("0x0bdF1Dcd281f45E885Ae93eDb28D972096D648Da", [])
  // }

  // console.log("Deploying NFT1155 Contract...")
  // const NFT1155 = await ethers.getContractFactory("NFT1155");
  // const nft1155 = await NFT1155.deploy();
  // await nft1155.deployed();
  // console.log("NFT1155 Deployed Successfully to: ", nft1155.address);

  // if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
  //   console.log("verify NFT1155 contract...")
  //   await verify("0x8fa551BefF617D4A80509C28c220cE63d2bBcBE4", [])
  // }

  console.log("Deploying StakingToken20 Contract...")
  const StakingToken20 = await ethers.getContractFactory("StakingToken20");
  const stakingToken20 = await StakingToken20.deploy(
      "0xcD7Ad6644869549532f78d66AB764623666E63a0",
      5,
      5,
      ethers.utils.parseEther("10000")
  )
  await stakingToken20.deployed();
  const contractAddress = stakingToken20.address;1
  console.log("StakingToken20 Deployed Successfully to: ", contractAddress);

  

  if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
    await stakingToken20.deployTransaction.wait(6)
    console.log("verify StakingToken20 contract...")
    await verify(contractAddress, [
        "0xcD7Ad6644869549532f78d66AB764623666E63a0",
        5,
        5,
        ethers.utils.parseEther("10000")
    ])
  }
}

async function verify(contractAddress: string, args: Array<any>) {
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args
    })
  } catch (err: any) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("Already verified")
    } else {
      console.log(err)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
