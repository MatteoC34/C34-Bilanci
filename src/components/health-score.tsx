import { cn } from "@/lib/utils";

export interface HealthScoreProps {
  score: number;
  dimensions?: Array<{ name: string; score: number }>;
  badges?: Array<{ text: string; type: "success" | "warning" | "danger" | "info" }>;
}

function colorForScore(s: number) {
  if (s >= 70) return "var(--success)";
  if (s >= 40) return "var(--warning)";
  return "var(--destructive)";
}

export function HealthScore({ score, dimensions = [], badges = [] }: HealthScoreProps) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = colorForScore(score);

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-card/60 p-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-3xl font-bold">{Math.round(score)}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Salute</span>
          </div>
        </div>

        <div className="flex-1 min-w-[240px] grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dimensions.map((d) => (
            <div key={d.name} className="px-3 py-2 rounded-md bg-muted/40">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.name}</div>
              <div className="tabular text-sm font-semibold">{Math.round(d.score)}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {badges.map((b, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                b.type === "success" && "bg-success/15 text-success",
                b.type === "warning" && "bg-warning/20 text-warning-foreground",
                b.type === "danger" && "bg-destructive/15 text-destructive",
                b.type === "info" && "bg-info/15 text-info",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {b.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}