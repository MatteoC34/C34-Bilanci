import type { ReactNode } from "react";
import { Users, Mail, BarChart3, AlertTriangle, Sparkles, FileText, Settings, LogOut } from "lucide-react";
import { AppShell, type NavSection } from "./app-shell";
import { signOut } from "@/hooks/use-me";
import { Button } from "./ui/button";

const sections: NavSection[] = [
  {
    label: "Gestione",
    items: [
      { label: "Clienti", to: "/admin/clienti", icon: Users },
      { label: "Inviti Pendenti", to: "/admin/inviti", icon: Mail },
    ],
  },
  {
    label: "Analisi",
    items: [
      { label: "Dashboard Globale", to: "/admin/dashboard", icon: BarChart3 },
      { label: "Alert Portafoglio", to: "/admin/alert", icon: AlertTriangle },
    ],
  },
  {
    label: "Studio",
    items: [
      { label: "Template AI", to: "/admin/template", icon: Sparkles },
      { label: "Note & Commenti", to: "/admin/note", icon: FileText },
      { label: "Impostazioni", to: "/admin/impostazioni", icon: Settings },
    ],
  },
];

export function AdminShell({
  headerTitle,
  headerSubtitle,
  headerActions,
  children,
}: {
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell
      brand={{ title: "CONSULTING/34", subtitle: "Studio STP · Admin Panel" }}
      sections={sections}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      headerActions={headerActions}
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