"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, X, Maximize2, MessageSquare, Bot } from "lucide-react";
import { CopilotChat } from "./CopilotChat";
import { useLive } from "./LiveDataProvider";

export function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { athleteId } = useLive();

  return (
    <>
      {/* Floating Launcher Button (visible when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group border border-blue-500/30"
          title="Open Sports Injury AI Copilot"
        >
          <div className="relative">
            <Sparkles size={18} className="text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-600 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs tracking-tight">AI Copilot</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-700 text-blue-100">
            #{athleteId}
          </span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[460px] h-[640px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Top Control Bar */}
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-blue-400" />
              <span className="text-xs font-bold tracking-tight">AI Injury Copilot · #{athleteId}</span>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/copilot"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Expand to Fullscreen Workspace"
              >
                <Maximize2 size={13} />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Minimize Copilot"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Embedded Chat */}
          <div className="flex-1 overflow-hidden">
            <CopilotChat standalone={false} />
          </div>
        </div>
      )}
    </>
  );
}
