import { PaginationStatus } from "convex/react";
import { Doc } from "../../../convex/_generated/dataModel";

interface DocumentsTableProps {
  documents: Doc<"documents">[] | undefined;
  loadMore: (numItems: number) => void;
  status : PaginationStatus
}

export const DocumentsTable = () => {
  return <div>"HGell"</div>;
};
