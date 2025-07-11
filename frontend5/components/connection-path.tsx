"use client"

import { ArrowRight, Factory, Truck, Store } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ConnectionPathProps {
  manufacturer?: any
  distributor?: any
  retailer?: any
  currentUserType: string
}

export function ConnectionPath({ manufacturer, distributor, retailer, currentUserType }: ConnectionPathProps) {
  const getStepStatus = (step: string) => {
    if (step === "manufacturer") return manufacturer ? "completed" : "current"
    if (step === "distributor") return distributor ? "completed" : manufacturer ? "current" : "pending"
    if (step === "retailer") return retailer ? "completed" : distributor ? "current" : "pending"
    return "pending"
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100 border-green-200"
      case "current":
        return "text-blue-600 bg-blue-100 border-blue-200"
      case "pending":
        return "text-gray-400 bg-gray-100 border-gray-200"
      default:
        return "text-gray-400 bg-gray-100 border-gray-200"
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Supply Chain Connection Path</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-4">
          {/* Manufacturer Step */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 ${getStepColor(getStepStatus("manufacturer"))}`}>
              <div className="flex items-center space-x-3">
                <Factory className="h-6 w-6" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{manufacturer ? manufacturer.name : "Select Manufacturer"}</p>
                  {manufacturer && <p className="text-xs truncate opacity-75">{manufacturer.location}</p>}
                </div>
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                Manufacturer
              </Badge>
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />

          {/* Distributor Step */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 ${getStepColor(getStepStatus("distributor"))}`}>
              <div className="flex items-center space-x-3">
                <Truck className="h-6 w-6" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{distributor ? distributor.name : "Select Distributor"}</p>
                  {distributor && <p className="text-xs truncate opacity-75">{distributor.coverage}</p>}
                </div>
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                Distributor
              </Badge>
            </div>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />

          {/* Retailer Step */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 ${getStepColor(getStepStatus("retailer"))}`}>
              <div className="flex items-center space-x-3">
                <Store className="h-6 w-6" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{retailer ? retailer.name : "Select Retailer"}</p>
                  {retailer && <p className="text-xs truncate opacity-75">{retailer.type}</p>}
                </div>
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                Retailer
              </Badge>
            </div>
          </div>
        </div>

        {/* Connection Summary */}
        {(manufacturer || distributor || retailer) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Connection Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {manufacturer && (
                <p>
                  • <span className="font-medium">Manufacturer:</span> {manufacturer.name} (
                  {manufacturer.specialization})
                </p>
              )}
              {distributor && (
                <p>
                  • <span className="font-medium">Distributor:</span> {distributor.name} ({distributor.coverage})
                </p>
              )}
              {retailer && (
                <p>
                  • <span className="font-medium">Retailer:</span> {retailer.name} ({retailer.type})
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
