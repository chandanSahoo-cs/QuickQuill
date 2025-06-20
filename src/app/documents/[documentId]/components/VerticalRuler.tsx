import { useState, useRef, useEffect } from "react";
import { FaCaretRight } from "react-icons/fa";

const PAGE_HEIGHT = 1056;
const MIN_SPACE = 100;
const markers = Array.from({ length: 111 }, (_, i) => i);

export const VerticalRuler = () => {
  const [topMargin, setTopMargin] = useState(56);
  const [bottomMargin, setBottomMargin] = useState(56);
  const [isDraggingTop, setIsDraggingTop] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);

  const rulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!(isDraggingTop || isDraggingBottom) || !rulerRef.current) return;

      const container = rulerRef.current.querySelector(
        "#vertical-ruler-container"
      );
      if (container) {
        const rect = container.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const rawY = Math.max(0, Math.min(PAGE_HEIGHT, relativeY));

        if (isDraggingTop) {
          const maxTop = PAGE_HEIGHT - bottomMargin - MIN_SPACE;
          setTopMargin(Math.min(rawY, maxTop));
        } else if (isDraggingBottom) {
          const maxBottom = PAGE_HEIGHT - topMargin - MIN_SPACE;
          const bottomY = Math.min(PAGE_HEIGHT - rawY, maxBottom);
          setBottomMargin(Math.max(0, bottomY));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingTop(false);
      setIsDraggingBottom(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDraggingTop, isDraggingBottom, topMargin, bottomMargin]);

  return (
    <div
      ref={rulerRef}
      className="w-6 border-r border-gray-300 relative select-none print:hidden pt-4">
      <div
        id="vertical-ruler-container"
        className="relative h-[1056px] mx-auto w-full">
        <VerticalMarker
          position={topMargin}
          isTop={true}
          isDragging={isDraggingTop}
          onMouseDown={() => setIsDraggingTop(true)}
          onDoubleClick={() => setTopMargin(56)}
        />
        <VerticalMarker
          position={bottomMargin}
          isTop={false}
          isDragging={isDraggingBottom}
          onMouseDown={() => setIsDraggingBottom(true)}
          onDoubleClick={() => setBottomMargin(56)}
        />

        <div className="absolute inset-y-0 right-0 w-full">
          <div className="relative h-[1056px] w-full">
            {markers.map((marker) => {
              const position = (marker * PAGE_HEIGHT) / 110;

              return (
                <div
                  key={marker}
                  className="absolute left-0"
                  style={{ top: `${position}px` }}>
                  {marker % 10 === 0 && (
                    <div className="w-2 h-[1px] bg-neutral-500">
                      <span className="absolute left-3 text-[10px] text-neutral-500">
                        {marker / 10 + 1}
                      </span>
                    </div>
                  )}
                  {marker % 5 === 0 && marker % 10 !== 0 && (
                    <div className="w-1.5 h-[1px] bg-neutral-500"></div>
                  )}
                  {marker % 5 !== 0 && (
                    <div className="w-1 h-[1px] bg-neutral-500"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface VerticalMarkerProps {
  position: number;
  isTop: boolean;
  isDragging: boolean;
  onMouseDown: () => void;
  onDoubleClick: () => void;
}

const VerticalMarker = ({
  position,
  isTop,
  isDragging,
  onMouseDown,
  onDoubleClick,
}: VerticalMarkerProps) => {
  return (
    <div
      className="absolute left-0 h-4 w-full cursor-ns-resize z-[5] group -mt-2"
      style={{ [isTop ? "top" : "bottom"]: `${position}px` }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}>
      <FaCaretRight className="absolute top-1/2 left-0 text-blue-500 transform -translate-y-1/2" />
      <div
        className="absolute top-1/2 left-4 transform -translate-y-1/2 h-[1px] w-[100vw] bg-blue-500 scale-y-50"
        style={{
          display: isDragging ? "block" : "none",
        }}
      />
    </div>
  );
};
