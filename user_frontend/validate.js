import { ethers } from "ethers";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const contractABI = require('./abi/MedicineCrateTracking.json');
import dotenv from "dotenv";
dotenv.config();

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
const privateKey = "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0"

const publicWallet = new ethers.Wallet(privateKey, provider);
const contractInstance = new ethers.Contract(contractAddress, contractABI, publicWallet);

export async function scanBottle(bottleCode) {
  const network = await provider.getNetwork();
  console.log("PROVIDER NETWORK 1 : ", JSON.stringify(network, null, 2));

  const isValid = await contractInstance.scanBottleReadOnly(bottleCode);
  console.log("the tx of scanBottle : ", isValid)
  if(isValid){
    const tx = await contractInstance.scanBottle(bottleCode);
    const receipt = await tx.wait(); // Wait for transaction to be mined
  }

  return isValid
}

export async function debugIsExists(crateCode) {
  console.log("Block number:", await provider.getBlockNumber());
  // console.log("PROVIDER NETWORK : ", await provider.getNetwork())
  const network = await provider.getNetwork();
  console.log("PROVIDER NETWORK 1 : ", JSON.stringify(network, null, 2));
  // console.log("CONTRACT ABI : ", contractABI)

  const tx = await contractInstance.debugIsExists(crateCode) // Sends transaction
  // const receipt = await tx.wait(); // Wait for transaction to be mined
  console.log("the returned tx in debugIsExists :", tx)
  return tx
}
