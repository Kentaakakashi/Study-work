import { useEffect, useState } from "react";
import { CloudRain, Snowflake, Flower2, Leaf, Stars, Music4 } from "lucide-react";

type Weather = "none" | "rain" | "snow" | "sakura" | "leaves" | "stars";

export default function FocusAmbientShell({
  children,
  onOpenMusic,
}: {
  children: React.ReactNode;
  onOpenMusic: () => void;
}) {
  const [weather, setWeather] = useState<Weather>("none");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("focus_notes");
    if (saved) setNotes(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("focus_notes", notes);
  }, [notes]);

  const renderWeather = () => {
    if (weather === "none") return null;

    const particles = 40;

    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: particles }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 5;

          if (weather === "rain") {
            return (
              <span
                key={i}
                className="absolute h-8 w-[1px] bg-white/40 animate-[rain_1.2s_linear_infinite]"
                style={{ left: `${left}%`, animationDelay: `${delay}s` }}
              />
            );
          }

          if (weather === "snow") {
            return (
              <span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-white animate-[snow_6s_linear_infinite]"
                style={{ left: `${left}%`, animationDelay: `${delay}s` }}
              />
            );
          }

          if (weather === "sakura") {
            return (
              <span
                key={i}
                className="absolute text-pink-300 animate-[snow_7s_linear_infinite]"
                style={{ left: `${left}%`, animationDelay: `${delay}s` }}
              >
                ✿
              </span>
            );
          }

          if (weather === "leaves") {
            return (
              <span
                key={i}
                className="absolute text-amber-400 animate-[snow_8s_linear_infinite]"
                style={{ left: `${left}%`, animationDelay: `${delay}s` }}
              >
                ❋
              </span>
            );
          }

          return (
            <span
              key={i}
              className="absolute rounded-full bg-white/80 animate-pulse"
              style={{
                left: `${left}%`,
                top: `${Math.random() * 100}%`,
                width: 2,
                height: 2,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative rounded-3xl border border-border/40 bg-background/20 overflow-hidden">

      {renderWeather()}

      <div className="relative z-10 p-4">{children}</div>

      <div className="absolute bottom-4 right-4 flex gap-2 z-20">

        <button
          onClick={() => setWeather("rain")}
          className="focus-btn"
        >
          <CloudRain size={16}/> Rain
        </button>

        <button
          onClick={() => setWeather("snow")}
          className="focus-btn"
        >
          <Snowflake size={16}/> Snow
        </button>

        <button
          onClick={() => setWeather("sakura")}
          className="focus-btn"
        >
          <Flower2 size={16}/> Sakura
        </button>

        <button
          onClick={() => setWeather("leaves")}
          className="focus-btn"
        >
          <Leaf size={16}/> Leaves
        </button>

        <button
          onClick={() => setWeather("stars")}
          className="focus-btn"
        >
          <Stars size={16}/> Stars
        </button>

        <button
          onClick={onOpenMusic}
          className="focus-btn"
        >
          <Music4 size={16}/> Music
        </button>
      </div>

      <div className="absolute left-4 bottom-4 w-64 z-20">
        <textarea
          placeholder="Focus notes..."
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
          className="w-full rounded-xl border border-border/40 bg-background/60 p-2 text-sm backdrop-blur"
        />
      </div>
    </div>
  );
            }
