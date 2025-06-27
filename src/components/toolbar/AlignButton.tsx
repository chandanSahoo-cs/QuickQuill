"use client"

import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import { AlignCenterIcon, AlignJustifyIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

export const AlignButton = () => {
  const { editor } = useEditorStore()

  const alignments = [
    {
      label: "Align Left",
      value: "left",
      icon: AlignLeftIcon,
    },
    {
      label: "Align Center",
      value: "center",
      icon: AlignCenterIcon,
    },
    {
      label: "Align Right",
      value: "right",
      icon: AlignRightIcon,
    },
    {
      label: "Align Justify",
      value: "justify",
      icon: AlignJustifyIcon,
    },
  ]

  let InitialIcon = AlignLeftIcon
  alignments.map(({ value, icon: Icon }) => {
    if (editor?.isActive({ textAlign: value })) {
      InitialIcon = Icon
    }
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-8 min-w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800"
        >
          <InitialIcon className="h-4 w-4" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg rounded-xl">
        <div className="space-y-1">
          {alignments.map(({ label, value, icon: Icon }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => editor?.chain().focus().setTextAlign(value).run()}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 w-full text-left",
                editor?.isActive({ textAlign: value }) && "bg-violet-50 text-violet-700",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{label}</span>
            </motion.button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
