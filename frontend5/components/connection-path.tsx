"use client"

import { ArrowRight, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Entity {
  id: string
  name: string
  location?: string
  specialization?: string
  coverage?: string
  type?: string
}

interface ConnectionPathProps {
  manufacturer?: Entity | null
  distributor?: Entity | null
  retailer?: Entity | null
  currentUserType: "manufacturer" | "distributor" | "retailer"
}

export function ConnectionPath({ manufacturer, distributor, retailer, currentUserType }: ConnectionPathProps) {
  const getStepStatus = (step: string) => {
    switch (currentUserType) {
      case "manufacturer":
        if (step === "manufacturer") return "current"
        if (step === "distributor" && distributor) return "selected"
        return "pending"
      case "distributor":
        if (step === "manufacturer") return "completed"
        if (step === "distributor") return "current"
        if (step === "retailer" && retailer) return "selected"
        return "pending"
      case "retailer":
        if (step === "manufacturer") return "completed"
        if (step === "distributor") return "completed"
        if (step === "retailer") return "current"
        return "pending"
      default:
        return "pending"
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "current":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "selected":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  return (
    <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-white rounded-lg border">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Supply Chain Connection Path</h3>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        {/* Manufacturer Step */}
        <div className="flex-1">
          <div className={`p-2 sm:p-3 rounded-lg border-2 ${getStepColor(getStepStatus("manufacturer"))}`}>
            <div className="text-xs sm:text-sm font-medium">Manufacturer</div>
            {manufacturer ? (
              <div className="mt-1">
                <div className="font-semibold text-xs sm:text-sm truncate">{manufacturer.name}</div>
                <div className="text-xs opacity-75 truncate">{manufacturer.specialization}</div>
                <div className="text-xs opacity-75 truncate">{manufacturer.location}</div>
              </div>
            ) : (
              <div className="text-xs opacity-75">Not connected</div>
            )}
          </div>
        </div>

        <ArrowRight className="mx-2 sm:mx-4 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0" />

        {/* Distributor Step */}
        <div className="flex-1">
          <div className={`p-2 sm:p-3 rounded-lg border-2 ${getStepColor(getStepStatus("distributor"))}`}>
            <div className="text-xs sm:text-sm font-medium">Distributor</div>
            {distributor ? (
              <div className="mt-1">
                <div className="font-semibold text-xs sm:text-sm truncate">{distributor.name}</div>
                <div className="text-xs opacity-75 truncate">{distributor.coverage}</div>
                <div className="text-xs opacity-75 truncate">{distributor.location}</div>
              </div>
            ) : (
              <div className="text-xs opacity-75">Not selected</div>
            )}
          </div>
        </div>

        <ArrowRight className="mx-2 sm:mx-4 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0" />

        {/* Retailer Step */}
        <div className="flex-1">
          <div className={`p-2 sm:p-3 rounded-lg border-2 ${getStepColor(getStepStatus("retailer"))}`}>
            <div className="text-xs sm:text-sm font-medium">Retailer</div>
            {retailer ? (
              <div className="mt-1">
                <div className="font-semibold text-xs sm:text-sm truncate">{retailer.name}</div>
                <div className="text-xs opacity-75 truncate">{retailer.type}</div>
                <div className="text-xs opacity-75 truncate">{retailer.location}</div>
              </div>
            ) : (
              <div className="text-xs opacity-75">Not selected</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        {/* Manufacturer Step */}
        <div className={`p-3 rounded-lg border-2 ${getStepColor(getStepStatus("manufacturer"))}`}>
          <div className="text-sm font-medium">Manufacturer</div>
          {manufacturer ? (
            <div className="mt-1">
              <div className="font-semibold text-sm">{manufacturer.name}</div>
              <div className="text-xs opacity-75">{manufacturer.specialization}</div>
              <div className="text-xs opacity-75">{manufacturer.location}</div>
            </div>
          ) : (
            <div className="text-xs opacity-75">Not connected</div>
          )}
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-4 w-4 text-gray-400" />
        </div>

        {/* Distributor Step */}
        <div className={`p-3 rounded-lg border-2 ${getStepColor(getStepStatus("distributor"))}`}>
          <div className="text-sm font-medium">Distributor</div>
          {distributor ? (
            <div className="mt-1">
              <div className="font-semibold text-sm">{distributor.name}</div>
              <div className="text-xs opacity-75">{distributor.coverage}</div>
              <div className="text-xs opacity-75">{distributor.location}</div>
            </div>
          ) : (
            <div className="text-xs opacity-75">Not selected</div>
          )}
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-4 w-4 text-gray-400" />
        </div>

        {/* Retailer Step */}
        <div className={`p-3 rounded-lg border-2 ${getStepColor(getStepStatus("retailer"))}`}>
          <div className="text-sm font-medium">Retailer</div>
          {retailer ? (
            <div className="mt-1">
              <div className="font-semibold text-sm">{retailer.name}</div>
              <div className="text-xs opacity-75">{retailer.type}</div>
              <div className="text-xs opacity-75">{retailer.location}</div>
            </div>
          ) : (
            <div className="text-xs opacity-75">Not selected</div>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs">
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
            Completed
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
            Current
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
            Selected
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
            Pending
          </Badge>
        </div>
      </div>
    </div>
  )
}
