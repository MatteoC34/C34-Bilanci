import type { ReactNode } from "react";
import { BarChart3, LineChart, BookOpen, Receipt, Calculator, FileText, MessageSquare, LogOut } from "lucide-react";
import { AppShell, type NavSection } from "./app-shell";
import { signOut } from "@/hooks/use-me";
import { Button } from "./ui/button";

const sections: NavSection[] = [
  {
    label: "Analisi",
    items: [
      { label: "Overview", to: "/dashboard/overview", icon: BarChart3 },
      { label: "Conto Economico", to: "/dashboard/conto-economico", icon: LineChart },
      { label: "Stato Patrimoniale", to: "/dashboard/stato-patrimoniale", icon: BookOpen },
      { label: "Mastrini & Conti", to: "/dashboard/mastrini", icon: Receipt },
    ],
  },
  {
    label: "Pianificazione",
    items: [
      { label: "Fiscale & Tax", to: "/dashboard/fiscale", icon: Calculator },
      { label: "Simulatore", to: "/dashboard/simulatore", icon: Calculator },
    ],
  },
  {
    label: "Documenti",
    items: [
      { label: "Bilanci Caricati", to: "/dashboard/bilanci", icon: FileText },
      { label: "Note dal Consulente", to: "/dashboard/note", icon: MessageSquare },
    ],
  },
];

export function ClientShell({
  client,
  headerTitle,
  headerSubtitle,
  headerActions,
  children,
}: {
  client: { name: string; piva?: string | null; ateco?: string | null } | null;
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell
      brand={{ title: "CONSULTING/34", subtitle: "Portale Clienti" }}
      sections={sections}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      headerActions={headerActions}
      badge={
        client && (
          <div className="rounded-md bg-card border border-border px-3 py-2">
            <div className="text-xs font-semibold">{client.name}</div>
            {client.piva && <div className="text-[10px] text-muted-foreground mt-0.5">P.IVA {client.piva}</div>}
            {client.ateco && <div className="text-[10px] text-muted-foreground">ATECO {client.ateco}</div>}
          </div>
        )
      }
      footer={
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Esci
        </Button>
      }
    >
      {children}
    </AppShell>
  );
}