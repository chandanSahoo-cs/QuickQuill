"use client"

import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import { ChevronDownIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

export const FontFamilyButton = () => {
  const { editor } = useEditorStore()

  const fonts = [
    { label: "Arial", value: "Arial" },
    { label: "Helvetica", value: "Helvetica" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Georgia", value: "Georgia" },
    { label: "Verdana", value: "Verdana" },
    { label: "Trebuchet MS", value: "Trebuchet MS" },
    { label: "Courier New", value: "Courier New" },
    { label: "Lucida Console", value: "Lucida Console" },
    { label: "Tahoma", value: "Tahoma" },
    { label: "Impact", value: "Impact" },
    { label: "Palatino Linotype", value: "Palatino Linotype" },
    { label: "Garamond", value: "Garamond" },
    { label: "Comic Sans MS", value: "Comic Sans MS" },
    { label: "Segoe UI", value: "Segoe UI" },
    { label: "Calibri", value: "Calibri" },
    { label: "Cambria", value: "Cambria" },
    { label: "Didot", value: "Didot" },
    { label: "Rockwell", value: "Rockwell" },
    { label: "Franklin Gothic Medium", value: "Franklin Gothic Medium" },
    { label: "Century Gothic", value: "Century Gothic" },
    { label: "Lucida Sans Unicode", value: "Lucida Sans Unicode" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          className="h-8 w-32 shrink-0 flex items-center justify-between rounded-lg hover:bg-slate-100 px-3 transition-colors duration-200 text-slate-700 border border-slate-200 bg-white"
        >
          <span className="truncate text-sm font-medium">
            {editor?.getAttributes("textStyle").fontFamily || "Arial"}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg rounded-xl max-h-64 overflow-y-auto">
        <div className="space-y-1">
          {fonts.map(({ label, value }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.01 }}
              onClick={() => editor?.chain().focus().setFontFamily(value).run()}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 w-full text-left",
                !editor?.getAttributes("textStyle").fontFamily && value === "Arial" && "bg-violet-50 text-violet-700",
                editor?.getAttributes("textStyle").fontFamily === value && "bg-violet-50 text-violet-700",
              )}
              style={{ fontFamily: value }}
            >
              <span className="text-sm">{label}</span>
            </motion.button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
