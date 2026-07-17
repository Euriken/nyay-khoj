import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, ExternalLink, Scale } from "lucide-react";

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
  summary?: string;
}

interface CaseComparisonProps {
  cases: CaseResult[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveCase: (id: number) => void;
  onCaseClick: (id: number) => void;
}

export const CaseComparison = ({
  cases,
  isOpen,
  onClose,
  onRemoveCase,
  onCaseClick,
}: CaseComparisonProps) => {
  const verdictStyle = (verdict?: string) => {
    if (verdict === "Convicted") return "bg-red-500/10 text-red-400 border-red-500/25";
    if (verdict === "Acquitted") return "bg-green-500/10 text-green-400 border-green-500/25";
    if (verdict === "Appeal Allowed") return "bg-blue-500/10 text-blue-400 border-blue-500/25";
    return "bg-primary/10 text-primary border-primary/25";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-6 bg-background border border-border shadow-2xl backdrop-blur-md">
        <DialogHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-primary font-display font-bold uppercase tracking-widest text-base flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary animate-pulse" />
            Case Comparison Matrix
          </DialogTitle>
          <DialogDescription className="sr-only">
            Compare legal details of selected court judgments
          </DialogDescription>
        </DialogHeader>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm flex-1">
            No cases selected for comparison. Please select at least two cases from the search results.
          </div>
        ) : (
          <div className="flex-1 overflow-auto my-4 border border-border rounded-lg bg-card/40">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40 border-r border-border sticky left-0 bg-background/95 backdrop-blur z-20">
                    Feature
                  </th>
                  {cases.map((c) => (
                    <th key={c.id} className="p-4 border-r border-border last:border-r-0 min-w-[260px] relative group vertical-align-top">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => onCaseClick(c.id)}
                          className="font-medium text-foreground hover:text-primary transition-colors text-sm text-left line-clamp-3 hover:underline"
                          style={{ fontFamily: "'EB Garamond', serif", fontSize: "15px" }}
                        >
                          {c.title}
                        </button>
                        <button
                          onClick={() => onRemoveCase(c.id)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-red-400 p-1 rounded-full hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from comparison"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Court */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Court
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-foreground">
                      <span className="px-2.5 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/25">
                        {c.court}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Case Type */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Case Type
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-muted-foreground">
                      <span className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground bg-background/50">
                        {c.case_type}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Year */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Year
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-foreground">
                      {c.year || "N/A"}
                    </td>
                  ))}
                </tr>

                {/* Verdict */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Verdict
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-foreground">
                      {c.verdict && c.verdict !== "See Judgment" ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs border ${verdictStyle(c.verdict)}`}>
                          {c.verdict}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">See Judgment</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* IPC Sections */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    IPC Sections
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-foreground font-medium">
                      {c.ipc_sections ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25">
                          {c.ipc_sections}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">None cited</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* BNS Sections */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    BNS Sections
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-foreground">
                      {c.bns_sections ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs border bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25 font-medium">
                          {c.bns_sections}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">None mapped</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Sentence Range */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Sentence Range
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-sm text-foreground font-medium">
                      {c.sentence_range ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs border bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25">
                          ⚖ {c.sentence_range}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Summary / Text Snippet */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Summary/Text
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-xs text-muted-foreground font-legal leading-relaxed">
                      <div className="line-clamp-6 hover:line-clamp-none transition-all duration-300 max-h-48 overflow-y-auto">
                        {c.summary || (c.text ? c.text.slice(0, 450) + "..." : "No description available.")}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* External Link */}
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border bg-card/60 sticky left-0 z-10">
                    Source Link
                  </td>
                  {cases.map((c) => (
                    <td key={c.id} className="p-4 border-r border-border last:border-r-0 text-xs text-foreground">
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          Indian Kanoon
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No link</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-lg transition-colors font-display tracking-widest uppercase"
          >
            Close Matrix
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
