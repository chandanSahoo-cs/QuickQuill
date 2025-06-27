"use client"

import { MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar"
import { useState } from "react"
import { motion } from "framer-motion"

const MAX_ROWS = 8
const MAX_COLS = 8

export function TableMenu({ insertTable }: { insertTable: ({ rows, cols }: { rows: number; cols: number }) => void }) {
  const [hoveredRow, setHoveredRow] = useState(0)
  const [hoveredCol, setHoveredCol] = useState(0)

  return (
    <MenubarSub>
      <MenubarSubTrigger className="rounded-lg">Table</MenubarSubTrigger>
      <MenubarSubContent className="bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-xl p-3">
        <div className="space-y-3">
          <div className="text-sm text-center text-slate-600 font-medium">
            {hoveredCol > 0 && hoveredRow > 0 ? `${hoveredRow} × ${hoveredCol}` : `Insert Table`}
          </div>
          <div className="grid grid-cols-8 gap-1 p-2 bg-slate-50 rounded-lg">
            {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, index) => {
              const row = Math.floor(index / MAX_COLS) + 1
              const col = (index % MAX_COLS) + 1
              const isHighlighted = row <= hoveredRow && col <= hoveredCol

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className={`w-5 h-5 border-2 rounded cursor-pointer transition-all duration-200 ${
                    isHighlighted
                      ? "bg-violet-500 border-violet-600 shadow-sm"
                      : "bg-white border-slate-300 hover:border-violet-300"
                  }`}
                  onMouseEnter={() => {
                    setHoveredRow(row)
                    setHoveredCol(col)
                  }}
                  onClick={() => insertTable({ rows: hoveredRow, cols: hoveredCol })}
                />
              )
            })}
          </div>
        </div>
      </MenubarSubContent>
    </MenubarSub>
  )
}
