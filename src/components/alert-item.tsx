import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertItemProps {
  type: "danger" | "warning" | "info";
  title: string;
  description: string;
}

export function AlertItem({ type, title, description }: AlertItemProps) {
  const Icon = type === "info" ? CheckCircle2 : type === "danger" ? AlertTriangle : Info;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
          type === "danger" && "bg-destructive/15 text-destructive",
          type === "warning" && "bg-warning/20 text-warning-foreground",
          type === "info" && "bg-info/15 text-info",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}