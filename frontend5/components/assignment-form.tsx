"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendCrate } from "../apis"

interface Entity {
  id: string
  name: string
  walletAddress: string
  [key: string]: any
}

interface AssignmentFormProps {
  fromEntity: Entity | null
  toEntity: Entity | null
  crateCode: string | null
  assignmentType: "manufacturer-to-distributor" | "distributor-to-retailer"
}

export function AssignmentForm({ fromEntity, toEntity, crateCode, assignmentType }: AssignmentFormProps) {
  const [assignmentData, setAssignmentData] = useState({
    productName: "",
    batchId: "",
    quantity: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setAssignmentData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromEntity || !toEntity) {
      toast({
        title: "Error",
        description: `Please select a ${assignmentType.includes("distributor") ? "retailer" : "distributor"} first`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate blockchain transaction
      // await new Promise((resolve) => setTimeout(resolve, 2000))
      const receipt = await sendCrate(crateCode, toEntity.walletAddress)

      toast({
        title: "Assignment Successful",
        description: `Product assigned from ${fromEntity.name} to ${toEntity.name}`,
      })

      // Reset form
      setAssignmentData({
        productName: "",
        batchId: "",
        quantity: "",
        notes: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    return assignmentType === "manufacturer-to-distributor" ? "Assign to Distributor" : "Forward to Retailer"
  }

  const getDescription = () => {
    return assignmentType === "manufacturer-to-distributor"
      ? "Assign products to the selected distributor"
      : "Forward products to the selected retailer"
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Send className="h-5 w-5" />
          {getTitle()}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div>
            <Label htmlFor="productName" className="text-sm sm:text-base">
              Product Name
            </Label>
            <Input
              id="productName"
              value={assignmentData.productName}
              onChange={(e) => handleInputChange("productName", e.target.value)}
              placeholder="Enter product name"
              required
              className="text-sm sm:text-base"
            />
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <div>
              <Label htmlFor="batchId" className="text-sm sm:text-base">
                Batch ID
              </Label>
              <Input
                id="batchId"
                value={assignmentData.batchId}
                onChange={(e) => handleInputChange("batchId", e.target.value)}
                placeholder="Enter batch ID"
                required
                className="text-sm sm:text-base"
              />
            </div> */}
            {/* <div>
              <Label htmlFor="quantity" className="text-sm sm:text-base">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={assignmentData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="Enter quantity"
                required
                className="text-sm sm:text-base"
              />
            </div> */}
          </div>

          {/* <div>
            <Label htmlFor="notes" className="text-sm sm:text-base">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={assignmentData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
              className="text-sm sm:text-base"
            />
          </div> */}

          <Button
            type="submit"
            className="w-full text-sm sm:text-base py-2 sm:py-3"
            disabled={isSubmitting || !fromEntity || !toEntity}
          >
            {isSubmitting ? "Assigning..." : `Assign to ${toEntity?.name || "Selected Entity"}`}
          </Button>

          {(!fromEntity || !toEntity) && (
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              Please select a {assignmentType.includes("distributor") ? "retailer" : "distributor"} to enable assignment
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
