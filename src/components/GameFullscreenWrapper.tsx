import { useFullscreen } from "@/hooks/useFullscreen";
import FullscreenButton from "@/components/FullscreenButton";
import { ReactNode } from "react";

interface GameFullscreenWrapperProps {
  children: ReactNode;
}

export default function GameFullscreenWrapper({ children }: GameFullscreenWrapperProps) {
  const { containerRef, isFullscreen, toggle } = useFullscreen();

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 flex flex-col min-w-0 ${
        isFullscreen ? "bg-background overflow-auto" : ""
      }`}
    >
      {children}
      <div className={`fixed z-50 ${isFullscreen ? "bottom-4 left-4" : "bottom-4 left-4"}`}>
        <FullscreenButton
          isFullscreen={isFullscreen}
          onToggle={toggle}
          className="bg-card/80 backdrop-blur-sm shadow-lg border border-muted hover:bg-card"
        />
      </div>
    </div>
  );
}
