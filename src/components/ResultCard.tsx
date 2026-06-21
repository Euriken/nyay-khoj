import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface CaseResult {
  title: string;
  court: string;
  case_type: string;
  url: string;
  text: string;
  similarity: number;
  ipc_sections?: string;
  verdict?: string;
}

export const ResultCard = ({ result, query, index, onIpcClick }: { result: CaseResult; query: string; index: number; onIpcClick?: (ipc: string) => void }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"}`/explain", {
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
    };
    fetchExplanation();
  }, []);

  const similarity = result.similarity > 1 
  ? Math.round(result.similarity * 100) 
  : Math.round(result.similarity * 10000) / 100;

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
          <h2 className="font-medium text-foreground leading-snug text-sm flex-1"
              style={{ fontFamily: "'EB Garamond', serif", fontSize: "15px" }}>
            {result.title}
          </h2>
          <span className="text-primary font-semibold text-sm flex-shrink-0">
          {similarity > 1 ? `${Math.round(similarity)}%` : `${similarity.toFixed(1)}%`}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pl-9">
          <span className="px-2.5 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/25">
            {result.court}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground">
            {result.case_type}
          </span>
          {result.verdict && result.verdict !== "See Judgment" && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs border ${verdictStyle()}`}>
              {result.verdict}
            </span>
          )}
          {result.ipc_sections && (
            <span
              onClick={() => onIpcClick?.(result.ipc_sections!)}
              className="px-2.5 py-0.5 rounded-full text-xs border bg-purple-500/10 text-purple-400 border-purple-500/25 cursor-pointer hover:bg-purple-500/20 transition-colors"
              title="Click to search cases with this IPC section"
            >
              IPC: {result.ipc_sections}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pl-9 font-legal">
          {result.text ? result.text.slice(0, 280) + "…" : ""}
        </p>

        <div className="ml-9 p-3 rounded-md bg-primary/5 border border-primary/15">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-[10px] font-medium text-primary tracking-widest uppercase">
              Why this judgment matches
            </p>
          </div>
          {loading ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-2.5 bg-primary/15 rounded w-full" />
              <div className="h-2.5 bg-primary/15 rounded w-4/5" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed font-legal">{explanation}</p>
          )}
        </div>

        <div className="pl-9 flex items-center justify-between pt-1 border-t border-border/50">
          {result.url ? (
            <a href={result.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              View Full Judgment
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : <span />}
          <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
            {result.court}
          </span>
        </div>
      </div>
    </div>
  );
};
