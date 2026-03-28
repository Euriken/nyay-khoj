import { useState } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { SearchForm } from "@/components/SearchForm";
import { ResultCard } from "@/components/ResultCard";
import { Loader2 } from "lucide-react";

export interface CaseResult {
  title: string;
  court: string;
  case_type: string;
  similarity: number;
  summary: string;
  judgment_url: string;
}

const Index = () => {
  const [results, setResults] = useState<CaseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("http://localhost:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results ?? data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {loading && (
          <div className="flex flex-col items-center gap-3 mt-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Searching cases…</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-muted-foreground mt-16">No results found.</p>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-10 space-y-5">
            {results.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
