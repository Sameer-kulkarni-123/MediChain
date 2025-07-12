"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Package, ArrowLeft, Truck, CheckCircle, Send, Search, Clock, Wifi, List } from "lucide-react" // Added List icon
import Link from "next/link"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { ConnectionPath } from "@/components/connection-path"
import supplyChainData from "@/data/supplyChainData.json"
import { useToast } from "@/hooks/use-toast"
import { getAccount, distributorReceiveCrate, sendCrateToRetailer, getCrateDetails, getCrateEvents, debugContractConnection, getAllCrateCodes } from "../../apis" // Added getAllCrateCodes

interface ReceivedCrate {
  crateCode: string;
  batchId: string;
  medicineName: string;
  currentPhysicalAddress: string;
  currentWalletAddress: string;
  isFinalDestination: boolean;
  inTransit: boolean;
  timestamp: string;
  status: 'In Transit' | 'Received by Distributor' | 'Sent to Retailer' | 'Received by Retailer';
}

// Interface for fetched crate details from the blockchain
interface FetchedCrateDetails {
  crateCode: string;
  batchId: string;
  medicineId: string;
  medicineName: string;
  manufacturerPhysicalAddress: string;
  manufacturerWalletAddress: string;
  currentPhysicalAddress: string;
  currentWalletAddress: string;
  cidDocument: string;
  bottleCount: string; // uint256 from solidity comes as string in web3.js
  inTransit: boolean;
  nextHolderWalletAddress: string;
  exists: boolean;
  pastWalletAddress: string[];
  isFinalDestination: boolean;
  bottleCodes: string[];
}

export default function DistributorPortal() {
  const [currentDistributor, setCurrentDistributor] = useState<any>(null)
  const [crateCodeToReceive, setCrateCodeToReceive] = useState<string>("")
  const [crateCodeToSend, setCrateCodeToSend] = useState<string>("")
  const [distributorPhysicalAddress, setDistributorPhysicalAddress] = useState<string>("")
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null)
  const [receivedCrates, setReceivedCrates] = useState<ReceivedCrate[]>([])
  const [isReceiving, setIsReceiving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isFetchingCrate, setIsFetchingCrate] = useState(false);
  const [fetchedCrateDetails, setFetchedCrateDetails] = useState<FetchedCrateDetails | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [allBlockchainCrateCodes, setAllBlockchainCrateCodes] = useState<string[]>([]); // New state for all crate codes
  const [isFetchingAllCrates, setIsFetchingAllCrates] = useState(false); // New state for fetching all crates
  const { toast } = useToast()

  useEffect(() => {
    setCurrentDistributor(supplyChainData.distributors[0])
    if (supplyChainData.distributors[0]) {
      setDistributorPhysicalAddress(supplyChainData.distributors[0].location);
    }
    fetchAllCrateCodes(); // Fetch all crate codes on component mount
  }, [])

  const fetchAllCrateCodes = async () => {
    setIsFetchingAllCrates(true);
    try {
      const codes = await getAllCrateCodes();
      setAllBlockchainCrateCodes(codes);
      toast({
        title: "All Crate Codes Fetched",
        description: `Found ${codes.length} crate codes on the blockchain.`,
      });
    } catch (error: any) {
      console.error("Error fetching all crate codes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch all crate codes from blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingAllCrates(false);
    }
  };

  const handleCheckCrateStatus = async () => {
    if (!crateCodeToReceive) {
      toast({
        title: "Error",
        description: "Please enter a Crate Code to check its status.",
        variant: "destructive",
      });
      return;
    }
    setIsFetchingCrate(true);
    setFetchedCrateDetails(null); // Clear previous details
    try {
      const details = await getCrateDetails(crateCodeToReceive);
      console.log("Medicine Name:", details.medicineName);
      setFetchedCrateDetails(details);
      toast({
        title: "Crate Status Fetched",
        description: `Details for Crate ${crateCodeToReceive} loaded.`,
      });
    } catch (error: any) {
      console.error("Error fetching crate details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch crate details. Crate might not exist.",
        variant: "destructive",
      });
      setFetchedCrateDetails(null);
    } finally {
      setIsFetchingCrate(false);
    }
  };

  const handleReceiveCrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crateCodeToReceive) {
      toast({
        title: "Error",
        description: "Please enter a Crate Code to receive.",
        variant: "destructive",
      });
      return;
    }
    if (!distributorPhysicalAddress) {
      toast({
        title: "Error",
        description: "Please enter your physical address.",
        variant: "destructive",
      });
      return;
    }

    setIsReceiving(true);
    try {
      const receipt = await distributorReceiveCrate(crateCodeToReceive, distributorPhysicalAddress);
      console.log("Crate received by distributor successful:", receipt);

      // Fetch updated crate details after successful receipt
      const crateDetails = await getCrateDetails(crateCodeToReceive);
      const newReceivedCrate: ReceivedCrate = {
        crateCode: crateDetails.crateCode,
        batchId: crateDetails.batchId,
        medicineName: crateDetails.medicineName,
        currentPhysicalAddress: crateDetails.currentPhysicalAddress,
        currentWalletAddress: crateDetails.currentWalletAddress,
        isFinalDestination: crateDetails.isFinalDestination,
        inTransit: crateDetails.inTransit,
        timestamp: new Date().toLocaleString(), // Use current time for local display
        status: 'Received by Distributor',
      };

      setReceivedCrates(prev => [...prev, newReceivedCrate]);
      setCrateCodeToReceive(""); // Clear input after successful receipt
      setFetchedCrateDetails(null); // Clear fetched details

      toast({
        title: "Crate Received",
        description: `Crate ${crateCodeToReceive} successfully received!`,
      });
    } catch (error: any) {
      console.error("Error receiving crate:", error);
      let errorMessage = "Failed to receive crate. Please try again.";
      if (error.message.includes("You are not the intended recipient of this crate.")) {
        errorMessage = "You are not the intended recipient of this crate. Please check the crate code or your wallet address.";
      } else if (error.message.includes("Crate is not in transit.")) {
        errorMessage = "Crate is not in transit and cannot be received. It might already be received or not sent yet.";
      } else if (error.message.includes("Crate does not exist.")) {
        errorMessage = "Crate does not exist. Please check the crate code.";
      } else if (error.message.includes("User denied transaction signature")) {
        errorMessage = "Transaction denied by user.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction.";
      } else if (error.message.includes("AbiError")) {
        errorMessage = "Blockchain transaction failed. Ensure the crate is in transit to you and try again. Check console for more details.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsReceiving(false);
    }
  };

  const handleSendCrateToRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crateCodeToSend) {
      toast({
        title: "Error",
        description: "Please enter a Crate Code to send.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedRetailer) {
      toast({
        title: "Error",
        description: "Please select a retailer first.",
        variant: "destructive",
      });
      return;
    }

    // Check if the crate is actually in the distributor's possession and not already in transit
    const crateInPossession = receivedCrates.find(c => c.crateCode === crateCodeToSend && c.status === 'Received by Distributor');
    if (!crateInPossession) {
      toast({
        title: "Error",
        description: "Crate not found or not currently in your possession to send. Please receive it first.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const receipt = await sendCrateToRetailer(crateCodeToSend, selectedRetailer.walletAddress);
      console.log("Crate sent to retailer successful:", receipt);

      // Update the status of the sent crate in the local state
      setReceivedCrates(prevCrates =>
        prevCrates.map(crate =>
          crate.crateCode === crateCodeToSend ? { ...crate, status: 'Sent to Retailer', inTransit: true } : crate
        )
      );
      setCrateCodeToSend(""); // Clear input after successful send
      setSelectedRetailer(null); // Clear selected retailer

      toast({
        title: "Crate Sent",
        description: `Crate ${crateCodeToSend} successfully sent to ${selectedRetailer.name}.`,
      });
    } catch (error: any) {
      console.error("Error sending crate to retailer:", error);
      let errorMessage = "Failed to send crate to retailer. Please try again.";
      if (error.message.includes("Only the current holder can perform this action.")) {
        errorMessage = "You are not the current holder of this crate.";
      } else if (error.message.includes("Crate is currently in transit.")) {
        errorMessage = "Crate is already in transit. Cannot send again.";
      } else if (error.message.includes("Crate has reached its final destination.")) {
        errorMessage = "Crate has reached its final destination and cannot be sent further.";
      } else if (error.message.includes("Retailer wallet address cannot be zero.")) {
        errorMessage = "Please select a valid retailer.";
      } else if (error.message.includes("User denied transaction signature")) {
        errorMessage = "Transaction denied by user.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction.";
      } else if (error.message.includes("AbiError")) {
        errorMessage = "Blockchain transaction failed. Check console for more details.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDebugConnection = async () => {
    setIsDebugging(true);
    setDebugInfo(null);
    try {
      const info = await debugContractConnection();
      setDebugInfo(info);
      toast({
        title: "Blockchain Connection Check",
        description: "Connection details fetched successfully.",
      });
    } catch (error: any) {
      console.error("Error debugging connection:", error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to blockchain. Ensure MetaMask is installed and connected.",
        variant: "destructive",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Distributor Portal</h1>
              <p className="text-sm sm:text-base text-gray-600">Receive and forward medical crates</p>
              {currentDistributor && (
                <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">
                  {currentDistributor.name} - {currentDistributor.coverage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Path */}
        <div className="mb-6 sm:mb-8">
          <ConnectionPath
            distributor={currentDistributor}
            retailer={selectedRetailer}
            currentUserType="distributor"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Receive Crate Form */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle className="h-5 w-5" />
                Receive Crate
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Acknowledge receipt of a crate from a manufacturer.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleReceiveCrate} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="crateCodeToReceive" className="text-sm sm:text-base">
                    Crate Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="crateCodeToReceive"
                      value={crateCodeToReceive}
                      onChange={(e) => setCrateCodeToReceive(e.target.value)}
                      placeholder="Enter crate code to receive"
                      required
                      className="text-sm sm:text-base flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleCheckCrateStatus}
                      variant="outline"
                      size="sm"
                      disabled={isFetchingCrate || !crateCodeToReceive}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      {isFetchingCrate ? "Checking..." : "Check Status"}
                    </Button>
                  </div>
                </div>

                {fetchedCrateDetails && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <h4 className="font-medium text-blue-900 mb-1">Crate Details:</h4>
                    <p><strong>Medicine:</strong> {fetchedCrateDetails.medicineName}</p>
                    <p><strong>Batch ID:</strong> {fetchedCrateDetails.batchId}</p>
                    <p><strong>Current Holder:</strong> {fetchedCrateDetails.currentWalletAddress}</p>
                    <p><strong>In Transit:</strong> {fetchedCrateDetails.inTransit ? 'Yes' : 'No'}</p>
                    {fetchedCrateDetails.inTransit && (
                      <p><strong>Next Holder:</strong> {fetchedCrateDetails.nextHolderWalletAddress}</p>
                    )}
                    {fetchedCrateDetails.isFinalDestination && (
                      <p className="text-red-600 font-semibold">Crate has reached its final destination.</p>
                    )}
                    {!fetchedCrateDetails.exists && (
                      <p className="text-red-600 font-semibold">Crate does not exist in the system.</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="distributorPhysicalAddress" className="text-sm sm:text-base">
                    Your Physical Address
                  </Label>
                  <Input
                    id="distributorPhysicalAddress"
                    value={distributorPhysicalAddress}
                    onChange={(e) => setDistributorPhysicalAddress(e.target.value)}
                    placeholder="Enter your physical address"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                  disabled={isReceiving || !fetchedCrateDetails || !fetchedCrateDetails.inTransit || fetchedCrateDetails.nextHolderWalletAddress.toLowerCase() !== currentDistributor?.walletAddress.toLowerCase()}
                >
                  {isReceiving ? "Receiving Crate..." : "Receive Crate"}
                </Button>
                {fetchedCrateDetails && fetchedCrateDetails.exists && (
                    <p className="text-xs text-gray-600 mt-2">
                        Note: You can only receive crates that are 'In Transit' and where 'Next Holder' is your wallet address.
                    </p>
                )}
            </form>
            </CardContent>
          </Card>

          {/* Send Crate to Retailer Form */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Send className="h-5 w-5" />
                Send Crate to Retailer
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Forward a received crate to a retailer.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSendCrateToRetailer} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="crateCodeToSend" className="text-sm sm:text-base">
                    Crate Code
                  </Label>
                  <Input
                    id="crateCodeToSend"
                    value={crateCodeToSend}
                    onChange={(e) => setCrateCodeToSend(e.target.value)}
                    placeholder="Enter crate code to send"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <SearchableDropdown
                  options={supplyChainData.retailers} // Assuming retailers data exists
                  value={selectedRetailer}
                  onSelect={setSelectedRetailer}
                  placeholder="Search and select a retailer..."
                  label="Select Retailer"
                />
                {selectedRetailer && (
                  <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">Selected Retailer:</h4>
                    <div className="space-y-1 text-xs sm:text-sm text-green-800">
                      <p>
                        <span className="font-medium">Name:</span> {selectedRetailer.name}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span> {selectedRetailer.location}
                      </p>
                      <p className="font-mono text-xs break-all">
                        <span className="font-medium">Wallet:</span> {selectedRetailer.walletAddress}
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                  disabled={isSending || !selectedRetailer}
                >
                  {isSending ? "Sending Crate..." : "Send Crate to Retailer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Received Crates */}
          <Card className="xl:col-span-2">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-5 w-5" />
                My Crates
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Overview of crates you have received or sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {receivedCrates.length === 0 ? (
                <p className="text-gray-600 text-sm">No crates received or sent yet.</p>
              ) : (
                <div className="space-y-4">
                  {receivedCrates.map((crate) => (
                    <div key={crate.crateCode} className="p-4 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-base text-gray-900">{crate.crateCode}</h4>
                        <Badge
                          variant="outline"
                          className={
                            crate.status === 'Received by Distributor'
                              ? "text-green-600 border-green-600"
                              : crate.status === 'Sent to Retailer'
                                ? "text-yellow-600 border-yellow-600"
                                : "text-blue-600 border-blue-600" // Fallback for other statuses
                          }
                        >
                          {crate.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        Medicine: {crate.medicineName} (Batch: {crate.batchId})
                      </p>
                      <p className="text-sm text-gray-700">Current Location: {crate.currentPhysicalAddress}</p>
                      <p className="text-xs text-gray-500 mt-1">Last Updated: {crate.timestamp}</p>
                      {crate.status === 'Received by Distributor' && (
                        <Button
                          onClick={() => setCrateCodeToSend(crate.crateCode)}
                          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-sm py-2"
                          disabled={isSending || !selectedRetailer}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSending && crateCodeToSend === crate.crateCode ? "Sending..." : `Send to ${selectedRetailer ? selectedRetailer.name : 'Retailer'}`}
                        </Button>
                      )}
                      {crate.status === 'Sent to Retailer' && (
                        <p className="text-sm text-yellow-700 mt-4">Crate is in transit to retailer.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Retailers Overview */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Available Retailers Network</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Overview of all retailers in the network
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplyChainData.retailers.map((retailer) => (
                <div
                  key={retailer.id}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRetailer?.id === retailer.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedRetailer(retailer)}
                >
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{retailer.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{retailer.location}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {retailer.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Blockchain Crate Codes */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <List className="h-5 w-5" />
              All Blockchain Crate Codes
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              List of all crate codes registered on the blockchain. Use these to check status or receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Button
              onClick={fetchAllCrateCodes}
              className="w-full text-sm sm:text-base py-2 sm:py-3 mb-4"
              disabled={isFetchingAllCrates}
            >
              {isFetchingAllCrates ? "Fetching All Codes..." : "Refresh All Crate Codes"}
            </Button>
            {allBlockchainCrateCodes.length === 0 && !isFetchingAllCrates ? (
              <p className="text-gray-600 text-sm">No crate codes found on the blockchain. Create one as a Manufacturer first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allBlockchainCrateCodes.map((code) => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="flex justify-between items-center px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors text-sm"
                    onClick={() => {
                      setCrateCodeToReceive(code);
                      toast({
                        title: "Crate Code Copied",
                        description: `Crate code ${code} copied to input.`,
                      });
                    }}
                  >
                    <span className="font-mono text-gray-800 truncate">{code}</span>
                    <Search className="h-3 w-3 ml-2 text-gray-500" />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Connection Status */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Wifi className="h-5 w-5" />
              Blockchain Connection Status
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Check the connection to your Ethereum network and wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Button
              onClick={handleDebugConnection}
              className="w-full text-sm sm:text-base py-2 sm:py-3 mb-4"
              disabled={isDebugging}
            >
              {isDebugging ? "Checking Connection..." : "Check Blockchain Connection"}
            </Button>
            {debugInfo && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-1">
                <p><strong>Connected:</strong> {debugInfo.isConnected ? 'Yes' : 'No'}</p>
                <p className="break-all"><strong>Account:</strong> {debugInfo.account}</p>
                <p><strong>Network ID:</strong> {debugInfo.networkId}</p>
                <p><strong>Balance:</strong> {debugInfo.balance} ETH</p>
                <p className="text-xs text-gray-600 mt-2">
                  This confirms your wallet is connected and can interact with the blockchain.
                </p>
              </div>
            )}
            {!debugInfo && !isDebugging && (
                <p className="text-gray-600 text-sm">Click the button above to check your blockchain connection.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - Placeholder */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-5 w-5" />
              Recent Activity (Blockchain Events)
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              This section would display real-time events from the blockchain relevant to the distributor.
              A full implementation would involve fetching and parsing these events using `getCrateEvents`.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">Crate MC-1704123456-7890</p>
                  <p className="text-xs sm:text-sm text-gray-600">Received from Manufacturer</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600 shrink-0 text-xs sm:text-sm">
                  Received
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">Crate MC-1704123456-7891</p>
                  <p className="text-xs sm:text-sm text-gray-600">Sent to Retailer R001</p>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600 shrink-0 text-xs sm:text-sm">
                  In Transit
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
