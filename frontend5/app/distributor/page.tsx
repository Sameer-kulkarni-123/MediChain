"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Truck, ArrowLeft, MapPin, Calendar, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function DistributorPortal() {
  const [selectedCrate, setSelectedCrate] = useState("MC-1704123456-7890")
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
    currentStatus: "At Manufacturer",
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
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Success",
        description: "Distribution details updated on blockchain successfully!",
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
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Crate Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Crate Details
              </CardTitle>
              <CardDescription>Read-only information from the blockchain</CardDescription>
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
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
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
        </div>

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
      </div>
    </div>
  )
}
