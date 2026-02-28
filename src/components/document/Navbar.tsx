"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";

import { OrganizationSwitcher, UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import {
  BoldIcon,
  FileCodeIcon,
  FileIcon,
  FilePlusIcon,
  FileSearchIcon,
  FileTextIcon,
  GitCommitIcon,
  GlobeIcon,
  ItalicIcon,
  PrinterIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  StrikethroughIcon,
  TextIcon,
  TrashIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BsFilePdf } from "react-icons/bs";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Avatars } from "./Avatar";
import { Inbox } from "./Inbox";

import { RemoveDialog } from "@/components/RemoveDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { DocumentInput, TableMenu } from "@/components/document";
import { useEditorStore } from "@/store/useEditorStore";
import { motion } from "framer-motion";
// import { VersionControlModal } from "../version-control/VersionControlModal";
import { useState } from "react";
import { VersionControlModal } from "../version-control/VersionControlModal";

interface NavbarProps {
  data: Doc<"documents">;
}

export const Navbar = ({ data }: NavbarProps) => {
  const { editor } = useEditorStore();
  const { user } = useUser();
  const router = useRouter();
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const create = useMutation(api.documents.create);
  const commit = useMutation(api.commits.commitDoc);

  const owner = data.ownerId === user?.id;

  const onCommit = () => {
    commit({
      documentId: data._id,
      content: editor?.getJSON(),
    })
      .then(() => toast.success("Commited successfully"))
      .catch((error) => {
        if (error.data === "Nothing to change") toast.warning(error.data);
        else toast.warning(error.data);
      });
  };

  const onNewDocument = () => {
    create({
      title: "Untitled Document",
      initialContent: "",
    })
      .catch(() => toast.error("Failed to create file"))
      .then((id) => {
        toast.success("Document created");
        router.push(`/documents/${id}`);
      });
  };

  const onVersionHistory = () => {
    setIsVersionModalOpen(true);
  };

  const insertTable = ({ rows, cols }: { rows: number; cols: number }) => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: false })
      .run();
  };

  const onDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const onSaveJson = () => {
    if (!editor) return;

    const content = editor.getJSON();
    const blob = new Blob([JSON.stringify(content)], {
      type: "application/json",
    });
    onDownload(blob, `${data.title}.json`);
  };

  const onSaveHTML = () => {
    if (!editor) return;

    const content = editor.getHTML();
    const blob = new Blob([content], {
      type: "text/html",
    });
    onDownload(blob, `${data.title}.html`);
  };

  const onSaveText = () => {
    if (!editor) return;

    const content = editor.getText();
    const blob = new Blob([content], {
      type: "application/json",
    });
    onDownload(blob, `${data.title}.txt`);
  };

  const onFileSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "f",
      code: "KeyF",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const onSavePdf = () => {
    (async () => {
      if (!editor) return;

      const html = editor.getHTML(); // or prepare custom full HTML
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullHtml: html }),
      });

      if (!response.ok) {
        console.error("Failed to generate PDF");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = data.title;
      link.click();
      window.URL.revokeObjectURL(url);
    })();
  };

  return (
    <nav className="flex items-center justify-between">
      <div className="flex gap-2 items-center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={40} height={32} />
          </Link>
        </motion.div>
        <div className="flex flex-col">
          <DocumentInput title={data.title} id={data._id} />
          <div className="flex">
            <Menubar className="border-none bg-transparent shadow-none h-auto p-0">
              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg:muted h-auto">
                  File
                </MenubarTrigger>
                <MenubarContent className="print:hidden">
                  <MenubarSub>
                    <MenubarSubTrigger>
                      <FileIcon className="size-4 mr-2" />
                      Save
                    </MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem onClick={() => onSaveJson()}>
                        <FileCodeIcon className="size-4 mr-2" />
                        JSON
                      </MenubarItem>
                      <MenubarItem onClick={() => onSaveHTML()}>
                        <GlobeIcon className="size-4 mr-2" />
                        HTML
                      </MenubarItem>
                      <MenubarItem onClick={() => onSavePdf()}>
                        <BsFilePdf className="size-4 mr-2" />
                        PDF
                      </MenubarItem>
                      <MenubarItem onClick={() => onSaveText()}>
                        <FileTextIcon className="size-4 mr-2" />
                        Text
                      </MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarItem onClick={onNewDocument}>
                    <FilePlusIcon className="size-4 mr-2" />
                    New Document
                  </MenubarItem>
                  <MenubarItem onClick={() => onFileSearch()}>
                    <FileSearchIcon className="size-4 mr-2" />
                    Find In Document
                  </MenubarItem>
                  <MenubarItem onClick={() => onCommit()}>
                    <GitCommitIcon className="size-4 mr-2" />
                    Commit
                  </MenubarItem>
                  <MenubarSeparator />
                  <RenameDialog documentId={data._id} initialTitle={data.title}>
                    <MenubarItem
                      onClick={(e) => e.stopPropagation()}
                      onSelect={(e) => e.preventDefault()}>
                      <FilePlusIcon className="size-4 mr-2" />
                      Rename
                    </MenubarItem>
                  </RenameDialog>
                  <RemoveDialog
                    documentId={data._id}
                    onClick={() => router.push("/")}>
                    <MenubarItem
                      onClick={(e) => e.stopPropagation()}
                      onSelect={(e) => e.preventDefault()}>
                      <TrashIcon className="size-4 mr-2" />
                      Remove
                    </MenubarItem>
                  </RemoveDialog>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => window.print()}>
                    <PrinterIcon className="size-4 mr-2" />
                    Print
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg:muted h-auto">
                  Edit
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem
                    onClick={() => editor?.chain().focus().undo().run()}>
                    <Undo2Icon className="size-4 mr-2" />
                    Undo <MenubarShortcut>⌘ Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem
                    onClick={() => editor?.chain().focus().redo().run()}>
                    <Redo2Icon className="size-4 mr-2" />
                    Redo <MenubarShortcut>⌘ Y</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg:muted h-auto">
                  Insert
                </MenubarTrigger>
                <MenubarContent>
                  <TableMenu insertTable={insertTable} />
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg:muted h-auto">
                  Format
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarSub>
                    <MenubarSubTrigger>
                      <TextIcon className="size-4 mr-2" />
                      Text
                    </MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem
                        onClick={() => editor?.chain().focus().setBold().run()}>
                        <BoldIcon className="size-4 mr-2" />
                        Bold <MenubarShortcut>⌘ B</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem
                        onClick={() =>
                          editor?.chain().focus().setItalic().run()
                        }>
                        <ItalicIcon className="size-4 mr-2" />
                        Italic
                        <MenubarShortcut>⌘&nbsp; I</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem
                        onClick={() =>
                          editor?.chain().focus().setUnderline().run()
                        }>
                        <UnderlineIcon className="size-4 mr-2" />
                        Underline <MenubarShortcut>⌘ U</MenubarShortcut>
                      </MenubarItem>
                      <MenubarItem
                        onClick={() =>
                          editor?.chain().focus().setStrike().run()
                        }>
                        <StrikethroughIcon className="size-4 mr-2" />
                        Strikethrough&nbsp;&nbsp;
                        <MenubarShortcut>⌘ S</MenubarShortcut>
                      </MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarItem
                    onClick={() =>
                      editor?.chain().focus().unsetAllMarks().run()
                    }>
                    <RemoveFormattingIcon className="size-4 mr-2" />
                    Clear Formatting
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              {owner && (
                <MenubarMenu>
                  <MenubarTrigger
                    className="text-sm font-normal py-0.5 px-[7px] rounded-sm hover:bg:muted h-auto"
                    onClick={() => onVersionHistory()}>
                    Version History
                  </MenubarTrigger>
                </MenubarMenu>
              )}
            </Menubar>
          </div>
        </div>
      </div>
      <div className="flex gap-3 items-center pl-6">
        <Avatars />
        <Inbox />
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/"
          afterLeaveOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          afterSelectPersonalUrl="/"
        />
        <UserButton />
      </div>
      <VersionControlModal
        data={data}
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </nav>
  );
};
