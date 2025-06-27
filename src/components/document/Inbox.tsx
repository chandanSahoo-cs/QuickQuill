"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ClientSideSuspense } from "@liveblocks/react"
import {
  InboxNotification,
  InboxNotificationList,
} from "@liveblocks/react-ui"
import { useInboxNotifications } from "@liveblocks/react/suspense"
import { BellIcon } from "lucide-react"
import { motion } from "framer-motion"

export const Inbox = () => (
  <ClientSideSuspense
    fallback={
      <>
        <Button variant="ghost" disabled size="icon" className="relative rounded-lg">
          <BellIcon className="h-5 w-5" />
        </Button>
        <Separator orientation="vertical" className="h-6 bg-slate-200" />
      </>
    }
  >
    <InboxMenu />
  </ClientSideSuspense>
)

const InboxMenu = () => {
  const { inboxNotifications } = useInboxNotifications()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-slate-100">
              <BellIcon className="h-5 w-5 text-slate-600" />
              {inboxNotifications.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white flex items-center justify-center text-xs font-medium shadow-sm"
                >
                  {inboxNotifications.length}
                </motion.span>
              )}
            </Button>
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-auto bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-xl p-2"
        >
          {inboxNotifications.length > 0 ? (
            <InboxNotificationList>
              {inboxNotifications.map((notification) => (
                <InboxNotification
                  key={notification.id}
                  inboxNotification={notification}
                />
              ))}
            </InboxNotificationList>
          ) : (
            <div className="p-4 w-[400px] text-center text-sm text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <BellIcon className="h-8 w-8 text-slate-300" />
                <p className="font-medium">No notifications</p>
                <p className="text-xs text-slate-400">You&apos;re all caught up!</p>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="h-6 bg-slate-200" />
    </>
  )
}
