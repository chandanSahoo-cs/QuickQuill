"use client"

import { format } from "date-fns"
import { Building2Icon, CircleUserIcon, FileTextIcon, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import type { Doc } from "../../../convex/_generated/dataModel"
import { DocumentMenu } from "./DocumentMenu"
import { motion } from "framer-motion"

interface DocumentCardProps {
  document: Doc<"documents">
}

export const DocumentCard = ({ document }: DocumentCardProps) => {
  const router = useRouter()
  const [org, setOrg] = useState<string>("")
  const [isHovered, setIsHovered] = useState(false)
  const orgId = document.organizationId

  const fetchOrg = useCallback(
    () => async () => {
      const res = await fetch("/api/get-org-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgId }),
      })
      if (!res.ok) {
        throw new Error("Failed to fetch org details")
      }

      const data = await res.json()
      setOrg(data.name)
    },
    [],
  )

  useEffect(() => {
    if (orgId) {
      fetchOrg()()
    }
  }, [fetchOrg])

  const handleClick = () => {
    router.push(`documents/${document._id}`)
  }

  return (
    <motion.div
      whileHover={{
        backgroundColor: "rgba(248, 250, 252, 0.8)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
      }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer rounded-xl px-6 py-4 -mx-6 transition-all duration-150 border border-transparent hover:border-slate-100"
    >
      <div className="flex items-center gap-5">
        {/* Enhanced Document Icon */}
        <div className="flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center group-hover:from-violet-100 group-hover:to-purple-100 transition-all duration-200"
          >
            <FileTextIcon className="h-6 w-6 text-violet-500 group-hover:text-violet-600 transition-colors duration-200" />
          </motion.div>
        </div>

        {/* Enhanced Document Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 truncate group-hover:text-slate-900 transition-colors duration-200 text-lg">
                {document.title}
              </h3>
              <div className="flex items-center gap-6 mt-2">
                {/* Enhanced Sharing Info */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {document.organizationId ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2Icon className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="truncate max-w-24 font-medium">{org || "Team"}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <CircleUserIcon className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="font-medium">Personal</span>
                    </>
                  )}
                </div>

                {/* Enhanced Creation Date */}
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(document._creationTime), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Actions */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0 ml-4"
            >
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:shadow-md transition-shadow duration-200">
                <DocumentMenu
                  documentId={document._id}
                  title={document.title}
                  onNewTab={() => window.open(`/documents/${document._id}`, "_blank")}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Date */}
      <div className="sm:hidden mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Created {format(new Date(document._creationTime), "MMM dd, yyyy")}</span>
        </div>
      </div>
    </motion.div>
  )
}
