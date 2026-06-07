import { useState } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { SearchForm } from "@/components/SearchForm";
import { ResultCard } from "@/components/ResultCard";
import { Loader2 } from "lucide-react";

export interface CaseResult {
  title: string;
  court: string;
  case_type: string;
  url: string;
  text: string;
  similarity: number;
  ipc_sections?: string;
  verdict?: string;
}

const Index = () => {
  const [results, setResults] = useState<CaseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [caseTypeFilter, setCaseTypeFilter] = useState("All Types");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [courtFilter, setCourtFilter] = useState("All Courts");

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    setCaseTypeFilter("All Types");
    setVerdictFilter("All");
    setCourtFilter("All Courts");
    try {
      const res = await fetch("http://127.0.0.1:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((r) => {
    const matchType = caseTypeFilter === "All Types" || r.case_type === caseTypeFilter;
    const matchVerdict = verdictFilter === "All" || r.verdict === verdictFilter;
    const matchCourt = courtFilter === "All Courts" ||
      (courtFilter === "Supreme Court" && r.court.includes("Supreme")) ||
      (courtFilter === "High Court" && r.court.includes("High")) ||
      (courtFilter === "District Court" && r.court.includes("District"));
    return matchType && matchVerdict && matchCourt;
  });

  const verdictOptions = ["All", "Convicted", "Acquitted", "Appeal Allowed", "Dismissed"];
  const verdictColors: Record<string, string> = {
    "All": "bg-primary/15 text-primary border-primary/30",
    "Convicted": "bg-red-500/15 text-red-400 border-red-500/30",
    "Acquitted": "bg-green-500/15 text-green-400 border-green-500/30",
    "Appeal Allowed": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Dismissed": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {searched && !loading && results.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={caseTypeFilter}
                onChange={(e) => setCaseTypeFilter(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                {["All Types","Criminal","Civil","Land&Property","Tax","Financial","Motorvehicles","Industrial&Labour","Constitution"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>

              <select
                value={courtFilter}
                onChange={(e) => setCourtFilter(e.target.value)}
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                {["All Courts","Supreme Court","High Court","District Court"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2">
                {verdictOptions.map(v => (
                  <button
                    key={v}
                    onClick={() => setVerdictFilter(v)}
                    className={"px-3 py-1 rounded-full text-xs border transition-all " +
                      (verdictFilter === v ? verdictColors[v] + " font-semibold" : "border-border text-muted-foreground hover:border-primary/40")}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{filteredResults.length} results</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 mt-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Searching cases...</p>
          </div>
        )}

        {!loading && searched && filteredResults.length === 0 && (
          <p className="text-center text-muted-foreground mt-16">No results found.</p>
        )}

        {!loading && filteredResults.length > 0 && (
          <div className="mt-6 space-y-5">
            {filteredResults.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
