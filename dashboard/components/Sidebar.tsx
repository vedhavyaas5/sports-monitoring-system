"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Radio, Users, Calendar,
  BarChart2, Bell, FileText, Settings, Zap,
  ClipboardList, ScanLine, ShieldCheck, UserPlus, Sparkles
} from "lucide-react";
import { useLive } from "./LiveDataProvider";

const NAV = [
  { href: "/",           icon: LayoutDashboard, label: "Dashboard"       },
  { href: "/copilot",    icon: Sparkles,        label: "AI Copilot"      },
  { href: "/live",       icon: Radio,           label: "Live Monitor"    },
  { href: "/athletes",   icon: Users,           label: "Athletes"        },
  { href: "/assessment", icon: ClipboardList,   label: "Self-Assessment" },
  { href: "/mri",        icon: ScanLine,        label: "MRI Analysis"    },
  { href: "/alerts",     icon: Bell,            label: "Alerts"          },
  { href: "/reports",    icon: FileText,        label: "Reports"         },
  { href: "/admin",      icon: ShieldCheck,     label: "Admin / Coach"   },
  { href: "/evaluation", icon: Zap,             label: "Model Evaluation"},
  { href: "/login",      icon: UserPlus,        label: "Add Person / Login" },
  { href: "/settings",   icon: Settings,        label: "Settings"        },
];

export function Sidebar() {
  const path = usePathname();
  const { connected, demo, alerts } = useLive();
  const unackCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
            SPORTS AI
          </span>
          <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
            Injury Risk Monitor
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"}`}>
              <Icon size={16} className={active ? "text-blue-600" : "text-slate-400"} />
              <span>{label}</span>
              {label === "AI Copilot" && (
                <span className="ml-auto px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase">
                  Gemini
                </span>
              )}
              {label === "Alerts" && unackCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  {unackCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 pulse-green" : "bg-red-500 pulse-red"}`} />
            <span className={connected ? "text-slate-700" : "text-red-600"}>
              {connected ? "System Online" : "Disconnected"}
            </span>
          </div>
          {demo && <span className="demo-badge">DEMO</span>}
        </div>
      </div>
    </aside>
  );
}
