import { Scale } from "lucide-react";

export const SearchHeader = () => (
  <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
    <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
      <Scale className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-display font-bold tracking-tight text-foreground">
        Indian Legal Search Engine
      </h1>
    </div>
  </header>
);
