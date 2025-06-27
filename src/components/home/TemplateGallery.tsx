"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { templates } from "@/constants/template"
import { cn } from "@/lib/utils"
import { useLoadingStore } from "@/store/useLoadingStore"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { api } from "../../../convex/_generated/api"
import { motion } from "framer-motion"
import { Plus, Sparkles, FileText } from "lucide-react"

export const TemplateGallery = () => {
  const router = useRouter()
  const create = useMutation(api.documents.create)
  const [isCreating, setIsCreating] = useState(false)
  const { setIsLoading } = useLoadingStore()

  const onTemplateClick = async (title: string, initialContent: string) => {
    try {
      setIsCreating(true)
      setIsLoading(true)

      const documentId = await create({ title, initialContent })

      if (!documentId) {
        throw new Error("Document creation failed.")
      }

      router.push(`/documents/${documentId}`)
    } catch (error) {
      console.error("Failed to create document:", error)
      toast.error("Failed to create document")
    }
  }

  const onBlankDocument = async () => {
    await onTemplateClick("Untitled Document", "")
  }

  return (
    <div className="bg-gradient-to-br from-slate-50/80 to-violet-50/40">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Elegant Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">Start Creating</h2>
              </div>
              <p className="text-slate-500">Choose a template or start with a blank document</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBlankDocument}
              disabled={isCreating}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:shadow-md hover:border-slate-300 transition-all duration-300 disabled:opacity-50"
            >
              <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <Plus className="h-3 w-3 text-violet-600" />
              </div>
              Blank Document
            </motion.button>
          </div>

          {/* Enhanced Template Carousel */}
          <Carousel className="w-full">
            <CarouselContent className="-ml-6">
              {templates.map((template, index) => (
                <CarouselItem
                  key={template.id}
                  className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 pl-6"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn("space-y-4", isCreating && "pointer-events-none opacity-50")}
                  >
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        y: -4,
                      }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isCreating}
                      onClick={() => onTemplateClick(template.label, template.initialContent)}
                      className="group w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 relative"
                    >
                      <div
                        style={{
                          backgroundImage: `url(${template.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                        className="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#a375f3]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    <div className="space-y-1">
                      <h3 className="font-medium text-slate-700 text-sm truncate">{template.label}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <FileText className="h-3 w-3" />
                        <span>Template</span>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white/90 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 shadow-sm" />
            <CarouselNext className="bg-white/90 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 shadow-sm" />
          </Carousel>
        </motion.div>
      </div>
    </div>
  )
}
