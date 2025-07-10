"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  name: string
  walletAddress: string
  category: string
  [key: string]: any
}

interface SearchableDropdownProps {
  options: Option[]
  value?: Option | null
  onSelect: (option: Option) => void
  placeholder: string
  label: string
  disabled?: boolean
}

export function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder,
  label,
  disabled = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
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
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
            disabled && "cursor-not-allowed bg-gray-50 text-gray-500",
          )}
        >
          <span className="block truncate">{value ? value.name : placeholder}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50",
                    value?.id === option.id && "bg-blue-50",
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "block truncate font-medium",
                        value?.id === option.id ? "text-blue-600" : "text-gray-900",
                      )}
                    >
                      {option.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{option.walletAddress}</span>
                    {option.location && <span className="text-xs text-gray-400">{option.location}</span>}
                  </div>
                  {value?.id === option.id && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                      <Check className="h-5 w-5" />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
