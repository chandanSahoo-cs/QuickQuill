"use client"
import { useEffect } from "react"

import { CalloutExtension } from "@/extensions/callout"
import { FontSizeExtension } from "@/extensions/font-size"
import { LineHeightExtension } from "@/extensions/line-height"
import Blockquote from "@tiptap/extension-blockquote"
import Code from "@tiptap/extension-code"
import { Color } from "@tiptap/extension-color"
import FontFamily from "@tiptap/extension-font-family"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import TextAlign from "@tiptap/extension-text-align"
import TextStyle from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ImageResize from "tiptap-extension-resize-image"

interface ReadOnlyEditorProps {
  html: string
  className?: string
}

export const ReadOnlyEditor = ({ html, className = "" }: ReadOnlyEditorProps) => {
  const editor = useEditor({
    extensions: [
      FontSizeExtension,
      LineHeightExtension,
      CalloutExtension,
      StarterKit.configure({ history: false }),
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
      Code,
      Blockquote,
    ],
    content: html,
    editable: false,
    editorProps: {
      attributes: {
        class: `focus:outline-none bg-transparent border-0 flex flex-col w-full prose prose-slate max-w-none ${className}`,
      },
    },
  })

  useEffect(() => {
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html)
    }
  }, [editor, html])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }

  return <EditorContent editor={editor} />
}
