"use client";

import {
  AlignButton,
  FontFamilyButton,
  FontSizeButton,
  HeadingLevelButton,
  HighlightButton,
  ImageButton,
  LineHeightButton,
  LinkButton,
  ListButton,
  TextColorButton,
} from "@/components/toolbar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/useEditorStore";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  BoldIcon,
  ItalicIcon,
  ListTodoIcon,
  Loader2,
  LucideIcon,
  MessageSquarePlusIcon,
  PrinterIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  SpellCheckIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";

interface ToolbarButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  icon: LucideIcon;
}

const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
}: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-sm h-7 min-w-7 flex items-center justify-center rounded-sm hover:bg-neutral-200/80",
        isActive && "bg-neutral-200/80"
      )}>
      <Icon className="size-4" />
    </button>
  );
};

interface ToolbarProps {
  data: Doc<"documents">;
}

export const Toolbar = ({ data }: ToolbarProps) => {
  const { editor } = useEditorStore();
  const sections: {
    label: string;
    icon: LucideIcon;
    isActive?: boolean;
    onClick: () => void;
  }[][] = [
    [
      {
        label: "Undo",
        icon: Undo2Icon,
        onClick: () => editor?.chain().focus().undo().run(),
      },
      {
        label: "Redo",
        icon: Redo2Icon,
        onClick: () => editor?.chain().focus().redo().run(),
      },
      {
        label: "Print",
        icon: PrinterIcon,
        onClick: () => window.print(),
      },
      {
        label: "Spell Check",
        icon: SpellCheckIcon,
        onClick: () => {
          const current = editor?.view.dom.getAttribute("spellcheck");
          editor?.view.dom.setAttribute(
            "spellcheck",
            current === "false" ? "true" : "false"
          );
        },
      },
    ],
    [
      {
        label: "Bold",
        icon: BoldIcon,
        isActive: editor?.isActive("bold"),
        onClick: () => {
          editor?.chain().focus().toggleBold().run();
        },
      },
      {
        label: "Italic",
        icon: ItalicIcon,
        isActive: editor?.isActive("italic"),
        onClick: () => {
          editor?.chain().focus().toggleItalic().run();
        },
      },
      {
        label: "Underline",
        icon: UnderlineIcon,
        isActive: editor?.isActive("underline"),
        onClick: () => {
          editor?.chain().focus().toggleUnderline().run();
        },
      },
    ],
    [
      {
        label: "Comment",
        icon: MessageSquarePlusIcon,
        onClick: () => editor?.chain().focus().addPendingComment().run(),
        isActive: editor?.isActive("liveblockCommentMark"),
      },
      {
        label: "Check List",
        icon: ListTodoIcon,
        onClick: () => editor?.chain().focus().toggleTaskList().run(),
        isActive: editor?.isActive("taskList"),
      },
      {
        label: "Remove Formatting",
        icon: RemoveFormattingIcon,
        onClick: () => editor?.chain().focus().unsetAllMarks().run(),
      },
    ],
  ];
  const commit = useMutation(api.commits.commitDoc);

  const [isCommiting, setIsCommiting] = useState(false);

  const onCommit = async () => {
    setIsCommiting(true);
    await commit({
      documentId: data._id,
      content: editor?.getJSON(),
    })
      .then(() => toast.success("Commited successfully"))
      .catch((error) => {
        if(error.data === "Nothing to change") toast.warning(error.data)
        else toast.error("Failed to commit")
      })
      .finally(() => setIsCommiting(false));
  };

  return (
    <div className="bg-[#F1F4F9] px-2.5 py-0.5 rounded-[24px] min-h-[40px] flex items-center gap-x-[355px] overflow-x-auto">
      <div className="flex items-center gap-x-0.5">
        {sections[0].map((item) => (
          <ToolbarButton key={item.label} {...item} />
        ))}
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        <FontFamilyButton />
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        <HeadingLevelButton />
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        <FontSizeButton />
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        <TextColorButton />
        <HighlightButton />
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        <LinkButton />
        <ImageButton />
        <AlignButton />
        <ListButton />
        <LineHeightButton />
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        {sections[1].map((item) => (
          <ToolbarButton key={item.label} {...item} />
        ))}
        <Separator orientation="vertical" className="h-6 bg-neutral-300" />
        {sections[2].map((item) => (
          <ToolbarButton key={item.label} {...item} />
        ))}
      </div>

      <motion.div
        key="commit"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
        <Button
          onClick={() => onCommit()}
          className="rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-none my-1">
          <div className="flex gap-1  w-24 justify-center">
            {isCommiting && (
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
                  <Loader2 className="h-4 w-4" />
                </motion.div>
              </motion.div>
            )}
            Commit
          </div>
        </Button>
      </motion.div>
    </div>
  );
};
