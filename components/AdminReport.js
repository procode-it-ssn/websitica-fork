"use client";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/client";
import { IS_MOCK_MODE } from "@/lib/mockData";
import {
  Trophy,
  Download,
  Search,
  KeyRound,
  Crown,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tv,
  ArrowUpDown,
  Filter,
  Users,
  Award,
  Zap,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

export default function AdminReport({ teams = [], onTeamsUpdated }) {
  const [labFilter, setLabFilter] = useState("all"); // "all" | "1" | "2"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("grand"); // "grand" | "r1" | "codections" | "web" | "bidding" | "r2"
  const [showQualifiedOnly, setShowQualifiedOnly] = useState(false);
  const [customTopCount, setCustomTopCount] = useState("10");
  const [isUpdatingQual, setIsUpdatingQual] = useState(false);
  const [qualSuccessMsg, setQualSuccessMsg] = useState("");
  const [presentationMode, setPresentationMode] = useState(false);

  // Process and compute all round scores
  const processedTeams = useMemo(() => {
    return teams.map((team) => {
      const p1Score = team.participant1_score || 0;
      const p2Score = team.participant2_score || 0;
      const codections =
        team.codections_score || (p1Score + p2Score) || team.score || 0;

      const r1WebUI = team.r1_web_ui || 0;
      const r1WebUX = team.r1_web_ux || 0;
      const r1WebTech = team.r1_web_tech || 0;
      const r1WebTotal = team.r1_web_total || (r1WebUI + r1WebUX + r1WebTech) || 0;

      const bidding = team.bidding_score || 0;
      const r1Total = team.r1_total_score || (r1WebTotal + codections + bidding) || 0;

      const r2Accuracy = team.r2_accuracy || 0;
      const r2Responsive = team.r2_responsiveness || 0;
      const r2Code = team.r2_code_quality || 0;
      const r2Comm = team.r2_communication || 0;
      const r2Aura = team.r2_aura_points || 0;
      const r2Total =
        team.r2_total_score ||
        (r2Accuracy + r2Responsive + r2Code + r2Comm + r2Aura) ||
        0;

      const grandTotal = team.grand_total_score || (r1Total + r2Total) || 0;

      return {
        ...team,
        p1Score,
        p2Score,
        calculatedCodections: codections,
        r1WebUI,
        r1WebUX,
        r1WebTech,
        calculatedR1WebTotal: r1WebTotal,
        calculatedBidding: bidding,
        calculatedR1Total: r1Total,
        calculatedR2Total: r2Total,
        calculatedGrandTotal: grandTotal,
      };
    });
  }, [teams]);

  // Sort teams according to the selected criteria
  const sortedTeams = useMemo(() => {
    const list = [...processedTeams];
    list.sort((a, b) => {
      if (sortBy === "r1") {
        return b.calculatedR1Total - a.calculatedR1Total;
      }
      if (sortBy === "codections") {
        return b.calculatedCodections - a.calculatedCodections;
      }
      if (sortBy === "web") {
        return b.calculatedR1WebTotal - a.calculatedR1WebTotal;
      }
      if (sortBy === "bidding") {
        return b.calculatedBidding - a.calculatedBidding;
      }
      if (sortBy === "r2") {
        return b.calculatedR2Total - a.calculatedR2Total;
      }
      return b.calculatedGrandTotal - a.calculatedGrandTotal;
    });
    return list;
  }, [processedTeams, sortBy]);

  // Filtered teams based on search, lab, and qualification status
  const filteredTeams = useMemo(() => {
    return sortedTeams.filter((team) => {
      if (labFilter !== "all" && String(team.lab) !== String(labFilter)) {
        return false;
      }
      if (showQualifiedOnly && !team.is_r2_qualified) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        team.name?.toLowerCase().includes(q) ||
        team.passkey?.toLowerCase().includes(q) ||
        team.participant1_name?.toLowerCase().includes(q) ||
        team.participant2_name?.toLowerCase().includes(q)
      );
    });
  }, [sortedTeams, labFilter, showQualifiedOnly, searchQuery]);

  // Tournament statistics
  const totalTeamsCount = teams.length;
  const qualifiedCount = teams.filter((t) => t.is_r2_qualified).length;
  const highestScore =
    sortedTeams.length > 0 ? sortedTeams[0].calculatedGrandTotal : 0;
  const averageScore =
    sortedTeams.length > 0
      ? Math.round(
          sortedTeams.reduce((acc, t) => acc + t.calculatedGrandTotal, 0) /
            sortedTeams.length
        )
      : 0;

  // Find index of the last qualified team to render the cutoff divider
  const lastQualifiedIndex = useMemo(() => {
    let lastIdx = -1;
    filteredTeams.forEach((t, idx) => {
      if (t.is_r2_qualified) lastIdx = idx;
    });
    return lastIdx;
  }, [filteredTeams]);

  // Toggle single team qualification
  const handleToggleQualify = async (team) => {
    const newStatus = !team.is_r2_qualified;
    setIsUpdatingQual(true);

    if (IS_MOCK_MODE) {
      team.is_r2_qualified = newStatus;
      setIsUpdatingQual(false);
      if (onTeamsUpdated) onTeamsUpdated();
      return;
    }

    try {
      const { error } = await supabase
        .from("teams")
        .update({ is_r2_qualified: newStatus })
        .eq("id", team.id);

      if (error) throw error;
      setQualSuccessMsg(
        `Squad "${team.name}" is now ${newStatus ? "QUALIFIED for Round 2" : "UNQUALIFIED"}.`
      );
      setTimeout(() => setQualSuccessMsg(""), 3000);
      if (onTeamsUpdated) onTeamsUpdated();
    } catch (err) {
      console.error("Error updating qualification:", err);
      alert("Failed to update squad qualification: " + err.message);
    } finally {
      setIsUpdatingQual(false);
    }
  };

  // Qualify top N squads based on the current sorted leaderboard
  const handleQualifyTopN = async (count) => {
    if (sortedTeams.length === 0) return;
    const targetCount = Math.min(count, sortedTeams.length);
    const topSquads = sortedTeams.slice(0, targetCount);
    const topIds = topSquads.map((t) => t.id);

    const confirmMsg = `Are you sure you want to select the TOP ${targetCount} teams for Round 2 Finals?\n\nThis will mark them as QUALIFIED and set remaining teams as UNQUALIFIED.`;
    if (!window.confirm(confirmMsg)) return;

    setIsUpdatingQual(true);

    if (IS_MOCK_MODE) {
      teams.forEach((t) => {
        t.is_r2_qualified = topIds.includes(t.id);
      });
      setIsUpdatingQual(false);
      setQualSuccessMsg(`Top ${targetCount} squads qualified for Round 2!`);
      setTimeout(() => setQualSuccessMsg(""), 3500);
      if (onTeamsUpdated) onTeamsUpdated();
      return;
    }

    try {
      // 1. Mark top N squads as qualified
      const { error: err1 } = await supabase
        .from("teams")
        .update({ is_r2_qualified: true })
        .in("id", topIds);

      if (err1) throw err1;

      // 2. Mark remaining squads as not qualified
      const otherSquads = teams.filter((t) => !topIds.includes(t.id));
      if (otherSquads.length > 0) {
        const otherIds = otherSquads.map((t) => t.id);
        const { error: err2 } = await supabase
          .from("teams")
          .update({ is_r2_qualified: false })
          .in("id", otherIds);
        if (err2) throw err2;
      }

      setQualSuccessMsg(`Top ${targetCount} squads successfully qualified for Round 2!`);
      setTimeout(() => setQualSuccessMsg(""), 3500);
      if (onTeamsUpdated) onTeamsUpdated();
    } catch (err) {
      console.error("Error qualifying top squads:", err);
      alert("Failed to qualify squads: " + err.message);
    } finally {
      setIsUpdatingQual(false);
    }
  };

  // Reset all qualifications
  const handleResetAllQualified = async () => {
    if (!window.confirm("Are you sure you want to reset ALL team qualifications?")) return;
    setIsUpdatingQual(true);

    if (IS_MOCK_MODE) {
      teams.forEach((t) => {
        t.is_r2_qualified = false;
      });
      setIsUpdatingQual(false);
      if (onTeamsUpdated) onTeamsUpdated();
      return;
    }

    try {
      const { error } = await supabase
        .from("teams")
        .update({ is_r2_qualified: false })
        .gte("id", 0);

      if (error) throw error;
      setQualSuccessMsg("All squad qualifications have been reset.");
      setTimeout(() => setQualSuccessMsg(""), 3000);
      if (onTeamsUpdated) onTeamsUpdated();
    } catch (err) {
      console.error("Error resetting qualifications:", err);
      alert("Failed to reset qualifications: " + err.message);
    } finally {
      setIsUpdatingQual(false);
    }
  };

  // Export to Excel file (.xlsx) with all round details
  const handleExportToExcel = () => {
    if (filteredTeams.length === 0) {
      alert("No squad data available to export.");
      return;
    }

    const exportRows = filteredTeams.map((team, index) => ({
      "Rank": index + 1,
      "Squad Name": team.name,
      "Secret Passkey": team.passkey || "N/A",
      "Lab Arena": `Lab ${team.lab || 1}`,
      "Participant 1": team.participant1_name || "N/A",
      "P1 Codections Score": team.p1Score,
      "Participant 2": team.participant2_name || "(Solo)",
      "P2 Codections Score": team.p2Score,
      "Total Codections Score": team.calculatedCodections,
      "R1 Web UI (/30)": team.r1WebUI,
      "R1 Web UX (/35)": team.r1WebUX,
      "R1 Web Tech (/35)": team.r1WebTech,
      "R1 Web Total (/100)": team.calculatedR1WebTotal,
      "R1 Bidding Score": team.calculatedBidding,
      "Round 1 Combined Score": team.calculatedR1Total,
      "Round 2 Qualified": team.is_r2_qualified ? "QUALIFIED" : "NO",
      "R2 Accuracy (/30)": team.r2_accuracy || 0,
      "R2 Responsiveness (/20)": team.r2_responsiveness || 0,
      "R2 Code Quality (/20)": team.r2_code_quality || 0,
      "R2 Communication (/15)": team.r2_communication || 0,
      "R2 Aura Points (/15)": team.r2_aura_points || 0,
      "R2 Finals Total (/100)": team.calculatedR2Total,
      "Grand Tournament Total": team.calculatedGrandTotal,
      "Export Date": new Date().toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    const columnWidths = [
      { wch: 10 }, // Rank
      { wch: 24 }, // Squad Name
      { wch: 16 }, // Passkey
      { wch: 12 }, // Lab
      { wch: 22 }, // P1
      { wch: 16 }, // P1 Score
      { wch: 22 }, // P2
      { wch: 16 }, // P2 Score
      { wch: 20 }, // Codections Total
      { wch: 14 }, // UI
      { wch: 14 }, // UX
      { wch: 14 }, // Tech
      { wch: 18 }, // Web Total
      { wch: 16 }, // Bidding
      { wch: 20 }, // R1 Combined
      { wch: 18 }, // R2 Qualified
      { wch: 16 }, // R2 Acc
      { wch: 18 }, // R2 Resp
      { wch: 18 }, // R2 Code
      { wch: 18 }, // R2 Comm
      { wch: 16 }, // R2 Aura
      { wch: 20 }, // R2 Finals Total
      { wch: 22 }, // Grand Total
      { wch: 20 }, // Export Date
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Websitica_Leaderboard"
    );

    const labSuffix = labFilter === "all" ? "All_Labs" : `Lab_${labFilter}`;
    const filename = `Websitica_Leaderboard_${labSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner & Tournament Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border-3 border-black bg-white p-4 shadow-brutal">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">
            REGISTERED SQUADS
          </span>
          <p className="font-syne font-black text-3xl text-black mt-1">
            {totalTeamsCount}
          </p>
        </div>

        <div className="border-3 border-black bg-[#9AE885] p-4 shadow-brutal">
          <span className="text-[10px] font-bold text-black uppercase block">
            ROUND 2 QUALIFIED
          </span>
          <p className="font-syne font-black text-3xl text-black mt-1">
            {qualifiedCount} <span className="text-xs font-mono">SQUADS</span>
          </p>
        </div>

        <div className="border-3 border-black bg-[#FFD12E] p-4 shadow-brutal">
          <span className="text-[10px] font-bold text-black uppercase block">
            ARENA HIGH SCORE ({sortBy.toUpperCase()})
          </span>
          <p className="font-syne font-black text-3xl text-black mt-1">
            {highestScore} <span className="text-xs font-mono">PTS</span>
          </p>
        </div>

        <div className="border-3 border-black bg-[#C1F8FF] p-4 shadow-brutal flex flex-col justify-between">
          <span className="text-[10px] font-bold text-black uppercase block">
            AVERAGE TOURNAMENT SCORE
          </span>
          <p className="font-syne font-black text-3xl text-black mt-1">
            {averageScore} <span className="text-xs font-mono">PTS</span>
          </p>
        </div>
      </div>

      {/* Main Leaderboard & Qualification Control Deck */}
      <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD12E] border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-syne font-black text-2xl uppercase tracking-tight text-black flex items-center gap-2">
                <span>MASTER LEADERBOARD &amp; NEXT ROUND QUALIFIER</span>
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase">
                Ranked by highest score to lowest • Select teams for Round 2 Finals &amp; live presentation
              </p>
            </div>
          </div>

          {/* Action Buttons: Presentation Mode & Excel Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPresentationMode(true)}
              className="bg-[#C1F8FF] hover:bg-[#A6F1FF] text-black font-syne font-black text-xs py-2.5 px-3.5 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all uppercase flex items-center gap-1.5 cursor-pointer"
              title="Open Fullscreen Projector Scoreboard"
            >
              <Tv className="w-4 h-4 text-black" />
              <span>PROJECTOR SCOREBOARD</span>
            </button>

            <button
              onClick={handleExportToExcel}
              className="bg-[#9AE885] hover:bg-[#85DE6E] text-black font-syne font-black text-xs py-2.5 px-3.5 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-all uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>EXPORT EXCEL (.XLSX)</span>
            </button>
          </div>
        </div>

        {/* Qualification Success Notification */}
        {qualSuccessMsg && (
          <div className="p-3 border-2 border-black bg-[#9AE885]/30 mb-4 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-black">
              <CheckCircle2 className="w-4 h-4 text-[#2F855A]" />
              <span>{qualSuccessMsg}</span>
            </div>
            <button
              onClick={() => setQualSuccessMsg("")}
              className="text-black font-black text-xs hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* BATCH QUALIFICATION CONTROLS PANEL */}
        <div className="border-2 border-black bg-[#FFFDF0] p-4 mb-5 shadow-brutal-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="font-syne font-black text-sm uppercase text-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" /> ROUND 2 ADVANCEMENT SELECTOR
              </span>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                Automatically select the highest-scoring squads according to current rank and qualify them for Round 2.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isUpdatingQual}
                onClick={() => handleQualifyTopN(5)}
                className="bg-[#FFD12E] hover:bg-[#FFE57F] text-black font-mono font-bold text-[11px] px-2.5 py-1.5 border border-black shadow-[1px_1px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                QUALIFY TOP 5
              </button>
              <button
                type="button"
                disabled={isUpdatingQual}
                onClick={() => handleQualifyTopN(10)}
                className="bg-[#C1F8FF] hover:bg-[#A6F1FF] text-black font-mono font-bold text-[11px] px-2.5 py-1.5 border border-black shadow-[1px_1px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                QUALIFY TOP 10
              </button>
              <button
                type="button"
                disabled={isUpdatingQual}
                onClick={() => handleQualifyTopN(16)}
                className="bg-[#FE90E9] hover:bg-[#FFAEF2] text-black font-mono font-bold text-[11px] px-2.5 py-1.5 border border-black shadow-[1px_1px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                QUALIFY TOP 16
              </button>

              <div className="flex items-center border border-black bg-white">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customTopCount}
                  onChange={(e) => setCustomTopCount(e.target.value)}
                  className="w-12 text-center text-xs font-mono font-bold py-1 outline-none"
                  placeholder="N"
                />
                <button
                  type="button"
                  disabled={isUpdatingQual || !customTopCount}
                  onClick={() => handleQualifyTopN(parseInt(customTopCount, 10) || 10)}
                  className="bg-black text-white px-2 py-1 text-[11px] font-bold hover:bg-gray-800 cursor-pointer disabled:opacity-50"
                >
                  QUALIFY TOP
                </button>
              </div>

              <button
                type="button"
                disabled={isUpdatingQual || qualifiedCount === 0}
                onClick={handleResetAllQualified}
                className="bg-white hover:bg-red-50 text-red-600 font-mono font-bold text-[11px] px-2.5 py-1.5 border border-black shadow-[1px_1px_0px_#101010] cursor-pointer disabled:opacity-40"
              >
                RESET ALL
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar: Sort Selector + Search + Lab Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad name, passkey, or contestant..."
              className="w-full border-2 border-black bg-[#FFFDF9] pl-9 pr-3 py-1.5 text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none shadow-brutal-sm"
            />
            <Search className="w-4 h-4 text-black absolute left-2.5 top-2 pointer-events-none" />
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-1 border-2 border-black p-1 bg-[#FFF9F3] text-xs font-bold flex-wrap">
            <span className="text-[10px] text-gray-500 uppercase px-1">SORT:</span>
            <button
              onClick={() => setSortBy("grand")}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                sortBy === "grand"
                  ? "bg-black text-white"
                  : "hover:bg-black/10 text-black"
              }`}
            >
              GRAND TOTAL
            </button>
            <button
              onClick={() => setSortBy("r1")}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                sortBy === "r1"
                  ? "bg-black text-white"
                  : "hover:bg-black/10 text-black"
              }`}
            >
              R1 TOTAL
            </button>
            <button
              onClick={() => setSortBy("codections")}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                sortBy === "codections"
                  ? "bg-black text-white"
                  : "hover:bg-black/10 text-black"
              }`}
            >
              CODECTIONS
            </button>
            <button
              onClick={() => setSortBy("web")}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                sortBy === "web"
                  ? "bg-black text-white"
                  : "hover:bg-black/10 text-black"
              }`}
            >
              WEB UI
            </button>
            <button
              onClick={() => setSortBy("r2")}
              className={`px-2 py-0.5 text-[10px] uppercase font-bold transition-all cursor-pointer ${
                sortBy === "r2"
                  ? "bg-black text-white"
                  : "hover:bg-black/10 text-black"
              }`}
            >
              R2 FINALS
            </button>
          </div>

          {/* Lab Segmented Tabs & Show Qualified Checkbox */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 border-2 border-black p-1 bg-[#FFF9F3] text-xs font-bold">
              <button
                onClick={() => setLabFilter("all")}
                className={`px-2.5 py-0.5 text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  labFilter === "all"
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/10"
                }`}
              >
                ALL ({totalTeamsCount})
              </button>
              <button
                onClick={() => setLabFilter("1")}
                className={`px-2 py-0.5 text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  labFilter === "1"
                    ? "bg-[#FFD12E] text-black border border-black"
                    : "text-black hover:bg-black/10"
                }`}
              >
                LAB 1
              </button>
              <button
                onClick={() => setLabFilter("2")}
                className={`px-2 py-0.5 text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  labFilter === "2"
                    ? "bg-[#C1F8FF] text-black border border-black"
                    : "text-black hover:bg-black/10"
                }`}
              >
                LAB 2
              </button>
            </div>

            <button
              onClick={() => setShowQualifiedOnly(!showQualifiedOnly)}
              className={`px-2.5 py-1 border-2 border-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showQualifiedOnly
                  ? "bg-[#9AE885] text-black shadow-brutal-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>QUALIFIED ONLY ({qualifiedCount})</span>
            </button>
          </div>
        </div>

        {/* Master Leaderboard Table */}
        {filteredTeams.length === 0 ? (
          <div className="border-2 border-black bg-[#FFFDF0] p-8 text-center">
            <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-bold text-sm uppercase text-black">No squads found.</p>
            <p className="text-xs text-gray-500 mt-1">
              Squads will automatically appear here once registered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-black shadow-brutal-sm">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-[#101010] text-[#FFF9F3] text-[11px] font-mono uppercase sticky top-0 z-10">
                  <th className="p-2.5 border-b-2 border-black text-center w-12">#</th>
                  <th className="p-2.5 border-b-2 border-black">Squad &amp; Lab</th>
                  <th className="p-2.5 border-b-2 border-black">Contestants &amp; Individual Scores</th>
                  <th className="p-2.5 border-b-2 border-black text-right">Codections</th>
                  <th className="p-2.5 border-b-2 border-black text-right">R1 Web</th>
                  <th className="p-2.5 border-b-2 border-black text-right">Bidding</th>
                  <th className="p-2.5 border-b-2 border-black text-right">R1 Total</th>
                  <th className="p-2.5 border-b-2 border-black text-right">R2 Finals</th>
                  <th className="p-2.5 border-b-2 border-black text-right font-black text-[#FFD12E]">
                    Grand Total
                  </th>
                  <th className="p-2.5 border-b-2 border-black text-center">Round 2 Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-black/20">
                {filteredTeams.map((team, idx) => {
                  let rankBadge = "bg-white text-black border border-black";
                  if (idx === 0)
                    rankBadge =
                      "bg-[#FFD12E] text-black border-2 border-black font-black shadow-[1px_1px_0px_#101010]";
                  else if (idx === 1)
                    rankBadge =
                      "bg-[#C1F8FF] text-black border-2 border-black font-black shadow-[1px_1px_0px_#101010]";
                  else if (idx === 2)
                    rankBadge =
                      "bg-[#FE90E9] text-black border-2 border-black font-black shadow-[1px_1px_0px_#101010]";

                  const isQualified = team.is_r2_qualified;

                  return (
                    <tr
                      key={team.id}
                      className={`hover:bg-[#FFF9E6] transition-colors ${
                        isQualified
                          ? "bg-[#9AE885]/10"
                          : idx < 3
                          ? "bg-[#FFFDF5]"
                          : "bg-white"
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 text-xs font-syne ${rankBadge}`}
                        >
                          {idx === 0 ? <Crown className="w-3.5 h-3.5 text-black" /> : idx + 1}
                        </span>
                      </td>

                      {/* Squad Name & Lab */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-syne font-black text-sm uppercase text-black">
                            {team.name}
                          </span>
                          <span className="bg-gray-100 text-gray-700 border border-gray-300 px-1 py-0.2 text-[9px] font-mono font-bold">
                            L{team.lab || 1}
                          </span>
                        </div>
                        {team.passkey && (
                          <span className="inline-flex items-center gap-1 bg-[#FFF9A6] border border-black px-1.5 py-0.2 text-[9px] font-mono font-bold mt-0.5">
                            <KeyRound className="w-2.5 h-2.5" />
                            {team.passkey}
                          </span>
                        )}
                      </td>

                      {/* Contestants with Team Name Context */}
                      <td className="p-2.5">
                        <div className="font-bold text-black uppercase flex items-center justify-between text-[11px]">
                          <span>
                            1. {team.participant1_name || "Contestant 1"}
                          </span>
                          <span className="font-mono text-[#38A169] ml-2">
                            {team.p1Score} pts
                          </span>
                        </div>
                        {team.participant2_name ? (
                          <div className="font-bold text-gray-700 uppercase flex items-center justify-between text-[11px] mt-0.5">
                            <span>2. {team.participant2_name}</span>
                            <span className="font-mono text-[#D69E2E] ml-2">
                              {team.p2Score} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic block mt-0.5">
                            (Solo Squad)
                          </span>
                        )}
                      </td>

                      {/* Codections Total */}
                      <td className="p-2.5 font-bold text-right font-mono text-[#FF6B35]">
                        {team.calculatedCodections}
                      </td>

                      {/* R1 Web UI */}
                      <td className="p-2.5 text-right font-mono">
                        {team.calculatedR1WebTotal}
                      </td>

                      {/* Bidding */}
                      <td className="p-2.5 text-right font-mono">
                        {team.calculatedBidding}
                      </td>

                      {/* R1 Total */}
                      <td className="p-2.5 font-bold text-right font-mono text-black">
                        {team.calculatedR1Total}
                      </td>

                      {/* R2 Finals */}
                      <td className="p-2.5 font-bold text-right font-mono text-purple-700">
                        {team.calculatedR2Total}
                      </td>

                      {/* Grand Total */}
                      <td className="p-2.5 font-black text-right font-mono text-base text-[#101010]">
                        {team.calculatedGrandTotal}
                      </td>

                      {/* Round 2 Qualification Toggle Button */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          disabled={isUpdatingQual}
                          onClick={() => handleToggleQualify(team)}
                          className={`px-3 py-1 text-[10px] font-syne font-black uppercase border-2 border-black transition-all cursor-pointer ${
                            isQualified
                              ? "bg-[#9AE885] hover:bg-[#85DE6E] text-black shadow-[2px_2px_0px_#101010]"
                              : "bg-white hover:bg-gray-100 text-gray-600 border-dashed"
                          }`}
                        >
                          {isQualified ? "✓ QUALIFIED" : "+ QUALIFY"}
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

      {/* FULLSCREEN / PROJECTOR PRESENTATION SCOREBOARD MODAL */}
      {presentationMode && (
        <div className="fixed inset-0 z-50 bg-[#101010] text-white overflow-y-auto p-4 sm:p-8 flex flex-col justify-between animate-in fade-in">
          <div>
            {/* Projector Header */}
            <div className="flex items-center justify-between border-b-2 border-white/20 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#FFD12E]" />
                <div>
                  <h1 className="font-syne font-black text-2xl sm:text-4xl uppercase tracking-wider text-white">
                    WEBSITICA &apos;26 • LIVE ARENA SCOREBOARD
                  </h1>
                  <p className="font-mono text-xs sm:text-sm text-[#FFD12E] tracking-widest uppercase mt-0.5">
                    INVENTE TECHFEST • OFFICIAL TOURNAMENT STANDINGS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPresentationMode(false)}
                  className="bg-[#FF6B35] hover:bg-[#ff5519] text-white font-syne font-black px-4 py-2 text-sm border-2 border-white uppercase cursor-pointer"
                >
                  ✕ EXIT FULLSCREEN
                </button>
              </div>
            </div>

            {/* Scoreboard Table for Big Screen */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b-2 border-white/40 text-xs sm:text-sm uppercase text-[#FFD12E]">
                    <th className="py-3 px-4 text-center w-16">#</th>
                    <th className="py-3 px-4">Squad Name</th>
                    <th className="py-3 px-4">Contestant Participants</th>
                    <th className="py-3 px-4 text-center">Lab</th>
                    <th className="py-3 px-4 text-right">Codections</th>
                    <th className="py-3 px-4 text-right">R1 Total</th>
                    <th className="py-3 px-4 text-right text-white font-black text-base">Grand Score</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm sm:text-base">
                  {sortedTeams.slice(0, 20).map((team, idx) => {
                    let rankColor = "text-white";
                    if (idx === 0) rankColor = "text-[#FFD12E] font-black text-xl";
                    else if (idx === 1) rankColor = "text-[#C1F8FF] font-black text-xl";
                    else if (idx === 2) rankColor = "text-[#FE90E9] font-black text-xl";

                    return (
                      <tr
                        key={team.id}
                        className={`hover:bg-white/5 transition-colors ${
                          team.is_r2_qualified ? "bg-[#9AE885]/10" : ""
                        }`}
                      >
                        <td className={`py-3 px-4 text-center font-syne ${rankColor}`}>
                          {idx === 0 ? "👑 1" : idx + 1}
                        </td>
                        <td className="py-3 px-4 font-syne font-black uppercase text-white text-lg">
                          {team.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          <span className="font-bold text-white">
                            {team.participant1_name || "Contestant 1"}
                          </span>
                          {team.participant2_name && (
                            <span className="text-gray-400"> &amp; {team.participant2_name}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-white/10 px-2 py-0.5 text-xs font-bold uppercase border border-white/20">
                            L{team.lab || 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-[#FF6B35] font-bold">
                          {team.calculatedCodections}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">
                          {team.calculatedR1Total}
                        </td>
                        <td className="py-3 px-4 text-right font-syne font-black text-xl text-[#9AE885]">
                          {team.calculatedGrandTotal}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {team.is_r2_qualified ? (
                            <span className="bg-[#9AE885] text-black px-2.5 py-1 text-xs font-black uppercase border border-black">
                              ✓ QUALIFIED FOR FINALS
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs font-mono">
                              IN PLAY
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mt-6 flex justify-between items-center text-xs text-gray-400">
            <span>SSN COLLEGE OF ENGINEERING × SHIV NADAR UNIVERSITY CHENNAI</span>
            <span>PRESS ESC OR CLICK EXIT TO RETURN TO ADMIN CONSOLE</span>
          </div>
        </div>
      )}
    </div>
  );
}
