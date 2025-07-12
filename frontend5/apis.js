import Web3 from "web3";
import contractABI from './abi/MedicineCrateTracking.json';

// const contractAddress = process.env.NEXT_PUBLIC_CONRACT_ADDRESS_IN_SEPOLIA; // Use NEXT_PUBLIC_ to expose in frontend
const contractAddress = process.env.NEXT_PUBLIC_CONRACT_ADDRESS_IN_LOCAL;
console.log(contractAddress);

// Helper: Get Web3 instance and contract (client-side only)
function getWeb3AndContract() {
  if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
    throw new Error("Web3 not available - make sure this code runs on client side");
  }

  const web3 = new Web3(window.ethereum);


  if (!contractAddress) {
    throw new Error("Contract address not configured. Please check your environment variables.");
  }

  // console.log("Contract Address:", contractAddress);
  // console.log("Contract ABI loaded:", !!contractABI);

  const contract = new web3.eth.Contract(contractABI, contractAddress);
  return { web3, contract };
}

export async function getAccount() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    // console.log("Connected account:", accounts[0]);
    return accounts[0];
  } catch (error) {
    console.error("Error getting account:", error);
    throw new Error("Failed to connect wallet. Please make sure MetaMask is installed and connected.");
  }
}

// 1. Register a new crate (corresponds to createCrate in Solidity)
export async function createCrate(crateCode, batchId, medicineId, medicineName, manufacturerPhysicalAddress, cidDocument, bottleCount, bottleCodes) {
  try {
    console.log("Creating crate with parameters:", {
      crateCode,
      batchId,
      medicineId,
      medicineName,
      manufacturerPhysicalAddress,
      cidDocument,
      bottleCount,
      bottleCodesLength: bottleCodes?.length
    });

    const { contract } = getWeb3AndContract();
    const account = await getAccount();

    // Validate parameters
    if (!crateCode || !batchId || !medicineId || !medicineName || !manufacturerPhysicalAddress) {
      throw new Error("Missing required parameters for crate creation");
    }

    if (!bottleCodes || bottleCodes.length === 0) {
      throw new Error("Bottle codes array cannot be empty");
    }

    if (bottleCount <= 0 || bottleCount > 99999) {
      throw new Error("Invalid bottle count");
    }

    console.log("Calling contract.methods.createCrate...");

    const result = await contract.methods.createCrate(
      crateCode,
      batchId,
      medicineId,
      medicineName,
      manufacturerPhysicalAddress,
      cidDocument || "", // Ensure cidDocument is always a string
      Number(bottleCount), // Ensure bottleCount is a number
      bottleCodes
    ).send({ from: account });

    console.log("Crate creation successful:", result);
    return result;
  } catch (error) {
    console.error("Error creating crate:", error);
    let errorMessage = "Failed to create crate: Unknown error.";
    if (error.message.includes("User denied")) {
      errorMessage = "Transaction was rejected by user.";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction.";
    } else if (error.message.includes("Crate with this code already exists.")) {
      errorMessage = "Crate code already exists in the system.";
    } else if (error.message.includes("Bottle count must match number of bottle codes.")) {
      errorMessage = "Bottle count must match the number of provided bottle codes.";
    } else if (error.message.includes("execution reverted")) {
      // Attempt to parse specific revert reason
      const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorMessage = `Contract execution failed: ${revertReasonMatch[1]}.`;
      } else {
        errorMessage = "Contract execution failed. Please check your parameters and try again.";
      }
    } else {
      errorMessage = `Failed to create crate: ${error.message}.`;
    }
    throw new Error(errorMessage);
  }
}

// 2. Send crate to distributor (corresponds to sendCrateToDistributor in Solidity)
export async function sendCrateToDistributor(crateCode, distributorWalletAddress) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    const result = await contract.methods.sendCrateToDistributor(crateCode, distributorWalletAddress).send({ from: account });
    return result;
  } catch (error) {
    console.error("Error sending crate to distributor:", error);
    let errorMessage = "Failed to send crate to distributor: Unknown error.";
    if (error.message.includes("User denied transaction signature")) {
      errorMessage = "Transaction denied by user.";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction.";
    } else if (error.message.includes("execution reverted")) {
      const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorMessage = `Contract execution failed: ${revertReasonMatch[1]}.`;
      } else {
        errorMessage = "Contract execution failed. Please check your parameters and try again.";
      }
    } else {
      errorMessage = `Failed to send crate to distributor: ${error.message}.`;
    }
    throw new Error(errorMessage);
  }
}

// 3. Distributor receives crate (corresponds to distributorReceiveCrate in Solidity)
export async function distributorReceiveCrate(crateCode, distributorPhysicalAddress) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    console.log("Receiving crate:", crateCode);
    const receipt = await contract.methods.distributorReceiveCrate(crateCode, distributorPhysicalAddress).send({ from: account });
    console.log("Crate received by distributor:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error receiving crate by distributor:", error);
    let errorMessage = "Failed to receive crate: Unknown error.";
    if (error.message.includes("User denied transaction signature")) {
      errorMessage = "Transaction denied by user.";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction.";
    } else if (error.message.includes("execution reverted")) {
      const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorMessage = `Contract execution failed: ${revertReasonMatch[1]}.`;
      } else {
        errorMessage = "Contract execution failed. Please check your parameters and try again.";
      }
    } else {
      errorMessage = `Failed to receive crate: ${error.message}.`;
    }
    throw new Error(errorMessage);
  }
}

// 4. Send crate to retailer (corresponds to sendCrateToRetailer in Solidity)
export async function sendCrateToRetailer(crateCode, retailerWalletAddress) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    const result = await contract.methods.sendCrateToRetailer(crateCode, retailerWalletAddress).send({ from: account });
    return result;
  } catch (error) {
    console.error("Error sending crate to retailer:", error);
    let errorMessage = "Failed to send crate to retailer: Unknown error.";
    if (error.message.includes("User denied transaction signature")) {
      errorMessage = "Transaction denied by user.";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction.";
    } else if (error.message.includes("execution reverted")) {
      const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorMessage = `Contract execution failed: ${revertReasonMatch[1]}.`;
      } else {
        errorMessage = "Contract execution failed. Please check your parameters and try again.";
      }
    } else {
      errorMessage = `Failed to send crate to retailer: ${error.message}.`;
    }
    throw new Error(errorMessage);
  }
}

// 5. Retailer receives crate (corresponds to retailerReceiveCrate in Solidity)
export async function retailerReceiveCrate(crateCode, retailerPhysicalAddress) {
  try {
    const { contract } = getWeb3AndContract();
    const account = await getAccount();
    const result = await contract.methods.retailerReceiveCrate(crateCode, retailerPhysicalAddress).send({ from: account });
    return result;
  } catch (error) {
    console.error("Error receiving crate by retailer:", error);
    let errorMessage = "Failed to receive crate by retailer: Unknown error.";
    if (error.message.includes("User denied transaction signature")) {
      errorMessage = "Transaction denied by user.";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for transaction.";
    } else if (error.message.includes("execution reverted")) {
      const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorMessage = `Contract execution failed: ${revertReasonMatch[1]}.`;
      } else {
        errorMessage = "Contract execution failed. Please check your parameters and try again.";
      }
    } else {
      errorMessage = `Failed to receive crate: ${error.message}.`;
    }
    throw new Error(errorMessage);
  }
}

// 6. Get crate details (corresponds to getCrateDetails in Solidity)
export async function getCrateDetails(crateCode) {
  try {
    const { contract } = getWeb3AndContract();
    return await contract.methods.getCrateDetails(crateCode).call();
  } catch (error) {
    console.error("Error getting crate details:", error);
    let errorMessage = "Failed to get crate details: Unknown error.";

    // Prioritize checking error.data for specific revert reasons from call methods
    if (error.data) {
      if (typeof error.data === 'object' && error.data.message) {
        const revertReasonMatch = error.data.message.match(/revert (.*?)(?:\s*at|\s*$)/);
        if (revertReasonMatch && revertReasonMatch[1]) {
          errorMessage = `Contract execution reverted: ${revertReasonMatch[1]}.`;
        } else {
          errorMessage = `Blockchain error: ${error.data.message}.`;
        }
      } else if (typeof error.data === 'string') {
        const revertReasonMatch = error.data.match(/revert (.*?)(?:\s*at|\s*$)/);
         if (revertReasonMatch && revertReasonMatch[1]) {
          errorMessage = `Contract execution reverted: ${revertReasonMatch[1]}.`;
        } else {
          errorMessage = `Blockchain error: ${error.data}.`;
        }
      }
    } else if (error.message) {
      if (error.message.includes("Parameter decoding error: Returned values aren't valid")) {
        // This is the specific AbiError you're seeing.
        errorMessage = "Crate not found or contract ABI mismatch. Please ensure the crate code is correct, the contract is deployed, and your ABI matches the deployed contract's ABI. Also, check if your blockchain node is fully synced.";
      } else {
        const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
        if (revertReasonMatch && revertReasonMatch[1]) {
          errorMessage = `Contract execution reverted: ${revertReasonMatch[1]}.`;
        } else if (error.message.includes("Crate does not exist.")) {
          errorMessage = "Crate with this code does not exist.";
        } else {
          errorMessage = `Failed to get crate details: ${error.message}.`;
        }
      }
    } else if (error.reason) {
      errorMessage = `Blockchain error: ${error.reason}.`;
    }

    throw new Error(errorMessage);
  }
}


// 7. Get all events for a crate (helper function)
export async function getCrateEvents(crateCode) {
  try {
    const { contract } = getWeb3AndContract();
    const events = await contract.getPastEvents('allEvents', {
      filter: { crateCode: crateCode },
      fromBlock: 0,
      toBlock: 'latest'
    });
    // Filter events to only include those relevant to crate tracking
    const filteredEvents = events.filter(event =>
      ['CrateCreated', 'CrateInTransit', 'CrateReceived'].includes(event.event)
    );
    return filteredEvents;
  } catch (error) {
    console.error("Error getting crate events:", error);
    throw new Error(`Failed to get crate events: ${error.message}`);
  }
}

// 8. Debug function to check contract connection
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

// 9. Get all crate codes from the blockchain
export async function getAllCrateCodes() {
  try {
    const { contract } = getWeb3AndContract();
    const crateCodes = await contract.methods.getAllCrateCodes().call();
    console.log("All crate codes in blockchain:", crateCodes);
    return crateCodes;
  } catch (error) {
    console.error("Error fetching all crate codes:", error);
    let errorMessage = "Failed to retrieve all crate codes from the blockchain: Unknown error.";
    if (error.message.includes("Parameter decoding error: Returned values aren't valid")) {
      errorMessage = "No crates found or contract ABI mismatch for getAllCrateCodes. Please ensure you have created crates, the contract is deployed with the correct ABI, and your blockchain node is fully synced.";
    } else if (error.message.includes("execution reverted")) {
      const revertReasonMatch = error.message.match(/revert (.*?)(?:\s*at|\s*$)/);
      if (revertReasonMatch && revertReasonMatch[1]) {
        errorMessage = `Contract execution reverted: ${revertReasonMatch[1]}.`;
      } else {
        errorMessage = "Contract execution failed. Please check your contract's `getAllCrateCodes` function.";
      }
    } else {
      errorMessage = `Failed to retrieve all crate codes: ${error.message}.`;
    }
    throw new Error(errorMessage);
  }
}
