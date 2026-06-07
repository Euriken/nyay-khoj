import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface CaseResult {
  title: string;
  court: string;
  case_type: string;
  url: string;
  text: string;
  similarity: number;
  ipc_sections?: string;
  verdict?: string;
  explanation?: string;
}

export const ResultCard = ({ result }: { result: CaseResult }) => {
  const similarity = Math.round(result.similarity * 100);

  const verdictColor = () => {
    if (result.verdict === "Convicted") return "bg-red-500/15 text-red-400 border-red-500/30";
    if (result.verdict === "Acquitted") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (result.verdict === "Appeal Allowed") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors">
      <h2 className="font-semibold text-lg text-foreground leading-snug">
        {result.title}
      </h2>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">{result.court}</Badge>
        <Badge variant="outline" className="text-xs">{result.case_type}</Badge>
        <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
          {similarity}% match
        </Badge>
        {result.verdict && result.verdict !== "See Judgment" && (
          <Badge className={"text-xs border " + verdictColor()}>
            {result.verdict}
          </Badge>
        )}
        {result.ipc_sections && (
          <Badge className="text-xs bg-purple-500/15 text-purple-400 border-purple-500/30">
            IPC: {result.ipc_sections}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {result.text ? result.text.slice(0, 300) + "..." : ""}
      </p>
      {result.explanation && (
        <div className="mt-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <p className="text-xs font-medium text-primary mb-1">🤖 AI Explanation</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
        </div>
      )}
      {result.url && (
        <a href={result.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          View Full Judgment
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
};