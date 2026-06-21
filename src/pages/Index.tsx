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
  const [searchTrigger, setSearchTrigger] = useState("");

  const handleSearch = async (q: string) => {
    setLoading(true);
    setSearched(true);
    setQuery(q);
    setCaseTypeFilter("All Types");
    setVerdictFilter("All");
    setCourtFilter("All Courts");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}`/search", {
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

  const handleIpcClick = (ipc: string) => {
    setActiveTab("search");
    setSearchTrigger(ipc);
    handleSearch(ipc);
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

      {/* Tab Bar */}
      <div className="border-b border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 pt-3">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-5 py-2.5 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === "search"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            ⚖ Case Search
          </button>
          <button
            onClick={() => setActiveTab("advisor")}
            className={`px-5 py-2.5 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === "advisor"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🏛 Legal Advisor
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "search" && (
          <>
            {!searched && (
              <div className="flex items-start gap-4 mb-8 p-5 rounded-lg border border-primary/20 bg-card/60">
                <div className="w-12 h-12 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center flex-shrink-0 text-xl">
                  ⚖️
                </div>
                <div>
                  <p className="text-primary text-sm font-medium mb-1"
                     style={{ fontFamily: "'Cinzel', serif" }}>
                    Adv. Nyay — Your Legal Assistant
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed font-legal">
                    Namaste! Describe your legal situation below and I will search through{" "}
                    <span className="text-foreground font-medium">9,904 Indian court judgments</span>{" "}
                    to find the most relevant cases. You may also consult me directly in the Legal Advisor tab.
                  </p>
                </div>
              </div>
            )}

            <SearchForm onSearch={handleSearch} loading={loading} externalQuery={searchTrigger} />

            {searched && !loading && (
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground tracking-widest uppercase mr-1">Verdict</span>
                  {["All", "Convicted", "Acquitted", "Appeal Allowed", "Dismissed"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVerdictFilter(v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        verdictFilter === v
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  <div className="ml-auto flex gap-2">
                    <select
                      className="text-xs rounded border border-border bg-card text-muted-foreground px-3 py-1.5"
                      value={caseTypeFilter}
                      onChange={(e) => setCaseTypeFilter(e.target.value)}
                    >
                      {caseTypeOptions.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <select
                      className="text-xs rounded border border-border bg-card text-muted-foreground px-3 py-1.5"
                      value={courtFilter}
                      onChange={(e) => setCourtFilter(e.target.value)}
                    >
                      {courtOptions.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-medium">{filteredResults.length}</span> judgments found
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-3 mt-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm tracking-wide">Searching judgments...</p>
              </div>
            )}

            {!loading && searched && filteredResults.length === 0 && (
              <p className="text-center text-muted-foreground mt-20">No judgments found.</p>
            )}

            {!loading && filteredResults.length > 0 && (
              <div className="mt-6 space-y-4">
                {filteredResults.map((r, i) => (
                  <ResultCard key={i} result={r} query={query} index={i} onIpcClick={handleIpcClick} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "advisor" && <LegalAdvisor />}
      </main>

      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground tracking-wide">
            © 2026 Nyay Khoj — For informational purposes only
          </p>
          <p className="text-xs text-primary/50 tracking-widest uppercase"
             style={{ fontFamily: "'Cinzel', serif" }}>
            Satyameva Jayate
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
