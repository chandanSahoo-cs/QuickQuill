"use client"

import { useEditorStore } from "@/store/useEditorStore"
import { ImageIcon, SearchIcon, UploadIcon } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { motion } from "framer-motion"

export const ImageButton = () => {
  const { editor } = useEditorStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const onChange = (src: string) => {
    editor?.chain().focus().setImage({ src }).run()
  }

  const onUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const imageUrl = URL.createObjectURL(file)
        onChange(imageUrl)
      }
    }

    input.click()
  }

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      onChange(imageUrl)
      setImageUrl("")
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-8 min-w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800"
          >
            <ImageIcon className="h-4 w-4" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-2 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg rounded-xl">
          <div className="space-y-1">
            <DropdownMenuItem
              onClick={onUpload}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
            >
              <UploadIcon className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium">Upload Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
            >
              <SearchIcon className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium">Paste Image URL</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-md border-slate-200/50 shadow-xl rounded-2xl p-0 max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-violet-600" />
                </div>
                <DialogTitle className="text-lg font-semibold text-slate-800">Insert Image URL</DialogTitle>
              </div>
            </DialogHeader>
            <div className="px-6 pb-4">
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImageUrlSubmit()
                  }
                }}
                className="bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300 focus:ring-violet-200 rounded-xl h-11 transition-all duration-200"
                autoFocus
              />
            </div>
            <DialogFooter className="p-6 pt-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
              <div className="flex gap-3 w-full">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImageUrlSubmit}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Insert Image
                </Button>
              </div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
}
