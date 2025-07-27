"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Store, ArrowLeft, Shield, CheckCircle, Package, Truck, Factory } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { retailerReceivedCrate, scanBottle, getCrateInfo, getAccount } from "../../apis"

export default function RetailerPortal() {
  const [crateCode, setCrateCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [deliveryAcknowledged, setDeliveryAcknowledged] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCertActivated, setIsCertActivated] = useState(false)

  const { toast } = useToast()

  // Mock crate journey data
  const crateJourney = {
    crateCode: "BFIT0",
    medicineName: "Paracetamol 500mg",
    batchId: "B001",
    bottleCount: 100,
    stages: [
      {
        stage: "Manufacturing",
        icon: Factory,
        status: "completed",
        timestamp: "2024-01-15 10:30 AM",
        location: "PharmaCorp Manufacturing Facility",
        details: "Crate manufactured and quality tested",
      },
      {
        stage: "Distribution",
        icon: Truck,
        status: "completed",
        timestamp: "2024-01-18 02:15 PM",
        location: "MediLogistics Warehouse",
        details: "Stored in temperature-controlled environment",
      },
      {
        stage: "Retail Delivery",
        icon: Store,
        status: "in-progress",
        timestamp: "2024-01-20 09:00 AM",
        location: "HealthMart Pharmacy",
        details: "Ready for final delivery confirmation",
      },
    ],
  }

  const verifyCrate = async () => {
    if (!crateCode) {
      toast({
        title: "Error",
        description: "Please enter a crate code to verify",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)

    try {
      // Get crate data from blockchain
      const crateData = await getCrateInfo(crateCode)
      
      if (crateData && crateData.exists) {
        setIsVerified(true)
        toast({
          title: "Verification Successful",
          description: "Crate authenticity confirmed on blockchain",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: "Crate code not found or invalid",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify crate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const confirmDelivery = async () => {
    if (!deliveryAcknowledged) {
      toast({
        title: "Error",
        description: "Please acknowledge delivery before confirming",
        variant: "destructive",
      })
      return
    }

    try {
      // Mark crate as received by retailer (final destination)
      await retailerReceivedCrate(crateCode)

      toast({
        title: "Delivery Confirmed",
        description: "Final delivery status updated on blockchain",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm delivery. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleActivateCert = async () => {
  try {
    await activateCertifications(crateCode);
    setIsCertActivated(true);
    toast({
      title: "Certifications Activated",
      description: "Retailer successfully activated crate certifications",
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to activate certifications",
      variant: "destructive",
    });
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Retailer Portal</h1>
              <p className="text-gray-600">Verify authenticity and confirm final delivery</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Crate Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Crate Verification
              </CardTitle>
              <CardDescription>Verify crate authenticity using blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="crateCode">Crate Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="crateCode"
                    value={crateCode}
                    onChange={(e) => setCrateCode(e.target.value)}
                    placeholder="Enter crate code (e.g., MC-1704123456-7890)"
                  />
                  {/* <Button onClick={verifyCrate} disabled={isVerifying} variant="outline">
                    {isVerifying ? "Verifying..." : "Verify"}
                  </Button> */}
                </div>
              </div>

              {isVerified && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Verification Successful</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">Crate authenticity confirmed on blockchain</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Delivery Confirmation
              </CardTitle>
              <CardDescription>Confirm final delivery and update status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="delivery-ack" checked={deliveryAcknowledged} onCheckedChange={setDeliveryAcknowledged} />
                <Label htmlFor="delivery-ack" className="text-sm">
                  I acknowledge that the medical crate has been received in good condition
                </Label>
              </div>

              <Button
                onClick={confirmDelivery}
                disabled={!deliveryAcknowledged || isVerified}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Confirm Final Delivery
              </Button>
              {isVerified && deliveryAcknowledged && (
              <Button
                onClick={handleActivateCert}
                disabled={isCertActivated}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCertActivated ? "✅ Certifications Activated" : "Activate Certifications"}
              </Button>
            )}


              {isVerified && <p className="text-sm text-gray-500">Please verify crate authenticity first</p>}
            </CardContent>
          </Card>
        </div>

        {/* Crate Journey */}
        {isVerified && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Complete Crate Journey
              </CardTitle>
              <CardDescription>Track the complete journey from manufacturer to retailer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Crate Code:</span>
                    <p className="font-mono">{crateJourney.crateCode}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Medicine:</span>
                    <p>{crateJourney.medicineName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Batch ID:</span>
                    <p>{crateJourney.batchId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Bottle Count:</span>
                    <p>{crateJourney.bottleCount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {crateJourney.stages.map((stage, index) => {
                  const Icon = stage.icon
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div
                        className={`p-2 rounded-full ${
                          stage.status === "completed"
                            ? "bg-green-100"
                            : stage.status === "in-progress"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            stage.status === "completed"
                              ? "text-green-600"
                              : stage.status === "in-progress"
                                ? "text-blue-600"
                                : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{stage.stage}</h3>
                          <Badge
                            variant="outline"
                            className={
                              stage.status === "completed"
                                ? "text-green-600 border-green-600"
                                : stage.status === "in-progress"
                                  ? "text-blue-600 border-blue-600"
                                  : "text-gray-600 border-gray-600"
                            }
                          >
                            {stage.status === "completed"
                              ? "Completed"
                              : stage.status === "in-progress"
                                ? "In Progress"
                                : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{stage.timestamp}</p>
                        <p className="text-sm font-medium text-gray-800">{stage.location}</p>
                        <p className="text-sm text-gray-600">{stage.details}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}