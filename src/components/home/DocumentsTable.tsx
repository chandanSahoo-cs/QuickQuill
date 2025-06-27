"use client"

import { Button } from "@/components/ui/button"
import type { PaginationStatus } from "convex/react"
import { LoaderIcon, FileText, Sparkles } from "lucide-react"
import type { Doc } from "../../../convex/_generated/dataModel"
import { DocumentCard } from "./DocumentCard"
import { motion, AnimatePresence } from "framer-motion"

interface DocumentsTableProps {
  documents: Doc<"documents">[] | undefined
  loadMore: (numItems: number) => void
  status: PaginationStatus
}

export const DocumentsTable = ({ documents, loadMore, status }: DocumentsTableProps) => {
  return (
    <div className="max-w-[1110px] mx-auto py-16">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Elegant Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3 pb-6 border-b border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800">Recent Documents</h2>
          </div>
          <p className="text-slate-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {documents?.length || 0} {documents?.length === 1 ? "document" : "documents"} in your workspace
          </p>
        </motion.div>

        {/* Document Grid */}
        <div className="space-y-2">
          {documents === undefined ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center h-32 bg-slate-50/50 rounded-xl"
            >
              <div className="flex items-center gap-3 text-slate-400">
                <LoaderIcon className="animate-spin h-5 w-5" />
                <span className="text-sm font-medium">Loading your documents...</span>
              </div>
            </motion.div>
          ) : documents.length === 0 ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-24 bg-gradient-to-br from-slate-50/50 to-violet-50/30 rounded-2xl"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-violet-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-700">Your workspace is ready</h3>
                  <p className="text-slate-500 max-w-md">
                    Start creating beautiful documents with our templates or begin with a blank canvas
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <span>Choose a template above to get started</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-1">
                {documents.map((document, index) => (
                  <motion.div
                    key={document._id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.03,
                      ease: "easeOut",
                    }}
                    layout
                  >
                    <DocumentCard document={document} />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Elegant Load More */}
        <AnimatePresence>
          {status === "CanLoadMore" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center pt-8 border-t border-slate-100"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => loadMore(5)}
                  className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 rounded-full px-6 py-2 shadow-sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Load more documents
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
