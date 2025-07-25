// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineCrateTracking {

    struct Crate {
        string crateCode;
        string batchID;
        string productID;
        string medicineName;
        address manufacturerWalletAddress;
        address currentWalletAddress;
        string cidDocument;
        uint256 bottleCount;
        address nextCrateReceiverWalletAddress; 
        mapping(string => SubCrate) subCrates;
        string[] subCratesList; //new
        address[] pastWalletAddress; 
        bool inTransit;
        bool isExists;
        bool isCrateFinalDestination;
        bool isSubCrateExists;
        mapping(string => Bottle) bottles; 
        string[] bottlesList;
    }

    struct Bottle {
        string bottleID; //{cratecode}_{bottleID}
        string productID;
        bool scanned;
        uint256 scanTimestamp;
        bool isExists;
        bool reported;
        string parentCrateID;
        string parentSubCrateID;
        bool isSubCrateExists;
    }

    struct SubCrate {
        string subCrateID;
        mapping(string => Bottle) bottles;
        string[] bottlesList;
        address nextSubCrateReceiverWalletAddress;
        bool isSubCrateFinalDestination;
        bool isExists;
        string parentCrateID;
        address subCrateCurrentHolderWalletAddress;
    }

    mapping(string => Crate) public crates;

    function debugIsExists(string memory crateCode) public view returns(bool) {
        // require(crates[crateCode].isExists, "crate doesnt exists");
        return crates[crateCode].isExists;
    }


    function registerCrate(
        string memory crateCode,
        string memory batchID,
        string memory productID,
        string memory medicineName,
        // address manufacturerWalletAddress,
        string memory cidDocument,
        uint256 bottleCount,
        string[] memory bottleIds
    ) public {
        require(!crates[crateCode].isExists, "Crate already registered");
        address[] memory emptyAddressArray;
        string [] memory emptySubCrateList;
        // SubCrate[] memory emptySubCratesArray;

    Crate storage c = crates[crateCode];

    c.crateCode = crateCode;
    c.batchID = batchID;
    c.productID = productID;
    c.medicineName = medicineName;
    c.manufacturerWalletAddress = msg.sender;
    c.currentWalletAddress = msg.sender;
    c.cidDocument = cidDocument;
    c.bottleCount = bottleCount;
    c.nextCrateReceiverWalletAddress = address(0);
    c.subCratesList = emptySubCrateList;
    c.pastWalletAddress = emptyAddressArray;
    c.inTransit = false;
    c.isExists = true;
    c.isCrateFinalDestination = false;
    c.isSubCrateExists = false;

    uint bottleIdsLength = bottleIds.length;

    c.bottlesList = bottleIds;

    for(uint i = 0; i < bottleIdsLength; i++){
        Bottle storage b = crates[crateCode].bottles[bottleIds[i]];

        b.bottleID = bottleIds[i];
        b.productID = productID;
        b.scanned = false;
        b.scanTimestamp = 0;
        b.isExists = true;
        b.reported = false;
        b.parentCrateID = crateCode;
        b.parentSubCrateID = "";
        b.isSubCrateExists = false;
    }
    }

    function createSubCrate(string memory parentCrateCode, string memory subCrateID, string[] memory bottlesIDs) public {
        require(crates[parentCrateCode].isExists, "crate doesn't exist");
        require(crates[parentCrateCode].currentWalletAddress == msg.sender, "only parent crate holders can create sub crates");
        require(!crates[parentCrateCode].subCrates[subCrateID].isExists, "the subcrate already exists");
        crates[parentCrateCode].isSubCrateExists = false;

        // SubCrate memory newSubCrate = SubCrate
        SubCrate storage newSubCrate = crates[parentCrateCode].subCrates[subCrateID];
        
        newSubCrate.subCrateID = subCrateID;
        newSubCrate.nextSubCrateReceiverWalletAddress = address(0);
        newSubCrate.isSubCrateFinalDestination = false;
        newSubCrate.isExists = true;
        newSubCrate.parentCrateID = parentCrateCode;
        newSubCrate.subCrateCurrentHolderWalletAddress = msg.sender;
        crates[parentCrateCode].subCratesList.push(subCrateID);

        uint bottlesArrLen = bottlesIDs.length;

        crates[parentCrateCode].subCrates[subCrateID].bottlesList = bottlesIDs;

        for(uint i = 0; i < bottlesArrLen; i++) {
            require(crates[parentCrateCode].bottles[bottlesIDs[i]].isExists, "The bottles to be put in the sub crate don't exist in the parent crate");
            Bottle storage b = crates[parentCrateCode].subCrates[subCrateID].bottles[bottlesIDs[i]];
            
            b.bottleID = bottlesIDs[i];
            b.productID = crates[parentCrateCode].productID;
            b.scanned = false;
            b.scanTimestamp = 0;
            b.isExists = true;
            b.reported = false;
            b.parentCrateID = parentCrateCode;
            b.parentSubCrateID = subCrateID;
            b.isSubCrateExists = true;

            crates[parentCrateCode].bottles[bottlesIDs[i]].isExists = false;

        }
    }


    function crateSend(string memory parentCrateCode, address receiverWalletAddress) public {
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "crate doesn't exist");
        require(!crate.inTransit, "crate already in transit");
        require(!crate.isSubCrateExists, "The crate has been divided into subCrates and cannot be sent");

        //add new require to enforce only the crate holder can send the crate
        require(crate.currentWalletAddress == msg.sender, "crate can only be sent by the one holding it");

        crate.inTransit = true;
        crate.nextCrateReceiverWalletAddress = receiverWalletAddress;
        crate.pastWalletAddress.push(crate.currentWalletAddress);
    }

    //for sub crates
    function subCrateSend(string memory subCrateCode, address receiverWalletAddress) public {
        string memory parentCrateCode = parseCrateFromSubCrate(subCrateCode);
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "crate doesn't exist");
        require(crate.subCrates[subCrateCode].isExists, "subCrate doesn't exist");
        require(!crate.inTransit, "crate already in transit");

        SubCrate storage subCrate = crate.subCrates[subCrateCode];
        require(subCrate.subCrateCurrentHolderWalletAddress == msg.sender, "you dont currently hold the subCrate you are trying to send");

        crate.inTransit = true;
        subCrate.nextSubCrateReceiverWalletAddress = receiverWalletAddress;
        crate.pastWalletAddress.push(crate.currentWalletAddress);
    }

    function crateReceived(string memory parentCrateCode) public {
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "crate doesn't exist");
        require(crate.nextCrateReceiverWalletAddress == msg.sender, "not the allocated receiver"); //asserts that only the correct receiver can receive it

        crate.currentWalletAddress = msg.sender;
        crate.inTransit = false;
        crate.nextCrateReceiverWalletAddress = address(0);
    }

    function crateRetailerReceived(string memory parentCrateCode) public {
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "crate doesn't exist");
        require(crate.nextCrateReceiverWalletAddress == msg.sender, "not the allocated receiver");
        require(crate.inTransit, "Crate is not in transit");

        crate.currentWalletAddress = msg.sender;
        crate.inTransit = false;
        crate.isCrateFinalDestination = true;
        crate.pastWalletAddress.push(msg.sender);
        crate.nextCrateReceiverWalletAddress = address(0);
    }

    function subCrateRetailerReceived(string memory subCrateCode) public {
        string memory parentCrateCode = parseCrateFromSubCrate(subCrateCode);
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "crate doesn't exist");
        require(crate.inTransit, "Crate is not in transit");
        SubCrate storage subCrate = crate.subCrates[subCrateCode];
        require(subCrate.isExists, "subCrate doesn't exist");
        require(subCrate.nextSubCrateReceiverWalletAddress == msg.sender, "not the allocated receiver for the sub crate");

        crate.currentWalletAddress = msg.sender; // to get full backtrack info, M & D addr from pastWalletAddress + currentWalletAddress(from crate)
        crate.inTransit = false;
        subCrate.isSubCrateFinalDestination = true; 
        crate.nextCrateReceiverWalletAddress = address(0);
    }

    event BottleScanned(string bottleCode, bool success);

    function scanBottle(string memory bottleCode) public returns(bool){
        string memory crateCode = parseCrateFromBottle(bottleCode);
        Crate storage crate = crates[crateCode];
        require(crate.isExists, "crate doesn't exists");


        if (crate.isSubCrateExists) {
            bool flag = false;
            string memory subCrateConsists;
            for(uint i = 0; i < crate.subCratesList.length; i++){
               if(crate.subCrates[crate.subCratesList[i]].bottles[bottleCode].isExists){
                flag = true;
                subCrateConsists = crate.subCratesList[i];
                break;
               } 
            }
            if (!flag){
                bool isValid = false;
                emit BottleScanned(bottleCode, isValid);
                return isValid;
            }
            
            if(crate.subCrates[subCrateConsists].isSubCrateFinalDestination){
                if(crate.subCrates[subCrateConsists].bottles[bottleCode].scanned){
                    bool isValid = false;
                    emit BottleScanned(bottleCode, isValid);
                    return isValid;
                }
                else{
                    crate.subCrates[subCrateConsists].bottles[bottleCode].scanned = true;
                    
                    bool isValid = true;
                    emit BottleScanned(bottleCode, isValid);
                    return isValid;
                    
                }
            }
            else{
                bool isValid = false;
                emit BottleScanned(bottleCode, isValid);
                return isValid;
            }


        }
        else{
            Bottle storage bottle = crate.bottles[bottleCode];
            if(bottle.isExists){
                if(bottle.scanned){
                    bool isValid = false;
                    emit BottleScanned(bottleCode, isValid);
                    return isValid;
                }
                else{
                    bool isValid = true;
                    bottle.scanned = true;
                    emit BottleScanned(bottleCode, isValid);
                    return isValid;
                }
            }
            else{
                bool isValid = false;
                emit BottleScanned(bottleCode, isValid);
                return isValid;
            }
        }
        
    }


    function parseCrateFromBottle(string memory bottleCode) public pure returns (string memory crateCode){
        bytes memory bottleBytes = bytes(bottleCode);

        require(bottleBytes.length == 11, "Bottle code not of the right size");

        bytes memory crateBytes = new bytes(5);
        for (uint256 i = 0; i < 5; i++) {
            crateBytes[i] = bottleBytes[i];
        }

        bytes memory remainingBytes = new bytes(5);
        for (uint256 i = 6; i < 11; i++) {
            remainingBytes[i - 6] = bottleBytes[i];
        }

        return string(crateBytes);
    }


    //{crateCode}_{subCrateCode} GF2IG_JGH8C
    function parseCrateFromSubCrate(string memory subCrateCode) public pure returns(string memory){
        bytes memory bottleBytes = bytes(subCrateCode);

        require(bottleBytes.length == 11, "Sub Crate code not of the right size");

        bytes memory crateBytes = new bytes(5);
        for (uint256 i = 0; i < 5; i++) {
            crateBytes[i] = bottleBytes[i];
        }

        bytes memory remainingBytes = new bytes(5);
        for (uint256 i = 6; i < 11; i++) {
            remainingBytes[i - 6] = bottleBytes[i];
        }

        return string(crateBytes);


    }

    function getAllBottlesOfCrate(string memory parentCrateCode) public view returns(string[] memory){
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "the crate doesn't exitst");

        string[] memory bottleIds = crate.bottlesList;

        uint256 count = 0;
        for(uint256 i = 0; i < bottleIds.length; i++){
            if(crate.bottles[bottleIds[i]].isExists){
                count++;
            }
        }

        string[] memory validBottleIds = new string[](count);
        uint256 temp = 0;

        for(uint256 i = 0; i < bottleIds.length; i++){
            if(crate.bottles[bottleIds[i]].isExists){
                validBottleIds[temp] = bottleIds[i];
                temp++;
            }

        }
        
        return validBottleIds;
    }
    
    function retrieveCrateInfo(string memory parentCrateCode) public view returns(string[] memory){
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "The crate doesn't exist");
        string[] memory retArr = new string[](4);

        string memory strBottleCount = uintToString(crate.bottleCount);

        retArr[0] = crate.crateCode;
        retArr[1] = crate.medicineName;
        retArr[2] = "placeholder batchID";
        retArr[3] = strBottleCount;

        return retArr;


    }

    function uintToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }


}

    