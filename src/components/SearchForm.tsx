import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
}

export const SearchForm = ({ onSearch, loading }: Props) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-muted-foreground mb-1">
        Describe your legal situation
      </label>
      <Textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. My landlord is refusing to return my security deposit after the lease ended…"
        className="min-h-[160px] bg-card border-border text-foreground placeholder:text-muted-foreground resize-y text-base"
      />
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
