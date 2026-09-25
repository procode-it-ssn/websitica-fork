"use client";
import { useState } from "react";
import { supabase } from "@/lib/client";
import { IS_MOCK_MODE } from "@/lib/mockData";
import {
  Gamepad2,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Save,
  Users,
  Award,
  Zap,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function AdminCodections({ teams = [], onTeamsUpdated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("all");
  const [copiedKey, setCopiedKey] = useState(null);
  const [editingScores, setEditingScores] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);

  const copyToClipboard = (text, id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const generateRandomKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "WS-";
    for (let i = 0; i < 4; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleRegenerateKey = async (team) => {
    const newKey = generateRandomKey();
    try {
      localStorage.setItem("websitica_passkey_" + (team.name || "").toLowerCase(), newKey);
      localStorage.setItem("websitica_passkey_id_" + team.id, newKey);
    } catch (e) {}

    if (IS_MOCK_MODE) {
      team.passkey = newKey;
      if (onTeamsUpdated) onTeamsUpdated();
      return;
    }

    try {
      await supabase.from("teams").update({ passkey: newKey }).eq("id", team.id);
      if (onTeamsUpdated) onTeamsUpdated();
    } catch (e) {
      console.error(e);
      if (onTeamsUpdated) onTeamsUpdated();
    }
  };

  const handleDeleteSquad = async (team) => {
    if (!team) return;
    const confirmMsg = `Are you sure you want to permanently delete squad "${team.name}" (ID: ${team.id})?\n\nThis will remove their passkey, submissions, and players from the database.`;
    if (!window.confirm(confirmMsg)) return;

    if (IS_MOCK_MODE) {
      if (onTeamsUpdated) onTeamsUpdated();
      return;
    }

    try {
      await supabase.from("submissions").delete().eq("team_id", team.id);
      await supabase.from("players").delete().eq("team_id", team.id);
      try {
        await supabase
          .from("candidates")
          .update({ team_id: null, team_name: null })
          .eq("team_id", team.id);
      } catch (e) {}
      await supabase.from("teams").delete().eq("id", team.id);
      try {
        localStorage.removeItem("websitica_passkey_" + (team.name || "").toLowerCase());
        localStorage.removeItem("websitica_passkey_id_" + team.id);
      } catch (e) {}
      if (onTeamsUpdated) onTeamsUpdated();
    } catch (err) {
      console.error("Error deleting squad:", err);
      alert("Failed to delete squad: " + (err.message || "Unknown error"));
    }
  };

  const handleScoreChange = (teamId, field, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    setEditingScores((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {
          p1: teams.find((t) => t.id === teamId)?.participant1_score || 0,
          p2: teams.find((t) => t.id === teamId)?.participant2_score || 0,
        }),
        [field]: val,
      },
    }));
  };

  const adjustScore = (teamId, field, delta) => {
    const current = editingScores[teamId] || {
      p1: teams.find((t) => t.id === teamId)?.participant1_score || 0,
      p2: teams.find((t) => t.id === teamId)?.participant2_score || 0,
    };
    const newVal = Math.max(0, (current[field] || 0) + delta);
    handleScoreChange(teamId, field, newVal);
  };

  const handleSaveScores = async (team) => {
    const current = editingScores[team.id] || {
      p1: team.participant1_score || 0,
      p2: team.participant2_score || 0,
    };

    const codections_score = (current.p1 || 0) + (current.p2 || 0);
    const r1_web = team.r1_web_total || 0;
    const bidding = team.bidding_score || 0;
    const r1_total_score = r1_web + codections_score + bidding;
    const r2_total = team.r2_total_score || 0;
    const grand_total_score = r1_total_score + r2_total;

    setSavingId(team.id);

    if (IS_MOCK_MODE) {
      team.participant1_score = current.p1;
      team.participant2_score = current.p2;
      team.codections_score = codections_score;
      team.score = codections_score;
      team.r1_total_score = r1_total_score;
      team.grand_total_score = grand_total_score;

      setTimeout(() => {
        setSavingId(null);
        setSavedSuccessId(team.id);
        if (onTeamsUpdated) onTeamsUpdated();
        setTimeout(() => setSavedSuccessId(null), 2500);
      }, 300);
      return;
    }

    try {
      await supabase
        .from("teams")
        .update({
          participant1_score: current.p1,
          participant2_score: current.p2,
          codections_score: codections_score,
          score: codections_score,
          r1_total_score: r1_total_score,
          grand_total_score: grand_total_score,
        })
        .eq("id", team.id);

      setSavedSuccessId(team.id);
      setTimeout(() => setSavedSuccessId(null), 2500);
      if (onTeamsUpdated) onTeamsUpdated();
    } catch (err) {
      console.error(err);
      alert("Error saving Codections score: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchLab =
      selectedLab === "all" || String(t.lab) === String(selectedLab);
    const matchQuery =
      !searchQuery.trim() ||
      (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.passkey || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.participant1_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.participant2_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchLab && matchQuery;
  });

  // Summary Metrics
  const totalCodectionsPoints = teams.reduce(
    (acc, t) => acc + (t.codections_score || t.score || 0),
    0
  );
  const highestSquadScore = teams.reduce(
    (max, t) => Math.max(max, t.codections_score || t.score || 0),
    0
  );
  const topSquad = teams.find(
    (t) => (t.codections_score || t.score || 0) === highestSquadScore && highestSquadScore > 0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF9] border-3 border-black shadow-brutal p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#9AE885] border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-syne font-black text-xl sm:text-2xl uppercase tracking-tight text-black">
                  ROUND 1: CODECTIONS MATRIX
                </h2>
                <span className="bg-[#FFD12E] border border-black text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                  LIVE SCORE TRACKER
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-0.5">
                In-game 4x4 word grid scores are automatically tracked &amp; saved here in real-time. Admins can view, adjust, or manually override scores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#9AE885] text-black border border-black px-2.5 py-1 text-xs font-mono font-bold flex items-center gap-1.5 shadow-brutal-sm">
              <Activity className="w-3.5 h-3.5 animate-pulse text-black" />
              AUTO-SYNC ACTIVE
            </span>
          </div>
        </div>

        {/* 4 Quick Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border-2 border-black p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono uppercase text-gray-500 block font-bold">
              ACTIVE SQUADS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-[#FF6B35]" />
              <span className="font-syne font-black text-xl text-black">
                {teams.length}
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono uppercase text-gray-500 block font-bold">
              TOTAL CODECTIONS PTS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="w-4 h-4 text-[#FFD12E]" />
              <span className="font-syne font-black text-xl text-black">
                {totalCodectionsPoints}
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono uppercase text-gray-500 block font-bold">
              ARENA HIGH SCORE
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Award className="w-4 h-4 text-[#9AE885]" />
              <span className="font-syne font-black text-xl text-black">
                {highestSquadScore} pts
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-3 shadow-brutal-sm">
            <span className="text-[10px] font-mono uppercase text-gray-500 block font-bold">
              TOP SQUAD
            </span>
            <div className="flex items-center gap-2 mt-1 truncate">
              <TrendingUp className="w-4 h-4 text-[#FE90E9] flex-shrink-0" />
              <span className="font-syne font-black text-sm text-black truncate">
                {topSquad ? topSquad.name : "None yet"}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-black absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad name, passkey, or participant..."
              className="w-full border-2 border-black bg-white pl-9 pr-3 py-2 text-xs font-mono font-bold focus:bg-[#FFF9A6] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-black flex-shrink-0" />
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full border-2 border-black bg-white py-2 px-3 text-xs font-mono font-bold uppercase focus:outline-none"
            >
              <option value="all">ALL LABS ({teams.length})</option>
              <option value="1">LAB 1 - OS LAB ({teams.filter((t) => t.lab === 1).length})</option>
              <option value="2">LAB 2 - SE LAB ({teams.filter((t) => t.lab === 2).length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Squad Scoring Cards Grid */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <div className="bg-white border-2 border-black p-8 text-center shadow-brutal">
            <p className="font-syne font-black text-base uppercase text-gray-500">
              {teams.length === 0
                ? "No teams registered yet. Teams will appear here automatically upon registration!"
                : "No matching squads found for this filter."}
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const currentScores = editingScores[team.id] || {
              p1: team.participant1_score || 0,
              p2: team.participant2_score || 0,
            };
            const total = (currentScores.p1 || 0) + (currentScores.p2 || 0);
            const isSaving = savingId === team.id;
            const isSaved = savedSuccessId === team.id;

            const activePasskey =
              team.passkey ||
              (typeof window !== "undefined"
                ? localStorage.getItem("websitica_passkey_" + (team.name || "").toLowerCase()) ||
                  localStorage.getItem("websitica_passkey_id_" + team.id)
                : null) ||
              "NOT SET";

            return (
              <div
                key={team.id}
                className="bg-white border-3 border-black shadow-brutal p-5 sm:p-6 transition-all hover:border-black"
              >
                {/* Squad Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-black/15 pb-4 mb-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-syne font-black text-xl sm:text-2xl uppercase text-black tracking-tight">
                          {team.name}
                        </span>
                        <span className="bg-[#101010] text-[#9AE885] px-2.5 py-0.5 text-xs font-mono font-bold border border-black uppercase">
                          {team.lab ? `LAB ${team.lab}` : "UNASSIGNED"}
                        </span>
                        {team.id && (
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-300 px-1.5 py-0.5">
                            ID: {team.id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Passkey Pill */}
                    <div className="flex items-center gap-1.5 bg-[#FFF9A6] border-2 border-black px-3 py-1 shadow-brutal-sm">
                      <KeyRound className="w-3.5 h-3.5 text-black" />
                      <span className="text-[10px] font-mono font-bold uppercase text-gray-600">
                        PASSKEY:
                      </span>
                      <strong className="font-mono text-xs tracking-wider font-black text-black">
                        {activePasskey}
                      </strong>
                      {activePasskey !== "NOT SET" && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activePasskey, team.id)}
                          className="p-1 hover:bg-black/10 transition-colors ml-1 cursor-pointer"
                          title="Copy Passkey"
                        >
                          {copiedKey === team.id ? (
                            <Check className="w-3.5 h-3.5 text-[#38A169]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-black" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRegenerateKey(team)}
                        className="p-1 hover:bg-black/10 transition-colors cursor-pointer"
                        title="Regenerate Passkey"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-black" />
                      </button>
                    </div>
                  </div>

                  {/* Header Right: Total Codections Score Badge & Save Button */}
                  <div className="flex items-center gap-3">
                    <div className="text-right bg-[#FFFDF0] border-2 border-black px-3 py-1.5 shadow-brutal-sm">
                      <span className="text-[10px] font-mono uppercase text-gray-600 font-bold block">
                        SQUAD CODECTIONS TOTAL
                      </span>
                      <span className="font-syne font-black text-2xl text-[#FF6B35]">
                        {total} <span className="text-xs text-gray-500 font-normal">pts</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveScores(team)}
                      className={`px-4 py-2.5 border-2 border-black font-syne font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-brutal active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all ${
                        isSaved
                          ? "bg-[#9AE885] text-black"
                          : "bg-[#FFD12E] hover:bg-[#ffe066] text-black"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span>SAVED ✓</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-black" />
                          <span>{isSaving ? "SAVING..." : "SAVE SCORE"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSquad(team)}
                      className="p-2 border-2 border-black bg-white hover:bg-red-600 hover:text-white text-red-600 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-colors"
                      title={`Delete squad "${team.name}"`}
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Individual Participant Interactive Scoring Deck */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Participant 1 */}
                  <div className="p-4 bg-[#FFFDF9] border-2 border-black shadow-brutal-sm">
                    <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#38A169] border border-black" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                            CONTESTANT 1
                          </span>
                          <strong className="font-syne font-black text-sm uppercase text-black block">
                            {team.participant1_name || "Contestant 1"}
                          </strong>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-black text-black bg-[#9AE885] border border-black px-2 py-0.5">
                        {currentScores.p1} pts
                      </span>
                    </div>

                    {/* Numeric Input & Quick Step Buttons */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={currentScores.p1}
                          onChange={(e) =>
                            handleScoreChange(team.id, "p1", e.target.value)
                          }
                          className="w-full border-2 border-black py-1.5 px-3 font-mono font-black text-base bg-white focus:bg-[#FFF9A6] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustScore(team.id, "p1", -50)}
                          className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-[10px] font-mono font-bold active:translate-y-0.5 cursor-pointer"
                        >
                          -50
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustScore(team.id, "p1", -10)}
                          className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-[10px] font-mono font-bold active:translate-y-0.5 cursor-pointer"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustScore(team.id, "p1", +10)}
                          className="px-2 py-1 border border-black bg-[#C1F8FF] hover:bg-[#A8F3FF] text-[10px] font-mono font-bold active:translate-y-0.5 cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustScore(team.id, "p1", +50)}
                          className="px-2 py-1 border border-black bg-[#9AE885] hover:bg-[#88D973] text-[10px] font-mono font-bold active:translate-y-0.5 cursor-pointer"
                        >
                          +50
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustScore(team.id, "p1", +100)}
                          className="px-2 py-1 border border-black bg-[#FFD12E] hover:bg-[#FFE066] text-[10px] font-mono font-bold active:translate-y-0.5 cursor-pointer"
                        >
                          +100
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Participant 2 */}
                  <div className="p-4 bg-[#FFFDF9] border-2 border-black shadow-brutal-sm">
                    <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#FE90E9] border border-black" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                            CONTESTANT 2
                          </span>
                          <strong className="font-syne font-black text-sm uppercase text-black block">
                            {team.participant2_name || "(Solo / Not Assigned)"}
                          </strong>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-black text-black bg-[#FE90E9] border border-black px-2 py-0.5">
                        {currentScores.p2} pts
                      </span>
                    </div>

                    {/* Numeric Input & Quick Step Buttons */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          disabled={!team.participant2_name}
                          value={currentScores.p2}
                          onChange={(e) =>
                            handleScoreChange(team.id, "p2", e.target.value)
                          }
                          className="w-full border-2 border-black py-1.5 px-3 font-mono font-black text-base bg-white focus:bg-[#FFF9A6] focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={!team.participant2_name}
                          onClick={() => adjustScore(team.id, "p2", -50)}
                          className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-[10px] font-mono font-bold active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        >
                          -50
                        </button>
                        <button
                          type="button"
                          disabled={!team.participant2_name}
                          onClick={() => adjustScore(team.id, "p2", -10)}
                          className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-[10px] font-mono font-bold active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          disabled={!team.participant2_name}
                          onClick={() => adjustScore(team.id, "p2", +10)}
                          className="px-2 py-1 border border-black bg-[#C1F8FF] hover:bg-[#A8F3FF] text-[10px] font-mono font-bold active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          disabled={!team.participant2_name}
                          onClick={() => adjustScore(team.id, "p2", +50)}
                          className="px-2 py-1 border border-black bg-[#9AE885] hover:bg-[#88D973] text-[10px] font-mono font-bold active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        >
                          +50
                        </button>
                        <button
                          type="button"
                          disabled={!team.participant2_name}
                          onClick={() => adjustScore(team.id, "p2", +100)}
                          className="px-2 py-1 border border-black bg-[#FFD12E] hover:bg-[#FFE066] text-[10px] font-mono font-bold active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        >
                          +100
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Calculation Equation Footer */}
                <div className="mt-4 pt-3 border-t border-dashed border-gray-300 flex flex-wrap items-center justify-between text-xs font-mono text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 border border-black px-2 py-0.5 font-bold">
                      Formula: P1 ({currentScores.p1}) + P2 ({currentScores.p2}) = {total} Codections Pts
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Grand Total Impact: R1 Web ({team.r1_web_total || 0}) + Codections ({total}) + Bidding ({team.bidding_score || 0}) = {(team.r1_web_total || 0) + total + (team.bidding_score || 0)} pts
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
