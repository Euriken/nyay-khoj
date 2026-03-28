import type { CaseResult } from "@/pages/Index";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

export const ResultCard = ({ result }: { result: CaseResult }) => {
  const similarity = Math.round(result.similarity * 100);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors">
      <h2 className="font-display font-semibold text-lg text-foreground leading-snug">
        {result.title}
      </h2>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">{result.court}</Badge>
        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{result.case_type}</Badge>
        <Badge className="text-xs bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
          {similarity}% match
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {result.summary?.slice(0, 500)}
      </p>

      {result.judgment_url && (
        <a
          href={result.judgment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          View Full Judgment
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
};
