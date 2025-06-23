import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const quillFacts = [
  {
    title: "Ancient Elegance",
    fact: "Quill pens were first used around 700 AD and remained the primary writing instrument for over 1,000 years.",
    icon: "🪶"
  },
  {
    title: "Feathered Origins", 
    fact: "The best quills came from the outer wing feathers of large birds like geese, swans, and ravens.",
    icon: "🦢"
  },
  {
    title: "Presidential Signatures",
    fact: "Many founding fathers, including Thomas Jefferson, used quill pens to sign the Declaration of Independence.",
    icon: "📜"
  },
  {
    title: "Literary Legacy",
    fact: "Shakespeare, Dickens, and Jane Austen all crafted their masterpieces with nothing but a quill and ink.",
    icon: "✍️"
  },
  {
    title: "Precision Craft",
    fact: "A skilled scribe could write for hours with a single quill, carefully maintaining its pointed tip.",
    icon: "🎯"
  }
];

export const QuillFacts = () => {
  const [currentFact, setCurrentFact] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % quillFacts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative h-full flex flex-col justify-center items-center p-12 text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-10"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 12}%`,
              fontSize: '2rem',
            }}
          >
            🪶
          </motion.div>
        ))}
      </div>

      {/* Floating Quill Cursor Effect */}
      <motion.div
        className="absolute pointer-events-none z-10 text-2xl opacity-30"
        animate={{
          x: mousePosition.x * 0.02,
          y: mousePosition.y * 0.02,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        🪶
      </motion.div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-lg">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          The Art of Writing
        </motion.h1>

        <motion.div
          key={currentFact}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
        >
          <div className="text-4xl mb-4">
            {quillFacts[currentFact].icon}
          </div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-200">
            {quillFacts[currentFact].title}
          </h3>
          <p className="text-white/90 leading-relaxed font-light">
            {quillFacts[currentFact].fact}
          </p>
        </motion.div>

        {/* Progress Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {quillFacts.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentFact ? 'bg-yellow-300' : 'bg-white/30'
              }`}
              whileHover={{ scale: 1.2 }}
            />
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
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};