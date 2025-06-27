"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Building2Icon, CircleUserIcon, FileTextIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DocumentMenu } from "./DocumentMenu";

interface DocumentRowProps {
  document: Doc<"documents">;
}

export const DocumentRow = ({ document }: DocumentRowProps) => {
  const router = useRouter();
  const [org, setOrg] = useState<string>("");
  const orgId = document.organizationId;

  const fetchOrg = useCallback(
    () => async () => {
      const res = await fetch("/api/get-org-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgId }),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch org details");
      }

      const data = await res.json();
      setOrg(data.name);
    },
    []
  );

  useEffect(() => {
    if (orgId) {
      fetchOrg()();
    }
  }, [fetchOrg]);

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.03)" }}
      transition={{ duration: 0.2 }}>
      <TableRow
        className="cursor-pointer border-violet-100/30 hover:bg-transparent"
        onClick={() => router.push(`documents/${document._id}`)}>
        <TableCell className="w-[50px]">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <FileTextIcon className="h-4 w-4 text-violet-600" />
          </motion.div>
        </TableCell>
        <TableCell className="font-medium md:w-[45%] text-violet-900">
          {document.title}
        </TableCell>
        <TableCell className="text-violet-600 hidden md:flex items-center gap-2">
          {document.organizationId ? (
            <Building2Icon className="h-4 w-4" />
          ) : (
            <CircleUserIcon className="h-4 w-4" />
          )}
          <span className="text-sm">
            {document.organizationId ? org : "Personal"}
          </span>
        </TableCell>
        <TableCell className="text-violet-500 hidden md:table-cell text-sm">
          {format(new Date(document._creationTime), "MMM dd, yyyy")}
        </TableCell>
        <TableCell className="flex justify-end">
          <DocumentMenu
            documentId={document._id}
            title={document.title}
            onNewTab={() => window.open(`/documents/${document._id}`, "_blank")}
          />
        </TableCell>
      </TableRow>
    </motion.div>
  );
};
