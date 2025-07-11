"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  name: string
  walletAddress: string
  location: string
  [key: string]: any
}

interface SearchableDropdownProps {
  options: Option[]
  value: Option | null
  onSelect: (option: Option | null) => void
  placeholder?: string
  label?: string
}

export function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder = "Search and select...",
  label,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(
    (option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (option: Option) => {
    onSelect(option)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {label && <Label className="text-sm sm:text-base">{label}</Label>}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal text-sm sm:text-base h-auto min-h-[2.5rem] sm:min-h-[3rem]",
            !value && "text-muted-foreground",
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {value ? (
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="font-medium truncate w-full">{value.name}</span>
              <span className="text-xs text-gray-500 truncate w-full">{value.location}</span>
            </div>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[60vh] overflow-hidden">
            <div className="p-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect(option)}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium text-sm truncate">{option.name}</span>
                      <span className="text-xs text-gray-500 truncate">{option.location}</span>
                      <span className="text-xs text-gray-400 font-mono truncate">
                        {option.walletAddress.slice(0, 10)}...
                      </span>
                    </div>
                    {value?.id === option.id && <Check className="h-4 w-4 text-green-600 shrink-0 ml-2" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
