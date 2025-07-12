// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MedicineCrateTracker
 * @dev A smart contract to track medicine crates from manufacturer to distributor to retailer.
 * Each crate has a unique identifier and its journey is recorded on the blockchain.
 */
contract MedicineCrateTracking {

    // Struct to define the properties of a medicine crate
    struct Crate {
        string crateCode;                       // Unique identifier for the crate
        string batchId;                         // Batch identification number
        string medicineId;                      // Medicine identification code
        string medicineName;                    // Name of the medicine
        string manufacturerPhysicalAddress;     // Physical address of manufacturer
        address manufacturerWalletAddress;      // Wallet address of manufacturer
        string currentPhysicalAddress;          // Current physical location of the crate
        address currentWalletAddress;           // Current holder's wallet address
        string cidDocument;                     // IPFS CID for document storage (e.g., batch details, certifications)
        uint256 bottleCount;                    // Number of bottles in crate
        bool inTransit;                         // Whether crate is currently in transit
        address nextHolderWalletAddress;        // Next recipient's wallet address
        bool exists;                            // Whether crate exists in the system
        address[] pastHolders;            // Array of previous holders' wallet addresses
        bool isFinalDestination;                // Whether crate reached its final destination (retailer)
        string[] bottleCodes;                   // Array of individual bottle codes within the crate
    }

    // Mapping to store crates, indexed by their unique crateCode
    mapping(string => Crate) public crates;

    // Array to store all crate codes, allowing iteration - ADDED THIS LINE
    string[] public allCrateCodes; // Declaration for allCrateCodes

    // Events to log important actions in the crate's lifecycle
    event CrateCreated(
        string indexed crateCode,
        address indexed manufacturer,
        string medicineName,
        uint256 bottleCount
    );

    event CrateInTransit(
        string indexed crateCode,
        address indexed sender,
        address indexed receiver,
        string currentPhysicalAddress
    );

    event CrateReceived(
        string indexed crateCode,
        address indexed receiver,
        string currentPhysicalAddress,
        bool isFinalDestination
    );

    /**
     * @dev Modifier to ensure that only the current holder of the crate can perform certain actions.
     * @param _crateCode The unique identifier of the crate.
     */
    modifier onlyCrateCurrentHolder(string memory _crateCode) {
        require(crates[_crateCode].exists, "Crate does not exist.");
        require(crates[_crateCode].currentWalletAddress == msg.sender, "Only the current holder can perform this action.");
        _;
    }

    /**
     * @dev Modifier to ensure that the crate is not currently in transit.
     * @param _crateCode The unique identifier of the crate.
     */
    modifier notInTransit(string memory _crateCode) {
        require(crates[_crateCode].exists, "Crate does not exist.");
        require(!crates[_crateCode].inTransit, "Crate is currently in transit.");
        _;
    }

    /**
     * @dev Modifier to ensure that the crate is currently in transit.
     * @param _crateCode The unique identifier of the crate.
     */
    modifier inTransit(string memory _crateCode) {
        require(crates[_crateCode].exists, "Crate does not exist.");
        require(crates[_crateCode].inTransit, "Crate is not in transit.");
        _;
    }

    /**
     * @dev Modifier to ensure that the crate has not reached its final destination.
     * @param _crateCode The unique identifier of the crate.
     */
    modifier notFinalDestination(string memory _crateCode) {
        require(crates[_crateCode].exists, "Crate does not exist.");
        require(!crates[_crateCode].isFinalDestination, "Crate has reached its final destination.");
        _;
    }

    /**
     * @dev Allows a manufacturer to create a new medicine crate and register it on the blockchain.
     * The manufacturer's wallet address is automatically set as the initial current holder.
     * @param _crateCode Unique identifier for the crate.
     * @param _batchId Batch identification number.
     * @param _medicineId Medicine identification code.
     * @param _medicineName Name of the medicine.
     * @param _manufacturerPhysicalAddress Physical address of the manufacturer.
     * @param _cidDocument IPFS CID for document storage.
     * @param _bottleCount Number of bottles in the crate.
     * @param _bottleCodes Array of individual bottle codes.
     */
    function createCrate(
        string memory _crateCode,
        string memory _batchId,
        string memory _medicineId,
        string memory _medicineName,
        string memory _manufacturerPhysicalAddress,
        string memory _cidDocument,
        uint256 _bottleCount,
        string[] memory _bottleCodes
    ) public {
        // Ensure the crate code is unique and does not already exist
        require(!crates[_crateCode].exists, "Crate with this code already exists.");
        // Ensure bottle count matches the number of provided bottle codes
        require(_bottleCount == _bottleCodes.length, "Bottle count must match number of bottle codes.");

        // Create a new Crate struct and populate its fields
        crates[_crateCode] = Crate({
            crateCode: _crateCode,
            batchId: _batchId,
            medicineId: _medicineId,
            medicineName: _medicineName,
            manufacturerPhysicalAddress: _manufacturerPhysicalAddress,
            manufacturerWalletAddress: msg.sender, // Manufacturer is the caller
            currentPhysicalAddress: _manufacturerPhysicalAddress, // Initial physical address
            currentWalletAddress: msg.sender,     // Manufacturer is the initial holder
            cidDocument: _cidDocument,
            bottleCount: _bottleCount,
            inTransit: false,                     // Not in transit initially
            nextHolderWalletAddress: address(0),  // No next holder initially
            exists: true,                         // Crate now exists
            pastHolders: new address[](0),  // No past holders yet
            isFinalDestination: false,            // Not at final destination
            bottleCodes: _bottleCodes
        });

        // Add the new crate code to our iterable array
        allCrateCodes.push(_crateCode); // Add crate code to the array

        // Emit an event to log the crate creation
        emit CrateCreated(_crateCode, msg.sender, _medicineName, _bottleCount);
    }

    /**
     * @dev Allows the current holder (e.g., manufacturer) to send a crate to a distributor.
     * This function updates the crate's status to 'in transit' and sets the next recipient.
     * @param _crateCode The unique identifier of the crate to send.
     * @param _distributorWalletAddress The wallet address of the distributor.
     */
    function sendCrateToDistributor(
        string memory _crateCode,
        address _distributorWalletAddress
    ) public onlyCrateCurrentHolder(_crateCode) notInTransit(_crateCode) notFinalDestination(_crateCode) {
        // Ensure the distributor address is valid
        require(_distributorWalletAddress != address(0), "Distributor wallet address cannot be zero.");

        Crate storage crate = crates[_crateCode];

        // Add the current holder to the list of past holders
        crate.pastHolders.push(crate.currentWalletAddress);

        // Update crate status for transit
        crate.inTransit = true;
        crate.nextHolderWalletAddress = _distributorWalletAddress;

        // Emit an event to log the crate being in transit
        emit CrateInTransit(_crateCode, msg.sender, _distributorWalletAddress, crate.currentPhysicalAddress);
    }

    /**
     * @dev Allows a distributor to acknowledge receipt of a crate.
     * This function updates the crate's current holder, physical address, and transit status.
     * @param _crateCode The unique identifier of the crate received.
     * @param _distributorPhysicalAddress The physical address of the distributor receiving the crate.
     */
    function distributorReceiveCrate(
        string memory _crateCode,
        string memory _distributorPhysicalAddress
    ) public inTransit(_crateCode) {
        Crate storage crate = crates[_crateCode];

        // Ensure the caller is the expected next holder
        require(crate.nextHolderWalletAddress == msg.sender, "You are not the intended recipient of this crate.");

        // Update crate status upon receipt
        crate.currentWalletAddress = msg.sender;
        crate.currentPhysicalAddress = _distributorPhysicalAddress;
        crate.inTransit = false;
        crate.nextHolderWalletAddress = address(0); // Clear next holder as it has been received

        // Emit an event to log the crate receipt
        emit CrateReceived(_crateCode, msg.sender, _distributorPhysicalAddress, crate.isFinalDestination);
    }

    /**
     * @dev Allows the current holder (e.g., distributor) to send a crate to a retailer.
     * This function updates the crate's status to 'in transit' and sets the next recipient.
     * @param _crateCode The unique identifier of the crate to send.
     * @param _retailerWalletAddress The wallet address of the retailer.
     */
    function sendCrateToRetailer(
        string memory _crateCode,
        address _retailerWalletAddress
    ) public onlyCrateCurrentHolder(_crateCode) notInTransit(_crateCode) notFinalDestination(_crateCode) {
        // Ensure the retailer address is valid
        require(_retailerWalletAddress != address(0), "Retailer wallet address cannot be zero.");

        Crate storage crate = crates[_crateCode];

        // Add the current holder to the list of past holders
        crate.pastHolders.push(crate.currentWalletAddress);

        // Update crate status for transit
        crate.inTransit = true;
        crate.nextHolderWalletAddress = _retailerWalletAddress;

        // Emit an event to log the crate being in transit
        emit CrateInTransit(_crateCode, msg.sender, _retailerWalletAddress, crate.currentPhysicalAddress);
    }

    /**
     * @dev Special function for a retailer to acknowledge receipt of a crate, marking it as final destination.
     * This function updates the crate's current holder, physical address, transit status, and final destination status.
     * @param _crateCode The unique identifier of the crate received.
     * @param _retailerPhysicalAddress The physical address of the retailer receiving the crate.
     */
    function retailerReceiveCrate(
        string memory _crateCode,
        string memory _retailerPhysicalAddress
    ) public inTransit(_crateCode) notFinalDestination(_crateCode) {
        Crate storage crate = crates[_crateCode];

        // Ensure the caller is the expected next holder
        require(crate.nextHolderWalletAddress == msg.sender, "You are not the intended recipient of this crate.");

        // Update crate status upon final receipt
        crate.currentWalletAddress = msg.sender;
        crate.currentPhysicalAddress = _retailerPhysicalAddress;
        crate.inTransit = false;
        crate.isFinalDestination = true;      // Mark as final destination
        crate.nextHolderWalletAddress = address(0); // Clear next holder

        // Emit an event to log the crate receipt at final destination
        emit CrateReceived(_crateCode, msg.sender, _retailerPhysicalAddress, crate.isFinalDestination);
    }

    /**
     * @dev Retrieves the details of a specific crate.
     * @param _crateCode The unique identifier of the crate.
     * @return crateCode The unique identifier of the crate.
     * @return batchId The batch identification number.
     * @return medicineId The medicine identification code.
     * @return medicineName The name of the medicine.
     * @return manufacturerPhysicalAddress The physical address of the manufacturer.
     * @return manufacturerWalletAddress The wallet address of the manufacturer.
     * @return currentPhysicalAddress The current physical location of the crate.
     * @return currentWalletAddress The current holder's wallet address.
     * @return cidDocument The IPFS CID for document storage.
     * @return bottleCount The number of bottles in the crate.
     * @return inTransitFlag Whether the crate is currently in transit.
     * @return nextHolderWalletAddress The next recipient's wallet address.
     * @return exists Whether the crate exists in the system.
     * @return pastHolders Array of previous holders' wallet addresses.
     * @return isFinalDestination Whether the crate has reached its final destination.
     * @return bottleCodes Array of individual bottle codes within the crate.
     */
    function getCrateDetails(string memory _crateCode)
        public
        view
        returns (
            string memory crateCode,
            string memory batchId,
            string memory medicineId,
            string memory medicineName,
            string memory manufacturerPhysicalAddress,
            address manufacturerWalletAddress,
            string memory currentPhysicalAddress,
            address currentWalletAddress, // Changed back to address
            string memory cidDocument,
            uint256 bottleCount,
            bool inTransitFlag,
            address nextHolderWalletAddress,
            bool exists,
            address[] memory pastHolders,
            bool isFinalDestination,
            string[] memory bottleCodes
        )
    {
        require(crates[_crateCode].exists, "Crate does not exist.");
        Crate storage crate = crates[_crateCode];
        return (
            crate.crateCode,
            crate.batchId,
            crate.medicineId,
            crate.medicineName,
            crate.manufacturerPhysicalAddress,
            crate.manufacturerWalletAddress,
            crate.currentPhysicalAddress,
            crate.currentWalletAddress, // Removed Web3.utils.toChecksumAddress
            crate.cidDocument,
            crate.bottleCount,
            crate.inTransit,
            crate.nextHolderWalletAddress,
            crate.exists,
            crate.pastHolders,
            crate.isFinalDestination,
            crate.bottleCodes
        );
    }

    /**
     * @dev Retrieves all unique crate codes registered in the system.
     * @return An array of all registered crate codes.
     */
    function getAllCrateCodes() public view returns (string[] memory) {
        return allCrateCodes;
    }
}
