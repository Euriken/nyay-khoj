import { useState } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { SearchForm } from "@/components/SearchForm";
import { ResultCard } from "@/components/ResultCard";
import { LegalAdvisor } from "@/components/LegalAdvisor";
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
  const [query, setQuery] = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState("All Types");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [courtFilter, setCourtFilter] = useState("All Courts");
  const [activeTab, setActiveTab] = useState<"search" | "advisor">("search");

  const handleSearch = async (q: string) => {
    setLoading(true);
    setSearched(true);
    setQuery(q);
    setCaseTypeFilter("All Types");
    setVerdictFilter("All");
    setCourtFilter("All Courts");
    try {
      const res = await fetch("http://127.0.0.1:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
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
    const matchCourt = courtFilter === "All Courts" || r.court === courtFilter;
    return matchType && matchVerdict && matchCourt;
  });

  const courtOptions = ["All Courts", ...Array.from(new Set(results.map((r) => r.court)))];
  const caseTypeOptions = ["All Types", ...Array.from(new Set(results.map((r) => r.case_type)))];

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "search"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            🔍 Case Search
          </button>
          <button
            onClick={() => setActiveTab("advisor")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "advisor"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            ⚖️ Legal Advisor
          </button>
        </div>

        {activeTab === "search" && (
          <>
            <SearchForm onSearch={handleSearch} loading={loading} />
            {searched && !loading && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    className="text-sm rounded-md border border-border bg-background text-foreground px-3 py-1.5"
                    value={caseTypeFilter}
                    onChange={(e) => setCaseTypeFilter(e.target.value)}
                  >
                    {caseTypeOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <select
                    className="text-sm rounded-md border border-border bg-background text-foreground px-3 py-1.5"
                    value={courtFilter}
                    onChange={(e) => setCourtFilter(e.target.value)}
                  >
                    {courtOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  {["All", "Convicted", "Acquitted", "Appeal Allowed", "Dismissed"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVerdictFilter(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        verdictFilter === v
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
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
                  <ResultCard key={i} result={r} query={query} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "advisor" && <LegalAdvisor />}
      </main>
    </div>
  );
};

export default Index;