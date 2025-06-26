"use client";
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
} from "@/components/ui/alert-dialog";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
interface RemoveDialogProps {
  documentId: Id<"documents">;
  children: React.ReactNode;
  onClick?: () => void;
}

export const RemoveDialog = ({
  documentId: documentId,
  children,
  onClick,
}: RemoveDialogProps) => {
  const remove = useMutation(api.documents.removeById);
  const [isRemoving, setIsRemoving] = useState(false);
  if (!onClick) {
    onClick = () => {};
  }
  const {user} = useUser();
  const getById = useQuery(api.documents.getById,{
    documentId
  })

  const owner = user?.id===getById?.ownerId;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            document.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isRemoving}
            onClick={(e) => {
              e.stopPropagation();
              if(!owner){
                toast.warning("You don't have permission to delete the document")
                return
              }
              setIsRemoving(true);
              onClick();
              remove({ documentId })
                .then(() => {
                  toast.success("Document Removed");
                })
                .catch(()=>toast.error("Something went wrong"))
                .finally(() => setIsRemoving(false));
            }}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
