import Web3 from "web3";
import contractABI from '../abi/MedicineCrateTracking.json';

// const contractAddress = process.env.NEXT_PUBLIC_CONRACT_ADDRESS_IN_SEPOLIA; // Use NEXT_PUBLIC_ to expose in frontend
const contractAddress = process.env.NEXT_PUBLIC_CONRACT_ADDRESS_IN_LOCAL; // Use NEXT_PUBLIC_ to expose in frontend

// Helper: Get Web3 instance and contract (client-side only)
function getWeb3AndContract() {
  if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
    throw new Error("Web3 not available - make sure this code runs on client side");
  }

  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  return { web3, contract };
}

async function getAccount() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

// 1. Register a new crate
export async function registerCrate(crateCode, crate) {
  console.log("running registerCrate")
  const { contract } = getWeb3AndContract();
  const account = await getAccount();
  console.log(account)
  return contract.methods.registerCrate(
    crateCode,
    crate.batchId,
    crate.medicineId,
    crate.medicineName,
    crate.manufacturerId,
    // crate.manufacturerAddress,
    account,  // Use current account as manufacturer address
    account, // Use current account as manufacturer address
    // crate.currentAddress,
    crate.currentAddressId,
    crate.cidDocuments,
    crate.bottleCount
  ).send({ from: account });
}

// 2. Send crate
export async function sendCrate(crateCode, toAddress, toId) {
  const { contract } = getWeb3AndContract();
  const account = await getAccount();
  return contract.methods.crateSent(crateCode, toAddress, toId).send({ from: account });
}

// 3. Receive crate
export async function receiveCrate(crateCode, newLocationId) {
  const { contract } = getWeb3AndContract();
  const account = await getAccount();
  return contract.methods.crateReceived(crateCode, newLocationId).send({ from: account });
}

// 4. Set retail location
export async function setRetailLocation(crateCode, latitude, longitude) {
  const { contract } = getWeb3AndContract();
  const account = await getAccount();
  const latInt = Math.round(latitude * 1e6);
  const longInt = Math.round(longitude * 1e6);
  return contract.methods.setRetailLocation(crateCode, latInt, longInt).send({ from: account });
}

// 5. Scan bottle
export async function scanBottle(bottleCode, latitude, longitude) {
  const { contract } = getWeb3AndContract();
  const account = await getAccount();
  const latInt = Math.round(latitude * 1e6);
  const longInt = Math.round(longitude * 1e6);
  return contract.methods.scanBottle(bottleCode, latInt, longInt).send({ from: account });
}

// 6. Get crate info
export async function getCrate(crateCode) {
  const { contract } = getWeb3AndContract();
  return contract.methods.crates(crateCode).call();
}

// 7. Get bottle scan info
export async function getBottleScan(bottleCode) {
  const { contract } = getWeb3AndContract();
  return contract.methods.bottleScans(bottleCode).call();
}

// 8. Parse crateCode from bottleCode
export function parseCrateFromBottle(bottleCode) {
  return bottleCode.split("-")[0];
}
