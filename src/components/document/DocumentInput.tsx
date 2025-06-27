"use client"

import type React from "react"

import { useDebounce } from "@/hooks/useDebounce"
import { useStatus } from "@liveblocks/react"
import { useMutation, useQuery } from "convex/react"
import { LoaderIcon } from "lucide-react"
import { useRef, useState } from "react"
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs"
import { toast } from "sonner"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"

interface DocumentInputProp {
  title: string
  id: Id<"documents">
}

export const DocumentInput = ({ title, id }: DocumentInputProp) => {
  const [value, setValue] = useState(title)
  const [isPending, setIsPending] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const status = useStatus()

  const mutate = useMutation(api.documents.renameById)

  const getById = useQuery(api.documents.getById, {
    documentId: id,
  })

  const { user } = useUser()

  const owner = getById?.ownerId === user?.id

  const debouncedUpdate = useDebounce((newValue: string) => {
    if (newValue === title) return
    setIsPending(true)
    mutate({ documentId: id, title: newValue })
      .then(() => {
        toast.success("Document updated successfully")
        setIsEditing(false)
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setIsPending(false))
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    mutate({ documentId: id, title: value })
      .then(() => {
        toast.success("Document updated successfully")
        setIsEditing(false)
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setIsPending(false))
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true)
    const newValue = e.target.value
    setValue(newValue)
    debouncedUpdate(newValue)
  }

  const showLoader = isPending || status === "connecting" || status === "reconnecting"
  const showError = status === "disconnected"

  return (
    <div className="flex items-center gap-3">
      {isEditing && owner ? (
        <form onSubmit={handleSubmit} className="relative w-fit max-w-[50ch]">
          <span className="invisible whitespace-pre px-2 text-lg font-medium">{value || " "}</span>
          <input
            ref={inputRef}
            value={value}
            onBlur={() => setIsEditing(false)}
            onChange={onChange}
            className="absolute inset-0 text-lg font-medium text-slate-800 px-2 bg-white border border-violet-200  rounded-lg focus:outline-none  transition-all duration-200"
          />
        </form>
      ) : (
        <motion.span
          whileHover={{ scale: 1.01 }}
          onClick={() => {
            if (owner) {
              setIsEditing(true)
              setTimeout(() => {
                inputRef.current?.focus()
              }, 0)
            }
          }}
          className={`text-lg font-medium px-2 py-1 rounded-lg transition-colors duration-200 truncate ${
            owner ? "cursor-pointer text-slate-800 hover:bg-slate-50" : "cursor-default text-slate-600"
          }`}
        >
          {title}
        </motion.span>
      )}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="flex items-center"
      >
        {showError && <BsCloudSlash className="h-4 w-4 text-red-500" />}
        {!showError && !showLoader && <BsCloudCheck className="h-4 w-4 text-green-500" />}
        {showLoader && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <LoaderIcon className="h-4 w-4 text-violet-500" />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
