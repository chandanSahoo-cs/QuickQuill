"use client"

import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import { ListCollapseIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

export const LineHeightButton = () => {
  const { editor } = useEditorStore()

  const lineHeights = [
    {
      label: "Default",
      value: "normal",
    },
    {
      label: "Single",
      value: "1",
    },
    {
      label: "1.5",
      value: "1.5",
    },
    {
      label: "Double",
      value: "2",
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-8 min-w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800"
        >
          <ListCollapseIcon className="h-4 w-4" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg rounded-xl">
        <div className="space-y-1">
          {lineHeights.map(({ label, value }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.01 }}
              onClick={() => editor?.chain().focus().setLineHeight(value).run()}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 w-full text-left",
                editor?.isActive({ lineHeight: value }) && "bg-violet-50 text-violet-700",
              )}
            >
              <span className="text-sm font-medium">{label}</span>
            </motion.button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
