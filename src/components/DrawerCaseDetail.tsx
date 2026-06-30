import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Scale, Sparkles, Printer } from "lucide-react";

const API_BASE = import.meta.env.DEV ? "http://localhost:5001" : "https://euriken-nyay-khoj.hf.space";

interface CaseData {
  id: number;
  title: string;
  court: string;
  case_type: string;
  url: string;
  text: string;
  ipc_sections?: string;
  verdict?: string;
  bns_sections?: string;
  sentence_range?: string;
  year?: number;
  summary?: string;
}

interface RelatedCase {
  id: number;
  title: string;
  court: string;
  case_type: string;
  verdict?: string;
  similarity: number;
  ipc_sections?: string;
  bns_sections?: string;
  sentence_range?: string;
  year?: number;
  summary?: string;
}

interface Props {
  caseId: number;
  onSectionClick: (section: string) => void;
  onRelatedCaseClick: (id: number) => void;
}

export const DrawerCaseDetail = ({ caseId, onSectionClick, onRelatedCaseClick }: Props) => {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [related, setRelated] = useState<RelatedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    if (!caseId) return;

    let slowTimer: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();

    const fetchCase = async () => {
      setLoading(true);
      setError(null);
      setSearchTimedOut(false);
      setSlowWarning(false);

      // Show slow warning after 5 seconds
      slowTimer = setTimeout(() => {
        setSlowWarning(true);
      }, 5000);

      // Abort after 30 seconds
      timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000);

      try {
        const res = await fetch(`${API_BASE}/case/${caseId}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error("Case not found");
        const data = await res.json();
        setCaseData(data);

        // Fetch related in parallel
        try {
          const relRes = await fetch(`${API_BASE}/related/${caseId}`, {
            signal: controller.signal
          });
          if (relRes.ok) {
            const relData = await relRes.json();
            setRelated(relData);
          }
        } catch (relError) {
          console.error("Failed to load related cases", relError);
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          setSearchTimedOut(true);
        } else {
          setError(e.message || "Failed to load case");
        }
      } finally {
        if (slowTimer) clearTimeout(slowTimer);
        if (timeoutId) clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchCase();

    return () => {
      if (slowTimer) clearTimeout(slowTimer);
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, [caseId, retryCount]);

  const renderInteractiveText = (text: string) => {
    if (!text) return null;

    const regex = /\b((?:IPC\s+Section|Section|Sec\.)\s*(\d{3}[A-Za-z]?))\b/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    let matchCount = 0;

    while ((match = regex.exec(text)) !== null && matchCount < 150) {
      const matchIndex = match.index;
      const fullMatchText = match[1];
      const sectionNum = match[2];

      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }

      parts.push(
        <button
          key={`match-${matchCount}`}
          onClick={() => {
            onSectionClick(sectionNum);
          }}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-all font-semibold cursor-pointer mx-0.5 text-xs align-baseline"
          title={`Search cases for Section ${sectionNum}`}
        >
          {fullMatchText}
        </button>
      );

      lastIndex = regex.lastIndex;
      matchCount++;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const verdictColor = (verdict: string | undefined) => {
    if (verdict === "Convicted") return "bg-red-500/10 text-red-400 border-red-500/25";
    if (verdict === "Acquitted") return "bg-green-500/10 text-green-400 border-green-500/25";
    if (verdict === "Appeal Allowed") return "bg-blue-500/10 text-blue-400 border-blue-500/25";
    return "bg-primary/10 text-primary border-primary/25";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-sm mx-auto px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm text-center">Loading judgment...</p>
        {slowWarning && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 animate-in fade-in duration-500">
            <p className="text-xs text-amber-300 text-center leading-relaxed font-legal">
              <span className="font-semibold">Waking up the server…</span> This may take up to a minute as the server is cold-starting.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (error || searchTimedOut || !caseData) {
    return (
      <div className="py-20 px-6 flex flex-col items-center text-center gap-5 max-w-sm mx-auto animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl select-none">
          ⏱
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Failed to load judgment</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {searchTimedOut 
              ? "Failed to load judgment. The server may be starting up."
              : (error || "Failed to load judgment. The server may be starting up.")}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pr-2">
      {/* Case Header Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground leading-snug font-legal">
          {caseData.title}
        </h2>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/25 font-medium">
            {caseData.court}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
            {caseData.case_type}
          </span>
          {caseData.year && (
            <span className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
              Year: {caseData.year}
            </span>
          )}
          {caseData.verdict && caseData.verdict !== "See Judgment" && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${verdictColor(caseData.verdict)}`}>
              {caseData.verdict}
            </span>
          )}
          {caseData.ipc_sections && (
            <span className="px-2.5 py-0.5 rounded-full text-xs border bg-amber-500/10 text-amber-500 border-amber-500/25">
              IPC: {caseData.ipc_sections}
            </span>
          )}
          {caseData.bns_sections && (
            <span className="px-2.5 py-0.5 rounded-full text-xs border bg-teal-500/10 text-teal-500 border-teal-500/25">
              BNS: {caseData.bns_sections}
            </span>
          )}
          {caseData.sentence_range && (
            <span className="px-2.5 py-0.5 rounded-full text-xs border bg-orange-500/10 text-orange-500 border-orange-500/25">
              ⚖ {caseData.sentence_range}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 pt-1">
          {caseData.url && (
            <a href={caseData.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              View on Indian Kanoon
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button
            onClick={() => {
              // Print only the drawer contents
              const printContent = document.getElementById("drawer-print-section");
              if (printContent) {
                const originalContent = document.body.innerHTML;
                document.body.innerHTML = printContent.innerHTML;
                window.print();
                window.location.reload(); // Quick restore
              } else {
                window.print();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Wrapper for Print/PDF */}
      <div id="drawer-print-section" className="space-y-6">
        {/* AI Summary */}
        {caseData.summary && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-primary tracking-widest uppercase">AI Case Summary</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-legal">
              {caseData.summary}
            </p>
          </div>
        )}

        {/* Full Judgment Text */}
        <div className="rounded-lg border border-border bg-card/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-primary tracking-widest uppercase">Judgment Text</h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-legal whitespace-pre-wrap">
              {renderInteractiveText(caseData.text)}
            </p>
          </div>
        </div>
      </div>

      {/* Related Cases */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-primary tracking-widest uppercase">
            Related Judgments
          </h3>
          <div className="space-y-2">
            {related.map((r) => (
              <div
                key={r.id}
                onClick={() => onRelatedCaseClick(r.id)}
                className="block rounded-lg border border-border bg-card p-3 hover:border-primary/45 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground leading-snug font-legal">{r.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] border bg-primary/10 text-primary border-primary/25">{r.court}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] border border-border text-muted-foreground">{r.case_type}</span>
                      {r.year && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] border border-border text-muted-foreground">Year: {r.year}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-primary font-semibold text-[10px] flex-shrink-0">
                    {Math.round(r.similarity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
