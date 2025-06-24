"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Feather, BookOpen, PenTool, Scroll, Target } from "lucide-react"

const quillFacts = [
  {
    title: "Ancient Elegance",
    fact: "Quill pens were first used around 700 AD and remained the primary writing instrument for over 1,000 years.",
    icon: Feather,
  },
  {
    title: "Feathered Origins",
    fact: "The best quills came from the outer wing feathers of large birds like geese, swans, and ravens.",
    icon: BookOpen,
  },
  {
    title: "Presidential Signatures",
    fact: "Many founding fathers, including Thomas Jefferson, used quill pens to sign the Declaration of Independence.",
    icon: Scroll,
  },
  {
    title: "Literary Legacy",
    fact: "Shakespeare, Dickens, and Jane Austen all crafted their masterpieces with nothing but a quill and ink.",
    icon: PenTool,
  },
  {
    title: "Precision Craft",
    fact: "A skilled scribe could write for hours with a single quill, carefully maintaining its pointed tip.",
    icon: Target,
  },
]

export const QuillFacts = () => {
  const [currentFact, setCurrentFact] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % quillFacts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const CurrentIcon = quillFacts[currentFact].icon

  return (
    <div className="relative h-full flex flex-col justify-center items-center p-12 text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-10"
            animate={{
              x: [0, 50, 0],
              y: [0, -25, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              left: `${20 + i * 12}%`,
              top: `${10 + i * 15}%`,
            }}
          >
            <Feather className="w-8 h-8 text-white" />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-lg">
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-12 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          The Art of Writing
        </motion.h1>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentFact}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
          >
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CurrentIcon className="w-6 h-6 text-yellow-200" />
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-yellow-200">{quillFacts[currentFact].title}</h3>

            <p className="text-white/90 leading-relaxed font-light">{quillFacts[currentFact].fact}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {quillFacts.map((_, index) => (
            <button key={index} onClick={() => setCurrentFact(index)} className="group">
              <motion.div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentFact ? "bg-yellow-300" : "bg-white/30"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Ink Splash Effect */}
      <motion.div
        className="absolute bottom-10 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}
