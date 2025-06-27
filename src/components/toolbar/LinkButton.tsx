"use client"

import { useEditorStore } from "@/store/useEditorStore"
import { Link2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { motion } from "framer-motion"

export const LinkButton = () => {
  const { editor } = useEditorStore()
  const [value, setValue] = useState("")

  const onChange = (href: string) => {
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run()
    setValue("")
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setValue(editor?.getAttributes("link").href || "")
      }}
    >
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-8 min-w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800"
        >
          <Link2Icon className="h-4 w-4" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-3 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg rounded-xl min-w-80">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Link URL</label>
            <Input
              placeholder="https://example.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300 focus:ring-violet-200 rounded-lg h-10 transition-all duration-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onChange(value)
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setValue("")}
              className="flex-1 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Clear
            </Button>
            <Button
              onClick={() => onChange(value)}
              size="sm"
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Apply Link
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
