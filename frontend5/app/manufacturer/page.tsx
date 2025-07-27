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
import supplyChainData from "@/data/supplyChainData.json"
import { useToast } from "@/hooks/use-toast"
import { registerCrate, getAccount, sendCrate } from "../../apis"

interface CreatedCrate {
  crateCode: string
  bottleCodes: string[]
  fullCrateCodes: string[] // Format: XXXXX-XXXXX
  formData: {
    batchId: string
    productId: string
    medicineName: string
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
    productId: "",
    medicineName: "",
    cidDocuments: "",
    bottleCount: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [manualCrateCodeForAssignment, setManualCrateCodeForAssignment] = useState("")

  useEffect(() => {
    // Simulate getting current manufacturer from wallet/auth
    // In real app, this would come from authentication
    setCurrentManufacturer(supplyChainData.manufacturers[0])
  }, [])

  // Generate random 10-character crate code (XXXXX-XXXXX format)
  const generateFullCrateCode = (): string => {
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
      // for (let i = 0; i < 5; i++) {
      //   secondPart += characters.charAt(Math.floor(Math.random() * characters.length))
      // }

      // Combine with hyphen
      result = `${firstPart}${secondPart}`
    } while (usedCodes.has(result))

    return result
  }

  // Generate bottle codes using the first 5 characters of crate code + unique suffixes
  const generateBottleCodesWithCratePrefix = (fullCrateCode: string, count: number): string[] => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const bottleCodes: string[] = []

    // Extract first 5 characters 
    //from the full crate code (before the hyphen)
    const cratePrefix = fullCrateCode.split("-")[0]

    for (let i = 0; i < count; i++) {
      let suffix: string

      // Generate unique 5-character suffix for each bottle
      do {
        suffix = ""
        for (let j = 0; j < 5; j++) {
          suffix += characters.charAt(Math.floor(Math.random() * characters.length))
        }
      } while (bottleCodes.some((code) => code.endsWith(`-${suffix}`)) || usedCodes.has(`${cratePrefix}-${suffix}`))

      const fullBottleCode = `${cratePrefix}-${suffix}`
      bottleCodes.push(fullBottleCode)
    }

    console.log("Generated bottle codes:", bottleCodes)
    console.log("All bottles linked to crate prefix:", cratePrefix)
    return bottleCodes
  }

  const generateCrateCode = () => {
    const newCrateCode = generateFullCrateCode()

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

  const handleDistributorConfirmation = async (crateCode:string, toAddress:string) => {
    if (!selectedDistributor) {
      toast({
        title: "Error",
        description: "No distributor selected",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call to confirm distributor selection
      // await new Promise((resolve) => setTimeout(resolve, 15000))
      const receipt = await sendCrate(crateCode, toAddress)
      console.log(receipt)

      toast({
        title: "Distributor Confirmed",
        description: `${selectedDistributor.name} has been confirmed as your distribution partner`,
      })

      console.log("Distributor confirmed:", selectedDistributor)
      setManualCrateCodeForAssignment("");
      setSelectedDistributor(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm distributor selection. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
        setIsSubmitting(false)
        return
      }

      // Generate bottle codes using the first 5 characters of the crate code + unique suffixes
      const bottleCodes = generateBottleCodesWithCratePrefix(crateCode, bottleCount)
      const fullCrateCodes = bottleCodes

      // Add all codes to used codes
      const newUsedCodes = new Set(usedCodes) //have to use backend
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

      // Prepare data for blockchain
      const blockchainData = {
        ...formData,
        bottleCodes: fullCrateCodes,
        timestamp: new Date().toISOString(),
      }

      const account = await getAccount()

      // Call the blockchain API
      const receipt = await registerCrate(
        formData.crateCode,
        formData.batchId,    //adding it to contract later
        formData.productId,
        formData.medicineName,
        // account,
        formData.cidDocuments || "",
        Number.parseInt(formData.bottleCount),
        bottleCodes,
      )
      console.log("Crate details submitted to blockchain:", receipt)
      console.log("Generated codes stored in system:", fullCrateCodes)

      toast({
        title: "Success",
        description: `Crate created successfully with ${bottleCount} bottles! Codes stored in system.`,
      })

      // Reset form
      setFormData({
        crateCode: "",
        batchId: "",
        productId: "",
        medicineName: "",
        cidDocuments: "",
        bottleCount: "",
      })
    } catch (error) {
      console.error("Blockchain submission error:", error)
      toast({
        title: "Error",
        description: "Failed to create crate on blockchain. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Manufacturer Portal</h1>
              <p className="text-sm sm:text-base text-gray-600">Create and manage medical crate records</p>
              {currentManufacturer && (
                <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">
                  {currentManufacturer.name} - {currentManufacturer.specialization}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connection Path */}
        <div className="mb-6 sm:mb-8">
          <ConnectionPath
            manufacturer={currentManufacturer}
            distributor={selectedDistributor}
            currentUserType="manufacturer"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Crate Creation Form */}
          <Card className="xl:col-span-2">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-5 w-5" />
                Crate Creation
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Generate crate code and enter manufacturing details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Crate Code Generation */}
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">Crate Code</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Generate a unique 10-character crate code (XXXXX format)
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={generateCrateCode}
                      variant="outline"
                      className="shrink-0 w-full sm:w-auto bg-transparent"
                    >
                      Generate Code
                    </Button>
                  </div>
                  <Input
                    value={formData.crateCode}
                    placeholder="Click generate to create code"
                    readOnly
                    className="bg-white font-mono text-sm sm:text-lg"
                  />
                  {formData.crateCode && (
                    <div className="mt-2 space-y-1">
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs sm:text-sm">
                        10-Character Crate Code Generated Successfully
                      </Badge>
                      <p className="text-xs text-gray-600">
                        All bottle codes will use prefix: {formData.crateCode.split("-")[0]}-XXXXX
                      </p>
                      <p className="text-xs text-blue-600">Bottles will be linked to crate: {formData.crateCode}</p>
                    </div>
                  )}
                </div>

                {/* Manufacturing Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batchId" className="text-sm sm:text-base">
                      Batch ID
                    </Label>
                    <Input
                      id="batchId"
                      value={formData.batchId}
                      onChange={(e) => handleInputChange("batchId", e.target.value)}
                      placeholder="Enter batch ID"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productId" className="text-sm sm:text-base">
                      Product ID
                    </Label>
                    <Input
                      id="productId"
                      value={formData.productId}
                      onChange={(e) => handleInputChange("productId", e.target.value)}
                      placeholder="Enter Product ID"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="medicineName" className="text-sm sm:text-base">
                    Medicine Name
                  </Label>
                  <Input
                    id="medicineName"
                    value={formData.medicineName}
                    onChange={(e) => handleInputChange("medicineName", e.target.value)}
                    placeholder="Enter medicine name"
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="bottleCount" className="text-sm sm:text-base">
                    Bottle Count
                  </Label>
                  <Input
                    id="bottleCount"
                    type="number"
                    min="1"
                    max="99999"
                    value={formData.bottleCount}
                    onChange={(e) => handleInputChange("bottleCount", e.target.value)}
                    placeholder="Enter number of bottles (1-99999)"
                    required
                    className="text-sm sm:text-base"
                  />
                  {formData.bottleCount && Number.parseInt(formData.bottleCount) > 0 && formData.crateCode && (
                    <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-1">
                      <p>
                        Will generate {formData.bottleCount} bottle codes using prefix "
                        {formData.crateCode.split("-")[0]}-"
                      </p>
                      <p className="text-xs text-blue-600">
                        All bottles will be linked to parent crate: {formData.crateCode}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="cidDocuments" className="text-sm sm:text-base">
                    CID Documents
                  </Label>
                  <Textarea
                    id="cidDocuments"
                    value={formData.cidDocuments}
                    onChange={(e) => handleInputChange("cidDocuments", e.target.value)}
                    placeholder="Enter IPFS CID for documents"
                    rows={3}
                    className="text-sm sm:text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                  disabled={isSubmitting || !formData.crateCode}
                >
                  {isSubmitting ? "Creating Crate on Blockchain..." : "Create Crate on Blockchain"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Distributor Selection */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Select Distributor
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Choose a distributor to assign your products to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
            <Label htmlFor="crateCodeForAssignment" className="text-sm sm:text-base">
                Crate Code
              </Label>
              <Input
                id="crateCodeForAssignment"
                value={manualCrateCodeForAssignment}
                onChange={(e) => setManualCrateCodeForAssignment(e.target.value)}
                placeholder="Enter crate code (e.g., XXXXX)"
                className="text-sm sm:text-base"
              />
              <SearchableDropdown
                options={supplyChainData.distributors}
                value={selectedDistributor}
                onSelect={setSelectedDistributor}
                placeholder="Search and select a distributor..."
                label="Available Distributors"
              />

              {selectedDistributor && (
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">Selected Distributor:</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-green-800">
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
                    <p className="font-mono text-xs break-all">
                      <span className="font-medium">Wallet:</span> {selectedDistributor.walletAddress}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleDistributorConfirmation(manualCrateCodeForAssignment, selectedDistributor["walletAddress"])}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Confirming Selection..." : "Confirm Distributor Selection"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Distributors Overview */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Available Distributors Network</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Overview of all distributors in the network
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplyChainData.distributors.map((distributor) => (
                <div
                  key={distributor.id}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDistributor?.id === distributor.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedDistributor(distributor)}
                >
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{distributor.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{distributor.coverage}</p>
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
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">Crate MC-1704123456-7890</p>
                  <p className="text-xs sm:text-sm text-gray-600">Paracetamol 500mg - Batch B001</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600 shrink-0 text-xs sm:text-sm">
                  Completed
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base">Crate MC-1704123456-7891</p>
                  <p className="text-xs sm:text-sm text-gray-600">Ibuprofen 200mg - Batch B002</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600 shrink-0 text-xs sm:text-sm">
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
