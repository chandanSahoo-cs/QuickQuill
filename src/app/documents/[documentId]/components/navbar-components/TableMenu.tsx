import {
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from "@/components/ui/menubar";
import { useState } from "react";

const MAX_ROWS = 8;
const MAX_COLS = 8;

export function TableMenu({
  insertTable,
}: {
  insertTable: ({rows,cols}: { rows: number; cols: number }) => void;
}) {
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Table</MenubarSubTrigger>
      <MenubarSubContent>
        <div className="px-3 py-2">
          <div className="mb-2 text-sm text-center text-gray-600">
            {hoveredCol > 0 && hoveredRow > 0
              ? `${hoveredRow} x ${hoveredCol}`
              : `Insert Table`}
          </div>
          <div className="grid grid-cols-8 gap-[2px]">
            {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, index) => {
              const row = Math.floor(index / MAX_COLS) + 1;
              const col = (index % MAX_COLS) + 1;
              const isHighlighted = row <= hoveredRow && col <= hoveredCol;

              return (
                <div
                  key={index}
                  className={`w-5 h-5 border ${
                    isHighlighted ? "bg-blue-500" : "bg-white"
                  } hover:bg-blue-300 border-gray-300`}
                  onMouseEnter={() => {
                    setHoveredRow(row);
                    setHoveredCol(col);
                  }}
                  onClick={() =>
                    insertTable({ rows: hoveredRow, cols: hoveredCol })
                  }
                />
              );
            })}
          </div>
        </div>
      </MenubarSubContent>
    </MenubarSub>
  );
}
