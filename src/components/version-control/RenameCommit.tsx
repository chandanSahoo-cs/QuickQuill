"use client";

import type React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { FilePenIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface RenameCommitProps {
  commit: Doc<"commits">;
  children: React.ReactNode;
}

export const RenameCommit = ({
  commit,
  children,
}: RenameCommitProps) => {
  const rename = useMutation(api.commits.renameCommit);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(commit.name);
  const [open, setIsOpen] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    rename({ commitId:commit._id, newCommitName: name.trim() || commit.name })
      .then(() => toast.success("Commit renamed successfully"))
      .catch(() => toast.error("Failed to rename commit"))
      .finally(() => {
        setIsUpdating(false);
        setIsOpen(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className="bg-white/95 backdrop-blur-md border-slate-200/50 shadow-xl rounded-2xl p-0 max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}>
          <form onSubmit={onSubmit}>
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  <FilePenIcon className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-slate-800">
                    Rename Commit
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-slate-500 text-sm">
                Give your commit a new name to help you find it later
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Commit name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter document name..."
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300 focus:ring-violet-200 rounded-xl h-11 transition-all duration-200"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  disabled={isUpdating}
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="flex-1 sm:flex-none text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors duration-200">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || !name.trim()}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50">
                  <AnimatePresence mode="wait">
                    {isUpdating ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}>
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        Saving...
                      </motion.div>
                    ) : (
                      <motion.span
                        key="save"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}>
                        Save Changes
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
