"use client"

import type React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { TrashIcon, AlertTriangleIcon, Loader2 } from "lucide-react"

interface RemoveDialogProps {
  documentId: Id<"documents">
  children: React.ReactNode
  onClick?: () => void
}

export const RemoveDialog = ({ documentId, children, onClick }: RemoveDialogProps) => {
  const remove = useMutation(api.documents.removeById)
  const [isRemoving, setIsRemoving] = useState(false)
  const { user } = useUser()
  const getById = useQuery(api.documents.getById, { documentId })

  const owner = user?.id === getById?.ownerId

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!owner) {
      toast.warning("You don't have permission to delete the document")
      return
    }
    setIsRemoving(true)
    onClick?.()
    remove({ documentId })
      .then(() => {
        toast.success("Document deleted successfully")
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setIsRemoving(false))
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent
        onClick={(e) => e.stopPropagation()}
        className="bg-white/95 backdrop-blur-md border-slate-200/50 shadow-xl rounded-2xl p-0 max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-semibold text-slate-800">Delete Document</AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
              This action cannot be undone. The document will be permanently removed from your workspace and all
              collaborators will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-6 py-4 bg-red-50/50 border-y border-red-100/50">
            <div className="flex items-center gap-3 text-sm">
              <TrashIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">&quot;{getById?.title || "Untitled"}&quot; will be deleted</p>
                <p className="text-red-600 text-xs mt-1">This cannot be recovered</p>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="p-6 pt-4 bg-slate-50/50 rounded-b-2xl">
            <div className="flex gap-3 w-full sm:w-auto">
              <AlertDialogCancel
                onClick={(e) => e.stopPropagation()}
                className="flex-1 sm:flex-none text-slate-600 hover:bg-slate-100 hover:text-slate-700 border-slate-200 rounded-xl transition-colors duration-200"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isRemoving}
                onClick={handleRemove}
                className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <AnimatePresence mode="wait">
                  {isRemoving ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                      Deleting...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="delete"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete Document
                    </motion.div>
                  )}
                </AnimatePresence>
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
