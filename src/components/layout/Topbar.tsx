import { Flame, Zap, Timer, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMenuToggle?: () => void;
}

const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 w-full glass-card border-b border-border/30 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile menu */}
        <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-gradient">Study Zone</span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden md:block" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
            <Flame className="w-4 h-4 streak-glow" />
            <span className="text-sm font-semibold streak-glow">7</span>
          </div>

          {/* Level */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Lvl 5</span>
            <span className="text-xs text-muted-foreground">1,250 XP</span>
          </div>

          {/* Quick Focus */}
          <Button
            onClick={() => navigate("/focus/pomodoro")}
            className="glow-button gap-2 text-sm h-9 px-4"
            size="sm"
          >
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Start Focus</span>
          </Button>

          {/* Avatar */}
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
            S
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
