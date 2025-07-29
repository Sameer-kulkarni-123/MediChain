"use client"

import * as React from "react"
import { Check, ChevronsUpDown, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Option {
  value: string
  label: string
}

interface MultiSelectDropdownProps {
  options: Option[]
  selected: string[]
  onSelect: (value: string[]) => void
  placeholder?: string
  label?: string
}

export function MultiSelectDropdown({
  options,
  selected,
  onSelect,
  placeholder = "Select options...",
  label,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    const newSelected = selected.includes(currentValue)
      ? selected.filter((item) => item !== currentValue)
      : [...selected, currentValue]
    onSelect(newSelected)
    setInputValue("") // Clear input after selection
  }

  const handleRemove = (valueToRemove: string) => {
    onSelect(selected.filter((item) => item !== valueToRemove))
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] flex-wrap pr-2 bg-transparent"
          >
            <div className="flex flex-wrap gap-1">
              {selected.length > 0 ? (
                selected.map((value) => {
                  const option = options.find((opt) => opt.value === value)
                  return (
                    <Badge key={value} variant="secondary" className="flex items-center gap-1 pr-1">
                      {option?.label || value}
                      <XCircle
                        className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(value)
                        }}
                      />
                    </Badge>
                  )
                })
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search options..." value={inputValue} onValueChange={setInputValue} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Use label for search, but value for selection
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center justify-between"
                  >
                    {option.label}
                    <Check
                      className={cn("ml-auto h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="text-sm text-gray-600 mt-2">
          Selected Bottle IDs: <span className="font-mono break-all">{selected.join(", ")}</span>
        </div>
      )}
    </div>
  )
}
