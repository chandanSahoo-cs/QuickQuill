"use client";

import {
  createSuggestionsItems,
  enableKeyboardNavigation,
  Slash,
  SlashCmd,
  SlashCmdProvider,
} from "@harshtalks/slash-tiptap";

//Live Block Extension
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

// Custom Extension
import { FindInDocumentExtension } from "@/extensions/find-in-document";
import { FontSizeExtension } from "@/extensions/font-size";
import { LineHeightExtension } from "@/extensions/line-height";

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
import { ClipboardListIcon, Code2Icon, Heading1Icon, Heading2Icon, Heading3Icon, ImageIcon, ListIcon, ListOrderedIcon, MinusIcon, StickyNoteIcon, TextIcon, TextQuoteIcon } from "lucide-react";
import { FindInDocument } from "./FindInDocument";

interface EditorProps {
  initialContent?: string | undefined;
}

const suggestions = createSuggestionsItems([
  {
    title: "Heading 1",
    searchTerms: ["h1", "large title"],
    icon: Heading1Icon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "Heading 2",
    searchTerms: ["h2", "subtitle"],
    icon: Heading2Icon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Heading 3",
    searchTerms: ["h3", "sub subtitle"],
    icon: Heading3Icon ,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "Paragraph",
    searchTerms: ["text", "body", "normal"],
    icon: TextIcon,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("paragraph").run();
    },
  },
  {
    title: "Blockquote",
    searchTerms: ["quote", "blockquote", "citation"],
    icon: TextQuoteIcon ,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Horizontal Rule",
    searchTerms: ["hr", "line", "divider"],
    icon: MinusIcon,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Callout",
    searchTerms: ["note", "callout", "info"],
    icon: StickyNoteIcon ,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(`<div data-type='callout'>💡 Callout</div>`)
        .run();
    },
  },
  {
    title: "Bullet List",
    searchTerms: ["unordered", "point", "list"],
    icon: ListIcon ,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered List",
    searchTerms: ["ordered", "numbered", "list"],
    icon: ListOrderedIcon ,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    searchTerms: ["checkbox", "todo", "task"],
    icon: ClipboardListIcon ,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Code Block",
    searchTerms: ["code", "snippet", "block"],
    icon: Code2Icon ,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Image",
    searchTerms: ["picture", "media", "img"],
    icon: ImageIcon ,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
]);

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
      Slash.configure({
        suggestion: {
          items: () => suggestions,
        },
      }),

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
      handleDOMEvents: {
        keydown: (_, v) => enableKeyboardNavigation(v),
      },
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
        <SlashCmdProvider>
          <EditorContent editor={editor} />
          <SlashCmd.Root editor={editor}>
            <SlashCmd.Cmd>
              <SlashCmd.List>
                {suggestions.map(({title,icon:Icon,command}) => {

                  return (
                    <SlashCmd.Item
                      value={title}
                      onCommand={(val) => {
                        command(val);
                      }}
                      className="flex w-full items-center space-x-3 cursor-pointer rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 aria-selected:bg-slate-100 transition-colors duration-150"
                      key={title}>
                      <div className="flex items-center space-x-3 w-full">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Icon className="size-4 mr-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 leading-tight">
                            {title}
                          </p>
                          {/* {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                              {item.description}
                            </p>
                          )} */}
                        </div>
                      </div>
                    </SlashCmd.Item>
                  );
                })}
              </SlashCmd.List>
            </SlashCmd.Cmd>
          </SlashCmd.Root>
        </SlashCmdProvider>
        <Threads editor={editor} />
      </div>
    </div>
  );
};
