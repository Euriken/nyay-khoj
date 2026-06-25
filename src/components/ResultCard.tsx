import { ExternalLink, ChevronDown, ChevronUp, Sparkles, Share2, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const API_BASE = import.meta.env.DEV ? "http://localhost:5001" : "https://euriken-nyay-khoj.hf.space";

interface CaseResult {
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
  summary?: string;
}

export const ResultCard = ({ 
  result, 
  query, 
  index, 
  onIpcClick, 
  onCaseClick,
  isCompared = false,
  onToggleCompare
}: { 
  result: CaseResult; 
  query: string; 
  index: number; 
  onIpcClick?: (ipc: string) => void; 
  onCaseClick?: (id: number, e: React.MouseEvent) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: number) => void;
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const detailUrl = `${window.location.origin}/case/${result.id}`;
    navigator.clipboard.writeText(detailUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const detailUrl = `${window.location.origin}/case/${result.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.title,
          text: `Read this judgment on Nyay Khoj: ${result.title}`,
          url: detailUrl
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      handleCopyLink();
    }
  };

  const fetchExplanation = useCallback(async () => {
    if (explanation) {
      setExpanded(!expanded);
      return;
    }
    setExpanded(true);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          title: result.title,
          text: result.text,
          verdict: result.verdict,
          ipc_sections: result.ipc_sections,
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch {
      setExplanation("Could not load explanation.");
    } finally {
      setLoading(false);
    }
  }, [explanation, expanded, query, result.title, result.text, result.verdict, result.ipc_sections]);

  const similarity = result.similarity > 1 
  ? Math.round(result.similarity * 100) 
  : Math.round(result.similarity * 10000) / 100;

  const getHighlightedSnippet = (text: string, query: string) => {
    if (!text) return null;
    if (!query || !query.trim()) return <span>{text.slice(0, 280)}...</span>;

    const stopWords = new Set(["and", "the", "for", "with", "under", "section", "sec", "in", "of", "to", "a", "an", "is", "on", "or", "by"]);
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.replace(/[^a-z0-9]/g, ""))
      .filter(t => t.length > 2 && !stopWords.has(t));

    const searchPatterns = terms.length > 0 ? terms : [query.toLowerCase()];

    let matchIndex = -1;
    let matchedLength = 0;
    
    for (const pattern of searchPatterns) {
      const idx = text.toLowerCase().indexOf(pattern);
      if (idx !== -1) {
        matchIndex = idx;
        matchedLength = pattern.length;
        break;
      }
    }

    let snippet = "";
    let startIdx = 0;
    
    if (matchIndex !== -1) {
      startIdx = Math.max(0, matchIndex - 100);
      let endIdx = Math.min(text.length, matchIndex + matchedLength + 180);
      
      if (startIdx > 0) {
        const nextSpace = text.indexOf(" ", startIdx);
        if (nextSpace !== -1 && nextSpace < matchIndex) {
          startIdx = nextSpace + 1;
        }
      }
      if (endIdx < text.length) {
        const prevSpace = text.lastIndexOf(" ", endIdx);
        if (prevSpace !== -1 && prevSpace > matchIndex) {
          endIdx = prevSpace;
        }
      }
      
      snippet = (startIdx > 0 ? "... " : "") + text.slice(startIdx, endIdx) + (endIdx < text.length ? " ..." : "");
    } else {
      snippet = text.slice(0, 280) + (text.length > 280 ? " ..." : "");
    }

    try {
      const escapedPatterns = searchPatterns
        .map(p => p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .filter(p => p.length > 0);
        
      if (escapedPatterns.length === 0) {
        return <span>{snippet}</span>;
      }

      const regex = new RegExp(`\\b(${escapedPatterns.join("|")})\\b`, "gi");
      const parts = snippet.split(regex);
      
      return (
        <span>
          {parts.map((part, i) => {
            const isMatch = searchPatterns.includes(part.toLowerCase().replace(/[^a-z0-9]/g, ""));
            return isMatch ? (
              <mark key={i} className="bg-yellow-500/20 dark:bg-yellow-500/10 text-foreground px-1 py-0.5 rounded font-semibold border-b border-yellow-500/40">
                {part}
              </mark>
            ) : (
              part
            );
          })}
        </span>
      );
    } catch (e) {
      return <span>{snippet}</span>;
    }
  };

  const verdictStyle = () => {
    if (result.verdict === "Convicted") return "bg-red-500/10 text-red-400 border-red-500/25";
    if (result.verdict === "Acquitted") return "bg-green-500/10 text-green-400 border-green-500/25";
    if (result.verdict === "Appeal Allowed") return "bg-blue-500/10 text-blue-400 border-blue-500/25";
    return "bg-primary/10 text-primary border-primary/25";
  };

  return (
    <div className="rounded-lg border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium">
            {index + 1}
          </span>
          <Link
            to={`/case/${result.id}`}
            onClick={(e) => onCaseClick && onCaseClick(result.id, e)}
            className="font-medium text-foreground leading-snug text-sm flex-1 hover:text-primary transition-colors"
            style={{ fontFamily: "'EB Garamond', serif", fontSize: "15px" }}
          >
            {result.title}
          </Link>
          {result.similarity < 0.1 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-secondary text-secondary-foreground border border-border flex-shrink-0 select-none shadow-sm"
                  title="This case matched search terms via text/keyword search.">
              Keyword Match
            </span>
          ) : (
            <span className="text-primary font-semibold text-sm flex-shrink-0">
              {similarity > 1 ? `${Math.round(similarity)}%` : `${similarity.toFixed(1)}%`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pl-9">
          <span className="px-2.5 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/25">
            {result.court}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
            {result.case_type}
          </span>
          {result.year && (
            <span className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
              Year: {result.year}
            </span>
          )}
          {result.verdict && result.verdict !== "See Judgment" && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs border ${verdictStyle()}`}>
              {result.verdict}
            </span>
          )}
          {result.ipc_sections && (
            <span
              onClick={() => onIpcClick?.(result.ipc_sections!)}
              className="px-2.5 py-0.5 rounded-full text-xs border bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/25 cursor-pointer hover:bg-amber-500/20 transition-colors"
              title="Click to search cases with this IPC section"
            >
              IPC: {result.ipc_sections}
            </span>
          )}
          {result.bns_sections && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs border bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/25"
              title="Bharatiya Nyaya Sanhita equivalent"
            >
              BNS: {result.bns_sections}
            </span>
          )}
          {result.sentence_range && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs border bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/25"
              title="Sentence range details"
            >
              ⚖ {result.sentence_range}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed pl-9 font-legal">
          {query.trim() && result.text ? (
            getHighlightedSnippet(result.text, query)
          ) : (
            <span>{result.summary ? result.summary : (result.text ? result.text.slice(0, 280) + "…" : "")}</span>
          )}
        </div>

        {/* Lazy AI Explanation — collapsed by default */}
        <button
          onClick={fetchExplanation}
          className="ml-9 flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors group"
        >
          <Sparkles className="h-3 w-3" />
          <span className="font-medium tracking-wide uppercase text-[10px]">
            {expanded ? "Hide AI explanation" : "Why this judgment matches"}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {expanded && (
          <div className="ml-9 p-3 rounded-md bg-primary/5 border border-primary/15 animate-in slide-in-from-top-1 duration-200">
            {loading ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-2.5 bg-primary/15 rounded w-full" />
                <div className="h-2.5 bg-primary/15 rounded w-4/5" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed font-legal">{explanation}</p>
            )}
          </div>
        )}

        <div className="pl-9 flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3">
            {result.url ? (
              <a href={result.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                View on Indian Kanoon
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : <span />}
            <Link
              to={`/case/${result.id}`}
              onClick={(e) => onCaseClick && onCaseClick(result.id, e)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mr-1"
            >
              Full Detail →
            </Link>
            {onToggleCompare && (
              <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none border-l border-border/60 pl-3 mr-1">
                <input
                  type="checkbox"
                  checked={isCompared}
                  onChange={() => onToggleCompare(result.id)}
                  className="rounded border-border bg-background text-primary focus:ring-primary h-3.5 w-3.5 accent-primary"
                />
                <span>Compare</span>
              </label>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              title="Share judgment link"
            >
              <Share2 className="h-3 w-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              title="Copy judgment link"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="hidden sm:inline text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
            {result.court}
          </span>
        </div>
      </div>
    </div>
  );
};
