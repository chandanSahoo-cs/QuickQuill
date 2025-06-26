import { Node, mergeAttributes, CommandProps } from "@tiptap/core";

export type CalloutType = "info" | "warning" | "success" | "error";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: (type?: CalloutType) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: "callout",

  group: "block",
  content: "block+",
  defining: false,
  isolating: false,
  selectable: true,

  addAttributes() {
    return {
      calloutType: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-callout-type"),
        renderHTML: (attributes) => ({
          "data-callout-type": attributes.calloutType,
          class: `callout callout-${attributes.calloutType}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-callout-type]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleCallout:
        (calloutType: CalloutType = "info") =>
        ({ state, commands }: CommandProps) => {
          const { $from } = state.selection;
          const parent = $from.node($from.depth);
          const isCallout = parent.type.name === "callout";

          if (isCallout) {
            return commands.lift("callout");
          }

          return commands.wrapIn("callout", { calloutType });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        const parent = $from.node($from.depth);

        const isEmpty =
          parent.childCount === 1 &&
          parent.firstChild?.type.name === "paragraph" &&
          parent.firstChild.content.size === 0;

        const isAtStart = $from.parentOffset === 0;

        if (parent.type.name === "callout" && isEmpty && isAtStart) {
          return editor.commands.lift("callout");
        }

        return false;
      },
    };
  },
});
