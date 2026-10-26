"use client";
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  MessageSquare,
  Trash2,
  Plus,
  ShieldCheck,
  Activity,
  ChevronRight,
  Database,
  Sliders,
  HelpCircle,
  Clock
} from "lucide-react";
import { CopilotChat } from "@/components/CopilotChat";
import { useLive } from "@/components/LiveDataProvider";
import { useAuth } from "@/context/AuthContext";

export default function CopilotPage() {
  const { athleteId, setAthleteId } = useLive();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchConversations = () => {
    fetch(`${API}/api/chat/conversations`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setConversations(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchConversations();
    fetch(`${API}/api/athletes`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAthletes(data); })
      .catch(() => {});
  }, [API]);

  const handleDeleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`${API}/api/chat/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    if (selectedConvId === id) setSelectedConvId(null);
    fetchConversations();
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col md:flex-row gap-5">
      {/* Left Sidebar: Conversations & Scoping */}
      <div className="w-full md:w-72 shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Chat History
            </h2>
          </div>
          <button
            onClick={() => setSelectedConvId(null)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
        </div>

        {/* Athlete Scoper */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Focus Athlete Record
          </label>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {athletes.map(a => (
              <option key={a.id} value={a.id}>
                #{a.id} - {a.name} ({a.position || a.sport})
              </option>
            ))}
          </select>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-1">
              <Clock size={20} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold">No previous chats</p>
              <p className="text-[11px]">Ask a question to start a new monitoring thread.</p>
            </div>
          ) : (
            conversations.map(c => {
              const active = selectedConvId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`p-3 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between group ${
                    active
                      ? "bg-blue-50 border border-blue-200 text-blue-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="truncate font-semibold">{c.title || "Monitoring Thread"}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Athlete #{c.athlete_id} · {c.message_count} messages
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConv(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Copilot System Status Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Model Engine:</span>
            <span className="font-mono text-blue-600 font-bold">Gemini 3.5 Flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Medical Tools:</span>
            <span className="font-bold text-emerald-600">13 Connected</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <CopilotChat
          conversationId={selectedConvId}
          onConversationCreated={(id) => {
            setSelectedConvId(id);
            fetchConversations();
          }}
          standalone={true}
        />
      </div>
    </div>
  );
}
