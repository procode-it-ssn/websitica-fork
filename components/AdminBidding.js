"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/client";
import {
  Trophy,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";
import { IS_MOCK_MODE, MOCK_TEAMS } from "@/lib/mockData";

export default function AdminBidding({ teams = [], onTeamsUpdated }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || "");
  const [questionNum, setQuestionNum] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [biddingLogs, setBiddingLogs] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update selected team if teams prop changes and no team is selected
  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = teams.find((t) => String(t.id) === String(selectedTeamId)) || teams[0];

  const codectionsScore = selectedTeam?.codections_score ?? selectedTeam?.score ?? 0;
  const biddingScore = selectedTeam?.bidding_score ?? 0;
  const totalScore = selectedTeam?.total_score ?? (codectionsScore + biddingScore);

  // Apply points delta to selected team's bidding score
  const applyPoints = async (delta, label) => {
    if (!selectedTeam) return;

    setIsUpdating(true);
    const newBidding = biddingScore + delta;
    const r1Web = selectedTeam.r1_web_total || (selectedTeam.r1_web_ui || 0) + (selectedTeam.r1_web_ux || 0) + (selectedTeam.r1_web_tech || 0);
    const codections = selectedTeam.codections_score || (selectedTeam.participant1_score || 0) + (selectedTeam.participant2_score || 0) || selectedTeam.score || 0;
    const newR1Total = r1Web + codections + newBidding;
    const r2Total = selectedTeam.r2_total_score || 0;
    const newGrandTotal = newR1Total + r2Total;

    // Local optimistic update
    selectedTeam.bidding_score = newBidding;
    selectedTeam.total_score = newR1Total;
    selectedTeam.r1_total_score = newR1Total;
    selectedTeam.grand_total_score = newGrandTotal;

    const logEntry = {
      id: "log-" + Date.now(),
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      question: questionNum,
      delta,
      newBidding,
      newTotal: newR1Total,
      label: label || (delta > 0 ? `+${delta}` : `${delta}`),
      timestamp: new Date().toLocaleTimeString(),
    };

    setBiddingLogs((prev) => [logEntry, ...prev.slice(0, 19)]);

    if (!IS_MOCK_MODE) {
      try {
        const { error: teamErr } = await supabase
          .from("teams")
          .update({
            bidding_score: newBidding,
            total_score: newR1Total,
            r1_total_score: newR1Total,
            grand_total_score: newGrandTotal,
          })
          .eq("id", selectedTeam.id);

        if (teamErr) {
          console.warn("Retrying legacy update:", teamErr);
          await supabase
            .from("teams")
            .update({ score: newR1Total })
            .eq("id", selectedTeam.id);
        }

        // Insert log in bidding_history
        try {
          await supabase.from("bidding_history").insert({
            team_id: selectedTeam.id,
            question_number: questionNum,
            points_delta: delta,
            score_after: newBidding,
            note: label || `Question ${questionNum}`,
          });
        } catch (hErr) {
          // ignore if table not present
        }
      } catch (err) {
        console.error("Error updating bidding score:", err);
      }
    }

    setFeedback({
      type: delta >= 0 ? "positive" : "negative",
      text: `${selectedTeam.name}: ${delta >= 0 ? "+" + delta : delta} PTS (Bidding: ${newBidding} | Total: ${newR1Total})`,
    });

    if (autoAdvance) {
      setQuestionNum((prev) => prev + 1);
    }

    setIsUpdating(false);
    if (onTeamsUpdated) onTeamsUpdated();
  };

  // Reset bidding score to 0
  const handleResetBidding = async () => {
    if (!selectedTeam) return;
    if (
      !confirm(
        `Are you sure you want to RESET Bidding Score for "${selectedTeam.name}" to 0?`
      )
    ) {
      return;
    }

    const newBidding = 0;
    const r1Web = selectedTeam.r1_web_total || (selectedTeam.r1_web_ui || 0) + (selectedTeam.r1_web_ux || 0) + (selectedTeam.r1_web_tech || 0);
    const codections = selectedTeam.codections_score || (selectedTeam.participant1_score || 0) + (selectedTeam.participant2_score || 0) || selectedTeam.score || 0;
    const newR1Total = r1Web + codections;
    const r2Total = selectedTeam.r2_total_score || 0;
    const newGrandTotal = newR1Total + r2Total;

    selectedTeam.bidding_score = 0;
    selectedTeam.total_score = newR1Total;
    selectedTeam.r1_total_score = newR1Total;
    selectedTeam.grand_total_score = newGrandTotal;

    if (!IS_MOCK_MODE) {
      try {
        await supabase
          .from("teams")
          .update({
            bidding_score: 0,
            total_score: newR1Total,
            r1_total_score: newR1Total,
            grand_total_score: newGrandTotal,
          })
          .eq("id", selectedTeam.id);
      } catch (e) {}
    }

    setFeedback({
      type: "neutral",
      text: `Reset bidding score for ${selectedTeam.name} to 0 PTS.`,
    });
    if (onTeamsUpdated) onTeamsUpdated();
  };

  // Undo last action for selected team
  const handleUndo = async () => {
    const lastLog = biddingLogs.find((l) => l.teamId === selectedTeam?.id);
    if (!lastLog) {
      alert("No recent action to undo for this team.");
      return;
    }

    // Reverse the delta
    await applyPoints(-lastLog.delta, `Undo Q${lastLog.question}`);
    setBiddingLogs((prev) => prev.filter((l) => l.id !== lastLog.id));
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner Alert */}
      {feedback && (
        <div
          className={`p-3.5 border-2 border-black flex items-center justify-between shadow-brutal text-xs font-bold ${
            feedback.type === "positive"
              ? "bg-[#9AE885] text-black"
              : feedback.type === "negative"
              ? "bg-[#FF8080] text-black"
              : "bg-[#C1F8FF] text-black"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-black underline uppercase cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Grid: Control Deck + Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Bidding Arena */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. TEAM SELECTOR & QUESTION TRACKER */}
          <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-4 mb-5">
              <div>
                <span className="bg-[#FF6B35] text-white text-[10px] font-mono font-black px-2 py-0.5 border border-black uppercase tracking-wider">
                  ROUND 2 • OFFLINE EVENT
                </span>
                <h2 className="font-syne font-black text-2xl uppercase tracking-tight text-black mt-1">
                  BIDDING ARENA SCORING DESK
                </h2>
              </div>

              {/* Question Number Stepper */}
              <div className="flex items-center gap-2 border-2 border-black bg-[#FFF9F3] p-1.5 shadow-brutal-sm">
                <span className="text-[10px] font-bold text-gray-500 uppercase px-1">
                  CURRENT QUESTION:
                </span>
                <button
                  type="button"
                  onClick={() => setQuestionNum((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 bg-white border border-black flex items-center justify-center font-black hover:bg-gray-100 cursor-pointer text-xs"
                >
                  -
                </button>
                <span className="font-syne font-black text-sm px-2 text-black bg-[#FFD12E] border border-black py-0.5">
                  Q {questionNum}
                </span>
                <button
                  type="button"
                  onClick={() => setQuestionNum((q) => q + 1)}
                  className="w-7 h-7 bg-white border border-black flex items-center justify-center font-black hover:bg-gray-100 cursor-pointer text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Team Picker Dropdown & Quick Badges */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  SELECT TARGET TEAM SQUAD:
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full border-2 border-black bg-[#FFFDF9] px-3 py-2 font-mono text-sm font-bold text-black focus:bg-[#FFF9A6] focus:outline-none shadow-brutal-sm cursor-pointer"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Lab {t.lab}) • [Bidding: {t.bidding_score || 0} pts] • [Total: {t.total_score || t.score || 0} pts]
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Team Cards Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`flex-shrink-0 px-3 py-1.5 border-2 border-black text-left transition-all cursor-pointer ${
                      String(t.id) === String(selectedTeamId)
                        ? "bg-[#FFD12E] shadow-[2px_2px_0px_#101010] translate-x-0.5 translate-y-0.5"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-bold text-xs uppercase block text-black truncate max-w-[130px]">
                      {t.name}
                    </span>
                    <span className="text-[9px] text-gray-600 block">
                      Bid: <strong>{t.bidding_score || 0}</strong> • Tot: <strong>{t.total_score || t.score || 0}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. THREE-WAY LIVE SCORE METERS */}
          {selectedTeam && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Round 1 Codections */}
              <div className="border-3 border-black bg-white p-4 shadow-brutal relative">
                <span className="bg-[#C1F8FF] border border-black text-[9px] font-black px-1.5 py-0.5 uppercase block w-fit mb-1">
                  ROUND 1 • CODECTIONS
                </span>
                <p className="font-syne font-black text-3xl text-black">
                  {codectionsScore} <span className="text-xs font-mono text-gray-500">PTS</span>
                </p>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                  Automatic Game Score
                </p>
              </div>

              {/* Round 2 Bidding */}
              <div className="border-3 border-black bg-[#FFFDF0] p-4 shadow-brutal relative">
                <span className="bg-[#FFD12E] border border-black text-[9px] font-black px-1.5 py-0.5 uppercase block w-fit mb-1">
                  ROUND 2 • BIDDING ARENA
                </span>
                <p className="font-syne font-black text-3xl text-[#FF6B35]">
                  {biddingScore >= 0 ? `+${biddingScore}` : biddingScore}{" "}
                  <span className="text-xs font-mono text-gray-500">PTS</span>
                </p>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                  Offline Live Score
                </p>
              </div>

              {/* Total Final Score */}
              <div className="border-3 border-black bg-[#9AE885] p-4 shadow-brutal relative">
                <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase block w-fit mb-1">
                  COMBINED FINAL TOTAL
                </span>
                <p className="font-syne font-black text-3xl text-black">
                  {totalScore} <span className="text-xs font-mono text-black/70">PTS</span>
                </p>
                <p className="text-[10px] text-black/80 font-bold mt-1 uppercase">
                  Tournament Rank Score
                </p>
              </div>
            </div>
          )}

          {/* 3. INTERACTIVE GRAPHICAL MARKING CONTROLS */}
          <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h3 className="font-syne font-black text-lg uppercase text-black">
                  ONE-CLICK SCORING CONSOLE
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  CLICK PRESETS TO INSTANTLY UPDATE SCORE WITHOUT TYPING
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase select-none">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="w-4 h-4 border-2 border-black accent-[#FFD12E] cursor-pointer"
                />
                <span>AUTO-ADVANCE QUESTION (Q{questionNum} ➔ Q{questionNum + 1})</span>
              </label>
            </div>

            {/* POSITIVE MARKS SECTION */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38A169]" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  POSITIVE MARKS (CORRECT BIDS &amp; BONUSES):
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(10, `Q${questionNum}: Standard Correct`)}
                  className="py-3 px-2 border-2 border-black bg-[#9AE885] hover:bg-[#85DE6E] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  +10 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">NORMAL</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(20, `Q${questionNum}: High Bid Correct`)}
                  className="py-3 px-2 border-2 border-black bg-[#C1F8FF] hover:bg-[#A9F4FF] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  +20 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">HIGH BID</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(5, `Q${questionNum}: Bonus Pass`)}
                  className="py-3 px-2 border-2 border-black bg-[#FFF9A6] hover:bg-[#FFF275] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  +5 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">BONUS</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(15, `Q${questionNum}: Tier-2 Correct`)}
                  className="py-3 px-2 border-2 border-black bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  +15 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">TIER 2</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(25, `Q${questionNum}: Max Bid Hit`)}
                  className="py-3 px-2 border-2 border-black bg-[#FE90E9] hover:bg-[#FD70E4] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  +25 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">MAX BID</span>
                </button>
              </div>
            </div>

            {/* NEGATIVE MARKS SECTION */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53E3E]" />
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  NEGATIVE MARKS (WRONG BIDS &amp; PENALTIES):
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(-5, `Q${questionNum}: Standard Wrong`)}
                  className="py-3 px-2 border-2 border-black bg-[#FFA8A8] hover:bg-[#FF9494] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  -5 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">NORMAL</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(-10, `Q${questionNum}: High Bid Wrong`)}
                  className="py-3 px-2 border-2 border-black bg-[#FF8080] hover:bg-[#FF6B6B] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  -10 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">HIGH BID</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(-2, `Q${questionNum}: Minor Infraction`)}
                  className="py-3 px-2 border-2 border-black bg-[#FFD1B3] hover:bg-[#FFBE94] text-black font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  -2 PTS
                  <span className="block text-[8px] font-mono font-bold text-black/70">MINOR</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(-15, `Q${questionNum}: Tier-2 Penalty`)}
                  className="py-3 px-2 border-2 border-black bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  -15 PTS
                  <span className="block text-[8px] font-mono font-bold text-white/80">TIER 2</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => applyPoints(-20, `Q${questionNum}: Severe Penalty`)}
                  className="py-3 px-2 border-2 border-black bg-[#C92A2A] hover:bg-[#B02525] text-white font-syne font-black text-sm uppercase shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all text-center cursor-pointer"
                >
                  -20 PTS
                  <span className="block text-[8px] font-mono font-bold text-white/80">SEVERE</span>
                </button>
              </div>
            </div>

            {/* FINE TUNING STEPPERS & RECOVERY */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-black/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  STEPPERS:
                </span>
                <button
                  type="button"
                  onClick={() => applyPoints(1, `Q${questionNum}: +1 Fine-tune`)}
                  className="px-2.5 py-1 bg-white border border-black text-xs font-bold hover:bg-gray-100 shadow-[1px_1px_0px_#101010] cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => applyPoints(-1, `Q${questionNum}: -1 Fine-tune`)}
                  className="px-2.5 py-1 bg-white border border-black text-xs font-bold hover:bg-gray-100 shadow-[1px_1px_0px_#101010] cursor-pointer"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => applyPoints(5, `Q${questionNum}: +5 Stepper`)}
                  className="px-2.5 py-1 bg-white border border-black text-xs font-bold hover:bg-gray-100 shadow-[1px_1px_0px_#101010] cursor-pointer"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => applyPoints(-5, `Q${questionNum}: -5 Stepper`)}
                  className="px-2.5 py-1 bg-white border border-black text-xs font-bold hover:bg-gray-100 shadow-[1px_1px_0px_#101010] cursor-pointer"
                >
                  -5
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-3 py-1 bg-white border border-black text-xs font-bold hover:bg-gray-100 shadow-[1px_1px_0px_#101010] cursor-pointer uppercase flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>UNDO LAST</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetBidding}
                  className="px-3 py-1 bg-red-100 border border-black text-red-700 hover:bg-red-200 text-xs font-bold shadow-[1px_1px_0px_#101010] cursor-pointer uppercase"
                >
                  RESET TO 0
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Scoring Audit History Feed */}
        <div className="space-y-6">
          <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
              <History className="w-5 h-5 text-black" />
              <h3 className="font-syne font-black text-base uppercase text-black">
                LIVE SCORING AUDIT FEED
              </h3>
            </div>

            {biddingLogs.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-black/40 text-center text-xs text-gray-500 font-bold bg-[#FFFDF0]">
                No bidding scores logged yet. Select a team and press any point preset to mark scores.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {biddingLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 border-2 border-black shadow-[2px_2px_0px_#101010] flex items-center justify-between text-xs ${
                      log.delta >= 0 ? "bg-[#9AE885]/20" : "bg-[#FF8080]/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-black uppercase">{log.teamName}</span>
                        <span className="text-[9px] bg-black text-white px-1 py-0.2 font-mono">
                          Q{log.question}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600 block mt-0.5">
                        {log.label} • Bidding: {log.newBidding} pts • Total: {log.newTotal} pts
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`font-syne font-black text-sm ${
                          log.delta >= 0 ? "text-[#2F855A]" : "text-[#C53030]"
                        }`}
                      >
                        {log.delta >= 0 ? `+${log.delta}` : log.delta}
                      </span>
                      <span className="text-[8px] text-gray-400 block font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
