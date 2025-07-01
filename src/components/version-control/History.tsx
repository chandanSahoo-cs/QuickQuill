"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/store/useEditorStore";
import { useMutation, usePaginatedQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClockIcon,
  FileTextIcon,
  HistoryIcon,
  Loader2,
  RotateCcwIcon,
  Sparkles,
  UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { ReadOnlyEditor } from "./ReadOnlyEditor";

interface HistoryProps {
  data: Doc<"documents">;
  onClose : () => void
}

export const History = ({ data,onClose }: HistoryProps) => {
  const { results, loadMore, status } = usePaginatedQuery(
    api.commits.getPaginatedCommit,
    { documentId: data._id },
    { initialNumItems: 5 }
  );

  const { editor } = useEditorStore();
  const [selectedVersion, setSelectedVersion] = useState<Doc<"commits"> | null>(
    null
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = useMutation(api.commits.restoreCommit);

  // Auto-select first version when results load
  useEffect(() => {
    if (!selectedVersion && results && results.length > 0) {
      setSelectedVersion(results[0]);
    }
  }, [results, selectedVersion]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onRestore = async () => {
    if (!selectedVersion) return;

    setIsRestoring(true);
    try {
      await restore({
        documentId: data._id,
        commitId: selectedVersion._id,
      });

      const success = editor?.commands.setContent(selectedVersion.content);
      if (success) {
        toast.success("Version restored successfully");
      } else {
        toast.error("Failed to update editor content");
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Failed to restore this version");
    } finally {
      setIsRestoring(false);
      onClose()
    }
  };

  const handleLoadMore = () => {
    if (status === "CanLoadMore") {
      loadMore(5);
    }
  };

  return (
    <div className="flex  h-[700px] ">
      {/* Main Content Area - Document Preview */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedVersion ? (
          <>
            {/* Version Header - Fixed */}
            <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Version from {formatDate(selectedVersion.createdAt)}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <UserIcon className="h-4 w-4" />
                      By {selectedVersion.authorId}
                    </p>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onRestore}
                    disabled={isRestoring}
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-6 py-2 font-medium">
                    {isRestoring ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Restoring...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RotateCcwIcon className="h-4 w-4" />
                        Restore This Version
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Editor Content - Scrollable */}
            <div className="flex-1">
              <div className="p-8">
                <ReadOnlyEditor html={selectedVersion.content} className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-hide h-[420px]" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileTextIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Select a Version
              </h3>
              <p className="text-slate-500 max-w-md">
                Choose a version from the history panel to view its content and
                restore if needed
              </p>
            </motion.div>
          </div>
        )}
      </div>

        <div className="w-80 h-[570px] bg-slate-50 border-l border-slate-200 flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                <HistoryIcon className="h-4 w-4 text-violet-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Version History</h3>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-hide">
            <div className="p-3 space-y-2">
              {status === "LoadingFirstPage" ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading versions...</span>
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {results?.map((version, index) => (
                      <motion.div
                        key={version._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedVersion?._id === version._id
                            ? "bg-purple-100 border-violet-200 shadow-sm "
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm hover:bg-purple-50"
                        }`}
                        onClick={() => setSelectedVersion(version)}>
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              index === 0 ? "bg-green-400" : "bg-slate-300"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-900">
                                {formatDate(version.createdAt)}
                              </span>
                              {index === 0 && (
                                <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                  Latest
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <UserIcon className="h-3 w-3" />
                              <span>{version.authorId}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <AnimatePresence>
                    {status === "CanLoadMore" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-center pt-8 border-t border-slate-100">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            onClick={() => loadMore(5)}
                            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 rounded-full px-6 py-2 shadow-sm">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Load more documents
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty State */}
                  {results?.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center py-12 text-center">
                      <div>
                        <ClockIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <h4 className="font-medium text-slate-600 mb-1">
                          No versions found
                        </h4>
                        <p className="text-xs text-slate-400">
                          Document versions will appear here
                        </p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};
