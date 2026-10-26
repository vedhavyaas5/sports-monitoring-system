"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Database,
  Wrench,
  HelpCircle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldCheck,
  AlertOctagon
} from "lucide-react";
import { useLive } from "./LiveDataProvider";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  sources?: Array<{ type: string; record_id?: string; summary?: string }>;
  used_tools?: string[];
  timestamp?: number;
}

interface CopilotChatProps {
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
  standalone?: boolean;
}

export function CopilotChat({ conversationId, onConversationCreated, standalone = false }: CopilotChatProps) {
  const { athleteId } = useLive();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Load suggestions
  useEffect(() => {
    fetch(`${API}/api/chat/suggestions`)
      .then(r => r.json())
      .then(setSuggestions)
      .catch(() => {});
  }, [API]);

  // Load existing conversation messages if conversationId changes
  useEffect(() => {
    if (conversationId) {
      setActiveConvId(conversationId);
      fetch(`${API}/api/chat/conversations/${conversationId}`)
        .then(r => r.json())
        .then(data => {
          if (data && Array.isArray(data.messages)) {
            const mapped = data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
              used_tools: m.tool_metadata_json ? JSON.parse(m.tool_metadata_json)?.tools : undefined
            }));
            setMessages(mapped);
          }
        })
        .catch(() => {});
    } else {
      setActiveConvId(null);
      setMessages([
        {
          id: "welcome-msg",
          role: "model",
          content: `👋 **Hello! I am your Sports Injury AI Copilot**, powered by Gemini with 13 authorized athletic monitoring tools.\n\nI can analyze **Athlete #${athleteId}**'s latest physiological sensor readings, movement kinematics, MRI image features, recovery indices, and run hypothetical **What-If risk simulations**.\n\n*How can I assist you with this athlete's monitoring data today?*`,
          timestamp: Date.now() / 1000
        }
      ]);
    }
  }, [conversationId, athleteId, API]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (userPrompt: string) => {
    const text = userPrompt.trim();
    if (!text || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: Date.now() / 1000
    };

    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvId,
          athlete_id: athleteId,
          message: text
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error communicating with AI Copilot");
      }

      if (data.conversation_id && data.conversation_id !== activeConvId) {
        setActiveConvId(data.conversation_id);
        if (onConversationCreated) onConversationCreated(data.conversation_id);
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "model",
        content: data.response,
        sources: data.sources,
        used_tools: data.used_tools,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content: `⚠️ **Communication Notice:** ${err.message || "Could not retrieve live Copilot response. Please ensure backend is running."}`,
          timestamp: Date.now() / 1000
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTools = (msgId: string) => {
    setExpandedTools(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className={`flex flex-col h-full bg-white ${standalone ? "rounded-2xl border border-slate-200 shadow-sm" : ""}`}>
      {/* Copilot Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Sports Injury AI Copilot</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.5 Grounded
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Target Athlete: <strong className="text-slate-800 font-bold">#{athleteId}</strong> · 13 Backend Tools Active
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveConvId(null);
            setMessages([
              {
                id: "welcome-reset",
                role: "model",
                content: `✨ New session started for **Athlete #${athleteId}**. How can I help you?`,
                timestamp: Date.now() / 1000
              }
            ]);
          }}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 p-1.5 hover:bg-slate-200/60 rounded-lg transition-colors"
          title="Start a fresh conversation"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === "user";
          const isEmergency = m.content.includes("CRITICAL MEDICAL ALERT");
          const hasTools = m.used_tools && m.used_tools.length > 0;
          const isExpanded = !!expandedTools[m.id];

          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-2xs ${
                  isUser
                    ? "bg-slate-800 text-white"
                    : isEmergency
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isUser ? <User size={15} /> : isEmergency ? <AlertOctagon size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white font-medium rounded-tr-xs shadow-xs"
                    : isEmergency
                    ? "bg-red-50 text-red-950 border border-red-200 rounded-tl-xs shadow-xs"
                    : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-slate dark:prose-invert">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>

                {/* Authorized Tool Invocations Accordion */}
                {hasTools && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                    <button
                      onClick={() => toggleTools(m.id)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 transition-colors"
                    >
                      <Wrench size={12} />
                      <span>{m.used_tools!.length} Authorized Tools Invoked</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 space-y-1 animate-in fade-in duration-100">
                        {m.used_tools!.map(t => (
                          <div key={t} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{t}()</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Verified Source Chips */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Database size={10} /> Verified Data Sources:
                    </span>
                    {m.sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 shadow-2xs"
                      >
                        {s.type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-600 animate-spin" />
              <span className="font-bold">Analyzing athlete records with Gemini & executing tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Carousel */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex gap-2 overflow-x-auto no-scrollbar">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(s.prompt)}
              disabled={loading}
              className="text-[11px] font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 transition-all shadow-2xs shrink-0 flex items-center gap-1.5"
            >
              <Sparkles size={11} className="text-blue-500 shrink-0" />
              <span>{s.category}: {s.prompt.slice(0, 32)}...</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={`Ask Copilot about Athlete #${athleteId}'s risk, sensors, MRI, or what-if simulation...`}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
