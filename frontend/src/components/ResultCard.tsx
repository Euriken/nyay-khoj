import { ExternalLink, ChevronDown, ChevronUp, Sparkles, Share2, Copy, Check, MessageSquare } from "lucide-react";
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
  onToggleCompare,
  onAskAdvisor,
}: { 
  result: CaseResult; 
  query: string; 
  index: number; 
  onIpcClick?: (ipc: string) => void; 
  onCaseClick?: (id: number, e: React.MouseEvent) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: number) => void;
  onAskAdvisor?: (contextMessage: string) => void;
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
    if (!query || !query.trim()) return <span>{text.slice(0, 240)}...</span>;

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
      snippet = text.slice(0, 240) + (text.length > 240 ? " ..." : "");
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
              <mark 
                key={i} 
                className="px-1 py-0.5 rounded font-semibold border-b border-register-accent/30"
                style={{ backgroundColor: "var(--register-highlight-bg)", color: "var(--register-highlight-text)" }}
              >
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

  // Compile metadata parameters to be joined by middots
  const metadataParts = [
    result.court,
    result.case_type,
    result.year ? `YEAR: ${result.year}` : null,
    result.ipc_sections ? `IPC: ${result.ipc_sections}` : null,
    result.bns_sections ? `BNS: ${result.bns_sections}` : null,
    result.sentence_range ? `SENTENCE: ${result.sentence_range}` : null,
    similarity > 0 ? (result.similarity < 0.1 ? "KEYWORD MATCH" : `${similarity.toFixed(1)}% RELEVANCE`) : null
  ].filter(Boolean);

  const verdictLabel = result.verdict && result.verdict !== "See Judgment" ? result.verdict : "JUDGMENT";

  return (
    <div className="border border-register-border bg-register-bg hover:border-register-accent/40 transition-colors overflow-hidden rounded shadow-sm">
      <div className="p-5 flex gap-4 items-start">
        
        {/* Left Column: Numbered ledger row index */}
        <div className="font-registerMono text-register-muted text-[12px] select-none w-8 flex-shrink-0 text-right pr-2 border-r border-register-divider mt-1">
          {String(index + 1).padStart(3, '0')}
        </div>

        {/* Center Column: Main content area */}
        <div className="flex-1 min-w-0 space-y-3">
          
          {/* Case Title */}
          <Link
            to={`/case/${result.id}`}
            onClick={(e) => onCaseClick && onCaseClick(result.id, e)}
            className="block font-registerSerif font-medium text-register-title text-base leading-snug hover:text-register-accent transition-colors"
          >
            {result.title}
          </Link>

          {/* Metadata line with middot separators */}
          <div className="font-registerMono text-[10px] tracking-wider text-register-muted uppercase select-none flex flex-wrap gap-x-2 gap-y-1">
            {metadataParts.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-register-muted/50">•</span>}
                {part}
              </span>
            ))}
          </div>

          {/* Quoted excerpt in italic serif */}
          <div className="italic font-registerSerif text-register-body text-[13px] leading-relaxed pl-4 border-l-2 border-register-divider py-0.5">
            {query.trim() && result.text ? (
              getHighlightedSnippet(result.text, query)
            ) : (
              <span>{result.summary ? result.summary : (result.text ? result.text.slice(0, 240) + "…" : "")}</span>
            )}
          </div>

          {/* Clickable Quick Tags / Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {result.ipc_sections && (
              <span
                onClick={() => onIpcClick?.(result.ipc_sections!)}
                className="font-registerMono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-register-border bg-register-bg text-register-muted cursor-pointer hover:border-register-accent hover:text-register-accent transition-colors"
                title="Click to search cases with this IPC section"
              >
                IPC: {result.ipc_sections}
              </span>
            )}
            {result.bns_sections && (
              <span
                className="font-registerMono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-register-border bg-register-bg text-register-muted"
                title="Bharatiya Nyaya Sanhita equivalent"
              >
                BNS: {result.bns_sections}
              </span>
            )}
          </div>

          {/* Interactive AI Triggers */}
          <div className="flex flex-wrap gap-4 pt-1 items-center">
            
            {/* Lazy AI Explanation Trigger */}
            <button
              onClick={fetchExplanation}
              className="flex items-center gap-1.5 text-register-muted hover:text-register-accent transition-colors group"
            >
              <Sparkles className="h-3.5 w-3.5 text-register-accent/70 group-hover:text-register-accent" />
              <span className="font-registerMono font-medium tracking-wider uppercase text-[9px]">
                {expanded ? "Hide AI explanation" : "Why this judgment matches"}
              </span>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {/* Ask Advisor Button */}
            {onAskAdvisor && (
              <button
                onClick={() => {
                  const ctx = [
                    `I need advice about this case: ${result.title}`,
                    `Court: ${result.court} | Type: ${result.case_type}${ result.year ? ` | Year: ${result.year}` : ""}`,
                    result.verdict && result.verdict !== "See Judgment" ? `Verdict: ${result.verdict}` : null,
                    result.ipc_sections ? `IPC Sections: ${result.ipc_sections}` : null,
                    result.bns_sections ? `BNS Equivalent: ${result.bns_sections}` : null,
                    result.sentence_range ? `Sentence range: ${result.sentence_range}` : null,
                    `\nCase snippet: "${result.text?.slice(0, 300)}..."`,
                    `\nWhat are the key legal implications and what should a person do if they face a similar situation?`,
                  ].filter(Boolean).join("\n");
                  onAskAdvisor(ctx);
                }}
                className="flex items-center gap-1.5 text-register-muted hover:text-register-accent transition-colors group"
              >
                <MessageSquare className="h-3.5 w-3.5 text-register-accent/70 group-hover:text-register-accent" />
                <span className="font-registerMono font-medium tracking-wider uppercase text-[9px]">Ask Legal Advisor</span>
              </button>
            )}
          </div>

          {/* Expanded AI Explanation Content */}
          {expanded && (
            <div className="p-3 rounded bg-register-accent/5 border border-register-border animate-in slide-in-from-top-1 duration-200">
              {loading ? (
                <div className="space-y-1.5 animate-pulse">
                  <div className="h-2.5 bg-register-muted/20 rounded w-full" />
                  <div className="h-2.5 bg-register-muted/20 rounded w-4/5" />
                </div>
              ) : (
                <p className="text-xs text-register-body leading-relaxed font-registerSerif">{explanation}</p>
              )}
            </div>
          )}

          {/* Footer actions divider line */}
          <div className="pt-2.5 flex flex-wrap items-center justify-between border-t border-register-divider gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {result.url && (
                <a href={result.url} target="_blank" rel="noopener noreferrer"
                  className="font-registerMono text-[9px] uppercase tracking-wider text-register-accent hover:underline flex items-center gap-1">
                  Indian Kanoon
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              <Link
                to={`/case/${result.id}`}
                onClick={(e) => onCaseClick && onCaseClick(result.id, e)}
                className="font-registerMono text-[9px] uppercase tracking-wider text-register-muted hover:text-register-accent transition-colors"
              >
                Full Detail →
              </Link>
              {onToggleCompare && (
                <label className="font-registerMono text-[9px] uppercase tracking-wider text-register-muted hover:text-register-accent transition-colors cursor-pointer select-none flex items-center gap-1.5 border-l border-register-divider pl-3">
                  <input
                    type="checkbox"
                    checked={isCompared}
                    onChange={() => onToggleCompare(result.id)}
                    className="rounded border-register-border bg-register-bg text-register-accent focus:ring-register-accent h-3 w-3 accent-register-accent"
                  />
                  <span>Compare</span>
                </label>
              )}
              <button
                onClick={handleShare}
                className="font-registerMono text-[9px] uppercase tracking-wider text-register-muted hover:text-register-accent transition-colors flex items-center gap-1 border-l border-register-divider pl-3"
                title="Share judgment link"
              >
                <Share2 className="h-2.5 w-2.5" />
                <span>Share</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="font-registerMono text-[9px] uppercase tracking-wider text-register-muted hover:text-register-accent transition-colors flex items-center gap-1"
                title="Copy judgment link"
              >
                {copied ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <span className="font-registerMono text-[8px] text-register-muted tracking-wider uppercase select-none">
              ID: #{result.id}
            </span>
          </div>

        </div>

        {/* Right Column: Verdict "stamp" */}
        <div className="flex-shrink-0 pl-1 self-start pt-1 hidden sm:block">
          <div 
            className="flex items-center justify-center w-16 h-16 rounded-full border-[1.5px] border-dashed border-register-stamp text-register-stamp p-2 select-none"
            style={{ transform: "rotate(-9deg)" }}
          >
            <span className="font-registerMono text-[8px] font-semibold tracking-wider uppercase text-center leading-tight">
              {verdictLabel}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
