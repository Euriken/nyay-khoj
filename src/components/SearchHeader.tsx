import { Scale, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export const SearchHeader = () => {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nyaykhoj_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("nyaykhoj_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <header className="sticky top-0 z-10 border-b border-primary/30 bg-card/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Left — Branding */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-widest text-primary uppercase"
                style={{ fontFamily: "'Cinzel', serif" }}>
              Nyay Khoj
            </h1>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
              Indian Legal Search Engine
            </p>
          </div>
        </Link>

        {/* Center — Ashoka Chakra divider */}
        <div className="hidden md:flex items-center gap-3 text-primary/30 text-xs tracking-widest uppercase"
             style={{ fontFamily: "'Cinzel', serif" }}>
          <div className="h-px w-16 bg-primary/20"></div>
          <span className="text-primary/50">⚖</span>
          <div className="h-px w-16 bg-primary/20"></div>
        </div>

        {/* Right — Navigation */}
        <nav className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <Link
            to="/"
            className="text-[11px] font-bold tracking-wider text-muted-foreground hover:text-primary transition-colors uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Search
          </Link>
          <Link
            to="/stats"
            className="text-[11px] font-bold tracking-wider text-muted-foreground hover:text-primary transition-colors uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Analytics
          </Link>
        </nav>

      </div>

      {/* Gold bottom accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
    </header>
  );
};