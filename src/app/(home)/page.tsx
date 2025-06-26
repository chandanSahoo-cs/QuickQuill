"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSearchParam } from "@/hooks/use-search-param";
import { DocumentsTable, Navbar, TemplateGallery } from "@/components/home";
import { useLoadingStore } from "@/store/useLoadingStore";
import { FullScreenLoader } from "@/components";

const Home = () => {
  const [search] = useSearchParam("search");
  const { results, status, loadMore } = usePaginatedQuery(
    api.documents.get,
    {search},
    { initialNumItems: 5 }
  );
  //TODO: Add debouncing
  const {isLoading} = useLoadingStore();
  return (
    isLoading ? <FullScreenLoader/> :
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4">
        <Navbar />
      </div>
      <div className="mt-16">
        <TemplateGallery />
        <DocumentsTable documents={results} loadMore={loadMore} status={status}/>
      </div>
    </div>
  );
};

export default Home;
