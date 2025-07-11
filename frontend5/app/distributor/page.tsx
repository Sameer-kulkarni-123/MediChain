"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Truck, ArrowLeft, MapPin, Calendar, Package, Users } from "lucide-react"
import Link from "next/link"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { ConnectionPath } from "@/components/connection-path"
import { AssignmentForm } from "@/components/assignment-form"
import supplyChainData from "@/data/supplyChainData.json"
import { useToast } from "@/hooks/use-toast"
import { sendCrate, receiveCrate, getCrate, getAccount } from "../../apis"

export default function DistributorPortal() {
  const [selectedCrate, setSelectedCrate] = useState("MC-1704123456-7890")
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null)
  const [currentDistributor, setCurrentDistributor] = useState<any>(null)
  const [receiveCrateCodeForAssignment, setreceiveCrateCodeForAssignment] = useState("")
  const [sendCrateCodeForAssignment, setsendCrateCodeForAssignment] = useState("")
  const [assignedManufacturer, setAssignedManufacturer] = useState<any>(null)
  const [distributorData, setDistributorData] = useState({
    storageLocation: "",
    shippingDetails: "",
    dispatchTimestamp: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate getting current distributor from wallet/auth
    setCurrentDistributor(supplyChainData.distributors[0])
    // Simulate assigned manufacturer
    setAssignedManufacturer(supplyChainData.manufacturers[0])
  }, [])

  // Mock crate data
  const crateDetails = {
    crateCode: "MRCZO",
    medicineName: "Paracetamol 500mg",
    batchId: "B001",
    manufacturerId: "MFG001",
    manufacturingDate: "2024-01-15",
    expiryDate: "2026-01-15",
    bottleCount: 100,
    currentStatus: "At Distributor",
  }

  const handleInputChange = (field: string, value: string) => {
    setDistributorData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get current account
      const account = await getAccount()
      
      // Simulate receiving crate from manufacturer (in real app, this would be triggered by manufacturer)
      // For demo purposes, we'll simulate the receive action
      await receiveCrate(receiveCrateCodeForAssignment)

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update distribution details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
          {/* Crate Details */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-5 w-5" />
                Crate Details
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Read-only information from the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Crate Code</Label>
                  <p className="font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded break-all">
                    {crateDetails.crateCode}
                  </p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Medicine Name</Label>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.medicineName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Batch ID</Label>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.batchId}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Manufacturer ID</Label>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.manufacturerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Manufacturing Date</Label>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.manufacturingDate}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Expiry Date</Label>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.expiryDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Bottle Count</Label>
                  <p className="text-xs sm:text-sm bg-gray-50 p-2 rounded">{crateDetails.bottleCount}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Current Status</Label>
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs sm:text-sm">
                    {crateDetails.currentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Update Form */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5" />
                Update Distribution Details
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
                  {isSubmitting ? "Updating Blockchain..." : "Update Distribution Details"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Retailer Selection */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Select Retailer
              </CardTitle>
              <Label htmlFor="crateCodeForAssignment" className="text-sm sm:text-base">
                Crate Code
              </Label>
              <Input
                id="crateCodeForAssignment"
                value={sendCrateCodeForAssignment}
                onChange={(e) => setsendCrateCodeForAssignment(e.target.value)}
                placeholder="Enter crate code (e.g., XXXXX-XXXXX)"
                className="text-sm sm:text-base"
              />
              <CardDescription className="text-sm sm:text-base">
                Choose a retailer to forward your products to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <SearchableDropdown
                options={supplyChainData.retailers}
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
            fromEntity={currentDistributor}
            toEntity={selectedRetailer}
            crateCode={sendCrateCodeForAssignment}
            assignmentType="distributor-to-retailer"
          />
        </div>

        {/* Available Retailers Overview */}
        <Card className="mt-6 sm:mt-8">
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {retailer.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
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
        </div>
      </div>
    </div>
  )
}
