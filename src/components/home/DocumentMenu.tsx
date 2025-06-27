"use client"

import { RemoveDialog } from "@/components/RemoveDialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ExternalLinkIcon, FilePenIcon, MoreVertical, TrashIcon, Copy } from "lucide-react"
import type { Id } from "../../../convex/_generated/dataModel"
import { RenameDialog } from "@/components/RenameDialog"
import { motion } from "framer-motion"

interface DocumentMenuProps {
  documentId: Id<"documents">
  title: string
  onNewTab: (id: string) => void
}

export const DocumentMenu = ({ documentId, title, onNewTab }: DocumentMenuProps) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/documents/${documentId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl rounded-xl p-2 min-w-[180px]"
        onClick={(e) => e.stopPropagation()}
      >
        <RenameDialog documentId={documentId} initialTitle={title}>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-700 hover:bg-slate-50 focus:bg-slate-50 rounded-lg text-sm py-2"
          >
            <FilePenIcon className="h-4 w-4 mr-3" />
            Rename
          </DropdownMenuItem>
        </RenameDialog>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onNewTab(documentId)
          }}
          className="text-slate-700 hover:bg-slate-50 focus:bg-slate-50 rounded-lg text-sm py-2"
        >
          <ExternalLinkIcon className="h-4 w-4 mr-3" />
          Open in new tab
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            handleCopyLink()
          }}
          className="text-slate-700 hover:bg-slate-50 focus:bg-slate-50 rounded-lg text-sm py-2"
        >
          <Copy className="h-4 w-4 mr-3" />
          Copy link
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100 my-1" />

        <RemoveDialog documentId={documentId}>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
            className="text-red-600 hover:bg-red-50 focus:bg-red-50 rounded-lg text-sm py-2"
          >
            <TrashIcon className="h-4 w-4 mr-3" />
            Remove
          </DropdownMenuItem>
        </RemoveDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
