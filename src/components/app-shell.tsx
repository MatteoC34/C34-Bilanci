import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
}
export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface AppShellProps {
  brand: { title: string; subtitle: string };
  badge?: ReactNode;
  sections: NavSection[];
  footer?: ReactNode;
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ brand, badge, sections, footer, headerTitle, headerSubtitle, headerActions, children }: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="w-[220px] shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="text-[15px] font-bold tracking-wider text-primary">{brand.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{brand.subtitle}</div>
        </div>
        {badge && <div className="px-4 py-3 border-b border-sidebar-border">{badge}</div>}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{section.label}</div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {footer && <div className="px-3 py-3 border-t border-sidebar-border">{footer}</div>}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/40 backdrop-blur flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-base font-semibold">{headerTitle}</h1>
            {headerSubtitle && <p className="text-xs text-muted-foreground">{headerSubtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}