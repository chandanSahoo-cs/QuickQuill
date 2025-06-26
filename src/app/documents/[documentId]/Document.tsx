"use client";

import { FindInDocument } from "@/components/document/FindInDocument";
import { useLoadingStore } from "@/store/useLoadingStore";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import { Editor } from "../../../components/document/Editor";
import { Navbar } from "../../../components/document/Navbar";
import { Toolbar } from "../../../components/document/Toolbar";
import { Room } from "./Room";
interface DocumentProps {
  preloadedDocument: Preloaded<typeof api.documents.getById>;
}

export const Document = ({ preloadedDocument }: DocumentProps) => {
  const document = usePreloadedQuery(preloadedDocument);
  const { isLoading, setIsLoading } = useLoadingStore();
  useEffect(() => {
    setIsLoading(false);
  }, []);
  console.log(isLoading);
  if (!document) {
    throw new Error("Document not found");
  }
  return (
    <Room>
      <div className="min-h-screen bg-[#FAFBFD]">
        <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 right-0 z-10 bg-[#FAFBFD] print:hidden">
          <Navbar data={document} />
          <Toolbar />
          <FindInDocument />
        </div>
        <div className="pt-[114px] print:pt-0">
          <Editor initialContent={document.initialContent} />
        </div>
      </div>
    </Room>
  );
};
