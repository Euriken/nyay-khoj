export const SkeletonCard = () => {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-[2px] bg-primary/10" />
      <div className="p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0" />
          <div className="h-4 bg-muted rounded w-3/4 mt-1" />
          <div className="h-4 bg-muted rounded w-10 ml-auto" />
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 pl-9">
          <div className="h-5 bg-muted rounded-full w-20" />
          <div className="h-5 bg-muted rounded-full w-16" />
          <div className="h-5 bg-muted rounded-full w-24" />
        </div>

        {/* Snippet text */}
        <div className="space-y-2 pl-9">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
        </div>

        {/* Footer row */}
        <div className="pl-9 flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex gap-4">
            <div className="h-3 bg-muted rounded w-28" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  );
};
