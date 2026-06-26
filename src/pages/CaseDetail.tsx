import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { ArrowLeft, ExternalLink, Loader2, Scale, Sparkles, Printer, Share2 } from "lucide-react";

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

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [related, setRelated] = useState<RelatedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: caseData?.title, url }); } catch (_) { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            navigate(`/?q=${sectionNum}`);
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

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/case/${id}`);
        if (!res.ok) throw new Error("Case not found");
        const data = await res.json();
        setCaseData(data);

        // Fetch related in parallel
        const relRes = await fetch(`${API_BASE}/related/${id}`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelated(relData);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load case");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCase();
  }, [id]);

  const verdictColor = (verdict: string | undefined) => {
    if (verdict === "Convicted") return "bg-red-500/10 text-red-400 border-red-500/25";
    if (verdict === "Acquitted") return "bg-green-500/10 text-green-400 border-green-500/25";
    if (verdict === "Appeal Allowed") return "bg-blue-500/10 text-blue-400 border-blue-500/25";
    return "bg-primary/10 text-primary border-primary/25";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="flex flex-col items-center justify-center mt-32 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading judgment...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-background">
        <SearchHeader />
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-destructive text-lg mb-4">{error || "Case not found"}</p>
          <Link to="/" className="text-primary hover:underline text-sm">← Back to Search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back button — returns to previous results page */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </button>

        {/* Case Header */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-primary via-primary/40 to-transparent" />
          <div className="p-6 space-y-4">
            <h1 className="text-xl font-semibold text-foreground leading-snug"
                style={{ fontFamily: "'EB Garamond', serif" }}>
              {caseData.title}
            </h1>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs border bg-primary/10 text-primary border-primary/25 font-medium">
                {caseData.court}
              </span>
              <span className="px-3 py-1 rounded-full text-xs border border-border text-muted-foreground">
                {caseData.case_type}
              </span>
              {caseData.year && (
                <span className="px-3 py-1 rounded-full text-xs border border-border text-muted-foreground">
                  Year: {caseData.year}
                </span>
              )}
              {caseData.verdict && caseData.verdict !== "See Judgment" && (
                <span className={`px-3 py-1 rounded-full text-xs border font-medium ${verdictColor(caseData.verdict)}`}>
                  {caseData.verdict}
                </span>
              )}
              {caseData.ipc_sections && (
                <span className="px-3 py-1 rounded-full text-xs border bg-amber-500/10 text-amber-500 border-amber-500/25">
                  IPC: {caseData.ipc_sections}
                </span>
              )}
              {caseData.bns_sections && (
                <span className="px-3 py-1 rounded-full text-xs border bg-teal-500/10 text-teal-500 border-teal-500/25">
                  BNS: {caseData.bns_sections}
                </span>
              )}
              {caseData.sentence_range && (
                <span className="px-3 py-1 rounded-full text-xs border bg-orange-500/10 text-orange-500 border-orange-500/25">
                  ⚖ {caseData.sentence_range}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2">
              {caseData.url && (
                <a href={caseData.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  View on Indian Kanoon
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copied ? "Link Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {caseData.summary && (
          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary tracking-widest uppercase">AI Case Summary</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-legal">
              {caseData.summary}
            </p>
          </div>
        )}

        {/* Full Judgment Text */}
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-primary tracking-widest uppercase">Judgment Text</h2>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-sm text-muted-foreground leading-relaxed font-legal whitespace-pre-wrap">
              {renderInteractiveText(caseData.text)}
            </p>
          </div>
        </div>

        {/* Related Cases */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
              Related Judgments
            </h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/case/${r.id}`}
                  className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug font-legal">{r.title}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] border bg-primary/10 text-primary border-primary/25">{r.court}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground">{r.case_type}</span>
                        {r.year && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground">Year: {r.year}</span>
                        )}
                        {r.verdict && r.verdict !== "See Judgment" && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${verdictColor(r.verdict)}`}>{r.verdict}</span>
                        )}
                        {r.ipc_sections && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] border bg-amber-500/10 text-amber-500 border-amber-500/25">IPC: {r.ipc_sections}</span>
                        )}
                        {r.bns_sections && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] border bg-teal-500/10 text-teal-500 border-teal-500/25">BNS: {r.bns_sections}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-primary font-semibold text-xs flex-shrink-0">
                      {Math.round(r.similarity * 100)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

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

export default CaseDetail;
