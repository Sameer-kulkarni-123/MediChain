"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Factory, ArrowLeft, Users, Package, Clock } from "lucide-react"
import Link from "next/link"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { ConnectionPath } from "@/components/connection-path"
import { AssignmentForm } from "@/components/assignment-form"
import supplyChainData from "@/data/supplyChainData.json"
import { useToast } from "@/hooks/use-toast"
import { registerCrate } from "../../apis"

interface CreatedCrate {
  crateCode: string
  bottleCodes: string[]
  fullCrateCodes: string[] // Format: XXXXX-XXXXX
  formData: {
    batchId: string
    medicineId: string
    medicineName: string
    manufacturerPhysicalAddress: string
    cidDocuments: string
    bottleCount: string
  }
  timestamp: string
}

export default function ManufacturerPortal() {
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null)
  const [currentManufacturer, setCurrentManufacturer] = useState<any>(null)
  const [createdCrates, setCreatedCrates] = useState<CreatedCrate[]>([])
  const [usedCodes, setUsedCodes] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    crateCode: "",
    batchId: "",
    medicineId: "",
    medicineName: "",
    manufacturerPhysicalAddress: "",
    cidDocuments: "",
    bottleCount: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate getting current manufacturer from wallet/auth
    // In real app, this would come from authentication
    setCurrentManufacturer(supplyChainData.manufacturers[0])
  }, [])

  // Generate random 10-character code with hyphen (XXXXX-XXXXX format)
  const generateRandom10CharCode = (): string => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""

    // Generate until we get a unique code
    do {
      // Generate first 5 characters
      let firstPart = ""
      for (let i = 0; i < 5; i++) {
        firstPart += characters.charAt(Math.floor(Math.random() * characters.length))
      }

      // Generate second 5 characters
      let secondPart = ""
      for (let i = 0; i < 5; i++) {
        secondPart += characters.charAt(Math.floor(Math.random() * characters.length))
      }

      // Combine with hyphen
      result = `${firstPart}-${secondPart}`
    } while (usedCodes.has(result))

    return result
  }

  // Generate random bottle codes for each bottle
  const generateRandomBottleCodes = (count: number): string[] => {
    const bottleCodes: string[] = []

    for (let i = 0; i < count; i++) {
      let bottleCode: string

      // Generate until we get a unique bottle code
      do {
        bottleCode = generateRandom10CharCode()
      } while (usedCodes.has(bottleCode) || bottleCodes.includes(bottleCode))

      bottleCodes.push(bottleCode)
    }
    console.log("Generated bottle codes:", bottleCodes)

    return bottleCodes
  }

  const generateCrateCode = () => {
    const newCrateCode = generateRandom10CharCode()

    setFormData((prev) => ({
      ...prev,
      crateCode: newCrateCode,
    }))

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

    if (!formData.crateCode) {
      toast({
        title: "Error",
        description: "Please generate a crate code first",
        variant: "destructive",
      })
      return
    }

    if (!formData.bottleCount || Number.parseInt(formData.bottleCount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid bottle count",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const bottleCount = Number.parseInt(formData.bottleCount)
      const crateCode = formData.crateCode

      if (bottleCount > 99999) {
        toast({
          title: "Error",
          description: "Bottle count cannot exceed 99,999",
          variant: "destructive",
        })
        return
      }

      // Generate random bottle codes (each is a 10-character code with hyphen)
      const bottleCodes = generateRandomBottleCodes(bottleCount)

      // Store the bottle codes as the full crate codes
      const fullCrateCodes = bottleCodes

      // Add all codes to used codes
      const newUsedCodes = new Set(usedCodes)
      newUsedCodes.add(crateCode)
      bottleCodes.forEach((code) => newUsedCodes.add(code))

      // Create crate object
      const newCrate: CreatedCrate = {
        crateCode,
        bottleCodes,
        fullCrateCodes,
        formData: { ...formData },
        timestamp: new Date().toLocaleString(),
      }

      // Update state (stored but not displayed)
      setCreatedCrates((prev) => [...prev, newCrate])
      setUsedCodes(newUsedCodes)

      // Call the blockchain API
      const receipt = await registerCrate(formData.crateCode, formData)
      console.log("Crate details submitted:", receipt)
      console.log("Generated codes stored in state:", fullCrateCodes)

      toast({
        title: "Success",
        description: `Crate created successfully with ${bottleCount} bottles! Codes stored in system.`,
      })

      // Reset form
      setFormData({
        crateCode: "",
        batchId: "",
        medicineId: "",
        medicineName: "",
        manufacturerPhysicalAddress: "",
        cidDocuments: "",
        bottleCount: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create crate. Please try again.",
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
              {currentManufacturer && (
                <p className="text-sm text-blue-600 font-medium">
                  {currentManufacturer.name} - {currentManufacturer.specialization}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Path */}
        <ConnectionPath
          manufacturer={currentManufacturer}
          distributor={selectedDistributor}
          currentUserType="manufacturer"
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Crate Creation Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Crate Creation
              </CardTitle>
              <CardDescription>Generate crate code and enter manufacturing details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Crate Code Generation */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Crate Code</h3>
                      <p className="text-sm text-gray-600">Generate a unique 10-character identifier for your crate</p>
                    </div>
                    <Button type="button" onClick={generateCrateCode} variant="outline">
                      Generate Code
                    </Button>
                  </div>
                  <Input
                    value={formData.crateCode}
                    placeholder="Click generate to create code"
                    readOnly
                    className="bg-white font-mono text-lg"
                  />
                  {formData.crateCode && (
                    <Badge variant="outline" className="text-green-600 border-green-600 mt-2">
                      10-Character Code Generated Successfully
                    </Badge>
                  )}
                </div>

                {/* Manufacturing Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="manufacturerPhysicalAddress">Manufacturer Physical Address</Label>
                  <Input
                    id="manufacturerPhysicalAddress"
                    value={formData.manufacturerPhysicalAddress}
                    onChange={(e) => handleInputChange("manufacturerPhysicalAddress", e.target.value)}
                    placeholder="Enter manufacturer physical address"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bottleCount">Bottle Count</Label>
                  <Input
                    id="bottleCount"
                    type="number"
                    min="1"
                    max="99999"
                    value={formData.bottleCount}
                    onChange={(e) => handleInputChange("bottleCount", e.target.value)}
                    placeholder="Enter number of bottles (1-99999)"
                    required
                  />
                  {formData.bottleCount && Number.parseInt(formData.bottleCount) > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Will generate {formData.bottleCount} random 10-character bottle codes (Format: XXXXX-XXXXX)
                    </p>
                  )}
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

                <Button type="submit" className="w-full" disabled={isSubmitting || !formData.crateCode}>
                  {isSubmitting ? "Creating Crate on Blockchain..." : "Create Crate on Blockchain"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Distributor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Distributor
              </CardTitle>
              <CardDescription>Choose a distributor to assign your products to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchableDropdown
                options={supplyChainData.distributors}
                value={selectedDistributor}
                onSelect={setSelectedDistributor}
                placeholder="Search and select a distributor..."
                label="Available Distributors"
              />

              {selectedDistributor && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Selected Distributor:</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>
                      <span className="font-medium">Name:</span> {selectedDistributor.name}
                    </p>
                    <p>
                      <span className="font-medium">Coverage:</span> {selectedDistributor.coverage}
                    </p>
                    <p>
                      <span className="font-medium">Capacity:</span> {selectedDistributor.capacity}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {selectedDistributor.location}
                    </p>
                    <p className="font-mono text-xs">
                      <span className="font-medium">Wallet:</span> {selectedDistributor.walletAddress}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Assignment Form */}
          <AssignmentForm
            fromEntity={currentManufacturer}
            toEntity={selectedDistributor}
            assignmentType="manufacturer-to-distributor"
          />
        </div>

        {/* Available Distributors Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Distributors Network</CardTitle>
            <CardDescription>Overview of all distributors in the network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplyChainData.distributors.map((distributor) => (
                <div
                  key={distributor.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDistributor?.id === distributor.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedDistributor(distributor)}
                >
                  <h4 className="font-medium text-gray-900">{distributor.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{distributor.coverage}</p>
                  <p className="text-xs text-gray-500 mt-1">{distributor.capacity}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {distributor.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
