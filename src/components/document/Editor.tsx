"use client";

//Live Block Extension
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

// Custom Extension
import { FindInDocumentExtension } from "@/extensions/find-in-document";
import { FontSizeExtension } from "@/extensions/font-size";
import { LineHeightExtension } from "@/extensions/line-height";
import {
  PaginationPlus,
  TableCellPlus,
  TableHeaderPlus,
  TablePlus,
  TableRowPlus,
} from "tiptap-pagination-plus";

//Inbuilt Extension
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";

import { HorizontalRuler } from "./HorizontalRuler";

import { useRef } from "react";
import { Threads } from "./Threads";

import { LEFT_MARGIN_DEFAULT, RIGHT_MARGIN_DEFAULT } from "@/constants/margin";
import { useEditorStore } from "@/store/useEditorStore";
import { useStorage } from "@liveblocks/react";
import { FindInDocument } from "./FindInDocument";

interface EditorProps {
  initialContent?: string | undefined;
}

export const Editor = ({ initialContent }: EditorProps) => {
  const liveblocks = useLiveblocksExtension({
    initialContent,
    offlineSupport_experimental: true,
  });
  const { setEditor } = useEditorStore();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const leftMargin = useStorage((root) => root.leftMargin);
  const rightMargin = useStorage((root) => root.rightMargin);

  const editor = useEditor({
    autofocus: true,
    extensions: [
      // Liveblock Extension
      liveblocks,

      // Custom Extensions
      FontSizeExtension,
      LineHeightExtension,
      FindInDocumentExtension.configure({
        searchTerm: "",
      }),
      // TablePlus,
      // TableRowPlus,
      // TableCellPlus,
      // TableHeaderPlus,
      // PaginationPlus,

      // Core Extensions
      StarterKit.configure({
        history: false,
      }),
      TaskItem.configure({ nested: true }),
      TaskList,
      Table,
      TableCell,
      TableHeader,
      TableRow,
      Image,
      ImageResize,
      Underline,
      FontFamily,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        style: `padding-left: ${leftMargin ?? LEFT_MARGIN_DEFAULT}px; padding-right:${rightMargin ?? RIGHT_MARGIN_DEFAULT}px`,
        class:
          "focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-[816px] pt-10 pr-14 pb-10 cursor-text",
      },
    },
    onCreate({ editor }) {
      setEditor(editor);
    },
    onUpdate({ editor }) {
      setEditor(editor);
    },
    onSelectionUpdate({ editor }) {
      setEditor(editor);
    },
    onTransaction({ editor }) {
      setEditor(editor);
    },
    onFocus({ editor }) {
      setEditor(editor);
    },
    onBlur({ editor }) {
      setEditor(editor);
    },
    onContentError({ editor }) {
      setEditor(editor);
    },
  });

  return (
    <div className="size-full overflow-x-auto bg-[#F9FBFD] py-2">
      <HorizontalRuler />
      <div
        className="flex justify-center py-4 w-full mx-auto editor-wrapper"
        ref={wrapperRef}>
        <FindInDocument />
        <EditorContent editor={editor} />
        <Threads editor={editor} />
      </div>
    </div>
  );
};
