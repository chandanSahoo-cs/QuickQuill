"use client"
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
  } from "@/components/ui/alert-dialog"

  import { Id } from "../../convex/_generated/dataModel"
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {toast} from "sonner"
import { useState } from "react";
import { useRouter } from "next/navigation";
interface RemoveDialogProps {
    documentId : Id<"documents">
    children: React.ReactNode;
    onClick?: ()=>void;
}

export const RemoveDialog = ({documentId: documentId, children,onClick}:RemoveDialogProps) =>{
    const remove = useMutation(api.documents.removeById)
    const [isRemoving, setIsRemoving] = useState(false);
    if(!onClick){
        onClick = () =>{}
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your document.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                    disabled={isRemoving}
                    onClick={(e)=>{
                        e.stopPropagation();
                        setIsRemoving(true);
                        onClick()
                        remove({documentId})
                        .then(()=>{
                            toast.success("Document Removed")
                        })
                        .catch(()=>toast.error("Something went wrong"))
                        .finally(()=> setIsRemoving(false));
                    }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}