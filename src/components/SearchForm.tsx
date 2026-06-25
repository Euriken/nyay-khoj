import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  externalQuery?: string;
}

const SUGGESTIONS = [
  "murder under section 302",
  "culpable homicide not amounting to murder",
  "attempt to murder",
  "voluntarily causing grievous hurt",
  "assault on woman with intent to outrage modesty",
  "rape under section 376",
  "theft and robbery",
  "criminal conspiracy and cheating",
  "forgery of valuable security",
  "dowry death and cruelty by husband",
  "bail application under section 438 crpc",
  "rash and negligent driving accident claim"
];

export const SearchForm = ({ onSearch, loading, externalQuery }: Props) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const filteredSuggestions = SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(query.toLowerCase()) && s.toLowerCase() !== query.toLowerCase()
  ).slice(0, 4);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      <label className="block text-sm font-medium text-muted-foreground mb-1">
        Describe your legal situation
      </label>
      <div className="relative">
        <Textarea
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="e.g. My landlord is refusing to return my security deposit after the lease ended…"
          className="min-h-[160px] bg-card border-border text-foreground placeholder:text-muted-foreground resize-y text-base"
        />
        {showSuggestions && query.length >= 3 && filteredSuggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
            {filteredSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 text-foreground transition-colors border-b border-border/40 last:border-b-0 font-legal flex items-center gap-2"
              >
                <Search className="h-3.5 w-3.5 text-primary/60 flex-shrink-0" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading || !query.trim()}
        className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold text-base px-8 py-5"
      >
        <Search className="h-4 w-4" />
        Search Cases
      </Button>
    </form>
  );
};
