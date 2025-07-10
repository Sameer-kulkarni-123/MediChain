// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineCrateTracking {

    struct Crate {
        string crateCode;
        string batchId;
        string medicineId;
        string medicineName;
        string manufacturerId;
        address manufacturerAddress;
        address currentAddress;
        string currentAddressId;
        string cidDocuments;
        uint256 bottleCount;
        bool inTransit;
        address nextHolder;
        string nextHolderId;
        bool exists;
        bool retailLocationSet;
        int32 retailLat; // stored as x1000000
        int32 retailLong;
    }

    struct BottleScanInfo {
        bool scanned;
        uint256 scanTimestamp;
        int32 scanLat;
        int32 scanLong;
        bool reported;
    }

    mapping(string => Crate) public crates;
    mapping(string => BottleScanInfo) public bottleScans; // bottleCode => scan info

    event CrateRegistered(string crateCode, uint256 bottleCount);
    event CrateSent(string crateCode, address from, address to);
    event CrateReceived(string crateCode, address from, address to);
    event BottleScanned(string bottleCode, bool firstScan, bool suspicious);
    event BottleReported(string bottleCode);

    modifier onlyCurrentHolder(string memory crateCode) {
        require(crates[crateCode].exists, "Crate does not exist");
        require(crates[crateCode].currentAddress == msg.sender, "Only current holder can perform this");
        _;
    }

    modifier onlyNextHolder(string memory crateCode) {
        require(crates[crateCode].exists, "Crate does not exist");
        require(crates[crateCode].nextHolder == msg.sender, "Only assigned receiver can confirm receipt");
        _;
    }
    
    modifier onlyRetailReceiver(string memory crateCode) {
        require(crates[crateCode].exists, "Crate does not exist");
        require(crates[crateCode].currentAddress == msg.sender, "Not current holder");
        _;
    }

    function registerCrate(
        string memory crateCode,
        string memory batchId,
        string memory medicineId,
        string memory medicineName,
        string memory manufacturerId,
        address manufacturerAddress,
        address currentAddress,
        string memory currentAddressId,
        string memory cidDocuments,
        uint256 bottleCount
    ) public {
        require(!crates[crateCode].exists, "Crate already registered");

    crates[crateCode] = Crate({
        crateCode: crateCode,
        batchId: batchId,
        medicineId: medicineId,
        medicineName: medicineName,
        manufacturerId: manufacturerId,
        manufacturerAddress: manufacturerAddress,
        currentAddress: currentAddress,
        currentAddressId: currentAddressId,
        cidDocuments: cidDocuments,
        bottleCount: bottleCount,
        inTransit: false,
        nextHolder: address(0),
        nextHolderId: "",
        exists: true,
        retailLocationSet: false,
        retailLat: 0,
        retailLong: 0
    });


        emit CrateRegistered(crateCode, bottleCount);
    }

    function crateSent(string memory crateCode, address to, string memory toId) public onlyCurrentHolder(crateCode) {
        Crate storage crate = crates[crateCode];
        require(!crate.inTransit, "Crate is already in transit");

        crate.inTransit = true;
        crate.nextHolder = to;
        crate.nextHolderId = toId;

        emit CrateSent(crateCode, msg.sender, to);
    }

    function crateReceived(string memory crateCode, string memory newLocationId) public onlyNextHolder(crateCode) {
        Crate storage crate = crates[crateCode];
        require(crate.inTransit, "Crate is not in transit");

        address previousHolder = crate.currentAddress;

        crate.currentAddress = msg.sender;
        crate.currentAddressId = newLocationId;
        crate.inTransit = false;
        crate.nextHolder = address(0);
        crate.nextHolderId = "";

        emit CrateReceived(crateCode, previousHolder, msg.sender);
    }

    function setRetailLocation(string memory crateCode, int32 lat, int32 longi) public onlyRetailReceiver(crateCode) {
        Crate storage crate = crates[crateCode];
        crate.retailLat = lat;
        crate.retailLong = longi;
        crate.retailLocationSet = true;
    }

    
    function scanBottle(string memory bottleCode, int32 scanLat, int32 scanLong) public {
        string memory crateCode = parseCrateFromBottle(bottleCode);
        Crate storage crate = crates[crateCode];
        require(crate.exists, "Invalid crate");
        require(crate.retailLocationSet, "Crate not at retail yet");

        BottleScanInfo storage info = bottleScans[bottleCode];

        bool suspicious = false;

        if (!info.scanned) {
            info.scanned = true;
            info.scanTimestamp = block.timestamp;
            info.scanLat = scanLat;
            info.scanLong = scanLong;
        } else {
            suspicious = true; // repeated scan
        }

        emit BottleScanned(bottleCode, !suspicious, suspicious);
    }

        function parseCrateFromBottle(string memory bottleCode) internal pure returns (string memory) {
        bytes memory b = bytes(bottleCode);
        for (uint i = 0; i < b.length; i++) {
            if (b[i] == "-") {
                bytes memory crateBytes = new bytes(i);
                for (uint j = 0; j < i; j++) {
                    crateBytes[j] = b[j];
                }
                return string(crateBytes);
            }
        }
        revert("Invalid bottle code");
    }
}
