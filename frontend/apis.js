import Web3 from "web3";

// Replace with your actual contract ABI and address
import contractABI from './abi/MedicineCrateTracking.json';
const contractAddress = process.env.CONRACT_ADDRESS_IN_SEPOLIA;

const web3 = new Web3(window.ethereum); // Or use Infura/websocket provider
const contract = new web3.eth.Contract(contractABI, contractAddress);

// 🚀 Get the current user's address
async function getAccount() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

// ✅ 1. Register a new crate
export async function registerCrate(crate) {
  const account = await getAccount();

  return contract.methods.registerCrate(
    crate.crateCode,
    crate.batchId,
    crate.medicineId,
    crate.medicineName,
    crate.manufacturerId,
    crate.manufacturerAddress,
    crate.currentAddress,
    crate.currentAddressId,
    crate.cidDocuments,
    crate.bottleCount
  ).send({ from: account });
}

// ✅ 2. Mark crate as sent
export async function sendCrate(crateCode, toAddress, toId) {
  const account = await getAccount();
  return contract.methods.crateSent(crateCode, toAddress, toId)
    .send({ from: account });
}

// ✅ 3. Mark crate as received
export async function receiveCrate(crateCode, newLocationId) {
  const account = await getAccount();
  return contract.methods.crateReceived(crateCode, newLocationId)
    .send({ from: account });
}

// ✅ 4. Set retail geofence location
export async function setRetailLocation(crateCode, latitude, longitude) {
  const account = await getAccount();
  const latInt = Math.round(latitude * 1e6);
  const longInt = Math.round(longitude * 1e6);

  return contract.methods.setRetailLocation(crateCode, latInt, longInt)
    .send({ from: account });
}

// ✅ 5. Scan bottle (records location + timestamp)
export async function scanBottle(bottleCode, latitude, longitude) {
  const account = await getAccount();
  const latInt = Math.round(latitude * 1e6);
  const longInt = Math.round(longitude * 1e6);

  return contract.methods.scanBottle(bottleCode, latInt, longInt)
    .send({ from: account });
}

// ✅ 6. Get crate info
export async function getCrate(crateCode) {
  return contract.methods.crates(crateCode).call();
}

// ✅ 7. Get bottle scan info
export async function getBottleScan(bottleCode) {
  return contract.methods.bottleScans(bottleCode).call();
}

// ✅ 8. Parse crateCode from bottleCode (can also be done off-chain)
export function parseCrateFromBottle(bottleCode) {
  return bottleCode.split("-")[0];
}
