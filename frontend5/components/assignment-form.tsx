"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { getAccount, sendCrate, sendSubCrate } from "../apis"

interface Entity {
  id: string
  name: string
  walletAddress: string
  [key: string]: any
}

interface AssignmentFormProps {
  fromEntity: Entity | null
  toEntity: Entity | null
  assignmentType: "crate" | "subCrate" // Updated type
  crateCode?: string // Optional for main crate
  parentCrateCode?: string // Optional for sub-crate
  subCrateCode?: string // Optional for sub-crate
}

export function AssignmentForm({
  fromEntity,
  toEntity,
  assignmentType,
  crateCode,
  parentCrateCode,
  subCrateCode,
}: AssignmentFormProps) {
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSendCrate = async () => {
    if (!fromEntity || !toEntity) {
      toast({
        title: "Error",
        description: "Please ensure both sender and receiver are selected.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      // Get current account (assuming the current user is the sender)
      const account = await getAccount()

      let receipt
      if (assignmentType === "subCrate") {
        if (!parentCrateCode || !subCrateCode) {
          toast({
            title: "Error",
            description: "Please enter both parent and sub-crate codes for sub-crate assignment.",
            variant: "destructive",
          })
          return
        }
        receipt = await sendSubCrate(parentCrateCode, subCrateCode, toEntity.walletAddress)
      } else {
        // assignmentType === "crate"
        if (!crateCode) {
          toast({
            title: "Error",
            description: "Please enter a crate code.",
            variant: "destructive",
          })
          return
        }
        receipt = await sendCrate(crateCode, toEntity.walletAddress)
      }

      console.log("Send transaction successful:", receipt)
      toast({
        title: `${assignmentType === "subCrate" ? "SubCrate" : "Crate"} Sent`,
        description: `${assignmentType === "subCrate" ? "SubCrate" : "Crate"} successfully sent to ${toEntity.name}.`,
      })
    } catch (error: any) {
      console.error("Error sending crate:", error)
      toast({
        title: "Error",
        description: `Failed to send ${assignmentType === "subCrate" ? "sub-crate" : "crate"}: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Determine if the send button should be disabled
  const isSendButtonDisabled =
    isSending ||
    !fromEntity ||
    !toEntity ||
    (assignmentType === "subCrate" ? !parentCrateCode || !subCrateCode : !crateCode)

  const getTitle = () => {
    return assignmentType === "subCrate" ? "Send SubCrate" : "Send Crate"
  }

  const getDescription = () => {
    return assignmentType === "subCrate"
      ? "Confirm and send sub-crate to the selected retailer."
      : "Confirm and send crate to the selected retailer."
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
        <div className="space-y-4">
          {fromEntity && toEntity ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-blue-900">
                From: <span className="font-normal">{fromEntity.name}</span>
              </p>
              <p className="text-sm font-medium text-blue-900">
                To: <span className="font-normal">{toEntity.name}</span>
              </p>
              {assignmentType === "subCrate" ? (
                <>
                  <p className="text-sm font-medium text-blue-900">
                    Parent Crate Code: <span className="font-normal font-mono break-all">{parentCrateCode}</span>
                  </p>
                  <p className="text-sm font-medium text-blue-900">
                    SubCrate Code: <span className="font-normal font-mono break-all">{subCrateCode}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-blue-900">
                  Crate Code: <span className="font-normal font-mono break-all">{crateCode}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Please select a retailer and enter a crate/sub-crate code.</p>
          )}

          <Button
            onClick={handleSendCrate}
            disabled={isSendButtonDisabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 sm:py-3"
          >
            {isSending ? "Sending..." : `Send ${assignmentType === "subCrate" ? "SubCrate" : "Crate"}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
