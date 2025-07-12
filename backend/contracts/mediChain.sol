// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineCrateTracking {

    struct Crate {
        string crateCode;
        string batchId;
        string medicineId;
        string medicineName;
        string manufacturerPhysicalAddress;
        address manufacturerWalletAddress;
        string currentPhysicalAddress;
        address currentWalletAddress;
        string cidDocument;
        uint256 bottleCount;
        bool inTransit;
        address nextHolderWalletAddress;     
        bool exists;
        address[] pastWalletAddress; 
        bool isFinalDestination;
        string[] bottleCodes; 
    }

    struct BottleScanInfo {
        bool scanned;
        uint256 scanTimestamp;
        bool reported;
    }

    mapping(string => Crate) public crates;
    mapping(string => BottleScanInfo) public bottleScans; // bottleCode => scan info

    event CrateRegistered(string crateCode, uint256 bottleCount);
    event CrateSent(string crateCode, address from, address to);
    event CrateReceived(string crateCode, address from, address to);
    event BottleScanned(string bottleCode, bool firstScan, bool suspicious);
    event BottleReported(string bottleCode);
    event CertificationsActivated(string crateCode, address retailer);

    modifier onlyCurrentHolder(string memory crateCode) {
        require(crates[crateCode].exists, "Crate does not exist");
        require(crates[crateCode].currentWalletAddress == msg.sender, "Only current holder can perform this");
        _;
    }

    modifier onlyNextHolder(string memory crateCode) {
        require(crates[crateCode].exists, "Crate does not exist");
        require(crates[crateCode].nextHolderWalletAddress == msg.sender, "Only assigned receiver can confirm receipt");
        _;
    }
    
    //modifier onlyRetailReceiver(string memory crateCode) {
        //require(crates[crateCode].exists, "Crate does not exist");
        //require(crates[crateCode].currentAddress == msg.sender, "Not current holder");
        //_;
    //}

    function registerCrate(
        string memory crateCode,
        string memory batchId,
        string memory medicineId,
        string memory medicineName,
        address manufacturerWalletAddress,
        string memory manufacturerPhysicalAddress,
        string memory cidDocument,
        uint256 bottleCount,
        string[] memory bottleCodes
    ) public {
        require(!crates[crateCode].exists, "Crate already registered");
        address[] memory emptyAddressArray;

    crates[crateCode] = Crate({
        crateCode: crateCode,
        batchId: batchId,
        medicineId: medicineId,
        medicineName: medicineName,
        manufacturerPhysicalAddress: manufacturerPhysicalAddress,
        manufacturerWalletAddress: manufacturerWalletAddress,
        currentWalletAddress: manufacturerWalletAddress,
        currentPhysicalAddress: manufacturerPhysicalAddress,
        cidDocument: cidDocument,
        bottleCount: bottleCount,
        inTransit: false,
        isFinalDestination: false,
        nextHolderWalletAddress: address(0),
        exists: true,
        bottleCodes: bottleCodes,
        pastWalletAddress: emptyAddressArray
    });


        emit CrateRegistered(crateCode, bottleCount);
    }

    function crateSent(string memory crateCode, address to) public onlyCurrentHolder(crateCode) {
        Crate storage crate = crates[crateCode];
        require(crate.exists, "crate doesnt exist 1");
        require(!crate.inTransit, "Crate is already in transit");

        crate.inTransit = true;
        crate.nextHolderWalletAddress = to;
        crate.pastWalletAddress.push(crate.currentWalletAddress);
        

        emit CrateSent(crateCode, msg.sender, to);
    }

    function crateReceived(string memory crateCode) public onlyNextHolder(crateCode) {
        Crate storage crate = crates[crateCode];
        require(crate.inTransit, "Crate is not in transit");

        

        crate.currentWalletAddress = msg.sender;
        crate.inTransit = false;
        crate.nextHolderWalletAddress = address(0);

        emit CrateReceived(crateCode, crate.pastWalletAddress[crate.pastWalletAddress.length - 1], msg.sender);
    }



    function crateRetailerReceived(string memory crateCode) public {
        Crate storage crate = crates[crateCode];
        require(crate.exists, "Invalid crate");

        crate.isFinalDestination = true;
        crate.inTransit = false;
        crate.currentWalletAddress = msg.sender;
        crate.pastWalletAddress.push(crate.currentWalletAddress);
        crate.nextHolderWalletAddress = address(0);
    }

    
    function scanBottle(string memory bottleCode) public {
        (string memory crateCode, string memory bottleId) = parseCrateFromBottle(bottleCode);
        Crate storage crate = crates[crateCode];
        require(crate.exists, "Invalid crate");
        require(crate.isFinalDestination, "crate didn't reached");
        bool bottleExists = false;

        BottleScanInfo storage info = bottleScans[bottleCode];
        for (uint i =0; i< crate.bottleCodes.length; i++){
            if (keccak256(bytes(bottleId)) == keccak256(bytes(crate.bottleCodes[i]))) {
                bottleExists = true;
                break;
            }
        }

        require(bottleExists, "Bottle doesn't exist");
        
        

        bool suspicious = false;

        if (!info.scanned) {
            info.scanned = true;
            info.scanTimestamp = block.timestamp;
        } else {
            suspicious = true; // repeated scan
        }

        emit BottleScanned(bottleCode, !suspicious, suspicious);
    }

        function parseCrateFromBottle(string memory bottleCode) internal pure returns (string memory, string memory) {
        bytes memory b = bytes(bottleCode);
        for (uint i = 0; i < b.length; i++) {
            if (b[i] == "-") {

                bytes memory crateBytes = new bytes(i);
                bytes memory bottleBytes = new bytes(i);
                for (uint j = 0; j < i; j++) {
                    crateBytes[j] = b[j];
                }
                for (uint j = i+1; i<b.length; j++){
                    bottleBytes[j] = b[j];
                }
                return (string(crateBytes), string(bottleBytes));
            }
        }
        revert("Invalid bottle code");
    }
}
