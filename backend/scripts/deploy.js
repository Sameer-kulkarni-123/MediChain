// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Medicine = await ethers.getContractFactory("MedicineCrateTracking");
  const contract = await Medicine.deploy();

  await contract.waitForDeployment(); // ✅ Modern ethers (v6+) uses this instead of .deployed()
  console.log("✅ Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
