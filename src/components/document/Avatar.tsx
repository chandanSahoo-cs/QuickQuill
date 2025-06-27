"use client"

import { Separator } from "@/components/ui/separator"
import { ClientSideSuspense } from "@liveblocks/react"
import { useOthers, useSelf } from "@liveblocks/react/suspense"
import { motion } from "framer-motion"

const AVATAR_SIZE = 36

interface AvatarProps {
  src: string
  name: string
}

export const Avatars = () => {
  return (
    <ClientSideSuspense fallback={null}>
      <AvatarStack />
    </ClientSideSuspense>
  )
}

const AvatarStack = () => {
  const users = useOthers()
  const currentUser = useSelf()

  if (users.length === 0) return null

  return (
    <>
      <div className="flex items-center">
        {currentUser && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative ml-2"
          >
            <Avatar src={currentUser.info.avatar} name="You" />
          </motion.div>
        )}

        <div className="flex">
          {users.map(({ connectionId, info }, index) => {
            return (
              <motion.div
                key={connectionId}
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: index * 0.1 }}
              >
                <Avatar name={info.name} src={info.avatar} />
              </motion.div>
            )
          })}
        </div>
      </div>
      <Separator orientation="vertical" className="h-6 bg-slate-200" />
    </>
  )
}

const Avatar = ({ src, name }: AvatarProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      className="group -ml-2 flex shrink-0 place-content-center relative border-3 border-white rounded-full bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm"
    >
      <div className="opacity-0 group-hover:opacity-100 absolute top-full py-2 px-3 text-white text-xs mt-3 z-10 bg-slate-800 whitespace-nowrap transition-opacity rounded-lg shadow-lg">
        {name}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
      </div>
      <img alt={name} src={src || "/placeholder.svg"} className="size-full rounded-full object-cover" />
    </motion.div>
  )
}
