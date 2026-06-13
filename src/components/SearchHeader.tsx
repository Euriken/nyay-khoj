import { Scale } from "lucide-react";

export const SearchHeader = () => (
  <header className="sticky top-0 z-10 border-b border-primary/30 bg-card/90 backdrop-blur-sm">
    <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">

      {/* Left — Branding */}
      <div className="flex items-center gap-3">
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
      </div>

      {/* Center — Ashoka Chakra divider */}
      <div className="hidden md:flex items-center gap-3 text-primary/30 text-xs tracking-widest uppercase"
           style={{ fontFamily: "'Cinzel', serif" }}>
        <div className="h-px w-16 bg-primary/20"></div>
        <span className="text-primary/50">⚖</span>
        <div className="h-px w-16 bg-primary/20"></div>
      </div>

      {/* Right — Tagline */}
      <div className="hidden md:block text-right">
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
          Satyameva Jayate
        </p>
        <p className="text-[10px] text-primary/60 tracking-wider">
          Truth Alone Triumphs
        </p>
      </div>

    </div>

    {/* Gold bottom accent line */}
    <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
  </header>
);