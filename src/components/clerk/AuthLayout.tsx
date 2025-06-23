import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { QuillFacts } from "./QuillFacts";

export const AuthLayout = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Quill Facts (60%) */}
      <div className="flex-[3] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
        <QuillFacts />
      </div>

      {/* Right Side - Auth Forms (40%) */}
      <div className="flex-[2] bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-50/50 to-pink-50/50" />

        <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm border-0 shadow-2xl shadow-purple-500/10 relative z-10">
          {/* Toggle Buttons */}
          <div className="relative mb-8 bg-gray-100 rounded-lg p-1 overflow-hidden">
            {/* Slider Background */}
            <motion.div
              layout
              animate={{
                left: isSignUp ? "50%" : "0%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="absolute top-1 bottom-1 w-1/2 rounded-md bg-purple-600 z-0"
            />

            <div className="relative z-10 flex">
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 transition-all duration-300 hover:bg-transparent ${
                  !isSignUp ? "text-white" : "text-gray-600 hover:text-purple-600"
                }`}
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 transition-all duration-300 hover:bg-transparent ${
                  isSignUp ? "text-white" : "text-gray-600 hover:text-purple-600"
                }`}
              >
                Sign Up
              </Button>
            </div>
          </div>

          {/* Form Container with Sliding Animation */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!isSignUp ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="auth-form-container">
                  <SignIn
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 bg-transparent",
                        headerTitle: "text-2xl font-bold text-gray-800 mb-2",
                        headerSubtitle: "text-gray-600 mb-6",
                        formButtonPrimary:
                          "bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200",
                        formFieldInput:
                          "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20",
                        formFieldLabel: "text-gray-700 font-medium",
                        footer: "hidden",
                        footerAction: "hidden",
                        footerActionLink: "hidden",
                        socialButtonsBlockButton:
                          "border-gray-200 hover:bg-gray-50 transition-colors duration-200",
                        dividerLine: "bg-gray-200",
                        dividerText: "text-gray-500",
                      },
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="auth-form-container">
                  <SignUp
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 bg-transparent",
                        headerTitle: "text-2xl font-bold text-gray-800 mb-2",
                        headerSubtitle: "text-gray-600 mb-6",
                        formButtonPrimary:
                          "bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200",
                        formFieldInput:
                          "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20",
                        formFieldLabel: "text-gray-700 font-medium",
                        footer: "hidden",
                        footerAction: "hidden",
                        footerActionLink: "hidden",
                        socialButtonsBlockButton:
                          "border-gray-200 hover:bg-gray-50 transition-colors duration-200",
                        dividerLine: "bg-gray-200",
                        dividerText: "text-gray-500",
                      },
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-purple-300/20 rounded-full blur-xl" />
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-pink-300/20 rounded-full blur-lg" />
      </div>
    </div>
  );
};
