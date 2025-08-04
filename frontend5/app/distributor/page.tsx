"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Truck, ArrowLeft, MapPin, Calendar, Package, Users, PlusCircle } from "lucide-react"
import Link from "next/link"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { ConnectionPath } from "@/components/connection-path"
import supplyChainData from "@/data/supplyChainData.json"
import { useToast } from "@/hooks/use-toast"
import { getAllBottlesOfSubCrate,receiveCrate, getAccount, createSubCrate,getAllBottlesOfCrate, getCrateInfo, getAllSubCratesOfCrate} from "../../apis"
import { MultiSelectDropdown } from "@/components/multi-select-dropdown"
import { AssignmentForm } from "@/components/assignment-form" // Ensure this is imported
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components
import { getConnectionsFrom, getRetailerByWallet, updateInventoryItem, updateProductLocation, getPendingAllocations, fulfillAllocations } from "@/api_local"

interface PendingAllocation {
  orderId: string;
  retailer_wallet: string;
  productName: string;
  qty: number;
}

export default function DistributorPortal() {
  const [selectedCrate, setSelectedCrate] = useState("MC-1704123456-7890")
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null)
  const [currentDistributor, setCurrentDistributor] = useState<any>(null)
  const [receiveCrateCodeForAssignment, setreceiveCrateCodeForAssignment] = useState("")
  const [assignedManufacturer, setAssignedManufacturer] = useState<any>(null)
  const [distributorData, setDistributorData] = useState({
    storageLocation: "",
    shippingDetails: "",
    dispatchTimestamp: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // New states for SubCrate creation
  const [parentCrateCodeForSubCrate, setParentCrateCodeForSubCrate] = useState("")
  const [availableBottleIds, setAvailableBottleIds] = useState<Array<{ value: string; label: string }>>([])
  const [selectedBottleIds, setSelectedBottleIds] = useState<string[]>([])
  const [subCrateId, setSubCrateId] = useState("")
  const [isCreatingSubCrate, setIsCreatingSubCrate] = useState(false)
  // const [connectedAccount, setConnectedAccount] = useState(await getAccount())

  // New states for sending Crate/SubCrate
  const [assignmentType, setAssignmentType] = useState<"crate" | "subCrate">("crate")
  const [crateCodeForSend, setCrateCodeForSend] = useState("") // For main crate
  const [parentCrateCodeForSend, setParentCrateCodeForSend] = useState("") // For sub-crate
  const [subCrateCodeForSend, setSubCrateCodeForSend] = useState("") // For sub-crate
  const [connectedRetailer, setConnectedRetailer] = useState<any[]>([]);
  //for placeholders only remove later, code has to change in assignment-form to remove this
  useEffect(() => {
    // Simulate getting current distributor from wallet/auth
    setCurrentDistributor(supplyChainData.distributors[0])
    // Simulate assigned manufacturer
    setAssignedManufacturer(supplyChainData.manufacturers[0])
  }, [])

const [crateDetails, setCrateDetails] = useState({
  crateCode: "",
  medicineName: "",
  batchId: "",
  bottleCount: 0,
  currentStatus: "Loading...",
})
const [crateCodeForDetails, setCrateCodeForDetails] = useState("")
const [isLoadingCrateDetails, setIsLoadingCrateDetails] = useState(false)

// Improved function to fetch crate details
const handleGetCrateDetails = async () => {
  if (!crateCodeForDetails.trim()) {
    toast({
      title: "Error",
      description: "Please enter a valid Crate Code first.",
      variant: "destructive",
    });
    return;
  }

  setIsLoadingCrateDetails(true);
  
  // Reset current status to loading
  setCrateDetails(prev => ({
    ...prev,
    currentStatus: "Loading..."
  }));

  try {
    const crateInfo = await getCrateInfo(crateCodeForDetails.trim());
    console.log("Crate Info:", crateInfo);
    
    // Debug log to see the actual structure
    console.log("Raw crateInfo structure:", crateInfo);
    console.log("Type of crateInfo:", typeof crateInfo);
    
    // Handle different possible return formats from blockchain
    let crateData;
    if (Array.isArray(crateInfo)) {
      crateData = crateInfo;
    } else if (crateInfo !== null && crateInfo !== undefined && typeof crateInfo === 'object') {
      // Convert object values to array (common with Web3 returns)
      crateData = Object.values(crateInfo);
    } else {
      throw new Error("Unexpected crate info format received from blockchain");
    }
    
    // Validate that we have the expected number of elements
    if (crateData.length < 4) {
      throw new Error("Incomplete crate information received");
    }
    
    setCrateDetails({
      crateCode: crateData[0]?.toString() || "",
      medicineName: crateData[1]?.toString() || "",
      batchId: crateData[2]?.toString() || "", 
      bottleCount: parseInt(crateData[3]?.toString() || "0", 10),
      currentStatus: "Active", // You might want to get this from another contract method
    });

    toast({
      title: "Success",
      description: `Successfully fetched details for crate ${crateCodeForDetails}`,
    });
  } catch (error) {
    console.error("Error fetching crate details:", error);
    
    // Reset crate details on error
    setCrateDetails({
      crateCode: "",
      medicineName: "",
      batchId: "",
      bottleCount: 0,
      currentStatus: "Error",
    });
    
    toast({
      title: "Error",
      description: `Failed to fetch crate details: ${
        error instanceof Error ? error.message : String(error)
      }`,
      variant: "destructive",
    });
  } finally {
    setIsLoadingCrateDetails(false);
  }
};

  // Simulate fetching bottle IDs based on parentCrateCode
  // useEffect(() => {
  //   if (parentCrateCodeForSubCrate.length >= 5) {
  //     // Trigger mock generation after a few characters
  //     // In a real app, you would call a blockchain API here to get actual bottle IDs
  //     // For now, we'll generate mock IDs based on the parent crate code prefix
  //     const mockBottlePrefix = parentCrateCodeForSubCrate.substring(0, 5).toUpperCase()
  //     const generatedBottles = Array.from({ length: 20 }, (_, i) => {
  //       const suffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  //       const bottleCode = `${mockBottlePrefix}-${suffix}`
  //       return { value: bottleCode, label: bottleCode }
  //     })
  //     setAvailableBottleIds(generatedBottles)
  //   } else {
  //     setAvailableBottleIds([])
  //     setSelectedBottleIds([]) // Clear selected bottles if parent crate code is too short
  //   }
  // }, [parentCrateCodeForSubCrate])

    interface ConnectionModel {
      fromWalletAddress: string;
      fromType: 'manufacturer' | 'distributor' | 'retailer';
      toWalletAddress: string;
      toType: 'manufacturer' | 'distributor' | 'retailer';
      distanceKm?: number;
      transitTimeDays?: number;
      costPerUnit?: number;
      active?: boolean;
    }

    //useeffect to get the connected distributors
    useEffect(() => {
    const fetchConnections = async () => {
      try {
        if (!currentDistributor?.walletAddress) return;
  
        // Fetch connections of type 'distributor'
        const { data: connections } = await getConnectionsFrom(
          currentDistributor.walletAddress.toLowerCase(),
          "retailer"
        );
  
        // For each connection, fetch distributor details
        const retailerDetails = await Promise.all(
          connections.map(async (conn: ConnectionModel) => {
            const { data: retailer } = await getRetailerByWallet(conn.toWalletAddress);
            
            return {
              name: retailer.name,
              walletAddress: retailer.walletAddress,
              distanceKm: conn.distanceKm || "N/A",
              transitTimeDays: conn.transitTimeDays || "N/A",
            };
          })
        );
        console.log(retailerDetails)
        setConnectedRetailer(retailerDetails);
      } catch (error) {
        console.error("Error fetching connected distributors:", error);
      }
    };
  
    fetchConnections();
  }, [currentDistributor]);

  // Generate SubCrate ID when bottles are selected
  useEffect(() => {
    if (selectedBottleIds.length > 0) {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let result = ""
      for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      result = parentCrateCodeForSubCrate + "-" + result
      setSubCrateId(result)
    } else {
      setSubCrateId("")
    }
  }, [selectedBottleIds])

  const handleInputChange = (field: string, value: string) => {
    setDistributorData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }
const handleGetCrateInfo = async () => {
  if (!parentCrateCodeForSubCrate) {
    toast({
      title: "Error",
      description: "Please enter a valid Parent Crate Code first.",
      variant: "destructive",
    });
    return;
  }

  try {
    const bottleIds = await getAllBottlesOfCrate(parentCrateCodeForSubCrate) as string[];
    console.log("Bottle IDs:", bottleIds);
    
    // Convert to the format expected by MultiSelectDropdown
    const formattedBottleIds = bottleIds.map((id: string) => ({
      value: id,
      label: id,
    }));
    setAvailableBottleIds(formattedBottleIds);

    toast({
      title: "Success",
      description: `Fetched ${bottleIds.length} bottles for crate ${parentCrateCodeForSubCrate}`,
    });
  } catch (error: any) {
    console.error("Error fetching bottle IDs:", error);
    toast({
      title: "Error",
      description: `Failed to fetch bottle IDs: ${error.message}`,
      variant: "destructive",
    });
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // const connectedAccount = await getAccount()
    // const location = { 
    //     "type" : "distributor",
    //     "walletAddress" : connectedAccount
    //   }
    // await updateProductLocation("P001", location, false)

    try {
      await receiveCrate(receiveCrateCodeForAssignment)


      const bottleIds = await getAllBottlesOfCrate(receiveCrateCodeForAssignment) as string[]
      const crateInfo = await getCrateInfo(receiveCrateCodeForAssignment) as string[]
      const connectedAccount = await getAccount()

      const location = { 
        "type" : "distributor",
        "walletAddress" : connectedAccount
      }


      bottleIds.map( async (bottleId) => {
        await updateProductLocation(bottleId, location, false)
      })

      // console.log("crateInfo", crateInfo)
      // console.log("crateInfo.medicineName inside try", crateInfo[1])

      // await updateProductLocation("P001", location, true)
      await updateInventoryItem(
        connectedAccount,
        crateInfo[1],
        bottleIds.length,
        bottleIds,
        null,
        "add",
        )
      

      toast({
        title: "Success",
        description: "Crate received and distribution details updated on blockchain successfully!",
      })

      // Reset form
      setDistributorData({
        storageLocation: "",
        shippingDetails: "",
        dispatchTimestamp: "",
      })
      setreceiveCrateCodeForAssignment("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update distribution details: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateSubCrate = async () => {
    if (!parentCrateCodeForSubCrate) {
      toast({
        title: "Error",
        description: "Please enter a Parent Crate Code.",
        variant: "destructive",
      })
      return
    }
    if (selectedBottleIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one bottle ID.",
        variant: "destructive",
      })
      return
    }
    if (!subCrateId) {
      toast({
        title: "Error",
        description: "SubCrate ID could not be generated. Please select bottles.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingSubCrate(true)
    try {
      // Call the blockchain API to create a sub-crate
      const receipt = await createSubCrate(parentCrateCodeForSubCrate, subCrateId, selectedBottleIds)
      console.log("SubCrate creation successful:", receipt)

      toast({
        title: "SubCrate Created",
        description: `SubCrate ${subCrateId} created successfully for parent crate ${parentCrateCodeForSubCrate}.`,
      })

      // Reset form
      setParentCrateCodeForSubCrate("")
      setSelectedBottleIds([])
      setSubCrateId("")
    } catch (error: any) {
      console.error("Error creating sub-crate:", error)
      toast({
        title: "Error",
        description: `Failed to create sub-crate: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsCreatingSubCrate(false)
    }
  }

  const [allocations, setAllocations] = useState<PendingAllocation[]>([]);
  const [refreshAllocations, setRefreshAllocations] = useState(false);

  const refresh = () => setRefreshAllocations((prev) => !prev);

useEffect(() => {
  const fetchAllocations = async () => {
    try {
      const walletAddress = await getAccount();
      console.log("💼 walletAddress = ", walletAddress); // ✅ Debug line
      if (!walletAddress) return;
      const data = await getPendingAllocations(walletAddress);
      console.log("📦 pendingAllocations = ", data); // ✅ Debug line
      setAllocations(data);
    } catch (err) {
      console.error("Failed to load allocations", err);
    }
  };
  fetchAllocations();
}, [refreshAllocations]);

  const handleFulfill = async (orderId: string) => {
    try {
      const walletAddress = await getAccount();
      if (!walletAddress) return;
      await fulfillAllocations(walletAddress, orderId);
      refresh();
    } catch (err) {
      console.error("Failed to fulfill allocation", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Distributor Portal</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage shipping and distribution logistics</p>
              {currentDistributor && (
                <p className="text-xs sm:text-sm text-green-600 font-medium truncate">
                  {currentDistributor.name} - {currentDistributor.coverage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Path */}
        <div className="mb-6 sm:mb-8">
          <ConnectionPath
            manufacturer={assignedManufacturer}
            distributor={currentDistributor}
            retailer={selectedRetailer}
            currentUserType="distributor"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Distribution Update Form */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5" />
                Receive Crate
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Add shipping and storage information</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Label htmlFor="crateCodeForAssignment" className="text-sm sm:text-base">
                  Crate Code
                </Label>
                <Input
                  id="crateCodeForAssignment"
                  value={receiveCrateCodeForAssignment}
                  onChange={(e) => setreceiveCrateCodeForAssignment(e.target.value)}
                  placeholder="Enter crate code (e.g., XXXXX-XXXXX)"
                  className="text-sm sm:text-base"
                />

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating on Blockchain..." : "Receive Crate"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Crate Details */}
  <Card className="w-full">
  <CardHeader className="px-4 sm:px-6">
    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
      <Package className="h-5 w-5" />
      Crate Details
    </CardTitle>
    <CardDescription className="text-sm sm:text-base">
      Fetch and view crate information from the blockchain
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4 px-4 sm:px-6">
    <div>
      <Label htmlFor="crateCodeForDetails" className="text-sm sm:text-base">
        Crate Code
      </Label>
      <Input
        id="crateCodeForDetails"
        value={crateCodeForDetails}
        onChange={(e) => setCrateCodeForDetails(e.target.value)}
        placeholder="Enter crate code to fetch details"
        className="text-sm sm:text-base"
        disabled={isLoadingCrateDetails}
      />
    </div>
    
    <Button
      onClick={handleGetCrateDetails}
      className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3"
      disabled={!crateCodeForDetails.trim() || isLoadingCrateDetails}
    >
      {isLoadingCrateDetails ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Fetching Details...
        </>
      ) : (
        "Get Crate Details"
      )}
    </Button>

    {/* Show loading state */}
    {isLoadingCrateDetails && (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Fetching crate information from blockchain...</p>
      </div>
    )}

    {/* Show crate details only if we have valid data */}
    {crateDetails.crateCode && !isLoadingCrateDetails && (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs sm:text-sm font-medium text-gray-600">Crate Code</Label>
            <p className="font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded break-all">
              {crateDetails.crateCode}
            </p>
          </div>
          <div>
            <Label className="text-xs sm:text-sm font-medium text-gray-600">Medicine Name</Label>
            <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">
              {crateDetails.medicineName || "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs sm:text-sm font-medium text-gray-600">Batch ID</Label>
            <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">
              {crateDetails.batchId || "N/A"}
            </p>
          </div>
          <div>
            <Label className="text-xs sm:text-sm font-medium text-gray-600">Bottle Count</Label>
            <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.bottleCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs sm:text-sm font-medium text-gray-600">Current Status</Label>
            <Badge 
              variant="outline" 
              className={`text-xs sm:text-sm ${
                crateDetails.currentStatus === "Error" 
                  ? "text-red-600 border-red-600" 
                  : "text-green-600 border-green-600"
              }`}
            >
              {crateDetails.currentStatus}
            </Badge>
          </div>
        </div>
      </>
    )}

    {/* Show message when no crate is loaded and not loading */}
    {!crateDetails.crateCode && !isLoadingCrateDetails && (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Enter a crate code above to fetch details</p>
      </div>
    )}
  </CardContent>
</Card>


          {/* New: Create SubCrate Card */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <PlusCircle className="h-5 w-5" />
                Create SubCrate
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Divide a main crate into smaller sub-crates
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4">
              <div>
                <Label htmlFor="parentCrateCodeForSubCrate" className="text-sm sm:text-base">
                  Parent Crate Code
                </Label>
                <Input
                  id="parentCrateCodeForSubCrate"
                  value={parentCrateCodeForSubCrate}
                  onChange={(e) => setParentCrateCodeForSubCrate(e.target.value)}
                  placeholder="Enter parent crate code (e.g., XXXXX-XXXXX)"
                  className="text-sm sm:text-base"
                />
              </div>
            <Button onClick={handleGetCrateInfo}
              className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3"
               disabled={!parentCrateCodeForSubCrate}>
                Get Crate Info
            </Button>


              <MultiSelectDropdown
                label="Bottle IDs"
                options={availableBottleIds}
                selected={selectedBottleIds}
                onSelect={setSelectedBottleIds}
                placeholder="Select bottle IDs for sub-crate"
              />

              <div>
                <Label htmlFor="subCrateId" className="text-sm sm:text-base">
                  Generated SubCrate ID
                </Label>
                <Input
                  id="subCrateId"
                  value={subCrateId}
                  readOnly
                  placeholder="Auto-generated after selecting bottles"
                  className="bg-gray-50 font-mono text-sm sm:text-base"
                />
                {subCrateId && (
                  <p className="text-xs text-gray-600 mt-1">This unique ID will be assigned to your new sub-crate.</p>
                )}
              </div>

              <Button
                onClick={handleCreateSubCrate}
                className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3"
                disabled={
                  isCreatingSubCrate || !parentCrateCodeForSubCrate || selectedBottleIds.length === 0 || !subCrateId
                }
              >
                {isCreatingSubCrate ? "Creating SubCrate..." : "Create SubCrate"}
              </Button>
            </CardContent>
          </Card>

          {/* Retailer Selection */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Select Retailer
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Choose a retailer to forward your products to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="assignmentType" className="text-sm sm:text-base">
                  Assignment Type
                </Label>
                <Select
                  value={assignmentType}
                  onValueChange={(value: "crate" | "subCrate") => setAssignmentType(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crate">Crate</SelectItem>
                    <SelectItem value="subCrate">SubCrate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assignmentType === "crate" ? (
                <div>
                  <Label htmlFor="crateCodeForSend" className="text-sm sm:text-base">
                    Enter Crate Code
                  </Label>
                  <Input
                    id="crateCodeForSend"
                    value={crateCodeForSend}
                    onChange={(e) => setCrateCodeForSend(e.target.value)}
                    placeholder="Enter crate code (e.g., XXXXX-XXXXX)"
                    className="text-sm sm:text-base"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subCrateCodeForSend" className="text-sm sm:text-base">
                      Enter SubCrate Code
                    </Label>
                    <Input
                      id="subCrateCodeForSend"
                      value={subCrateCodeForSend}
                      onChange={(e) => setSubCrateCodeForSend(e.target.value)}
                      placeholder="Enter sub-crate code"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}

              <SearchableDropdown
                options={connectedRetailer.map((d, index) => ({
                  id: index.toString(),
                  name: `${d.name} (Dist: ${d.distanceKm} km, ${d.transitTimeDays} days)`,
                  walletAddress: d.walletAddress,
                  location: `${d.distanceKm} km | ${d.transitTimeDays} days`,
                }))}
                value={selectedRetailer}
                onSelect={setSelectedRetailer}
                placeholder="Search and select a retailer..."
                label="Available Retailers"
              />

              {selectedRetailer && (
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">Selected Retailer:</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-green-800">
                    <p>
                      <span className="font-medium">Name:</span> {selectedRetailer.name}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {selectedRetailer.type}
                    </p>
                    <p>
                      <span className="font-medium">Stores:</span> {selectedRetailer.stores}
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
            </CardContent>
          </Card>

          {/* Product Assignment Form */}
          <AssignmentForm
            fromEntity={currentDistributor} //not in use, have to change code in assginmet-form to remove
            toEntity={selectedRetailer}
            assignmentType={assignmentType}
            crateCode={crateCodeForSend}
            parentCrateCode={parentCrateCodeForSend}
            subCrateCode={subCrateCodeForSend}
          />
        </div>
        <Card className="mt-10 min-h-[400px]">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Package className="h-5 w-5" />
      Pending Allocations
    </CardTitle>
    <CardDescription>
      Orders assigned to you by retailers that are yet to be fulfilled
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto">
      <div className="max-h-80 overflow-y-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-white z-10 border-b-2">
            <tr className="border-b">
              <th className="text-left p-3 font-medium text-gray-900">Order ID</th>
              <th className="text-left p-3 font-medium text-gray-900">Medicine Name</th>
              <th className="text-left p-3 font-medium text-gray-900">Retailer Wallet</th>
              <th className="text-left p-3 font-medium text-gray-900">Count</th>
              <th className="text-left p-3 font-medium text-gray-900">Status</th>
              <th className="text-left p-3 font-medium text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc) => (
              <tr key={alloc.orderId} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-gray-900">{alloc.orderId}</td>
                <td className="p-3 font-medium text-gray-900">{alloc.productName}</td>
                <td className="p-3 text-gray-700 font-mono text-xs">
                  {alloc.retailer_wallet.slice(0, 10)}...{alloc.retailer_wallet.slice(-6)}
                </td>
                <td className="p-3 text-gray-700">{alloc.qty}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Pending
                  </Badge>
                </td>
                <td className="p-3">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-2"
                    onClick={() => handleFulfill(alloc.orderId)}
                  >
                    Update Status
                  </Button>
                </td>
              </tr>
            ))}
            {allocations.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No pending allocations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </CardContent>
</Card>

      </div>

        {/* Available Retailers Overview */}
        {/* <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Available Retailers Network</CardTitle>
            <CardDescription className="text-sm sm:text-base">Overview of all retailers in the network</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {supplyChainData.retailers.map((retailer) => (
                <div
                  key={retailer.id}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRetailer?.id === retailer.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedRetailer(retailer)}
                >
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{retailer.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{retailer.type}</p>
                  <p className="text-xs text-gray-500 mt-1">{retailer.stores} stores</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {retailer.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Quick Actions */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Track Location</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">Monitor real-time crate locations</p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm bg-transparent">
                View Map
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Schedule Delivery</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">Plan and schedule deliveries</p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm bg-transparent">
                Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Inventory Status</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">Check current inventory levels</p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm bg-transparent">
                View Status
              </Button>
            </CardContent>
          </Card>
        </div> */}
      </div>
  )
}