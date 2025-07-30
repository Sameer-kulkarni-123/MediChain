const { ethers } = require("ethers");
const contractABI = require("../abi/MedicineCrateTracking.json");
require("dotenv").config();

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");

// Properly connected wallets
const wallets = {
  manufacturer: new ethers.Wallet(
    "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e",
    provider
  ),
  distributor: new ethers.Wallet(
    "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0",
    provider
  ),
  retailer: new ethers.Wallet(
    "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd",
    provider
  ),
};

// Connected contract instances
const contractInstances = {
  manufacturer: new ethers.Contract(contractAddress, contractABI, wallets.manufacturer.connect(provider)),
  distributor: new ethers.Contract(contractAddress, contractABI, wallets.distributor.connect(provider)),
  retailer: new ethers.Contract(contractAddress, contractABI, wallets.retailer.connect(provider)),
};

// Test data
const crateCode = "CR001";
const batchID = "BATCH001";
const productID = "PROD001";
const medicineName = "Paracetamol";
const cidDocument = "QmTestCID";
const bottleCount = 3;
const bottleIds = ["CR001_BC001", "CR001_BC002", "CR001_BC003"];
const subCrateID = "CR001_SUB01";
const subCrateBottleIds = ["CR001_BC001", "CR001_BC002"];

// Utility to wrap and retry tx
async function sendTx(txPromise, description) {
  try {
    const tx = await txPromise;
    await tx.wait();
    console.log(`✅ ${description} - PASSED`);
  } catch (err) {
    console.log(`❌ ${description} - FAILED:`, err.info?.error?.message || err.message);
  }
}

async function runTests() {
  await sendTx(
    contractInstances.manufacturer.registerCrate(
      crateCode,
      batchID,
      productID,
      medicineName,
      cidDocument,
      bottleCount,
      bottleIds
    ),
    "Crate registration"
  );

  await sendTx(
    contractInstances.manufacturer.registerCrate(
      crateCode,
      batchID,
      productID,
      medicineName,
      cidDocument,
      bottleCount,
      bottleIds
    ),
    "Duplicate crate registration (should fail)"
  );

  await sendTx(
    contractInstances.manufacturer.crateSend(crateCode, wallets.distributor.address),
    "Crate send to distributor"
  );

  await sendTx(
    contractInstances.manufacturer.crateSend(crateCode, wallets.distributor.address),
    "Double crate send (should fail)"
  );

  await sendTx(
    contractInstances.retailer.crateReceived(crateCode),
    "Unauthorized crate receive (should fail)"
  );

  await sendTx(
    contractInstances.distributor.crateReceived(crateCode),
    "Crate received by distributor"
  );

  await sendTx(
    contractInstances.retailer.createSubCrate(crateCode, subCrateID, subCrateBottleIds),
    "Retailer subcrate creation (should fail)"
  );

  await sendTx(
    contractInstances.distributor.createSubCrate(crateCode, subCrateID, subCrateBottleIds),
    "Subcrate creation by distributor"
  );

  await sendTx(
    contractInstances.distributor.crateSend(crateCode, wallets.retailer.address),
    "Crate send after subcrate (should fail)"
  );

  await sendTx(
    contractInstances.distributor.subCrateSend(subCrateID, wallets.retailer.address),
    "Subcrate sent to retailer"
  );

  await sendTx(
    contractInstances.retailer.subCrateRetailerReceived(subCrateID),
    "Subcrate received by retailer"
  );

  await sendTx(
    contractInstances.retailer.scanBottle("CR001_BC001"),
    "First scan of CR001_BC001"
  );

  await sendTx(
    contractInstances.retailer.scanBottle("CR001_BC001"),
    "Double scan of CR001_BC001 (should fail)"
  );

  await sendTx(
    contractInstances.retailer.scanBottle("CR001_BC003"),
    "Scan of bottle not in subcrate (should fail)"
  );
}

runTests();
