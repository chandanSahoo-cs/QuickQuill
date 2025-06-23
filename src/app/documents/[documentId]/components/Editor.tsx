"use client";

import {useLiveblocksExtension} from "@liveblocks/react-tiptap"

import { FontSizeExtension } from "@/extensions/font-size";
import { LineHeightExtension } from "@/extensions/line-height";
import { PageBreakExtension } from "@/extensions/page-break";
import { useEditorStore } from "@/store/useEditorStore";

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
import { VerticalRuler } from "./VerticalRuler";

import { useEffect, useRef } from "react";

export const Editor = () => {
  const liveblocks = useLiveblocksExtension();
  const { setEditor } = useEditorStore();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      // Liveblock Extension
      liveblocks,

      // Custom Extensions
      FontSizeExtension,
      LineHeightExtension,
      PageBreakExtension,

      // Core Extensions
      StarterKit,
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
        style: "padding: 56px;",
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

  useEffect(() => {
    if (!editor || !wrapperRef.current) return;

    const observer = new ResizeObserver(() => {
      debouncePaginate();
    });

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, [editor]);

  const debouncePaginate = () => {
    clearTimeout((window as any).__pageBreakTimeout);
    (window as any).__pageBreakTimeout = setTimeout(() => {
      paginate();
    }, 100);
  };

  const paginate = () => {
    console.log("Paginate");
    const prose = wrapperRef.current?.querySelector(".ProseMirror");
    if (!prose) return;

    const blocks = Array.from(prose.children) as HTMLElement[];
    const PAGE_HEIGHT = 1122;
    let heightSoFar = 0;
    const breakPositions: number[] = [];

    blocks.forEach((block, index) => {
      if (block.dataset.pageBreak !== undefined) {
        heightSoFar = 0;
        return;
      }

      const blockHeight = block.offsetHeight;

      if (heightSoFar + blockHeight > PAGE_HEIGHT) {
        breakPositions.push(index);
        heightSoFar = blockHeight;
      } else {
        heightSoFar += blockHeight;
      }
    });

    breakPositions.reverse().forEach((index) => {
      const block = blocks[index];
      const pos = editor?.view.posAtDOM(block, 0);
      if (typeof pos === "number" && !isNaN(pos)) {
        editor?.chain().focus().insertContentAt(pos, { type: "pageBreak" }).run();
      } else {
        console.warn("Could not insert page break for block at index", index);
      }
    });
  };

  return (
    <div className="size-full overflow-x-auto bg-[#F9FBFD] py-2">
      <HorizontalRuler />
      <div className="relative">
        <div className="absolute left-0 top-0 px-4">
          <VerticalRuler />
        </div>
        <div
          className="flex justify-center py-4 w-full mx-auto editor-wrapper"
          ref={wrapperRef}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
