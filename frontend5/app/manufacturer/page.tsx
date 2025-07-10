"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Factory, ArrowLeft, Package, Hash, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { registerCrate } from "../../apis"

export default function ManufacturerPortal() {
  async function onSubmit() {
    const receipt = await registerCrate(crateCode, formData)
    console.log("Crate details submitted:", receipt)
  }
  const [crateCode, setCrateCode] = useState("")
  const [formData, setFormData] = useState({
    batchId: "",
    medicineId: "",
    medicineName: "",
    manufacturerId: "",
    manufacturingDate: "",
    manufacturerAddress:"0xc4546db5f94e4bf5ef3d85f249768f469c5446c6", // Add manufacturing address field
    currentAddress: "0xc4546db5f94e4bf5ef3d85f249768f469c5446c6", // Add current address field
    currentAddressId: "", // Add current address id field
    //manufacturer address
    //match manufacturing addr and current address
    //math manufacturing addressId with current address id
    expiryDate: "",
    bottleCount: "",
    cidDocuments: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const generateCrateCode = () => {
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000)
    const newCrateCode = `MC-${timestamp}-${randomNum}`
    setCrateCode(newCrateCode)

    toast({
      title: "Crate Code Generated",
      description: `New crate code: ${newCrateCode}`,
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!crateCode) {
      toast({
        title: "Error",
        description: "Please generate a crate code first",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Success",
        description: "Crate details stored on blockchain successfully!",
      })

      // Reset form
      setCrateCode("")
      setFormData({
        batchId: "",
        medicineId: "",
        medicineName: "",
        manufacturerId: "",
        manufacturingDate: "",
        manufacturerAddress: "", // Add manufacturing address field
        currentAddress: "", // Add current address field
        currentAddressId: "", // Add current address id field
        //manufacturer address
        //match manufacturing addr and current address
        //math manufacturing addressId with current address id
        expiryDate: "",
        bottleCount: "",
        cidDocuments: ""
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to store crate details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Factory className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manufacturer Portal</h1>
              <p className="text-gray-600">Create and manage medical crate records</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Crate Code Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Crate Code Generation
              </CardTitle>
              <CardDescription>Generate a unique identifier for your medical crate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="crateCode">Crate Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="crateCode"
                    value={crateCode}
                    placeholder="Click generate to create code"
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button onClick={generateCrateCode} variant="outline">
                    Generate
                  </Button>
                </div>
              </div>
              {crateCode && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Code Generated Successfully
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Manufacturing Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manufacturing Details
              </CardTitle>
              <CardDescription>Enter the details for the medical crate</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batchId">Batch ID</Label>
                    <Input
                      id="batchId"
                      value={formData.batchId}
                      onChange={(e) => handleInputChange("batchId", e.target.value)}
                      placeholder="Enter batch ID"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="medicineId">Medicine ID</Label>
                    <Input
                      id="medicineId"
                      value={formData.medicineId}
                      onChange={(e) => handleInputChange("medicineId", e.target.value)}
                      placeholder="Enter medicine ID"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="medicineName">Medicine Name</Label>
                  <Input
                    id="medicineName"
                    value={formData.medicineName}
                    onChange={(e) => handleInputChange("medicineName", e.target.value)}
                    placeholder="Enter medicine name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturerId">Manufacturer ID</Label>
                  <Input
                    id="manufacturerId"
                    value={formData.manufacturerId}
                    onChange={(e) => handleInputChange("manufacturerId", e.target.value)}
                    placeholder="Enter manufacturer ID"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
                    <Input
                      id="manufacturingDate"
                      type="date"
                      value={formData.manufacturingDate}
                      onChange={(e) => handleInputChange("manufacturingDate", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bottleCount">Bottle Count</Label>
                  <Input
                    id="bottleCount"
                    type="number"
                    value={formData.bottleCount}
                    onChange={(e) => handleInputChange("bottleCount", e.target.value)}
                    placeholder="Enter number of bottles"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cidDocuments">CID Documents</Label>
                  <Textarea
                    id="cidDocuments"
                    value={formData.cidDocuments}
                    onChange={(e) => handleInputChange("cidDocuments", e.target.value)}
                    placeholder="Enter IPFS CID for documents"
                    rows={3}
                  />
                </div>

                <Button onClick={onSubmit} type="submit" className="w-full" disabled={isSubmitting || !crateCode}>
                  {isSubmitting ? "Submitting to Blockchain..." : "Submit to Blockchain"}
                </Button>
              </form>
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
                  <p className="text-sm text-gray-600">Paracetamol 500mg - Batch B001</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Completed
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Crate MC-1704123456-7891</p>
                  <p className="text-sm text-gray-600">Ibuprofen 200mg - Batch B002</p>
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
