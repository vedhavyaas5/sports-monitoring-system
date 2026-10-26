import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { LiveDataProvider } from "@/components/LiveDataProvider";
import { AuthProvider } from "@/context/AuthContext";
import { CopilotWidget } from "@/components/CopilotWidget";

export const metadata: Metadata = {
  title: "Sports AI Monitor | Real-Time Injury Risk Platform",
  description: "Real-Time AI-Based Sports Injury Risk Monitoring and Decision Support Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        <AuthProvider>
          <LiveDataProvider>
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <TopNav />
              <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 relative">
                {children}
              </main>
              <CopilotWidget />
            </div>
          </LiveDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
