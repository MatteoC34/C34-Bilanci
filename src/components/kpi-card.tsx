import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "gold" | "success" | "destructive" | "info";
const stripClass: Record<Accent, string> = {
  gold: "bg-primary",
  success: "bg-success",
  destructive: "bg-destructive",
  info: "bg-info",
};

export interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: number | null;
  accent?: Accent;
  invertDelta?: boolean;
}

export function KpiCard({ label, value, subtitle, delta, accent = "gold", invertDelta = false }: KpiCardProps) {
  const hasDelta = delta !== null && delta !== undefined && !Number.isNaN(delta);
  const positive = hasDelta && (invertDelta ? (delta as number) < 0 : (delta as number) > 0);
  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className={cn("absolute inset-y-0 left-0 w-1 rounded-l-xl", stripClass[accent])} />
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded",
              positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {(delta as number) > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {Math.abs(delta as number).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="tabular text-xl font-bold text-foreground">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}