import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchHeader } from "@/components/SearchHeader";
import { SearchForm } from "@/components/SearchForm";
import { ResultCard } from "@/components/ResultCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { LegalAdvisor } from "@/components/LegalAdvisor";
import { Loader2, X, Clock, SlidersHorizontal, Scale } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DrawerCaseDetail } from "@/components/DrawerCaseDetail";
import { CaseComparison } from "@/components/CaseComparison";

const API_BASE = import.meta.env.DEV ? "http://localhost:5001" : "https://euriken-nyay-khoj.hf.space";

const COURT_OPTIONS = [
  "All Courts",
  "Supreme Court",
  "High Court",
  "District Court / Tribunals",
  "Delhi High Court",
  "Bombay High Court",
  "Madras High Court",
  "Calcutta High Court",
  "Karnataka High Court",
  "Allahabad High Court",
  "Patna High Court"
];

const CASE_TYPE_OPTIONS = [
  "All Types",
  "Criminal",
  "Constitution",
  "Civil",
  "Land&Property",
  "Tax",
  "Industrial&Labour",
  "Motorvehicles",
  "Financial"
];

export interface CaseResult {
  id: number;
  title: string;
  court: string;
  case_type: string;
  url: string;
  text: string;
  similarity: number;
  ipc_sections?: string;
  verdict?: string;
  bns_sections?: string;
  sentence_range?: string;
  year?: number;
}

const HISTORY_KEY = "nyaykhoj_search_history";
const MAX_HISTORY = 10;

function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function addToHistory(query: string) {
  const history = getSearchHistory().filter(h => h !== query);
  history.unshift(query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<CaseResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [query, setQuery] = useState("");
  const [caseTypeFilter, setCaseTypeFilter] = useState("All Types");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [courtFilter, setCourtFilter] = useState("All Courts");
  const [activeTab, setActiveTab] = useState<"search" | "advisor">("search");
  const [searchTrigger, setSearchTrigger] = useState("");
  const [history, setHistory] = useState<string[]>(getSearchHistory());
  const [yearFrom, setYearFrom] = useState<number | "">("");
  const [yearTo, setYearTo] = useState<number | "">("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comparedCases, setComparedCases] = useState<CaseResult[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const handleCaseClick = useCallback((id: number, e?: React.MouseEvent) => {
    if (e) {
      if (window.innerWidth >= 768) {
        e.preventDefault();
        setSelectedCaseId(id);
        setIsDrawerOpen(true);
      }
    } else {
      setSelectedCaseId(id);
      setIsDrawerOpen(true);
    }
  }, []);

  const handleToggleCompare = useCallback((id: number) => {
    setComparedCases(prev => {
      const exists = prev.some(c => c.id === id);
      if (exists) {
        return prev.filter(c => c.id !== id);
      } else {
        const caseObj = results.find(r => r.id === id);
        if (caseObj) {
          return [...prev, caseObj];
        }
        return prev;
      }
    });
  }, [results]);

  const handleRemoveCompared = useCallback((id: number) => {
    setComparedCases(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleClearCompared = useCallback(() => {
    setComparedCases([]);
  }, []);

  const handleSearch = useCallback(async (
    q: string, 
    page = 1, 
    append = false, 
    overrideYf?: number | "", 
    overrideYt?: number | "",
    overrideVerdict?: string,
    overrideType?: string,
    overrideCourt?: string
  ) => {
    const currentYf = overrideYf !== undefined ? overrideYf : yearFrom;
    const currentYt = overrideYt !== undefined ? overrideYt : yearTo;
    const currentVerdict = overrideVerdict !== undefined ? overrideVerdict : verdictFilter;
    const currentType = overrideType !== undefined ? overrideType : caseTypeFilter;
    const currentCourt = overrideCourt !== undefined ? overrideCourt : courtFilter;

    if (!append) {
      setLoading(true);
      setSearched(true);
      setQuery(q);
      setCurrentPage(1);
      
      const newParams: any = { q };
      if (currentYf !== "") newParams.yf = currentYf.toString();
      if (currentYt !== "") newParams.yt = currentYt.toString();
      if (currentVerdict !== "All") newParams.v = currentVerdict;
      if (currentType !== "All Types") newParams.t = currentType;
      if (currentCourt !== "All Courts") newParams.c = currentCourt;
      setSearchParams(newParams);
      
      addToHistory(q);
      setHistory(getSearchHistory());
    } else {
      setLoadingMore(true);
    }
    try {
      const body: any = { query: q, page, per_page: 10 };
      if (currentYf !== "") body.year_from = currentYf;
      if (currentYt !== "") body.year_to = currentYt;
      if (currentVerdict !== "All") body.verdict = currentVerdict;
      if (currentType !== "All Types") body.case_type = currentType;
      if (currentCourt !== "All Courts") body.court = currentCourt;

      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!Array.isArray(data) && data.error) throw new Error(data.error);
      // Normalize: backend may return a flat array OR {results, total}
      const pageResults: CaseResult[] = Array.isArray(data) ? data : (data.results ?? []);
      const pageTotal: number = Array.isArray(data) ? data.length : (data.total ?? data.length ?? 0);
      if (append) {
        setResults(prev => [...prev, ...pageResults]);
      } else {
        setResults(pageResults);
      }
      setTotalResults(pageTotal);
      setCurrentPage(page);
    } catch (e) {
      if (!append) setResults([]);
      toast.error("Search failed", { description: "Could not connect to the server. Please try again." });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [setSearchParams, yearFrom, yearTo, verdictFilter, caseTypeFilter, courtFilter]);

  // Load from URL params on mount
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const urlYf = searchParams.get("yf");
    const urlYt = searchParams.get("yt");
    const urlV = searchParams.get("v");
    const urlT = searchParams.get("t");
    const urlC = searchParams.get("c");
    
    let yfVal: number | "" = "";
    let ytVal: number | "" = "";
    let vVal = "All";
    let tVal = "All Types";
    let cVal = "All Courts";
    
    if (urlYf) {
      yfVal = Number(urlYf);
      setYearFrom(yfVal);
    }
    if (urlYt) {
      ytVal = Number(urlYt);
      setYearTo(ytVal);
    }
    if (urlV) {
      vVal = urlV;
      setVerdictFilter(vVal);
    }
    if (urlT) {
      tVal = urlT;
      setCaseTypeFilter(tVal);
    }
    if (urlC) {
      cVal = urlC;
      setCourtFilter(cVal);
    }
    
    if (urlQuery) {
      setSearchTrigger(urlQuery);
      handleSearch(urlQuery, 1, false, yfVal, ytVal, vVal, tVal, cVal);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIpcClick = (ipc: string) => {
    setActiveTab("search");
    setSearchTrigger(ipc);
    handleSearch(ipc);
  };

  const handleLoadMore = () => {
    handleSearch(query, currentPage + 1, true);
  };

  const hasMore = (results?.length ?? 0) < totalResults;

  const handleVerdictChange = (v: string) => {
    setVerdictFilter(v);
    handleSearch(query, 1, false, undefined, undefined, v);
  };
  
  const handleCaseTypeChange = (t: string) => {
    setCaseTypeFilter(t);
    handleSearch(query, 1, false, undefined, undefined, undefined, t);
  };
  
  const handleCourtChange = (c: string) => {
    setCourtFilter(c);
    handleSearch(query, 1, false, undefined, undefined, undefined, undefined, c);
  };

  const handleResetFilters = () => {
    setYearFrom("");
    setYearTo("");
    setVerdictFilter("All");
    setCaseTypeFilter("All Types");
    setCourtFilter("All Courts");
    handleSearch(query, 1, false, "", "", "All", "All Types", "All Courts");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (yearFrom !== "") count++;
    if (yearTo !== "") count++;
    if (verdictFilter !== "All") count++;
    if (caseTypeFilter !== "All Types") count++;
    if (courtFilter !== "All Courts") count++;
    return count;
  };

  const handleExportCSV = () => {
    if ((results?.length ?? 0) === 0) return;
    
    const headers = ["Title", "Court", "Case Type", "Verdict", "Year", "IPC Sections", "BNS Sections", "Sentence Range", "URL"];
    const rows = results.map(r => [
      r.title,
      r.court,
      r.case_type,
      r.verdict || "",
      r.year ? r.year.toString() : "",
      r.ipc_sections || "",
      r.bns_sections || "",
      r.sentence_range || "",
      r.url || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nyay_khoj_results_${query.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Results exported to CSV!");
  };

  const filteredResults = results;

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      {/* Tab Bar - Hidden on desktop (lg) since search and advisor are visible side-by-side */}
      <div className="border-b border-border bg-card/40 lg:hidden">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pt-3">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Case Search */}
          <div className={`${activeTab === "search" ? "block" : "hidden"} lg:block lg:col-span-7 xl:col-span-8 space-y-6`}>
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
                    <span className="text-foreground font-medium">37,484 Indian court judgments</span>{" "}
                    to find the most relevant cases. You may also consult me directly in the Legal Advisor tab.
                  </p>
                </div>
              </div>
            )}

            <SearchForm onSearch={handleSearch} loading={loading} externalQuery={searchTrigger} />

            {/* Search History */}
            {!searched && (history?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {history.slice(0, 5).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setSearchTrigger(h); handleSearch(h); }}
                    className="px-3 py-1 rounded-full text-xs border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors truncate max-w-[200px]"
                  >
                    {h}
                  </button>
                ))}
                <button
                  onClick={() => { clearHistory(); setHistory([]); }}
                  className="px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  title="Clear search history"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {searched && !loading && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:border-primary/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Advanced Filters</span>
                    {getActiveFilterCount() > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>
                  
                  {getActiveFilterCount() > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-primary/75 hover:text-primary hover:underline transition-colors font-medium"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>

                {filtersOpen && (
                  <div className="p-5 rounded-xl border border-primary/20 bg-card/60 backdrop-blur-md shadow-lg space-y-4 animate-in slide-in-from-top-3 duration-250 ease-out">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Court & Case Type selects */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary tracking-widest uppercase font-semibold">Court</label>
                        <select
                          className="w-full text-xs rounded-lg border border-primary/15 bg-background/50 text-muted-foreground px-3 py-2 outline-none hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                          value={courtFilter}
                          onChange={(e) => handleCourtChange(e.target.value)}
                        >
                          {COURT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary tracking-widest uppercase font-semibold">Case Type</label>
                        <select
                          className="w-full text-xs rounded-lg border border-primary/15 bg-background/50 text-muted-foreground px-3 py-2 outline-none hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                          value={caseTypeFilter}
                          onChange={(e) => handleCaseTypeChange(e.target.value)}
                        >
                          {CASE_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Year Range */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary tracking-widest uppercase font-semibold">Year Range</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="From (e.g. 1950)"
                            className="w-full text-xs rounded-lg border border-primary/15 bg-background/50 text-muted-foreground px-3 py-2 outline-none hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                            value={yearFrom}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYearFrom(val === "" ? "" : Number(val));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSearch(query);
                              }
                            }}
                            onBlur={() => handleSearch(query)}
                          />
                          <input
                            type="number"
                            placeholder="To (e.g. 2026)"
                            className="w-full text-xs rounded-lg border border-primary/15 bg-background/50 text-muted-foreground px-3 py-2 outline-none hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                            value={yearTo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYearTo(val === "" ? "" : Number(val));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSearch(query);
                              }
                            }}
                            onBlur={() => handleSearch(query)}
                          />
                        </div>
                      </div>

                      {/* Verdict Buttons */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary tracking-widest uppercase font-semibold">Verdict</label>
                        <div className="flex flex-wrap gap-1.5">
                          {["All", "Convicted", "Acquitted", "Appeal Allowed", "Dismissed"].map((v) => (
                            <button
                              key={v}
                              onClick={() => handleVerdictChange(v)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border ${
                                verdictFilter === v
                                  ? "border-primary text-primary bg-primary/10"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Filter Chips */}
                {getActiveFilterCount() > 0 && (
                  <div className="flex flex-wrap gap-2 items-center pt-1 animate-in fade-in duration-200">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Active Filters:
                    </span>
                    {courtFilter !== "All Courts" && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <span>Court: {courtFilter}</span>
                        <button
                          onClick={() => handleCourtChange("All Courts")}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          title="Remove filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {caseTypeFilter !== "All Types" && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <span>Type: {caseTypeFilter}</span>
                        <button
                          onClick={() => handleCaseTypeChange("All Types")}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          title="Remove filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {verdictFilter !== "All" && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <span>Verdict: {verdictFilter}</span>
                        <button
                          onClick={() => handleVerdictChange("All")}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          title="Remove filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {(yearFrom !== "" || yearTo !== "") && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        <span>
                          Years: {yearFrom !== "" ? yearFrom : "Start"} - {yearTo !== "" ? yearTo : "End"}
                        </span>
                        <button
                          onClick={() => {
                            setYearFrom("");
                            setYearTo("");
                            handleSearch(query, 1, false, "", "", verdictFilter, caseTypeFilter, courtFilter);
                          }}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          title="Remove filter"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-medium">{(filteredResults?.length ?? 0)}</span> of{" "}
                    <span className="text-foreground">{totalResults}</span> judgments shown
                  </p>
                  <button
                    onClick={handleExportCSV}
                    className="text-xs text-primary/75 hover:text-primary hover:underline transition-colors font-medium flex items-center gap-1"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="mt-6 space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {!loading && searched && (filteredResults?.length ?? 0) === 0 && (
              <p className="text-center text-muted-foreground mt-20">No judgments found.</p>
            )}

            {!loading && (filteredResults?.length ?? 0) > 0 && (
              <div className="mt-6 space-y-4">
                {filteredResults.map((r, i) => (
                  <ResultCard 
                    key={r.id || i} 
                    result={r} 
                    query={query} 
                    index={i} 
                    onIpcClick={handleIpcClick} 
                    onCaseClick={handleCaseClick}
                    isCompared={comparedCases.some(c => c.id === r.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${(results?.length ?? 0)} of ${totalResults})`
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: AI Legal Advisor Sidebar */}
          <div className={`${activeTab === "advisor" ? "block" : "hidden"} lg:block lg:col-span-5 xl:col-span-4 sticky top-20`}>
            <LegalAdvisor onIpcClick={handleIpcClick} />
          </div>

        </div>
      </main>

      {/* Case Details Drawer / Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[95vw] sm:w-[85vw] md:w-[70vw] lg:w-[50vw] max-w-[800px] overflow-y-auto bg-background/95 backdrop-blur-md border-border p-6 shadow-2xl">
          <SheetHeader className="border-b border-border pb-4 mb-4">
            <SheetTitle className="text-primary font-display font-bold uppercase tracking-widest text-sm">
              Judgment Details
            </SheetTitle>
          </SheetHeader>
          {selectedCaseId !== null && (
            <DrawerCaseDetail 
              caseId={selectedCaseId} 
              onSectionClick={(sec) => {
                setIsDrawerOpen(false);
                setSearchTrigger(sec);
                handleSearch(sec);
              }}
              onRelatedCaseClick={(id) => {
                setSelectedCaseId(id);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Floating Compare Bar */}
      {(comparedCases?.length ?? 0) > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-4 px-6 py-3.5 rounded-full border border-primary/20 bg-background/90 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/25 text-primary text-xs flex items-center justify-center font-bold">
                {(comparedCases?.length ?? 0)}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {(comparedCases?.length ?? 0) === 1 ? "case selected" : "cases selected"}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-border" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCompareOpen(true)}
                disabled={(comparedCases?.length ?? 0) < 2}
                className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-1.5"
                title={(comparedCases?.length ?? 0) < 2 ? "Select at least 2 cases to compare" : "Open comparison matrix"}
              >
                <Scale className="h-3.5 w-3.5" />
                Compare Now
              </button>
              <button
                onClick={handleClearCompared}
                className="px-3 py-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors uppercase tracking-wider"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Comparison Matrix Dialog */}
      <CaseComparison
        cases={comparedCases}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemoveCase={handleRemoveCompared}
        onCaseClick={(id) => {
          setIsCompareOpen(false);
          handleCaseClick(id);
        }}
      />

      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
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
