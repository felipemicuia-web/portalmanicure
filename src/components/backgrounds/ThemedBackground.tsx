import { useEffect, useState } from "react";

type BackgroundType = "stars" | "bubbles" | "petals" | "leaves" | "rays" | "snow" | "butterflies";

interface ThemeBackground {
  type: BackgroundType;
  particleCount: number;
}

const THEME_BACKGROUNDS: Record<string, ThemeBackground> = {
  "galaxy": { type: "stars", particleCount: 20 },
  "rosa": { type: "petals", particleCount: 10 },
  "oceano": { type: "bubbles", particleCount: 12 },
  "floresta": { type: "leaves", particleCount: 10 },
  "pordosol": { type: "rays", particleCount: 6 },
  "meianoite": { type: "snow", particleCount: 15 },
  "lavanda": { type: "butterflies", particleCount: 6 },
};

function getThemeId(): string {
  try {
    const stored = localStorage.getItem("site-theme-id");
    return stored || "galaxy";
  } catch {
    return "galaxy";
  }
}

// Star component
function Star({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="bg-star"
      style={{
        left: `${left}%`,
        top: `${Math.random() * 100}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Bubble component (for Oceano theme)
function Bubble({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="bg-bubble"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Petal component (for Rosa theme)
function Petal({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="bg-petal"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 1.5,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Leaf component (for Floresta theme)
function Leaf({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="bg-leaf"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Ray component (for Pôr do Sol theme)
function Ray({ delay, left, duration }: { delay: number; left: number; duration: number }) {
  return (
    <div
      className="bg-ray"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Snowflake component (for Meia-Noite theme)
function Snowflake({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="bg-snowflake"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Butterfly component (for Lavanda theme)
function Butterfly({ delay, size, left, duration }: { delay: number; size: number; left: number; duration: number }) {
  return (
    <div
      className="bg-butterfly"
      style={{
        left: `${left}%`,
        top: `${Math.random() * 80}%`,
        width: size,
        height: size * 0.6,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export function ThemedBackground() {
  const [themeId, setThemeId] = useState(getThemeId);
  const [particles, setParticles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    // Listen for theme changes
    const handleStorageChange = () => {
      setThemeId(getThemeId());
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const current = getThemeId();
      if (current !== themeId) {
        setThemeId(current);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [themeId]);

  useEffect(() => {
    const config = THEME_BACKGROUNDS[themeId] || THEME_BACKGROUNDS["galaxy"];
    const newParticles: JSX.Element[] = [];

    for (let i = 0; i < config.particleCount; i++) {
      const delay = Math.random() * 10;
      const size = 4 + Math.random() * 12;
      const left = Math.random() * 100;
      const duration = 8 + Math.random() * 12;

      switch (config.type) {
        case "stars":
          newParticles.push(
            <Star key={i} delay={delay} size={size} left={left} duration={duration} />
          );
          break;
        case "bubbles":
          newParticles.push(
            <Bubble key={i} delay={delay} size={size * 1.5} left={left} duration={duration} />
          );
          break;
        case "petals":
          newParticles.push(
            <Petal key={i} delay={delay} size={size} left={left} duration={duration} />
          );
          break;
        case "leaves":
          newParticles.push(
            <Leaf key={i} delay={delay} size={size * 1.2} left={left} duration={duration} />
          );
          break;
        case "rays":
          newParticles.push(
            <Ray key={i} delay={delay} left={left} duration={duration * 0.5} />
          );
          break;
        case "snow":
          newParticles.push(
            <Snowflake key={i} delay={delay} size={size * 0.8} left={left} duration={duration} />
          );
          break;
        case "butterflies":
          newParticles.push(
            <Butterfly key={i} delay={delay} size={size * 1.5} left={left} duration={duration * 1.5} />
          );
          break;
      }
    }

    setParticles(newParticles);
  }, [themeId]);

  return (
    <div className="themed-bg-container">
      {particles}
    </div>
  );
}
