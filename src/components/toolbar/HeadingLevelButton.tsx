"use client"

import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import { ChevronDownIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Level } from "@tiptap/extension-heading"
import { motion } from "framer-motion"

export const HeadingLevelButton = () => {
  const { editor } = useEditorStore()

  const headings = [
    { label: "Normal Text", value: 0, fontSize: "16px" },
    { label: "Heading 1", value: 1, fontSize: "32px" },
    { label: "Heading 2", value: 2, fontSize: "24px" },
    { label: "Heading 3", value: 3, fontSize: "20px" },
    { label: "Heading 4", value: 4, fontSize: "18px" },
  ]

  const getCurrentHeading = () => {
    for (let level = 1; level <= 4; level++) {
      if (editor?.isActive("heading", { level })) {
        return `Heading ${level}`
      }
    }
    return "Normal text"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          className="h-8 min-w-8 shrink-0 flex items-center justify-between rounded-lg hover:bg-slate-100 px-3 transition-colors duration-200 text-slate-700 border border-slate-200 bg-white"
        >
          <span className="truncate text-sm font-medium">{getCurrentHeading()}</span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg rounded-xl">
        <div className="space-y-1">
          {headings.map(({ label, value, fontSize }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.01 }}
              style={{ fontSize }}
              onClick={() => {
                if (value === 0) {
                  editor?.chain().focus().setParagraph().run()
                } else {
                  editor
                    ?.chain()
                    .focus()
                    .toggleHeading({ level: value as Level })
                    .run()
                }
              }}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 w-full text-left",
                value === 0 && !editor?.isActive("heading") && "bg-violet-50 text-violet-700",
                editor?.isActive("heading", { level: value }) && "bg-violet-50 text-violet-700",
              )}
            >
              <span className="font-medium">{label}</span>
            </motion.button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
