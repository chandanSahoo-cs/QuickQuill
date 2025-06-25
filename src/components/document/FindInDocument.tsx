import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store/useEditorStore";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Match {
  from: number;
  to: number;
}

export function FindInDocument() {
  const { editor } = useEditorStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }

      if (e.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor, searchTerm]);

  useEffect(() => {
    editor?.on("update", () => {
      if (searchTerm.trim() !== "") {
        updateMatches(searchTerm);
      }
    });
  }, [editor, searchTerm]);

  const close = () => {
    setVisible(false);
    setSearchTerm("");
    setReplaceTerm("");
    setMatches([]);
    setCurrentMatchIndex(0);
    editor?.commands.clearSearch(); 
  };

  const findMatches = (term: string) => {
    if (!term || !editor) return [];

    const regex = new RegExp(term, "gi");
    const found: Match[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return true;
      const text = node.text || "";
      let match;
      while ((match = regex.exec(text))) {
        found.push({
          from: pos + match.index,
          to: pos + match.index + match[0].length,
        });
      }
      return true;
    });

    return found;
  };

  const updateMatches = (term: string) => {
    const results = findMatches(term);
    setMatches(results);
    setCurrentMatchIndex(0);
  };

  const toggleCase = () => {
    const newState = !caseSensitive;
    setCaseSensitive(newState);
    editor?.commands.toggleCaseSensitivity();
    if (searchTerm.trim() !== "") {
      updateMatches(searchTerm);
    }
  };

  const onSearchChange = (value: string) => {
    setSearchTerm(value);
    editor?.commands.setSearchTerm(value); // triggers highlight
    editor?.commands.setCurrentMatchIndex(0);
    updateMatches(value);
  };

  const goToMatch = (index: number) => {
    setCurrentMatchIndex(index);
    editor?.commands.setCurrentMatchIndex(index);
  };

  const nextMatch = () => {
    if (matches.length === 0) return;
    const next = (currentMatchIndex + 1) % matches.length;
    goToMatch(next);
  };

  const prevMatch = () => {
    if (matches.length === 0) return;
    const prev = (currentMatchIndex - 1 + matches.length) % matches.length;
    goToMatch(prev);
  };

  const replaceCurrent = () => {
    const match = matches[currentMatchIndex];
    if (!match) return;

    editor
      ?.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replaceTerm)
      .run();

    setTimeout(() => {
      onSearchChange(searchTerm); // refresh matches after replacing
    }, 10);
  };

  const replaceAll = () => {
    const term = searchTerm;
    const allMatches = findMatches(term);

    // Replace in reverse order to preserve positions
    [...allMatches].reverse().forEach((match) => {
      editor
        ?.chain()
        .setTextSelection({ from: match.from, to: match.to })
        .insertContent(replaceTerm)
        .run();
    });

    setTimeout(() => {
      onSearchChange("");
      editor?.commands.clearSearch();
    }, 10);
  };

  if (!visible) return null;

  return (
    <div className="absolute top-[160px] right-4 z-50 bg-white dark:bg-zinc-900 border border-input rounded-md shadow-md px-4 py-3 space-y-2 w-[360px]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">Find & Replace</span>
        <button onClick={close}>
          <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input
          id="case-sensitive"
          type="checkbox"
          checked={caseSensitive}
          onChange={toggleCase}
          className="accent-blue-600"
        />
        <label htmlFor="case-sensitive" className="text-muted-foreground">
          Case sensitive
        </label>
      </div>

      {/* Find input */}
      <Input
        ref={inputRef}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Find"
        className="h-8 text-sm"
      />

      {/* Replace input */}
      <Input
        value={replaceTerm}
        onChange={(e) => setReplaceTerm(e.target.value)}
        placeholder="Replace with"
        className="h-8 text-sm"
      />

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMatch}
            disabled={matches.length === 0}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMatch}
            disabled={matches.length === 0}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {matches.length > 0
              ? `${currentMatchIndex + 1} of ${matches.length}`
              : "No matches"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={replaceCurrent}
            disabled={matches.length === 0}>
            Replace
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={replaceAll}
            disabled={matches.length === 0}>
            Replace All
          </Button>
        </div>
      </div>
    </div>
  );
}
