"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyDiffHighlight } from "@/lib/apply-diff-highlight";
import { useEditorStore } from "@/store/useEditorStore";
import type { EditorJSON } from "@/types/type";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GitCompareIcon,
  Loader2,
  PencilLineIcon,
  RotateCcwIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { ReadOnlyEditor } from "./ReadOnlyEditor";
import { RenameCommit } from "./RenameCommit";

interface DiffProps {
  data: Doc<"documents">;
  onClose: () => void;
}

export const Diff = ({ data, onClose }: DiffProps) => {
  const { editor } = useEditorStore();
  const json = editor?.getJSON();
  const [currentContent, setCurrentContent] = useState(json);

  const { results, loadMore, status } = usePaginatedQuery(
    api.commits.getPaginatedCommit,
    { documentId: data._id },
    { initialNumItems: 5 }
  );

  const [selectedVersion, setSelectedVersion] = useState<Doc<"commits"> | null>(
    null
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = useMutation(api.commits.restoreCommit);
  const rename = useMutation(api.commits.renameCommit);

  // Auto-select first version when results load
  useEffect(() => {
    if (!selectedVersion && results && results.length > 0) {
      setSelectedVersion(results[0]);
    }
  }, [results, selectedVersion]);

  // Update current content when editor changes

  const getContent = useQuery(
    api.commits.getContentByCommitId,
    selectedVersion
      ? {
          commitId: selectedVersion._id,
        }
      : "skip"
  );
  const [content, setContent] = useState<EditorJSON | null>(null);
  useEffect(() => {
    if (!getContent || !json) return;
    const { modified, added } = applyDiffHighlight(getContent, json);
    setContent(modified as EditorJSON);
    setCurrentContent(added as EditorJSON);
  }, [getContent]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onRestore = async () => {
    if (!selectedVersion || !getContent) return;

    setIsRestoring(true);
    try {
      await restore({
        documentId: data._id,
        commitId: selectedVersion._id,
      });

      const success = editor?.commands.setContent(getContent as EditorJSON);
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
      onClose();
    }
  };

  const handleLoadMore = () => {
    if (status === "CanLoadMore") {
      loadMore(5);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[700px] bg-white">
        {/* Header with Version Selector */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Compare Versions
                </h3>
              </div>

              {/* Version Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 font-medium">
                  Compare with:
                </span>
                <Select
                  value={selectedVersion?._id || ""}
                  onValueChange={(value) => {
                    const version = results?.find((v) => v._id === value);
                    if (version) setSelectedVersion(version);
                  }}>
                  <SelectTrigger className="w-64 h-15 bg-white border-slate-200 rounded-lg">
                    <SelectValue placeholder="Select a version..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl max-h-64">
                    {results?.map((version, index) => (
                      <SelectItem
                        key={version._id}
                        value={version._id}
                        className="rounded-lg">
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`w-2 h-2 rounded-full ${index === 0 ? "bg-green-400" : "bg-slate-300"}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {version.name}
                              </span>
                              {index == 0 && (
                                <Badge className="bg-green-400 ">Latest</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <UserIcon className="h-3 w-3" />
                              <span>{version.authorId}</span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {status === "CanLoadMore" && (
                      <div className="p-2 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLoadMore}
                          className="w-full text-slate-600 hover:bg-slate-50">
                          Load More Versions
                        </Button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedVersion && (
                <RenameCommit commit={selectedVersion}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  <Button
                    disabled={isRestoring || !getContent}
                    className="bg-white border-purple-600 border-2 hover:bg-white text-purple-600 rounded-lg py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <PencilLineIcon className="h-4 w-4" />
                      Rename this version
                    </div>
                  </Button>
                </motion.div>
              </RenameCommit>
              )}
              {selectedVersion && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onRestore}
                    disabled={isRestoring || !getContent}
                    className="bg-violet-600 hover:bg-violet-600 text-white rounded-lg  py-2 font-medium">
                    {isRestoring ? (
                      <div className="flex items-center">
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
              )}
            </div>
          </div>
        </div>

        {/* Side-by-Side Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Current Version */}
          <div className="flex-1 flex flex-col border-r border-slate-200">
            <div className="flex-shrink-0 px-6 py-2 bg-green-50 border-b border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <h4 className="font-semibold text-green-800">
                    Current Version
                  </h4>
                  <p className="text-sm text-green-600">
                    Your current document
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {currentContent ? (
                <ReadOnlyEditor
                  json={currentContent as EditorJSON}
                  className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-hide h-[370px]"
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <div className="text-center">
                    <GitCompareIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No current content</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Version */}
          <div className="flex-1 flex flex-col">
            <div className="flex-shrink-0 px-6 py-2 bg-violet-50 border-b border-violet-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <div>
                  <h4 className="font-semibold text-violet-800">
                    {selectedVersion
                      ? `Version from ${formatDate(selectedVersion.createdAt)}`
                      : "Selected Version"}
                  </h4>
                  <p className="text-sm text-violet-600">
                    {selectedVersion
                      ? `By ${selectedVersion.authorId}`
                      : "Choose a version to compare"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <AnimatePresence mode="wait">
                {!selectedVersion ? (
                  <motion.div
                    key="no-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-32 text-slate-400">
                    <div className="text-center">
                      <GitCompareIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">Select a version to compare</p>
                    </div>
                  </motion.div>
                ) : !getContent ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-32 text-slate-400">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        Loading version content...
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}>
                    <ReadOnlyEditor
                      json={content as EditorJSON}
                      className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scrollbar-hide h-[370px]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
