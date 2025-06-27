"use client"

import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import { ListIcon, ListOrderedIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

export const ListButton = () => {
  const { editor } = useEditorStore()

  const lists = [
    {
      label: "Bullet List",
      icon: ListIcon,
      isActive: () => editor?.isActive("bulletList"),
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered List",
      icon: ListOrderedIcon,
      isActive: () => editor?.isActive("orderedList"),
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
    },
  ]

  let InitialIcon = ListIcon
  lists.map(({ icon: Icon, isActive }) => {
    if (isActive()) {
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
          {lists.map(({ label, icon: Icon, onClick, isActive }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.01 }}
              onClick={onClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 w-full text-left",
                isActive() && "bg-violet-50 text-violet-700",
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
