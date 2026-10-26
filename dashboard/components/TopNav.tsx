"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLive } from "./LiveDataProvider";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Activity,
  UserPlus,
  LogIn,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Check
} from "lucide-react";

export function TopNav() {
  const router = useRouter();
  const { athleteId, setAthleteId, connected, demo } = useLive();
  const { user, logout, switchDemoUser } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [scenario, setScenario] = useState("normal_training");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchAthletes = () => {
    fetch(`${API}/api/athletes`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAthletes(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAthletes();
  }, [API]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When user is an athlete, sync their athleteId
  useEffect(() => {
    if (user?.athlete_id && user.athlete_id !== athleteId) {
      setAthleteId(user.athlete_id);
    }
  }, [user]);

  const toggleScenario = async (sc: string) => {
    setScenario(sc);
    await fetch(`${API}/api/simulation/start?scenario=${sc}`, { method: "POST" }).catch(() => {});
  };

  const handlePersonaSwitch = async (username: string, targetAthleteId?: string) => {
    await switchDemoUser(username);
    if (targetAthleteId) {
      setAthleteId(targetAthleteId);
    }
    setMenuOpen(false);
    fetchAthletes();
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "US";

  let roleColor = "bg-blue-50 text-blue-700 border-blue-200";
  if (user?.role === "PHYSICIAN") roleColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (user?.role === "COACH") roleColor = "bg-purple-50 text-purple-700 border-purple-200";
  if (user?.role === "ATHLETE") roleColor = "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Athlete Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Athlete:
          </span>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} - {a.name} ({a.position || a.sport})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Add Person Link */}
        <Link
          href="/login?tab=register"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors shadow-2xs"
          title="Add a new athlete, doctor, or coach to the system"
        >
          <UserPlus size={14} />
          <span>+ Add Person</span>
        </Link>

        {/* Scenario Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => toggleScenario("normal_training")}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
              scenario === "normal_training" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Normal Training
          </button>
          <button
            onClick={() => toggleScenario("fatigued_overload")}
            className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
              scenario === "fatigued_overload" ? "bg-red-50 text-red-700 shadow-xs border border-red-200" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Fatigue Overload
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Stream Health Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-600">
          <Activity size={14} className="text-blue-600 animate-pulse" />
          <span>Live Sensor & Kinematic Stream</span>
        </div>

        {/* User Account / Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || "Dr. Robert Vance"}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleColor}`}>
                  {user?.role || "ADMIN"}
                </span>
                {user?.athlete_id && (
                  <span className="text-[10px] text-slate-400 font-semibold">#{user.athlete_id}</span>
                )}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Active Profile Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Signed in as
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">{user?.name}</div>
                <div className="text-xs text-slate-500 font-medium">@{user?.username} · {user?.role}</div>
              </div>

              {/* Fast 1-Click Switch Persona */}
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1">
                  <Sparkles size={11} className="text-blue-500" />
                  <span>Switch Active Persona</span>
                </div>
                <div className="space-y-1">
                  {[
                    { uname: "admin", name: "Dr. Robert Vance", role: "Physician / Admin", ath: "07" },
                    { uname: "coach", name: "Coach Sarah Miller", role: "Head Coach", ath: "07" },
                    { uname: "athlete07", name: "Marcus Vance", role: "Forward (#07)", ath: "07" },
                    { uname: "athlete12", name: "Elena Rostova", role: "Midfielder (#12)", ath: "12" },
                    { uname: "kylian10", name: "Kylian Mbappe", role: "Forward (#10)", ath: "10" },
                  ].map((p) => {
                    const isCurrent = user?.username === p.uname;
                    return (
                      <button
                        key={p.uname}
                        onClick={() => handlePersonaSwitch(p.uname, p.ath)}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({p.role})</span>
                        </div>
                        {isCurrent && <Check size={13} className="text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="p-1 space-y-0.5">
                <Link
                  href="/login?tab=register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <UserPlus size={14} />
                  <span>+ Add a Person / New Athlete</span>
                </Link>

                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <LogIn size={14} className="text-slate-400" />
                  <span>Sign In with Credentials</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut size={14} className="text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
