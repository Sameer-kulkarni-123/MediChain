import Web3 from "web3";
import contractABI from './abi/MedicineCrateTracking.json';

// const contractAddress = process.env.NEXT_PUBLIC_CONRACT_ADDRESS_IN_SEPOLIA; // Use NEXT_PUBLIC_ to expose in frontend
const contractAddress = process.env.NEXT_PUBLIC_CONRACT_ADDRESS_IN_LOCAL;

// Helper: Get Web3 instance and contract (client-side only)
function getWeb3AndContract() {
  if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
    throw new Error("Web3 not available - make sure this code runs on client side");
  }

  const web3 = new Web3(window.ethereum);
  
  if (!contractAddress) {
    throw new Error("Contract address not configured. Please check your environment variables.");
  }
  
  console.log("Contract Address:", contractAddress);
  console.log("Contract ABI loaded:", !!contractABI);
  
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  return { web3, contract };
}

export async function getAccount() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log("Connected account:", accounts[0]);
    return accounts[0];
  } catch (error) {
    console.error("Error getting account:", error);
    throw new Error("Failed to connect wallet. Please make sure MetaMask is installed and connected.");
  }
}

// 1. Register a new crate
export async function registerCrate(crateCode, batchId, medicineId, medicineName, manufacturerWalletAddress, manufacturerPhysicalAddress, cidDocument, bottleCount, bottleCodes) {
  try {
    console.log("Registering crate with parameters:", {
      crateCode,
      batchId,
      medicineId,
      medicineName,
      manufacturerWalletAddress,
      manufacturerPhysicalAddress,
      cidDocument,
      bottleCount,
      bottleCodesLength: bottleCodes?.length
    });

    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    
    // Validate parameters
    if (!crateCode || !batchId || !medicineId || !medicineName || !manufacturerWalletAddress || !manufacturerPhysicalAddress) {
      throw new Error("Missing required parameters for crate registration");
    }
    
    if (!bottleCodes || bottleCodes.length === 0) {
      throw new Error("Bottle codes array cannot be empty");
    }
    
    if (bottleCount <= 0 || bottleCount > 99999) {
      throw new Error("Invalid bottle count");
    }

    console.log("Calling contract.registerCrate...");
    
    const result = await contract.methods.registerCrate(
      crateCode,
      batchId,
      medicineId,
      medicineName,
      manufacturerWalletAddress,
      manufacturerPhysicalAddress,
      cidDocument,
      bottleCount,
      bottleCodes
    ).send({ from: account });
    
    console.log("Crate registration successful:", result);
    return result;
  } catch (error) {
    console.error("Error registering crate:", error);
    
    // Provide more specific error messages
    if (error.message.includes("User denied")) {
      throw new Error("Transaction was rejected by user");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient funds for transaction");
    } else if (error.message.includes("Crate already registered")) {
      throw new Error("Crate code already exists in the system");
    } else if (error.message.includes("execution reverted")) {
      throw new Error("Contract execution failed. Please check your parameters and try again.");
    } else {
      throw new Error(`Failed to register crate: ${error.message}`);
    }
  }
}

// 2. Send crate to next holder
export async function sendCrate(crateCode, toAddress) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    return contract.methods.crateSent(crateCode, toAddress).send({ from: account });
  } catch (error) {
    console.error("Error sending crate:", error);
    throw new Error(`Failed to send crate: ${error.message}`);
  }
}

// 3. Receive crate by next holder
export async function receiveCrate(crateCode) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    return contract.methods.crateReceived(crateCode).send({ from: account });
  } catch (error) {
    console.error("Error receiving crate:", error);
    throw new Error(`Failed to receive crate: ${error.message}`);
  }
}

// 4. Mark crate as received by retailer (final destination)
export async function retailerReceivedCrate(crateCode) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    return contract.methods.crateRetailerReceived(crateCode).send({ from: account });
  } catch (error) {
    console.error("Error marking crate as received by retailer:", error);
    throw new Error(`Failed to mark crate as received: ${error.message}`);
  }
}

// 5. Scan bottle at final destination
export async function scanBottle(bottleCode) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    return contract.methods.scanBottle(bottleCode).send({ from: account });
  } catch (error) {
    console.error("Error scanning bottle:", error);
    throw new Error(`Failed to scan bottle: ${error.message}`);
  }
}

// 6. Get crate info
export async function getCrate(crateCode) {
  try {
    const { contract } = getWeb3AndContract();
    return contract.methods.crates(crateCode).call();
  } catch (error) {
    console.error("Error getting crate info:", error);
    throw new Error(`Failed to get crate info: ${error.message}`);
  }
}

// 7. Get bottle scan info
export async function getBottleScan(bottleCode) {
  try {
    const { contract } = getWeb3AndContract();
    return contract.methods.bottleScans(bottleCode).call();
  } catch (error) {
    console.error("Error getting bottle scan info:", error);
    throw new Error(`Failed to get bottle scan info: ${error.message}`);
  }
}

// 8. Parse crateCode from bottleCode (helper function)
export function parseCrateFromBottle(bottleCode) {
  return bottleCode.split("-")[0];
}

// 9. Get all events for a crate (helper function)
export async function getCrateEvents(crateCode) {
  try {
    const { contract } = getWeb3AndContract();
    const events = await contract.getPastEvents('allEvents', {
      filter: { crateCode: crateCode },
      fromBlock: 0,
      toBlock: 'latest'
    });
    return events;
  } catch (error) {
    console.error("Error getting crate events:", error);
    throw new Error(`Failed to get crate events: ${error.message}`);
  }
}

// 10. Get bottle scan events (helper function)
export async function getBottleScanEvents(bottleCode) {
  try {
    const { contract } = getWeb3AndContract();
    const events = await contract.getPastEvents('BottleScanned', {
      filter: { bottleCode: bottleCode },
      fromBlock: 0,
      toBlock: 'latest'
    });
    return events;
  } catch (error) {
    console.error("Error getting bottle scan events:", error);
    throw new Error(`Failed to get bottle scan events: ${error.message}`);
  }
}

// 11. Debug function to check contract connection
export async function debugContractConnection() {
  try {
    const { contract, web3 } = getWeb3AndContract();
    const account = await getAccount();
    const networkId = await web3.eth.net.getId();
    const balance = await web3.eth.getBalance(account);
    
    console.log("Debug Info:", {
      contractAddress,
      account,
      networkId,
      balance: web3.utils.fromWei(balance, 'ether') + " ETH",
      isConnected: !!account
    });
    
    return {
      contractAddress,
      account,
      networkId,
      balance: web3.utils.fromWei(balance, 'ether'),
      isConnected: !!account
    };
  } catch (error) {
    console.error("Debug connection error:", error);
    throw error;
  }
}
