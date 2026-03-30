import { useMemo } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";

type BackgroundType = "stars" | "bubbles" | "petals" | "leaves" | "rays" | "snow" | "butterflies" | "sparkles" | "fireflies" | "hearts" | "confetti" | "none";

function Star({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-star" style={{ left: `${left}%`, top: `${Math.random() * 100}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Bubble({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-bubble" style={{ left: `${left}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Petal({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-petal" style={{ left: `${left}%`, width: size, height: size * 1.5, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Leaf({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-leaf" style={{ left: `${left}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Ray({ delay, left, duration }: { delay: number; left: number; duration: number }) {
  return (
    <div className="bg-ray" style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Snowflake({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-snowflake" style={{ left: `${left}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Butterfly({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-butterfly" style={{ left: `${left}%`, top: `${Math.random() * 80}%`, width: size, height: size * 0.6, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Sparkle({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-sparkle" style={{ left: `${left}%`, top: `${Math.random() * 100}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Firefly({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-firefly" style={{ left: `${left}%`, top: `${Math.random() * 100}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Heart({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div className="bg-heart" style={{ left: `${left}%`, width: size, height: size, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

function Confetti({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <div className="bg-confetti" style={{ left: `${left}%`, width: size * 0.4, height: size, backgroundColor: color, animationDelay: `${delay}s`, animationDuration: `${duration}s` }} />
  );
}

const PARTICLE_COUNTS: Record<BackgroundType, number> = {
  stars: 50,
  bubbles: 30,
  petals: 20,
  leaves: 25,
  rays: 15,
  snow: 40,
  butterflies: 12,
  sparkles: 35,
  fireflies: 20,
  hearts: 18,
  confetti: 40,
  none: 0,
};

export function ThemedBackground() {
  const { resolvedAnimationId } = useThemeContext();

  const particles = useMemo(() => {
    const type = resolvedAnimationId as BackgroundType;
    if (type === "none") return [];

    const count = PARTICLE_COUNTS[type] || 30;
    const result: JSX.Element[] = [];

    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 10;
      const size = 4 + Math.random() * 12;
      const left = Math.random() * 100;
      const duration = 8 + Math.random() * 12;

      switch (type) {
        case "stars":
          result.push(<Star key={i} delay={delay} size={size} left={left} duration={duration} />);
          break;
        case "bubbles":
          result.push(<Bubble key={i} delay={delay} size={size * 1.5} left={left} duration={duration} />);
          break;
        case "petals":
          result.push(<Petal key={i} delay={delay} size={size} left={left} duration={duration} />);
          break;
        case "leaves":
          result.push(<Leaf key={i} delay={delay} size={size * 1.2} left={left} duration={duration} />);
          break;
        case "rays":
          result.push(<Ray key={i} delay={delay} left={left} duration={duration * 0.5} />);
          break;
        case "snow":
          result.push(<Snowflake key={i} delay={delay} size={size * 0.8} left={left} duration={duration} />);
          break;
        case "butterflies":
          result.push(<Butterfly key={i} delay={delay} size={size * 1.5} left={left} duration={duration * 1.5} />);
          break;
        case "sparkles":
          result.push(<Sparkle key={i} delay={delay} size={size * 0.6} left={left} duration={duration * 0.6} />);
          break;
        case "fireflies":
          result.push(<Firefly key={i} delay={delay} size={size * 0.5} left={left} duration={duration * 1.2} />);
          break;
        case "hearts":
          result.push(<Heart key={i} delay={delay} size={size} left={left} duration={duration} />);
          break;
        case "confetti":
          result.push(<Confetti key={i} delay={delay} size={size} left={left} duration={duration * 0.8} />);
          break;
      }
    }
    return result;
  }, [resolvedAnimationId]);

  if (resolvedAnimationId === "none") return null;

  return (
    <div className="themed-bg-container">
      {particles}
    </div>
  );
}
