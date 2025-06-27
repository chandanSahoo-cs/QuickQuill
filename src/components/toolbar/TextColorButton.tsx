"use client"

import { useEditorStore } from "@/store/useEditorStore"
import type { ColorResult } from "react-color"
import { SketchPicker } from "react-color"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

export const TextColorButton = () => {
  const { editor } = useEditorStore()
  const value = editor?.getAttributes("textStyle").color || "#000000"
  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setColor(color.hex).run()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-8 min-w-8 shrink-0 flex flex-col items-center justify-center rounded-lg hover:bg-slate-100 px-2 transition-colors duration-200 text-slate-600 hover:text-slate-800 gap-1"
        >
          <span className="text-sm font-bold">A</span>
          <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: value }} />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border-slate-200 shadow-xl rounded-xl overflow-hidden">
        <div className="bg-white/95 backdrop-blur-sm">
          <SketchPicker color={value} onChange={onChange} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
