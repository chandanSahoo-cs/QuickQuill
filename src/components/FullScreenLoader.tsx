interface FullScreenLoaderProps {
  label?: string;
}

import { motion } from "framer-motion";

export const FullScreenLoader = ({ label }: FullScreenLoaderProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        {/* Animated Quill */}
        <motion.div
          className="text-6xl mb-6"
          animate={{
            rotate: [0, -10, 10, -5, 5, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}>
          🪶
        </motion.div>

        {/* Ink Dots Animation */}
        <div className="flex justify-center space-x-2 mb-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-purple-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Loading Text with Quill Theme */}
        <motion.p
          className="text-purple-600 font-medium text-lg"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}>
          {label ?? "Preparing your quill..."}
        </motion.p>

        {/* Subtle Ink Splash Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-pink-300/20 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </div>
  );
};
