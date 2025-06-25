import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    findInDocument: {
      setSearchTerm: (term: string) => ReturnType;
      clearSearch: () => ReturnType;
      setCurrentMatchIndex: (index: number) => ReturnType;
      toggleCaseSensitivity: () => ReturnType;
    };
  }
}

export const FindInDocumentExtension = Extension.create({
  name: "findInDocument",

  addOptions() {
    return {
      searchTerm: "",
      currentMatchIndex: -1,
      caseSensitive: false,
    };
  },

  addCommands() {
    return {
      setSearchTerm: (term: string) => () => {
        this.options.searchTerm = term;
        this.editor?.view.dispatch(this.editor.view.state.tr); // trigger re-render
        return true;
      },

      clearSearch: () => () => {
        this.options.searchTerm = "";
        this.options.currentMatchIndex = -1;
        this.editor?.view.dispatch(this.editor.view.state.tr);
        return true;
      },

      setCurrentMatchIndex: (index: number) => () => {
        this.options.currentMatchIndex = index;
        this.editor?.view.dispatch(this.editor.view.state.tr); // trigger re-render
        return true;
      },

      toggleCaseSensitivity: () => () => {
        this.options.caseSensitive = !this.options.caseSensitive;
        this.editor?.view.dispatch(this.editor.view.state.tr);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("find-in-document"),
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, old) => {
            const { searchTerm, currentMatchIndex = -1 } = this.options;

            const flags = this.options.caseSensitive ? "g" : "gi";
            const regex = new RegExp(searchTerm, flags);

            if (!searchTerm || searchTerm.length < 1) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];

            let matchIndex = 0;

            tr.doc.descendants((node, pos) => {
              if (!node.isText) return true;

              const text = node.text || "";
              let match;
              while ((match = regex.exec(text))) {
                const start = pos + match.index;
                const end = start + match[0].length;

                const isActive = matchIndex === currentMatchIndex;

                decorations.push(
                  Decoration.inline(start, end, {
                    class: `search-highlight${isActive ? " active" : ""}`,
                  })
                );

                matchIndex++;
              }

              return true;
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
