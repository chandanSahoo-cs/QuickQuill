"use client"

import type React from "react"

import { useEditorStore } from "@/store/useEditorStore"
import { MinusIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export const FontSizeButton = () => {
  const { editor } = useEditorStore()
  const currentFontSize = editor?.getAttributes("textStyle").fontSize
    ? editor?.getAttributes("textStyle").fontSize.replace("px", "")
    : "16"

  const [inputValue, setInputValue] = useState(currentFontSize)
  const [isEditing, setIsEditing] = useState(false)

  const updateFontSize = (newSize: string) => {
    const size = Number.parseInt(newSize)
    if (!isNaN(size) && size > 0) {
      editor?.chain().focus().setFontSize(`${size}px`).run()
      setInputValue(newSize)
      setIsEditing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    updateFontSize(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      updateFontSize(inputValue)
      editor?.commands.focus()
    }
  }

  const increment = () => {
    const newSize = Number.parseInt(inputValue) + 1
    updateFontSize(newSize.toString())
  }

  const decrement = () => {
    const newSize = Number.parseInt(inputValue) - 1
    updateFontSize(newSize.toString())
  }

  return (
    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={decrement}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-600"
      >
        <MinusIcon className="h-3 w-3" />
      </motion.button>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="h-7 w-12 text-sm text-center bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all duration-200"
          autoFocus
        />
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            setIsEditing(true)
            setInputValue(currentFontSize)
          }}
          className="h-7 w-12 text-sm text-center bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors duration-200 cursor-text text-slate-700"
        >
          {currentFontSize}
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={increment}
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 text-slate-600"
      >
        <PlusIcon className="h-3 w-3" />
      </motion.button>
    </div>
  )
}
