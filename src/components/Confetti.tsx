import { useEffect, useRef } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  shape: "rect" | "circle" | "star";
}

const COLORS = [
  "#f472b6", "#60a5fa", "#34d399", "#fbbf24",
  "#fb923c", "#a78bfa", "#f87171", "#38bdf8",
  "#c084fc", "#fb7185", "#4ade80", "#facc15",
];

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

export default function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const piecesRef = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const shapes: Array<"rect" | "circle" | "star"> = ["rect", "circle", "star"];

    // Create confetti pieces — more and varied
    piecesRef.current = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 300,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 5 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      size: Math.random() * 10 + 4,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 5000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      piecesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.vx *= 0.999;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 5000);

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
        }

        ctx.restore();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{ width: "100vw", height: "100vh" }}
      />
      {/* Emoji fireworks overlay */}
      <div className="fixed inset-0 pointer-events-none z-[101]" aria-hidden="true">
        {["🎉", "🎊", "⭐", "🏆", "💖", "🌟", "🎈", "✨"].map((e, i) => (
          <span
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${10 + (i * 11) % 80}%`,
              top: `${15 + (i * 13) % 60}%`,
              fontSize: `${24 + (i % 3) * 12}px`,
              animation: `emojiFirework 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s forwards`,
              opacity: 0,
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </>
  );
}
