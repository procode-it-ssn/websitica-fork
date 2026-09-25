"use client";
import { supabase } from "@/lib/client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Logout from "./Logout";
import Image from "next/image";
import AdminCandidates from "./AdminCandidates";
import AdminBidding from "./AdminBidding";
import AdminReport from "./AdminReport";
import AdminRound1Web from "./AdminRound1Web";
import AdminRound2 from "./AdminRound2";
import AdminCodections from "./AdminCodections";
import {
  Trophy,
  Play,
  Square,
  Eye,
  Trash2,
  Calendar,
  Layers,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  Users,
  Target,
  Download,
  Gamepad2,
  Palette,
  Rocket,
  KeyRound,
  Search,
} from "lucide-react";
import {
  IS_MOCK_MODE,
  MOCK_TEAMS,
  MOCK_SESSIONS,
  MOCK_CATEGORIES_DATA,
  MOCK_SUBMISSIONS,
} from "@/lib/mockData";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "candidates" | "bidding" | "report"
  const [teams, setTeams] = useState([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [sessions, setSessions] = useState([]);
  const [newSessionStart, setNewSessionStart] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionScores, setSessionScores] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [realtimeSubmissions, setRealtimeSubmissions] = useState([]);
  const [selectedLab, setSelectedLab] = useState(1); // Default to lab 1

  useEffect(() => {
    fetchTeams();
    fetchSessions();
    fetchCategories();
    fetchRecentSubmissions();
    const unsubscribe = subscribeToUpdates();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLab]);

  const fetchTeams = async () => {
    if (IS_MOCK_MODE) {
      setTeams(MOCK_TEAMS);
      return;
    }

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("score", { ascending: false });

    if (error) console.error("Error fetching teams:", error);
    else setTeams(data);
  };

  const fetchSessions = async () => {
    if (IS_MOCK_MODE) {
      setSessions(MOCK_SESSIONS.filter((s) => s.lab === selectedLab));
      return;
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("lab", selectedLab)
      .order("start_time", { ascending: false });

    if (error) console.error("Error fetching sessions:", error);
    else setSessions(data);
  };

  const fetchCategories = async () => {
    if (IS_MOCK_MODE) {
      setCategories(Object.keys(MOCK_CATEGORIES_DATA));
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("category");
    if (error) console.error("Error fetching categories:", error);
    else setCategories(data.map((c) => c.category));
  };

  const fetchRecentSubmissions = async () => {
    if (IS_MOCK_MODE) {
      setRealtimeSubmissions(MOCK_SUBMISSIONS);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          "score, created_at, player_id, team_id, team:teams(name, lab), player:players(name)"
        )
        .order("created_at", { ascending: false })
        .limit(15);

      if (!error && data) {
        setRealtimeSubmissions(
          data.map((s) => ({
            teamName: s.team?.name || "Unknown Team",
            playerName: s.player?.name || null,
            lab: s.team?.lab || null,
            score: s.score || 0,
            timestamp: new Date(s.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          }))
        );
      }
    } catch (e) {
      console.warn("Could not load recent submissions:", e);
    }
  };

  const subscribeToUpdates = () => {
    if (IS_MOCK_MODE) {
      setRealtimeSubmissions(MOCK_SUBMISSIONS);
      return () => {};
    }

    supabase
      .channel("teams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        handleTeamUpdate
      )
      .subscribe();

    supabase
      .channel("submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        handleSubmissionInsert
      )
      .subscribe();

    return () => {
      supabase.removeAllChannels();
    };
  };

  const handleTeamUpdate = (payload) => {
    console.log("Handle Team Update", payload);
    setTeams((currentTeams) => {
      if (payload.eventType === "DELETE") {
        return currentTeams
          .filter((team) => team.id !== payload.old.id)
          .sort((a, b) => b.score - a.score);
      } else {
        const updatedTeams = currentTeams.filter(
          (team) => team.id !== payload.new.id
        );
        updatedTeams.push(payload.new);
        return updatedTeams.sort((a, b) => b.score - a.score);
      }
    });
  };

  const handleSubmissionInsert = async (payload) => {
    const { session_id, team_id, player_id, score } = payload.new;

    let teamName = "Unknown Team";
    let lab = null;
    let officialScore = score;
    try {
      const { data: teamData } = await supabase
        .from("teams")
        .select("name, lab, score, codections_score")
        .eq("id", team_id)
        .limit(1)
        .single();
      if (teamData) {
        teamName = teamData.name;
        lab = teamData.lab;
        officialScore = teamData.codections_score ?? teamData.score ?? score;
      }
    } catch (e) {}

    let playerName = null;
    if (player_id) {
      try {
        const { data: pData } = await supabase
          .from("players")
          .select("name")
          .eq("id", player_id)
          .limit(1)
          .single();
        if (pData?.name) playerName = pData.name;
      } catch (e) {}
    }

    setSessionScores((prevScores) => {
      const updatedScores = { ...prevScores };
      if (!updatedScores[session_id]) {
        updatedScores[session_id] = {};
      }
      updatedScores[session_id][teamName] = officialScore;
      return updatedScores;
    });

    setRealtimeSubmissions((prev) => [
      {
        teamName,
        playerName,
        lab,
        score,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev.slice(0, 19),
    ]);

    fetchTeams();
  };

  const createNewSession = async () => {
    if (selectedCategories.length !== 4) {
      alert("Please select exactly 4 categories to assemble the tape.");
      return;
    }

    if (IS_MOCK_MODE) {
      const newSess = {
        id: "mock-session-" + Date.now(),
        status: "scheduled",
        start_time: newSessionStart.toISOString(),
        category1: selectedCategories[0],
        category2: selectedCategories[1],
        category3: selectedCategories[2],
        category4: selectedCategories[3],
        lab: selectedLab,
      };
      setSessions([...sessions, newSess]);
      setNewSessionStart(new Date());
      setSelectedCategories([]);
      return;
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert({
        status: "scheduled",
        start_time: newSessionStart.toISOString(),
        category1: selectedCategories[0],
        category2: selectedCategories[1],
        category3: selectedCategories[2],
        category4: selectedCategories[3],
        lab: selectedLab,
      })
      .select()
      .limit(1)
      .single();

    if (error) console.error("Error creating new session:", error);
    else {
      setSessions([...sessions, data]);
      setNewSessionStart(new Date());
      setSelectedCategories([]);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : prev.length < 4
        ? [...prev, category]
        : prev
    );
  };

  const startSession = async (sessionId) => {
    if (IS_MOCK_MODE) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "active" } : s))
      );
      setRealtimeSubmissions([]);
      return;
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .update({ status: "active" })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error starting session:", error);
    } else {
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === sessionId ? data : session
        )
      );
      setRealtimeSubmissions([]);
    }
  };

  const endSession = async (sessionId) => {
    if (IS_MOCK_MODE) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, status: "completed", end_time: new Date().toISOString() }
            : s
        )
      );
      fetchSessionScores(sessionId);
      return;
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .update({ status: "completed", end_time: new Date().toISOString() })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error ending session:", error);
    } else {
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === sessionId ? data : session
        )
      );
      fetchSessionScores(sessionId);
    }
  };

  const deleteSession = async (sessionId) => {
    if (IS_MOCK_MODE) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(null);
      }
      return;
    }

    const { error } = await supabase
      .from("quiz_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("Error deleting session:", error);
    } else {
      setSessions((prevSessions) =>
        prevSessions.filter((session) => session.id !== sessionId)
      );
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const fetchSessionScores = async (sessionId) => {
    if (IS_MOCK_MODE) {
      const mockScores = {
        "Byte Busters": 2450,
        "Syntax Sorcerers": 2180,
        "Circuit Breakers": 1920,
        "Algorhythms": 1640,
      };
      setSessionScores((prev) => ({ ...prev, [sessionId]: mockScores }));
      return;
    }

    const { data, error } = await supabase
      .from("submissions")
      .select("score, player_id, team_id, team:teams(name, score, codections_score)")
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error fetching session scores:", error);
      return;
    }

    // Deduplicate submissions per player to guarantee 100% score alignment with tournament squads
    const teamPlayerMax = {};
    const teamOfficialScores = {};

    data.forEach((sub) => {
      const teamName = sub.team?.name || "Unknown Team";
      if (sub.team) {
        teamOfficialScores[teamName] =
          sub.team.codections_score ?? sub.team.score ?? 0;
      }
      const pKey = sub.player_id || sub.id;
      if (!teamPlayerMax[teamName]) {
        teamPlayerMax[teamName] = {};
      }
      teamPlayerMax[teamName][pKey] = Math.max(
        teamPlayerMax[teamName][pKey] || 0,
        sub.score || 0
      );
    });

    const scores = {};
    Object.keys(teamPlayerMax).forEach((teamName) => {
      if (
        teamOfficialScores[teamName] !== undefined &&
        teamOfficialScores[teamName] > 0
      ) {
        scores[teamName] = teamOfficialScores[teamName];
      } else {
        scores[teamName] = Object.values(teamPlayerMax[teamName]).reduce(
          (a, b) => a + b,
          0
        );
      }
    });

    setSessionScores((prevScores) => ({
      ...prevScores,
      [sessionId]: scores,
    }));
  };

  const handleDeleteTeam = async (team) => {
    if (!team) return;
    const confirmMsg = `Are you sure you want to permanently delete squad "${team.name}" (ID: ${team.id})?\n\nThis will remove all associated submissions and player records from the database.`;
    if (!window.confirm(confirmMsg)) return;

    if (IS_MOCK_MODE) {
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      return;
    }

    try {
      // 1. Delete associated submissions
      await supabase.from("submissions").delete().eq("team_id", team.id);
      // 2. Delete associated players
      await supabase.from("players").delete().eq("team_id", team.id);
      // 3. Unlink any candidates assigned to this team
      try {
        await supabase
          .from("candidates")
          .update({ team_id: null, team_name: null })
          .eq("team_id", team.id);
      } catch (e) {}
      // 4. Delete the team itself
      const { error } = await supabase.from("teams").delete().eq("id", team.id);
      if (error) throw error;

      // 5. Clean up local passkey cache if present
      try {
        localStorage.removeItem("websitica_passkey_" + (team.name || "").toLowerCase());
        localStorage.removeItem("websitica_passkey_id_" + team.id);
      } catch (e) {}

      await fetchTeams();
    } catch (err) {
      console.error("Error deleting team:", err);
      alert("Failed to delete team: " + (err.message || "Unknown error"));
    }
  };

  const purgeAllTeams = async (targetLab = null) => {
    const isAll = targetLab === null;
    const msg = isAll
      ? "CRITICAL CONFIRMATION:\n\nAre you sure you want to permanently DELETE ALL TEAMS across the entire database (all labs)?\n\nThis will wipe all teams, players, and submissions."
      : `Are you sure you want to delete ALL teams in Lab ${targetLab}? This action is irreversible.`;

    if (!window.confirm(msg)) return;

    if (IS_MOCK_MODE) {
      if (isAll) setTeams([]);
      else setTeams((prev) => prev.filter((t) => t.lab !== targetLab));
      return;
    }

    try {
      if (isAll) {
        await supabase.from("submissions").delete().gte("id", 0);
        await supabase.from("players").delete().gte("id", 0);
        try {
          await supabase.from("candidates").update({ team_id: null, team_name: null }).gte("created_at", "1970-01-01");
        } catch (e) {}
        await supabase.from("teams").delete().gte("id", 0);
      } else {
        const labTeamIds = teams.filter((t) => t.lab === targetLab).map((t) => t.id);
        if (labTeamIds.length > 0) {
          await supabase.from("submissions").delete().in("team_id", labTeamIds);
          await supabase.from("players").delete().in("team_id", labTeamIds);
          try {
            await supabase.from("candidates").update({ team_id: null, team_name: null }).in("team_id", labTeamIds);
          } catch (e) {}
        }
        await supabase.from("teams").delete().eq("lab", targetLab);
      }
      await fetchTeams();
    } catch (err) {
      console.error("Error purging teams:", err);
      alert("Failed to purge teams: " + (err.message || "Unknown error"));
    }
  };

  const selectedLabTeams = teams.filter((t) => t.lab === selectedLab);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#101010] bg-grid py-8 px-4 sm:px-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Neo-Brutalist Command Bar */}
        <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 bg-[#FFD12E] border-2 border-black flex items-center justify-center shadow-brutal flex-shrink-0">
              <Radio className="w-6 h-6 text-black animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#101010] text-[#FFF9F3] text-[10px] font-mono font-black px-2 py-0.5 border border-black uppercase tracking-wider">
                  MASTER CONSOLE
                </span>
                <span className="bg-[#9AE885] text-black text-[10px] font-mono font-black px-2 py-0.5 border border-black uppercase">
                  ACTIVE DECK
                </span>
              </div>
              <h1 className="font-syne font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#101010] leading-tight mt-1">
                INVENTE &apos;26 TOURNAMENT MASTER
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {IS_MOCK_MODE && (
              <span className="bg-[#C1F8FF] text-black border-2 border-black px-3 py-1.5 text-xs font-bold shadow-brutal-sm hidden sm:inline-block">
                ⚡ MOCK MODE ACTIVE
              </span>
            )}
            <Logout />
          </div>
        </div>

        {/* Top Module Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "sessions"
                ? "bg-[#FFD12E] text-black shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>SESSIONS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("candidates")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "candidates"
                ? "bg-[#C1F8FF] text-black shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Users className="w-4 h-4 text-black flex-shrink-0" />
            <span>CANDIDATES</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("round1_web")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "round1_web"
                ? "bg-[#FFD12E] text-black shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Palette className="w-4 h-4 text-black flex-shrink-0" />
            <span>R1: WEBSITE</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("codections")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "codections"
                ? "bg-[#9AE885] text-black shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>R1: CODECTIONS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bidding")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "bidding"
                ? "bg-[#FE90E9] text-black shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Target className="w-4 h-4 text-black flex-shrink-0" />
            <span>R1: BIDDING</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("round2")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "round2"
                ? "bg-[#FF6B35] text-white shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Rocket className="w-4 h-4 text-black flex-shrink-0" />
            <span>R2: FINALS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`p-3 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === "report"
                ? "bg-[#9AE885] text-black shadow-brutal translate-x-0.5 translate-y-0.5"
                : "bg-white text-gray-700 hover:bg-[#FFF9A6] shadow-brutal-sm"
            }`}
          >
            <Trophy className="w-4 h-4 text-black flex-shrink-0" />
            <span>LEADERBOARD &amp; QUALIFIER</span>
          </button>
        </div>

        {/* Tab 2: Candidate Directory (Excel upload + duplicate check + manual add) */}
        {activeTab === "candidates" && (
          <AdminCandidates onCandidatesUpdated={fetchTeams} />
        )}

        {/* Tab 3: Round 1 Chaos Website Marking (UI 30, UX 35, Tech 35 = 100) */}
        {activeTab === "round1_web" && (
          <AdminRound1Web teams={teams} onTeamsUpdated={fetchTeams} />
        )}

        {/* Tab 4: Squad Passkeys & Codections Individual Participant Marks */}
        {activeTab === "codections" && (
          <AdminCodections teams={teams} onTeamsUpdated={fetchTeams} />
        )}

        {/* Tab 5: Offline Bidding Arena (Interactive +/- points per question) */}
        {activeTab === "bidding" && (
          <AdminBidding teams={teams} onTeamsUpdated={fetchTeams} />
        )}

        {/* Tab 6: Round 2 Replica Rush Finals Marking */}
        {activeTab === "round2" && (
          <AdminRound2 teams={teams} onTeamsUpdated={fetchTeams} />
        )}

        {/* Tab 7: Master Report & Comprehensive Excel (.xlsx) Export */}
        {activeTab === "report" && (
          <AdminReport teams={teams} onTeamsUpdated={fetchTeams} />
        )}

        {/* Tab 1: Sessions Deck (Existing tournament controls) */}
        {activeTab === "sessions" && (
          <div className="space-y-8">
            {/* Lab Switcher Segmented Bar */}
            <div className="card-brutal bg-white border-2 border-black shadow-brutal p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-black" />
                <span className="font-syne font-black text-sm uppercase tracking-wider text-black">
                  ACTIVE LAB ARENA:
                </span>
              </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedLab(1)}
              className={`px-5 py-2 border-2 border-black font-syne font-black text-sm uppercase transition-all shadow-brutal ${
                selectedLab === 1
                  ? "bg-[#FFD12E] text-black translate-x-0.5 translate-y-0.5 shadow-[1px_1px_0px_#101010]"
                  : "bg-white text-gray-700 hover:bg-[#FFF9A6]"
              }`}
            >
              LAB 1 (OS LAB)
            </button>
            <button
              onClick={() => setSelectedLab(2)}
              className={`px-5 py-2 border-2 border-black font-syne font-black text-sm uppercase transition-all shadow-brutal ${
                selectedLab === 2
                  ? "bg-[#C1F8FF] text-black translate-x-0.5 translate-y-0.5 shadow-[1px_1px_0px_#101010]"
                  : "bg-white text-gray-700 hover:bg-[#FFF9A6]"
              }`}
            >
              LAB 2 (SE LAB)
            </button>
          </div>

          <div className="text-xs text-gray-600 font-mono">
            Managing: <strong>Lab {selectedLab}</strong> ({selectedLabTeams.length} registered teams)
          </div>
        </div>

        {/* Create Session Card */}
        <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-6 sm:p-8">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FF6B35]" />
              <h2 className="font-syne font-black text-xl uppercase tracking-tight text-black">
                SCHEDULE TOURNAMENT TAPE (LAB {selectedLab})
              </h2>
            </div>
            <span className="bg-[#FE90E9] text-black text-xs font-mono font-bold px-2.5 py-1 border border-black uppercase">
              SELECT EXACTLY 4 CATEGORIES ({selectedCategories.length}/4)
            </span>
          </div>

          {/* Time Picker */}
          <div className="mb-6">
            <label className="block font-mono text-xs uppercase font-bold text-black mb-2">
              BROADCAST START TIMESTAMP
            </label>
            <div className="inline-block border-2 border-black shadow-brutal bg-[#FFFDF9]">
              <DatePicker
                selected={newSessionStart}
                onChange={(date) => setNewSessionStart(date)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="p-2.5 font-mono text-sm bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Category Chips Grid */}
          <div className="mb-6">
            <label className="block font-mono text-xs uppercase font-bold text-black mb-3">
              SELECT 4 THEMATIC PUZZLE SECTORS:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`p-2.5 text-xs font-mono font-black uppercase text-left border-2 border-black transition-all ${
                      isSelected
                        ? "bg-[#FFD12E] text-black shadow-[2px_2px_0px_#101010] translate-x-0.5 translate-y-0.5"
                        : "bg-white text-black hover:bg-[#FFF9A6] shadow-brutal-sm"
                    }`}
                  >
                    <span className="block truncate">{category}</span>
                    {isSelected && (
                      <span className="text-[9px] block text-[#FF6B35] font-black">
                        ✓ ATTACHED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dashed border-gray-300">
            <button
              onClick={createNewSession}
              disabled={selectedCategories.length !== 4}
              className="btn-brutal bg-[#9AE885] hover:bg-[#88d973] disabled:opacity-50 text-black border-2 border-black font-syne font-black text-sm uppercase px-6 py-3 shadow-brutal flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Play className="w-4 h-4" /> BROADCAST NEW TOURNAMENT TAPE ▶
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => purgeAllTeams(selectedLab)}
                className="btn-brutal bg-white hover:bg-red-50 text-red-600 border-2 border-black font-mono font-bold text-xs uppercase px-4 py-3 shadow-brutal flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title={`Delete all teams in Lab ${selectedLab}`}
              >
                <Trash2 className="w-4 h-4" /> PURGE LAB {selectedLab} TEAMS
              </button>

              <button
                type="button"
                onClick={() => purgeAllTeams(null)}
                className="btn-brutal bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black font-mono font-bold text-xs uppercase px-4 py-3 shadow-brutal flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Wipe all dummy & registered teams across entire database"
              >
                <Trash2 className="w-4 h-4 text-red-700" /> PURGE ALL TEAMS (ENTIRE DB)
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sessions & Live Submissions */}
          <div className="lg:col-span-7 space-y-8">
            {/* Sessions Table Card */}
            <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6">
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <h3 className="font-syne font-black text-lg uppercase tracking-tight text-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B35]" /> LAB {selectedLab} SESSIONS
                </h3>
                <span className="text-xs font-mono text-gray-500">
                  Total: {sessions.length} tapes
                </span>
              </div>

              {sessions.length === 0 ? (
                <p className="font-mono text-sm text-gray-500 py-6 text-center">
                  No sessions broadcast yet in Lab {selectedLab}. Create one above!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-[#101010] text-[#FFF9F3] text-xs font-mono uppercase tracking-wider">
                        <th className="p-2.5 border border-black">#</th>
                        <th className="p-2.5 border border-black">Start Time</th>
                        <th className="p-2.5 border border-black">Status</th>
                        <th className="p-2.5 border border-black">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono divide-y divide-black">
                      {sessions.map((session, index) => (
                        <tr
                          key={session?.id}
                          className="hover:bg-[#FFFDF9] transition-colors"
                        >
                          <td className="p-2.5 font-bold border border-black">
                            {index + 1}
                          </td>
                          <td className="p-2.5 border border-black">
                            {new Date(session?.start_time).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </td>
                          <td className="p-2.5 border border-black">
                            <span
                              className={`px-2 py-0.5 border border-black font-black uppercase text-[10px] ${
                                session?.status === "active"
                                  ? "bg-[#9AE885] text-black animate-pulse"
                                  : session?.status === "completed"
                                  ? "bg-gray-200 text-gray-600"
                                  : "bg-[#C1F8FF] text-black"
                              }`}
                            >
                              {session?.status}
                            </span>
                          </td>
                          <td className="p-2.5 border border-black space-x-1.5 whitespace-nowrap">
                            {session?.status === "scheduled" && (
                              <button
                                onClick={() => startSession(session?.id)}
                                className="bg-[#9AE885] hover:bg-[#88d973] text-black border border-black font-bold px-2 py-1 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                                title="Start Session"
                              >
                                <Play className="w-3 h-3 inline mr-1" /> START
                              </button>
                            )}
                            {session?.status === "active" && (
                              <button
                                onClick={() => endSession(session?.id)}
                                className="bg-[#FF6B35] hover:bg-[#ff8050] text-white border border-black font-bold px-2 py-1 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                                title="End Session"
                              >
                                <Square className="w-3 h-3 inline mr-1" /> END
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedSession(session);
                                fetchSessionScores(session?.id);
                              }}
                              className="bg-[#FFD12E] hover:bg-[#FFE57F] text-black border border-black font-bold px-2 py-1 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                              title="View Scores"
                            >
                              <Eye className="w-3 h-3 inline mr-1" /> SCORES
                            </button>
                            <button
                              onClick={() => deleteSession(session?.id)}
                              className="bg-white hover:bg-red-50 text-red-600 border border-black font-bold px-2 py-1 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3 h-3 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected Session Scoreboard Card */}
            {selectedSession && (
              <div className="card-brutal bg-[#FFFDF9] border-3 border-black shadow-brutal-lg p-5 sm:p-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-[#FFD12E] text-black border border-black px-1.5 py-0.5 uppercase">
                      TAPE RESULTS
                    </span>
                    <h4 className="font-syne font-black text-lg uppercase tracking-tight text-black mt-1">
                      SESSION SCOREBOARD
                    </h4>
                  </div>
                  <span className="font-mono text-xs text-gray-600">
                    {new Date(selectedSession.start_time).toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-[#101010] text-[#FFF9F3] text-xs font-mono uppercase">
                        <th className="p-2.5 border border-black">Squad &amp; Contestants</th>
                        <th className="p-2.5 border border-black text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                      {Object.keys(sessionScores[selectedSession.id] || {}).length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="p-4 text-center text-gray-500"
                          >
                            No submissions recorded for this session yet.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(
                          sessionScores[selectedSession.id] || {}
                        ).map(([teamName, score], idx) => {
                          const matchedTeam = teams.find((t) => t.name === teamName);
                          return (
                            <tr
                              key={teamName}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-[#FFF9F3]"
                              }
                            >
                              <td className="p-2.5 font-bold border border-black">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-syne font-black text-black">
                                    {teamName}
                                  </span>
                                  {matchedTeam?.lab && (
                                    <span className="bg-[#FFD12E] text-black border border-black px-1.5 py-0.2 text-[9px] font-mono font-bold">
                                      LAB {matchedTeam.lab}
                                    </span>
                                  )}
                                </div>
                                {matchedTeam && (matchedTeam.participant1_name || matchedTeam.participant2_name) && (
                                  <span className="block text-[10px] font-normal text-gray-600 mt-0.5">
                                    {matchedTeam.participant1_name}
                                    {matchedTeam.participant2_name ? ` & ${matchedTeam.participant2_name}` : ""}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-black text-[#FF6B35] border border-black text-right">
                                {score} PTS
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Realtime Submissions Card */}
            <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6">
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <h3 className="font-syne font-black text-lg uppercase tracking-tight text-black flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF6B35] animate-bounce" /> LIVE ARENA SUBMISSIONS
                </h3>
                <span className="bg-[#9AE885] text-black text-[10px] font-mono font-bold px-2 py-0.5 border border-black">
                  REAL-TIME SYNC
                </span>
              </div>

              {realtimeSubmissions.length === 0 ? (
                <p className="font-mono text-sm text-gray-500 py-4 text-center">
                  Waiting for active player submissions...
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-[#101010] text-[#FFF9F3] text-xs font-mono uppercase">
                        <th className="p-2.5 border border-black">Participant &amp; Squad</th>
                        <th className="p-2.5 border border-black text-center">Score Incr</th>
                        <th className="p-2.5 border border-black text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono divide-y divide-black">
                      {realtimeSubmissions.map((submission, index) => (
                        <tr key={index} className="hover:bg-[#FFFDF9]">
                          <td className="p-2.5 border border-black">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-black text-xs">
                                {submission.playerName || "Contestant"}
                              </span>
                              <span className="bg-[#C1F8FF] text-black border border-black px-1.5 py-0.2 text-[10px] font-mono font-bold">
                                {submission.teamName}
                              </span>
                              {submission.lab && (
                                <span className="bg-gray-100 text-gray-700 border border-gray-300 px-1 py-0.2 text-[9px] font-mono">
                                  Lab {submission.lab}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 font-black text-green-700 border border-black text-center">
                            +{submission.score}
                          </td>
                          <td className="p-2.5 text-gray-600 border border-black text-right font-mono text-[11px]">
                            {submission.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Global Tournament Leaderboard */}
          <div className="lg:col-span-5">
            <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6 sticky top-6">
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <h3 className="font-syne font-black text-lg uppercase tracking-tight text-black flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FFD12E]" /> TOURNAMENT SQUADS &amp; SCORES
                </h3>
                <span className="bg-[#FF6B35] text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-black">
                  {teams.length} SQUADS
                </span>
              </div>

              <p className="font-mono text-xs text-gray-600 mb-3">
                Manage registered teams in the database. You can delete test or dummy teams individually below.
              </p>

              {/* Team Search / Filter Input */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter squad by name..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-black pl-8 pr-2.5 py-1.5 font-mono text-xs outline-none focus:bg-[#FFF9E6]"
                />
              </div>

              {teams.filter((t) => (t.name || "").toLowerCase().includes(teamSearchQuery.toLowerCase())).length === 0 ? (
                <p className="font-mono text-sm text-gray-500 py-6 text-center">
                  {teams.length === 0 ? "No teams registered yet." : "No squads match your search filter."}
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse border border-black">
                    <thead>
                      <tr className="bg-[#101010] text-[#FFF9F3] text-xs font-mono uppercase sticky top-0 z-10">
                        <th className="p-2 border border-black">#</th>
                        <th className="p-2 border border-black">Team</th>
                        <th className="p-2 border border-black">Score</th>
                        <th className="p-2 border border-black">Lab</th>
                        <th className="p-2 border border-black text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                      {teams
                        .filter((t) => (t.name || "").toLowerCase().includes(teamSearchQuery.toLowerCase()))
                        .map((team, idx) => {
                          let rankPill = "bg-white text-black";
                          if (idx === 0) rankPill = "bg-[#FFD12E] text-black font-black";
                          else if (idx === 1) rankPill = "bg-[#C1F8FF] text-black font-black";
                          else if (idx === 2) rankPill = "bg-[#FE90E9] text-black font-black";

                          return (
                            <tr
                              key={team.id}
                              className={`border-b border-black ${
                                team.lab === selectedLab ? "bg-[#FFF9E6]" : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="p-2 border border-black text-center">
                                <span
                                  className={`inline-block w-6 h-6 leading-5 border border-black text-center text-xs ${rankPill}`}
                                >
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="p-2 border border-black font-bold">
                                {team.name}
                                <span className="block text-[10px] font-normal text-gray-500">
                                  {team.player_count || (team.participant2_name ? 2 : (team.participant1_name ? 1 : 0))} players {team.id ? `• ID: ${team.id}` : ""}
                                </span>
                                {(team.participant1_name || team.participant2_name) && (
                                  <span className="block text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-xs">
                                    {team.participant1_name}{team.participant2_name ? ` & ${team.participant2_name}` : ""}
                                  </span>
                                )}
                              </td>
                              <td className="p-2 border border-black font-black text-[#FF6B35]">
                                {team.score || 0}
                              </td>
                              <td className="p-2 border border-black">
                                <span className="bg-[#FFF9F3] border border-black px-1.5 py-0.5 text-[10px] font-bold">
                                  {team.lab ? `L${team.lab}` : "-"}
                                </span>
                              </td>
                              <td className="p-2 border border-black text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeam(team)}
                                  className="bg-white hover:bg-red-600 hover:text-white text-red-600 border border-black font-mono font-bold text-[10px] uppercase px-2 py-1 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-colors inline-flex items-center gap-1"
                                  title={`Delete squad "${team.name}" from database`}
                                >
                                  <Trash2 className="w-3 h-3 flex-shrink-0" />
                                  <span>DEL</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  </div>
  );
}

