"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { GitCompareIcon, HistoryIcon } from "lucide-react";
import { useState } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { History } from "./History";
import { ViewMode } from "@/types/type";

interface VersionControlModalProps {
  data: Doc<"documents">;
  isOpen: boolean;
  onClose: () => void;
}


export const VersionControlModal = ({
  isOpen,
  onClose,
  data,
}: VersionControlModalProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("history");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] w-[95vw] p-0 bg-white border-slate-200 overflow-hidden">
        <div className="sr-only">
          <DialogTitle>Hidden</DialogTitle>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col h-full">
          {/* Clean Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0 pt-7">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <HistoryIcon className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {data.title}
                </h2>
                <p className="text-sm text-slate-500">Version History</p>
              </div>
            </div>

            <div className="flex items-center gap-3 ">
              {/* Tab Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewMode("history")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                    viewMode === "history"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
                  )}>
                  <HistoryIcon className="h-4 w-4" />
                  History
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setViewMode("diff")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                    viewMode === "diff"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50"
                  )}>
                  <GitCompareIcon className="h-4 w-4" />
                  Compare
                </motion.button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden bg-slate-50">
            {viewMode === "history" && (
              <History data={data} onClose={onClose} />
            )}
            {viewMode === "diff" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                    <GitCompareIcon className="h-10 w-10 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    Compare Versions
                  </h3>
                  <p className="text-slate-500 max-w-md">
                    Diff functionality will be available soon. You can compare
                    different versions of your document here.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
