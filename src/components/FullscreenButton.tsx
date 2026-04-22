import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function FullscreenButton({ isFullscreen, onToggle, className = "" }: FullscreenButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`gap-1 text-xs ${className}`}
      aria-label={isFullscreen ? "יציאה ממסך מלא" : "מסך מלא"}
    >
      {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
      {isFullscreen ? "צמצם" : "מסך מלא"}
    </Button>
  );
}
