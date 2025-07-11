"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Truck, ArrowLeft, Users, Package, Clock, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { ConnectionPath } from "@/components/connection-path"
import { AssignmentForm } from "@/components/assignment-form"
import supplyChainData from "@/data/supplyChainData.json"
import { useToast } from "@/hooks/use-toast"
import { sendCrate, receiveCrate, getCrate, getAccount } from "../../apis"

export default function DistributorPortal() {
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null)
  const [currentDistributor, setCurrentDistributor] = useState<any>(null)
  const [assignedManufacturer, setAssignedManufacturer] = useState<any>(null)
  const [distributorData, setDistributorData] = useState({
    storageLocation: "",
    shippingDetails: "",
    dispatchTimestamp: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Mock crate data
  const crateDetails = {
    crateCode: "MC-1704123456-7890",
    medicineName: "Paracetamol 500mg",
    batchId: "B001",
    manufacturerId: "MFG001",
    manufacturingDate: "2024-01-15",
    expiryDate: "2026-01-15",
    bottleCount: 100,
    currentStatus: "At Distributor",
  }

  useEffect(() => {
    // Simulate getting current distributor from wallet/auth
    setCurrentDistributor(supplyChainData.distributors[0])
    // Simulate assigned manufacturer
    setAssignedManufacturer(supplyChainData.manufacturers[0])
  }, [])

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
      await receiveCrate(crateDetails.crateCode)

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Distributor Portal</h1>
              <p className="text-gray-600">Manage shipping and distribution logistics</p>
              {currentDistributor && (
                <p className="text-sm text-green-600 font-medium">
                  {currentDistributor.name} - {currentDistributor.coverage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Path */}
        <ConnectionPath
          manufacturer={assignedManufacturer}
          distributor={currentDistributor}
          retailer={selectedRetailer}
          currentUserType="distributor"
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Crate Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Received Crate Details
              </CardTitle>
              <CardDescription>Information from manufacturer on blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Crate Code</Label>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">{crateDetails.crateCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Medicine Name</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{crateDetails.medicineName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Batch ID</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{crateDetails.batchId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Manufacturer ID</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{crateDetails.manufacturerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Manufacturing Date</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{crateDetails.manufacturingDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{crateDetails.expiryDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bottle Count</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{crateDetails.bottleCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {crateDetails.currentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Update Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Update Distribution Details
              </CardTitle>
              <CardDescription>Add shipping and storage information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="storageLocation">Storage Location</Label>
                  <Input
                    id="storageLocation"
                    value={distributorData.storageLocation}
                    onChange={(e) => handleInputChange("storageLocation", e.target.value)}
                    placeholder="Enter storage facility address"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shippingDetails">Shipping Details</Label>
                  <Input
                    id="shippingDetails"
                    value={distributorData.shippingDetails}
                    onChange={(e) => handleInputChange("shippingDetails", e.target.value)}
                    placeholder="Enter shipping method and carrier"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dispatchTimestamp">Dispatch Timestamp</Label>
                  <Input
                    id="dispatchTimestamp"
                    type="datetime-local"
                    value={distributorData.dispatchTimestamp}
                    onChange={(e) => handleInputChange("dispatchTimestamp", e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? "Updating Blockchain..." : "Update Distribution Details"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Retailer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Retailer
              </CardTitle>
              <CardDescription>Choose a retailer to forward your products to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchableDropdown
                options={supplyChainData.retailers}
                value={selectedRetailer}
                onSelect={setSelectedRetailer}
                placeholder="Search and select a retailer..."
                label="Available Retailers"
              />

              {selectedRetailer && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Selected Retailer:</h4>
                  <div className="space-y-1 text-sm text-green-800">
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
                    <p className="font-mono text-xs">
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
            assignmentType="distributor-to-retailer"
          />
        </div>

        {/* Available Retailers Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Retailers Network</CardTitle>
            <CardDescription>Overview of all retailers in the network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplyChainData.retailers.map((retailer) => (
                <div
                  key={retailer.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRetailer?.id === retailer.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedRetailer(retailer)}
                >
                  <h4 className="font-medium text-gray-900">{retailer.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{retailer.type}</p>
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
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <MapPin className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Track Location</h3>
              <p className="text-sm text-gray-600 mb-4">Monitor real-time crate locations</p>
              <Button variant="outline" size="sm">
                View Map
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Schedule Delivery</h3>
              <p className="text-sm text-gray-600 mb-4">Plan and schedule deliveries</p>
              <Button variant="outline" size="sm">
                Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Package className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Inventory Status</h3>
              <p className="text-sm text-gray-600 mb-4">Check current inventory levels</p>
              <Button variant="outline" size="sm">
                View Status
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Crate MC-1704123456-7890</p>
                  <p className="text-sm text-gray-600">Forwarded to HealthMart Pharmacy</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Completed
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Crate MC-1704123456-7891</p>
                  <p className="text-sm text-gray-600">In transit to City Hospital</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
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
