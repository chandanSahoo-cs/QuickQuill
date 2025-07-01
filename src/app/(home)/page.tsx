"use client";

import { FullScreenLoader } from "@/components";
import { DocumentsTable, Navbar, TemplateGallery } from "@/components/home";
import { useSearchParam } from "@/hooks/use-search-param";
import { useLoadingStore } from "@/store/useLoadingStore";
import { usePaginatedQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";

const Home = () => {
  const [search] = useSearchParam("search");
  const { results, status, loadMore } = usePaginatedQuery(
    api.documents.get,
    { search },
    { initialNumItems: 5 }
  );
  const { isLoading } = useLoadingStore();

  return isLoading ? (
    <FullScreenLoader />
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Fixed Navbar with Glass Effect */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="h-full px-6">
          <Navbar />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="pt-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}>
          <TemplateGallery />
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}>
          <DocumentsTable
            documents={results}
            loadMore={loadMore}
            status={status}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
