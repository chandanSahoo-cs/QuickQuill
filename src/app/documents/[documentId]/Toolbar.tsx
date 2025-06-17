"use client";

import { cn } from "@/lib/utils";
import {
  BoldIcon,
  ChevronDownIcon,
  HighlighterIcon,
  ItalicIcon,
  ListTodoIcon,
  LucideIcon,
  MessageSquarePlusIcon,
  PrinterIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  SpellCheckIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import { type ColorResult, SketchPicker } from "react-color";
import { useEditorStore } from "@/store/useEditorStore";
import { Separator } from "@/components/ui/separator";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Level } from "@tiptap/extension-heading";
import Color from "@tiptap/extension-color";



const FontFamilyButton = () => {
  const { editor } = useEditorStore();

  const fonts = [
    { label: "Arial", value: "Arial" },
    { label: "Helvetica", value: "Helvetica" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Georgia", value: "Georgia" },
    { label: "Verdana", value: "Verdana" },
    { label: "Trebuchet MS", value: "Trebuchet MS" },
    { label: "Courier New", value: "Courier New" },
    { label: "Lucida Console", value: "Lucida Console" },
    { label: "Tahoma", value: "Tahoma" },
    { label: "Impact", value: "Impact" },
    { label: "Palatino Linotype", value: "Palatino Linotype" },
    { label: "Garamond", value: "Garamond" },
    { label: "Comic Sans MS", value: "Comic Sans MS" },
    { label: "Segoe UI", value: "Segoe UI" },
    { label: "Calibri", value: "Calibri" },
    { label: "Cambria", value: "Cambria" },
    { label: "Didot", value: "Didot" },
    { label: "Rockwell", value: "Rockwell" },
    { label: "Franklin Gothic Medium", value: "Franklin Gothic Medium" },
    { label: "Century Gothic", value: "Century Gothic" },
    { label: "Lucida Sans Unicode", value: "Lucida Sans Unicode" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 w-[120px] shrink-0 flex items-center justify-between rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm">
          <span className="truncate">
            {editor?.getAttributes("textStyle").fontFamily || "Arial"}
          </span>
          <ChevronDownIcon className="ml-2 size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1">
        {fonts.map(({ label, value }) => (
          <button
            onClick={() => editor?.chain().focus().setFontFamily(value).run()}
            key={value}
            className={cn(
              "flex items-center gap-x-2 px-3 py-1 rounded-sm hover:bg-neutral-200/80",
              !editor?.getAttributes("textStyle").fontFamily &&
                value == "Arial" &&
                "bg-neutral-200/80",
              editor?.getAttributes("textStyle").fontFamily === value &&
                "bg-neutral-200/80"
            )}
            style={{ fontFamily: value }}>
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const HeadingLevelButton = () => {
  const { editor } = useEditorStore();

  const headings = [
    { label: "Normal Text", value: 0, fontSize: "16px" },
    { label: "Heading 1", value: 1, fontSize: "32px" },
    { label: "Heading 2", value: 2, fontSize: "24px" },
    { label: "Heading 3", value: 3, fontSize: "20px" },
    { label: "Heading 4", value: 4, fontSize: "18px" },
  ];

  const getCurrentHeading = () => {
    for (let level = 1; level <= 4; level++) {
      if (editor?.isActive("heading", { level })) {
        return `Heading ${level}`;
      }
    }

    return "Normal text";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-7 min-w-7 shrink-0 flex items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm">
          <span className="truncate">{getCurrentHeading()}</span>
          <ChevronDownIcon className="ml-2 size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1">
        {headings.map(({ label, value, fontSize }) => (
          <button
            style={{ fontSize }}
            onClick={() => {
              if (value === 0) {
                editor?.chain().focus().setParagraph().run();
              } else {
                editor
                  ?.chain()
                  .focus()
                  .toggleHeading({ level: value as Level })
                  .run();
              }
            }}
            key={value}
            className={cn(
              "flex items-center gap-x-2 px-3 py-1 rounded-sm hover:bg-neutral-200/80",
              value === 0 &&
                !editor?.isActive("heading") &&
                "bg-neutral-200/80",
              editor?.isActive("heading", { level: value }) &&
                "bg-neutral-200/80"
            )}>
            <span>{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TextColorButton = () =>{
  const {editor} = useEditorStore();
  const value = editor?.getAttributes("textStyle").color || "#000000";
  const onChange = (color: ColorResult) =>{
    editor?.chain().focus().setColor(color.hex).run();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
        className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
        >
          <span className="text-xs">A</span>
          <div className="h-0.5 w-full" style={{backgroundColor:value}}/>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border">
        <SketchPicker
          color={value}
          onChange={onChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const HighlightButton = () =>{
  const {editor} = useEditorStore();
  let value = editor?.getAttributes("highlight").color || "#FFFFFF";
  const onChange = (color: ColorResult) =>{
    editor?.chain().focus().setHighlight({color:color.hex}).run();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
        className="h-7 min-w-7 shrink-0 flex flex-col items-center justify-center rounded-sm hover:bg-neutral-200/80 px-1.5 overflow-hidden text-sm"
        >
        <HighlighterIcon className="size-4"/>
        <div className="h-0.5 w-full" style={{backgroundColor:value}}/>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border">
        <SketchPicker
          color={value}
          onChange={onChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

export const Toolbar = () => {
  const { editor } = useEditorStore();
  // console.log(editor?.getAttributes("textStyle").fontFamily)
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
        onClick: () => {
          console.log("TODO: Comments");
        },
        isActive: false, //TODO enable this
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
  return (
    <div className="bg-[#F1F4F9] px-2.5 py0.5 rounded-[24px] min-h-[40px] flex items-center gap-x-0.5 overflow-x-auto">
      {sections[0].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      <FontFamilyButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      <HeadingLevelButton />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      <TextColorButton/>
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      <HighlightButton/>
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      {sections[1].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      {sections[2].map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
      <Separator orientation="vertical" className="h-6 bg-neutral-300" />
    </div>
  );
};
