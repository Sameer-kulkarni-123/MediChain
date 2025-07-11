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

interface AssignmentFormProps {
  fromEntity: any
  toEntity: any
  assignmentType: "manufacturer-to-distributor" | "distributor-to-retailer"
}

export function AssignmentForm({ fromEntity, toEntity, assignmentType }: AssignmentFormProps) {
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

    if (!toEntity) {
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
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const targetType = assignmentType.includes("distributor") ? "retailer" : "distributor"
      toast({
        title: "Assignment Successful",
        description: `Product assigned to ${toEntity.name} successfully!`,
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              value={assignmentData.productName}
              onChange={(e) => handleInputChange("productName", e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batchId">Batch ID</Label>
              <Input
                id="batchId"
                value={assignmentData.batchId}
                onChange={(e) => handleInputChange("batchId", e.target.value)}
                placeholder="Enter batch ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={assignmentData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={assignmentData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any special instructions or notes"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !toEntity}>
            {isSubmitting ? "Assigning..." : `Assign to ${toEntity?.name || "Selected Entity"}`}
          </Button>

          {!toEntity && (
            <p className="text-sm text-gray-500 text-center">
              Please select a {assignmentType.includes("distributor") ? "retailer" : "distributor"} to enable assignment
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
