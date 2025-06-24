"use client"

import { Button } from "@/components/ui/button"
import { Home, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

interface ErrorPageProps {
  error?: Error & { digest?: string }
  reset?: () => void
  showHomeButton?: boolean
}

const ErrorPage = ({ error, reset, showHomeButton = true }: ErrorPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <div className="text-center relative max-w-md mx-auto">
        {/* Animated Quill with Error Context */}
        <motion.div
          className="flex justify-center mb-8"
          animate={{
            rotate: [0, -8, 8, -4, 4, 0],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <div className="relative">
            <motion.div
              className="text-7xl"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              🪶
            </motion.div>
            {/* Subtle error indicator */}
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* Ink Drops Animation */}
        <div className="flex justify-center space-x-2 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-purple-600 rounded-full"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6],
                y: [0, -4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Error Content */}
        <motion.div
          className="space-y-6 mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="space-y-3">
            <motion.h1
              className="text-3xl font-bold text-purple-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Oops! Ink spilled
            </motion.h1>
            <motion.p
              className="text-purple-600/80 text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Something went wrong while preparing your quill
            </motion.p>
          </div>

          {error?.message && (
            <motion.div
              className="bg-purple-50/50 backdrop-blur-sm border border-purple-100 rounded-lg p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <p className="text-purple-700/80 text-sm font-medium leading-relaxed">{error.message}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex items-center justify-center gap-3 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        >
          {reset && (
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={reset}
                className="font-semibold px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refill the ink
              </Button>
            </motion.div>
          )}

          {showHomeButton && (
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                asChild
                variant="ghost"
                className="font-semibold px-8 py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-100/50 transition-all duration-200 rounded-full"
              >
                <a href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return home
                </a>
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Background Effects */}
        <motion.div
          className="absolute inset-0 pointer-events-none -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          {/* Floating ink blots */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-300/15 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-pink-300/15 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: 1,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-3/4 left-1/2 w-20 h-20 bg-purple-400/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              delay: 2,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Subtle paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none -z-5 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_purple_1px,_transparent_0)] bg-[length:20px_20px]" />
      </div>
    </div>
  )
}

export default ErrorPage
