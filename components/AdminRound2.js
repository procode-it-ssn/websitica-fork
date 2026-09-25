"use client";
import { useState } from "react";
import { supabase } from "@/lib/client";
import { IS_MOCK_MODE } from "@/lib/mockData";
import {
  Rocket,
  CheckCircle,
  Save,
  Search,
  Filter,
  Trophy,
  Award,
  Zap,
} from "lucide-react";

export default function AdminRound2({ teams = [], onTeamsUpdated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("all");
  const [showQualifiedOnly, setShowQualifiedOnly] = useState(false);
  const [editingScores, setEditingScores] = useState({});
  const [savingTeamId, setSavingTeamId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);

  const getTeamScoreState = (team) => {
    if (editingScores[team.id]) return editingScores[team.id];
    return {
      is_r2_qualified: team.is_r2_qualified || false,
      r2_accuracy: team.r2_accuracy || 0,
      r2_responsiveness: team.r2_responsiveness || 0,
      r2_code_quality: team.r2_code_quality || 0,
      r2_communication: team.r2_communication || 0,
      r2_aura_points: team.r2_aura_points !== undefined ? team.r2_aura_points : 15,
    };
  };

  const handleScoreChange = (teamId, field, value, maxVal) => {
    const num = Math.max(0, Math.min(maxVal, parseInt(value, 10) || 0));
    setEditingScores((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || getTeamScoreState(teams.find((t) => t.id === teamId))),
        [field]: num,
      },
    }));
  };

  const toggleQualified = (teamId) => {
    const current = getTeamScoreState(teams.find((t) => t.id === teamId));
    setEditingScores((prev) => ({
      ...prev,
      [teamId]: {
        ...current,
        is_r2_qualified: !current.is_r2_qualified,
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
    const r2_total_score =
      (current.r2_accuracy || 0) +
      (current.r2_responsiveness || 0) +
      (current.r2_code_quality || 0) +
      (current.r2_communication || 0) +
      (current.r2_aura_points || 0);

    const codections = team.codections_score || (team.participant1_score || 0) + (team.participant2_score || 0) || team.score || 0;
    const r1Web = team.r1_web_total || (team.r1_web_ui || 0) + (team.r1_web_ux || 0) + (team.r1_web_tech || 0);
    const bidding = team.bidding_score || 0;
    const r1_total = team.r1_total_score || (r1Web + codections + bidding);
    const grand_total_score = r1_total + r2_total_score;

    setSavingTeamId(team.id);

    if (IS_MOCK_MODE) {
      team.is_r2_qualified = current.is_r2_qualified;
      team.r2_accuracy = current.r2_accuracy;
      team.r2_responsiveness = current.r2_responsiveness;
      team.r2_code_quality = current.r2_code_quality;
      team.r2_communication = current.r2_communication;
      team.r2_aura_points = current.r2_aura_points;
      team.r2_total_score = r2_total_score;
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
          is_r2_qualified: current.is_r2_qualified,
          r2_accuracy: current.r2_accuracy,
          r2_responsiveness: current.r2_responsiveness,
          r2_code_quality: current.r2_code_quality,
          r2_communication: current.r2_communication,
          r2_aura_points: current.r2_aura_points,
          r2_total_score: r2_total_score,
          grand_total_score: grand_total_score,
        })
        .eq("id", team.id);

      if (error) {
        console.error("Error saving R2 score:", error);
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
    const state = getTeamScoreState(t);
    if (showQualifiedOnly && !state.is_r2_qualified) return false;
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
            <div className="w-12 h-12 bg-[#FE90E9] border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <Rocket className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-syne font-black text-xl sm:text-2xl uppercase tracking-tight text-black">
                  ROUND 2: REPLICA RUSH (FINALS MARKING)
                </h2>
                <span className="bg-[#FFD12E] border border-black text-[10px] font-mono font-bold px-2 py-0.5">
                  TOP 10 ARENA • 100 PTS
                </span>
              </div>
              <p className="text-xs text-gray-600 font-mono mt-0.5">
                Top 10 qualifying teams replicate target UI/UX: Accuracy (30) + Responsiveness (20) + Code Quality (20) + Communication (15) + Aura (15)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQualifiedOnly(!showQualifiedOnly)}
              className={`px-3 py-1.5 border-2 border-black font-syne font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                showQualifiedOnly
                  ? "bg-[#9AE885] text-black shadow-brutal"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {showQualifiedOnly ? "✓ SHOWING QUALIFIED ONLY" : "SHOW ALL SQUADS"}
            </button>
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
              No squads match current filters.
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const current = getTeamScoreState(team);
            const total =
              (current.r2_accuracy || 0) +
              (current.r2_responsiveness || 0) +
              (current.r2_code_quality || 0) +
              (current.r2_communication || 0) +
              (current.r2_aura_points || 0);

            const isSaving = savingTeamId === team.id;
            const isSuccess = savedSuccessId === team.id;

            return (
              <div
                key={team.id}
                className={`bg-white border-3 border-black shadow-brutal p-4 sm:p-5 transition-all ${
                  current.is_r2_qualified ? "border-l-8 border-l-[#9AE885]" : "opacity-80"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-black/10 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-syne font-black text-lg sm:text-xl uppercase text-black">
                        {team.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleQualified(team.id)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold border border-black uppercase cursor-pointer transition-colors ${
                          current.is_r2_qualified
                            ? "bg-[#9AE885] text-black"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {current.is_r2_qualified ? "★ R2 QUALIFIED" : "+ QUALIFY SQUAD"}
                      </button>
                      <span className="bg-[#101010] text-[#9AE885] px-2 py-0.5 text-[10px] font-mono font-bold border border-black uppercase">
                        LAB {team.lab || 1}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      Contestants: <strong>{team.participant1_name || "Contestant 1"}</strong>
                      {team.participant2_name ? ` & ${team.participant2_name}` : " (Solo)"}
                      <span className="mx-2 text-gray-300">|</span>
                      R1 Total: <strong>{team.r1_total_score || team.score || 0} pts</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-gray-500 block">
                        R2 FINALS TOTAL
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
                          : "bg-[#FE90E9] hover:bg-[#FFA6EF] text-black active:translate-x-0.5 active:translate-y-0.5"
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
                          <span>{isSaving ? "SAVING..." : "SAVE R2 MARKS"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5 Marking Criteria Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Criterion 1: Accuracy (30) */}
                  <div className="p-2.5 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold font-syne uppercase text-black">
                        ACCURACY (/30)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r2_accuracy}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_accuracy", -1, 30)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={current.r2_accuracy}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r2_accuracy", e.target.value, 30)
                        }
                        className="w-full text-center border-2 border-black py-0.5 font-mono font-black text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_accuracy", 1, 30)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Criterion 2: Responsiveness (20) */}
                  <div className="p-2.5 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold font-syne uppercase text-black">
                        RESPONSIVE (/20)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r2_responsiveness}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_responsiveness", -1, 20)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={current.r2_responsiveness}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r2_responsiveness", e.target.value, 20)
                        }
                        className="w-full text-center border-2 border-black py-0.5 font-mono font-black text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_responsiveness", 1, 20)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Criterion 3: Code Quality (20) */}
                  <div className="p-2.5 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold font-syne uppercase text-black">
                        CODE (/20)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r2_code_quality}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_code_quality", -1, 20)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={current.r2_code_quality}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r2_code_quality", e.target.value, 20)
                        }
                        className="w-full text-center border-2 border-black py-0.5 font-mono font-black text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_code_quality", 1, 20)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Criterion 4: Communication (15) */}
                  <div className="p-2.5 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold font-syne uppercase text-black">
                        COMM (/15)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r2_communication}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_communication", -1, 15)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={current.r2_communication}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r2_communication", e.target.value, 15)
                        }
                        className="w-full text-center border-2 border-black py-0.5 font-mono font-black text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_communication", 1, 15)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Criterion 5: Aura Points (15) */}
                  <div className="p-2.5 bg-[#FFFDF9] border-2 border-black">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold font-syne uppercase text-black">
                        AURA (/15)
                      </label>
                      <span className="font-mono text-xs font-black text-black">
                        {current.r2_aura_points}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_aura_points", -1, 15)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={current.r2_aura_points}
                        onChange={(e) =>
                          handleScoreChange(team.id, "r2_aura_points", e.target.value, 15)
                        }
                        className="w-full text-center border-2 border-black py-0.5 font-mono font-black text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustScore(team.id, "r2_aura_points", 1, 15)}
                        className="px-1.5 py-0.5 border border-black bg-white hover:bg-gray-100 text-xs font-mono font-bold"
                      >
                        +1
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
