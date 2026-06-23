import { cn } from "@/lib/utils";
import type { KpiTag } from "@/lib/kpi-library";

const tagStyles: Record<KpiTag, string> = {
  "PMI": "bg-info/15 text-info",
  "Startup": "bg-success/15 text-success",
  "VC": "bg-primary/15 text-primary",
  "Silicon Valley": "bg-accent text-accent-foreground",
  "Critico": "bg-destructive/15 text-destructive",
  "Nuovo": "bg-warning/20 text-warning-foreground",
  "Holding": "bg-muted text-muted-foreground",
  "Immobiliare": "bg-muted text-muted-foreground",
};

export function TagChip({ tag }: { tag: KpiTag }) {
  return (
    <span className={cn("inline-flex text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded", tagStyles[tag])}>
      {tag}
    </span>
  );
}