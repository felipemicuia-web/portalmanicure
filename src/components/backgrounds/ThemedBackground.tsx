import { useEffect, useState, useMemo } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";

type BackgroundType = "stars" | "bubbles" | "petals" | "leaves" | "rays" | "snow" | "butterflies";

interface ThemeBackground {
  type: BackgroundType;
  particleCount: number;
}

const THEME_BACKGROUNDS: Record<string, ThemeBackground> = {
  "galaxy": { type: "stars", particleCount: 50 },
  "rosa": { type: "petals", particleCount: 20 },
  "oceano": { type: "bubbles", particleCount: 30 },
  "floresta": { type: "leaves", particleCount: 25 },
  "pordosol": { type: "rays", particleCount: 15 },
  "meianoite": { type: "snow", particleCount: 40 },
  "lavanda": { type: "butterflies", particleCount: 12 },
};

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

export function ThemedBackground() {
  // Use ThemeContext directly instead of polling localStorage
  const { currentThemeId } = useThemeContext();

  const particles = useMemo(() => {
    const config = THEME_BACKGROUNDS[currentThemeId] || THEME_BACKGROUNDS["galaxy"];
    const result: JSX.Element[] = [];

    for (let i = 0; i < config.particleCount; i++) {
      const delay = Math.random() * 10;
      const size = 4 + Math.random() * 12;
      const left = Math.random() * 100;
      const duration = 8 + Math.random() * 12;

      switch (config.type) {
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
      }
    }
    return result;
  }, [currentThemeId]);

  return (
    <div className="themed-bg-container">
      {particles}
    </div>
  );
}
