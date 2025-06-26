import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Building2Icon, CircleUserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SiGoogledocs } from "react-icons/si";
import { Doc } from "../../../convex/_generated/dataModel";
import { DocumentMenu } from "./DocumentMenu";

interface DocumentRowProps {
  document: Doc<"documents">;
}

//

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
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(`documents/${document._id}`)}>
      <TableCell className="w-[50px]">
        <SiGoogledocs className="size-6 fill-blue-500" />
      </TableCell>
      <TableCell className="font-medium md:w-[45%]">{document.title}</TableCell>
      <TableCell className="text-muted-foreground hidded md:flex items-center gap-2">
        {document.organizationId ? (
          <Building2Icon className="size-4" />
        ) : (
          <CircleUserIcon className="size-4" />
        )}
        {document.organizationId ? org : "Personal"}
      </TableCell>
      <TableCell className="text-muted-foreground hidden md:table-cell">
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
  );
};
