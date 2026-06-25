import { useState } from "react";
import { Copy, FileDown, Printer, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  content: string;
}

export const LegalDraftCard = ({ content }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Draft copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocker prevented printing. Please disable popup blocker.");
      return;
    }
    
    const formattedContent = content
      .split("\n")
      .map(line => `<p style="margin: 0 0 10px 0; min-height: 1em;">${line}</p>`)
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Legal Document Draft</title>
          <style>
            body {
              font-family: 'EB Garamond', 'Georgia', serif;
              padding: 1.5in 1in 1in 1.25in;
              line-height: 1.8;
              color: #000;
              font-size: 14pt;
              position: relative;
            }
            .margin-line {
              position: absolute;
              left: 1in;
              top: 0;
              bottom: 0;
              width: 1px;
              border-left: 1px double #cc0000;
            }
            p {
              text-align: justify;
              text-justify: inter-word;
            }
          </style>
        </head>
        <body>
          <div class="margin-line"></div>
          ${formattedContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportDoc = () => {
    const header = 
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><title>Legal Document Draft</title>" +
      "<style>" +
      "body { font-family: 'Georgia', serif; line-height: 1.8; padding: 1in; }" +
      "p { text-align: justify; margin: 0 0 12pt 0; }" +
      "</style>" +
      "</head><body>";
    const footer = "</body></html>";
    
    const body = content
      .split("\n")
      .map(line => `<p>${line}</p>`)
      .join("");
      
    const sourceHTML = header + body + footer;
    const blob = new Blob(['\ufeff' + sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "legal_draft.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported draft to Word (.doc)!");
  };

  // Split content into lines for rendering line numbers
  const lines = content.split("\n");

  return (
    <div className="my-4 rounded-xl border border-primary/20 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] shadow-md overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/70 backdrop-blur-sm">
        <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1.5">
          📜 Visual Document Draft
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            title="Copy Draft text"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleExportDoc}
            className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            title="Export to MS Word (.doc)"
          >
            <FileDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            title="Print Draft"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Styled Legal Page paper rendering */}
      <div className="relative p-6 sm:p-8 bg-[#FAF6EE] text-[#2c2621] dark:bg-[#1E1C1A] dark:text-[#E6E1DC] font-legal leading-relaxed border-t border-border overflow-x-auto min-h-[300px]">
        {/* Left vertical red line margin */}
        <div className="absolute left-[54px] sm:left-[64px] top-0 bottom-0 w-[2px] border-l border-red-500/20 dark:border-red-500/10 pointer-events-none select-none" />

        {/* Faint Scale of Justice background watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] dark:opacity-[0.015] select-none">
          <svg className="w-64 h-64 text-[#2c2621] dark:text-[#E6E1DC]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
          </svg>
        </div>

        {/* Line numbered text */}
        <div className="relative flex gap-4 sm:gap-6 pl-2 z-10">
          {/* Line Numbers Column */}
          <div className="flex flex-col text-right select-none text-[10px] sm:text-xs text-red-500/40 dark:text-red-500/20 font-mono w-[30px] pr-2 pt-0.5 leading-[1.88]">
            {lines.map((_, idx) => (
              <div key={idx} className="h-[1.88rem] flex items-center justify-end">
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Actual content lines */}
          <div className="flex-1 text-xs sm:text-sm font-medium tracking-wide space-y-0 text-justify text-shadow-sm leading-[1.88]">
            {lines.map((line, idx) => (
              <p key={idx} className="h-[1.88rem] flex items-center m-0 truncate-overflow whitespace-pre-wrap">
                {line || " "}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
