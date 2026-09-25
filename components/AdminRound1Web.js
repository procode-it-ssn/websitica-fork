"use client";
import { useState } from "react";
import { supabase } from "@/lib/client";
import { IS_MOCK_MODE } from "@/lib/mockData";
import {
  Palette,
  CheckCircle,
  Save,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

export default function AdminRound1Web({ teams = [], onTeamsUpdated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("all");
  const [editingScores, setEditingScores] = useState({});
  const [savingTeamId, setSavingTeamId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);

  const getTeamScoreState = (team) => {
    if (editingScores[team.id]) return editingScores[team.id];
    return {
      r1_web_ui: team.r1_web_ui || 0,
      r1_web_ux: team.r1_web_ux || 0,
      r1_web_tech: team.r1_web_tech || 0,
    };
  };

  const handleScoreChange = (teamId, field, value, maxVal) => {
    const num = Math.max(0, Math.min(maxVal, parseInt(value, 10) || 0));
    setEditingScores((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {
          r1_web_ui: teams.find((t) => t.id === teamId)?.r1_web_ui || 0,
          r1_web_ux: teams.find((t) => t.id === teamId)?.r1_web_ux || 0,
          r1_web_tech: teams.find((t) => t.id === teamId)?.r1_web_tech || 0,
        }),
        [field]: num,
      },
    }));
  };

  const adjustScore = (teamId, field, delta, maxVal) => {
    const current = getTeamScoreState(teams.find((t) => t.id === teamId));
    const newVal = Math.max(0, Math.min(maxVal, (current[field] || 0) + delta));
    handleScoreChange(teamId, field, newVal, maxVal);
  };

  const handleSaveScore = async (team) => {
    const current = getTeamScoreState(team);
    const r1_web_total =
      (current.r1_web_ui || 0) +
      (current.r1_web_ux || 0) +
      (current.r1_web_tech || 0);

    const codections = team.codections_score || team.score || 0;
    const bidding = team.bidding_score || 0;
    const r1_total_score = r1_web_total + codections + bidding;
    const r2_total = team.r2_total_score || 0;
    const grand_total_score = r1_total_score + r2_total;

    setSavingTeamId(team.id);

    if (IS_MOCK_MODE) {
      team.r1_web_ui = current.r1_web_ui;
      team.r1_web_ux = current.r1_web_ux;
      team.r1_web_tech = current.r1_web_tech;
      team.r1_web_total = r1_web_total;
      team.r1_total_score = r1_total_score;
      team.grand_total_score = grand_total_score;

      setTimeout(() => {
        setSavingTeamId(null);
        setSavedSuccessId(team.id);
        if (onTeamsUpdated) onTeamsUpdated();
        setTimeout(() => setSavedSuccessId(null), 2500);
      }, 300);
      return;
    }

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          r1_web_ui: current.r1_web_ui,
          r1_web_ux: current.r1_web_ux,
          r1_web_tech: current.r1_web_tech,
          r1_web_total: r1_web_total,
          r1_total_score: r1_total_score,
          grand_total_score: grand_total_score,
        })
        .eq("id", team.id);

      if (error) {
        console.error("Error saving R1 web score:", error);
      } else {
        setSavedSuccessId(team.id);
        if (onTeamsUpdated) onTeamsUpdated();
        setTimeout(() => setSavedSuccessId(null), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTeamId(null);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchLab =
      selectedLab === "all" || String(t.lab) === String(selectedLab);
    const matchQuery =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.participant1_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.participant2_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLab && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFFDF9] border-3 border-black shadow-brutal p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFD12E] border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <Palette className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-syne font-black text-xl sm:text-2xl uppercase tracking-tight text-black">
                  ROUND 1: CHAOS BY DESIGN (WEBSITE MARKING)
                </h2>
                <span className="bg-[#C1F8FF] border border-black text-[10px] font-mono font-bold px-2 py-0.5">
                  100 PTS MAX
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-0.5">
                Evaluation criteria per official guidelines: UI Design (30 pts) + Confusing UX (35 pts) + Technical Functionality (35 pts)
              </p>
            </div>
          </div>

          {/* Quick Criteria breakdown pill */}
          <div className="flex flex-wrap gap-2 text-[11px] font-mono font-bold">
            <span className="bg-[#FFD12E]/30 border border-black px-2 py-1">
              🎨 UI: /30
            </span>
            <span className="bg-[#FE90E9]/30 border border-black px-2 py-1">
              🌀 UX: /35
            </span>
            <span className="bg-[#9AE885]/30 border border-black px-2 py-1">
              ⚙️ TECH: /35
            </span>
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
              placeholder="Search squad name or participant..."
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
              <option value="all">ALL LABS</option>
              <option value="1">LAB 1 (OS LAB)</option>
              <option value="2">LAB 2 (SE LAB)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Marking Cards Grid */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <div className="bg-white border-2 border-black p-8 text-center">
            <p className="font-syne font-black text-base uppercase text-gray-500">
              No matching squads found.
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const current = getTeamScoreState(team);
            const total =
              (current.r1_web_ui || 0) +
              (current.r1_web_ux || 0) +
              (current.r1_web_tech || 0);
            const isSaving = savingTeamId === team.id;
            const isSuccess = savedSuccessId === team.id;

            return (
              <div
                key={team.id}
                className="bg-white border-3 border-black shadow-brutal p-4 sm:p-5 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-black/10 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-syne font-black text-lg sm:text-xl uppercase text-black">
                        {team.name}
                      </span>
                      <span className="bg-[#101010] text-[#9AE885] px-2 py-0.5 text-[10px] font-mono font-bold border border-black uppercase">
                        LAB {team.lab || 1}
                      </span>
                      {team.passkey && (
                        <span className="bg-[#FE90E9]/30 text-black px-2 py-0.5 text-[10px] font-mono font-bold border border-black uppercase">
                          KEY: {team.passkey}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      Contestants: <strong>{team.participant1_name || "Contestant 1"}</strong>
                      {team.participant2_name ? ` & ${team.participant2_name}` : " (Solo)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-gray-500 block">
                        R1 WEB TOTAL
                      </span>
                      <span className="font-syne font-black text-2xl text-black">
                        {total} <span className="text-sm text-gray-500 font-normal">/ 100</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveScore(team)}
                      className={`px-4 py-2 border-2 border-black font-syne font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-brutal transition-all cursor-pointer ${
                        isSuccess
                          ? "bg-[#9AE885] text-black"
                          : "bg-[#FFD12E] hover:bg-[#FFE066] text-black active:translate-x-0.5 active:translate-y-0.5"
                      }`}
                    >
                      {isSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-black" />
                          <span>SAVED!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-black" />
                          <span>{isSaving ? "SAVING..." : "SAVE MARKS"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3 Marking Criteria Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Criterion 1: UI Design (30) */}
                  <div className="p-3 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold font-syne uppercase text-black">
                        UI DESIGN (MAX 30)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r1_web_ui} / 30
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ui", -5, 30)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ui", -1, 30)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={current.r1_web_ui}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r1_web_ui", e.target.value, 30)
                        }
                        className="w-full text-center border-2 border-black py-1 font-mono font-black text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ui", 1, 30)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ui", 5, 30)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Criterion 2: Confusing UX (35) */}
                  <div className="p-3 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold font-syne uppercase text-black">
                        CONFUSING UX (MAX 35)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r1_web_ux} / 35
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ux", -5, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ux", -1, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="35"
                        value={current.r1_web_ux}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r1_web_ux", e.target.value, 35)
                        }
                        className="w-full text-center border-2 border-black py-1 font-mono font-black text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ux", 1, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_ux", 5, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Criterion 3: Tech Functionality (35) */}
                  <div className="p-3 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold font-syne uppercase text-black">
                        TECH FUNCTIONALITY (MAX 35)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r1_web_tech} / 35
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_tech", -5, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_tech", -1, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="35"
                        value={current.r1_web_tech}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r1_web_tech", e.target.value, 35)
                        }
                        className="w-full text-center border-2 border-black py-1 font-mono font-black text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_tech", 1, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r1_web_tech", 5, 35)}
                        className="px-2 py-1 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
