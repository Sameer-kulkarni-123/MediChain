require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox");
console.log("RPC:", process.env.SEPOLIA_END_POINT_URL);
console.log("PK:", process.env.METAMASK_ACCOUNT_PRIVATE_KEY?.length);


// require("@nomiclabs/hardhat-ethers")
/** @type import('hardhat/config').HardhatUserConfig */

const {SEPOLIA_END_POINT_URL, METAMASK_ACCOUNT_PRIVATE_KEY} = process.env;

module.exports = {
  solidity: {
    version: "0.8.20", // or your version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // <== Enable IR-based compilation
    },
  },
  networks:{
    sepolia: {
      url: SEPOLIA_END_POINT_URL,
      accounts: [
        `0x${METAMASK_ACCOUNT_PRIVATE_KEY}`
      ]
    }
  }
};
