"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSearchParam } from "@/hooks/use-search-param"
import { SearchIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import { motion } from "framer-motion"

export const SearchInput = () => {
  const [search, setSearch] = useSearchParam("search")
  const [value, setValue] = useState(search)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const handleClear = () => {
    setValue("")
    setSearch("")
    inputRef.current?.blur()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSearch(value)
    inputRef.current?.blur()
  }

  return (
    <div className="flex-1 flex items-center justify-center max-w-2xl">
      <motion.form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md"
        whileHover={{ scale: 1.005 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search documents..."
          className={`
            w-full h-10 px-10 rounded-full border-0 
            bg-slate-50 text-slate-700
            placeholder:text-slate-400
            transition-all duration-200 ease-out
            focus-visible:ring-1 focus-visible:ring-violet-200 focus-visible:ring-offset-0
            focus-visible:bg-white focus-visible:shadow-sm
            ${isFocused ? "bg-white shadow-sm" : "hover:bg-slate-100/70"}
          `}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-transparent text-slate-400"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.form>
    </div>
  )
}
