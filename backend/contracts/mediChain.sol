// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineCrateTracking {

    struct Crate {
        string crateCode;
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

        for(uint i = 0; i < bottlesArrLen; i++) {
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

    function crateRetailerReceived(string memory parentCrateCode, string memory subCrateCode) public {
        Crate storage crate = crates[parentCrateCode];
        require(crate.isExists, "crate doesn't exist");
        require(crate.nextCrateReceiverWalletAddress == msg.sender, "not the allocated receiver");
        require(crate.inTransit, "Crate is not in transit");
        SubCrate storage subCrate = crate.subCrates[subCrateCode];
        require(subCrate.isExists, "subCrate doesn't exist");

        crate.currentWalletAddress = msg.sender; // to get full backtrack info, M & D addr from pastWalletAddress + currentWalletAddress(from crate)
        crate.inTransit = false;
        subCrate.isSubCrateFinalDestination = true; 
        crate.nextCrateReceiverWalletAddress = address(0);
    }

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
                return false;
            }
            
            if(crate.subCrates[subCrateConsists].isSubCrateFinalDestination){
                if(crate.subCrates[subCrateConsists].bottles[bottleCode].scanned){
                    return false;
                }
                else{
                    crate.subCrates[subCrateConsists].bottles[bottleCode].scanned = true;
                    return true;
                }
            }
            else{
                return false;
            }


        }
        else{
            Bottle storage bottle = crate.bottles[bottleCode];
            if(bottle.isExists){
                if(bottle.scanned){
                    return false;
                }
                else{
                    bottle.scanned = true;
                    return true;
                }
            }
            else{
                return false;
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

}

    