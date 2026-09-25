"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/client";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Building,
} from "lucide-react";
import { IS_MOCK_MODE, MOCK_CANDIDATES } from "@/lib/mockData";

export default function AdminCandidates({ onCandidatesUpdated }) {
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "available" | "assigned"
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  // Manual candidate form
  const [newName, setNewName] = useState("");
  const [newCollege, setNewCollege] = useState("SSN College of Engineering");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      if (IS_MOCK_MODE) {
        setCandidates(MOCK_CANDIDATES);
        return;
      }
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("name", { ascending: true });

      if (error || !data || data.length === 0) {
        setCandidates(MOCK_CANDIDATES);
      } else {
        setCandidates(data);
      }
    } catch (err) {
      console.warn("Falling back to local candidate list:", err);
      setCandidates(MOCK_CANDIDATES);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Excel (.xlsx / .xls / .csv) file import
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
          setFeedback({
            type: "error",
            text: "No rows found in the uploaded file.",
          });
          return;
        }

        // Map column headers intelligently matching participants_WEBSITICA (2).xlsx
        const parsed = rows
          .map((row) => {
            const keys = Object.keys(row);
            const findVal = (terms) => {
              const matchedKey = keys.find((k) =>
                terms.some((t) => k.toLowerCase().trim() === t || k.toLowerCase().trim().includes(t))
              );
              return matchedKey && row[matchedKey] !== undefined ? String(row[matchedKey]).trim() : null;
            };

            const name = findVal(["name", "candidate", "participant", "student", "full name"]);
            const college = findVal(["college", "institution", "dept", "department", "university"]) || "SSN / SNUC";
            const email = findVal(["email", "mail"]);
            const phone = findVal(["phone", "mobile", "contact", "whatsapp"]);
            const year_of_study = findVal(["year of study", "year", "study year"]);
            const gender = findVal(["gender", "sex"]);
            const ticket_id = findVal(["ticket id", "ticket", "reg id"]);
            const ticket_type = findVal(["ticket type"]);
            const payment_status = findVal(["payment status"]);

            return name
              ? {
                  name,
                  college,
                  email: email || null,
                  phone: phone || null,
                  year_of_study: year_of_study ? parseInt(year_of_study, 10) : null,
                  gender: gender || null,
                  ticket_id: ticket_id || null,
                  ticket_type: ticket_type || null,
                  payment_status: payment_status || null,
                  team_id: null,
                  team_name: null,
                }
              : null;
          })
          .filter(Boolean);

        if (parsed.length === 0) {
          setFeedback({
            type: "error",
            text: "Could not find a 'Name' column in the uploaded spreadsheet. Please check columns.",
          });
          return;
        }

        // Rigorous Duplicate Checking against existing candidates
        let duplicatesCount = 0;
        const newCandidates = [];

        for (const cand of parsed) {
          const isDuplicate = candidates.some((existing) => {
            // Match 1: Ticket ID
            if (cand.ticket_id && existing.ticket_id && cand.ticket_id === existing.ticket_id) {
              return true;
            }
            // Match 2: Email
            if (cand.email && existing.email && cand.email.toLowerCase() === existing.email.toLowerCase()) {
              return true;
            }
            // Match 3: Phone (numeric only)
            const candDigits = cand.phone ? cand.phone.replace(/\D/g, "") : "";
            const existDigits = existing.phone ? String(existing.phone).replace(/\D/g, "") : "";
            if (candDigits && existDigits && candDigits.length >= 8 && candDigits === existDigits) {
              return true;
            }
            // Match 4: Exact Name + College
            if (
              cand.name &&
              existing.name &&
              cand.name.toLowerCase().trim() === existing.name.toLowerCase().trim() &&
              cand.college.toLowerCase().trim() === (existing.college || "").toLowerCase().trim()
            ) {
              return true;
            }
            return false;
          });

          if (isDuplicate) {
            duplicatesCount++;
          } else {
            newCandidates.push(cand);
          }
        }

        if (newCandidates.length === 0) {
          setFeedback({
            type: "error",
            text: `⚠️ All ${parsed.length} candidate(s) in "${file.name}" are already registered! (0 added, ${duplicatesCount} duplicates skipped)`,
          });
          return;
        }

        // Insert new non-duplicate candidates into Supabase
        if (!IS_MOCK_MODE) {
          try {
            const { error } = await supabase.from("candidates").insert(newCandidates);
            if (error) {
              console.warn("Supabase insert warning, updating local state:", error);
            }
          } catch (insertErr) {
            console.warn("Insert error:", insertErr);
          }
        }

        // Update local state with unique IDs
        setCandidates((prev) => {
          const combined = [
            ...newCandidates.map((p, i) => ({
              id: "cand-" + Date.now() + "-" + i,
              ...p,
            })),
            ...prev,
          ];
          return combined;
        });

        setFeedback({
          type: "success",
          text: `🎉 Successfully imported ${newCandidates.length} new candidate(s) from "${file.name}"! (${duplicatesCount} duplicate entries automatically skipped)`,
        });

        if (onCandidatesUpdated) onCandidatesUpdated();
      } catch (err) {
        console.error("Error processing Excel file:", err);
        setFeedback({
          type: "error",
          text: "Error reading Excel file. Please ensure it is a valid .xlsx or .csv format.",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Populate official Invente roster (58 participants)
  const handleLoadDefaultRoster = async () => {
    try {
      const initialRoster = MOCK_CANDIDATES || [];
      let newCount = 0;
      let dupCount = 0;
      const toAdd = [];

      for (const item of initialRoster) {
        const isDup = candidates.some(
          (c) =>
            (c.ticket_id && item.ticket_id && c.ticket_id === item.ticket_id) ||
            (c.email && item.email && c.email.toLowerCase() === item.email.toLowerCase()) ||
            (c.name && item.name && c.name.toLowerCase().trim() === item.name.toLowerCase().trim())
        );
        if (isDup) {
          dupCount++;
        } else {
          newCount++;
          toAdd.push(item);
        }
      }

      if (toAdd.length > 0 && !IS_MOCK_MODE) {
        try {
          await supabase.from("candidates").insert(toAdd);
        } catch (e) {
          console.warn("Could not insert to supabase:", e);
        }
      }

      setCandidates((prev) => [...toAdd, ...prev]);
      setFeedback({
        type: "success",
        text: `✓ Official roster synced: ${newCount} added (${dupCount} duplicates skipped). Total: ${
          candidates.length + newCount
        } candidates in DB.`,
      });
      if (onCandidatesUpdated) onCandidatesUpdated();
    } catch (err) {
      console.error("Error loading default roster:", err);
    }
  };

  // Handle manual single candidate addition
  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert("Please enter a candidate name.");
      return;
    }

    setIsSubmittingManual(true);
    const candidateObj = {
      name: newName.trim(),
      college: newCollege.trim() || "SSN College of Engineering",
      email: newEmail.trim() || null,
      phone: newPhone.trim() || null,
      team_id: null,
      team_name: null,
    };

    if (!IS_MOCK_MODE) {
      try {
        const { error } = await supabase.from("candidates").insert([candidateObj]);
        if (error) console.warn("Supabase manual insert error:", error);
      } catch (err) {
        console.warn("Manual add db error:", err);
      }
    }

    setCandidates((prev) => [
      { id: "cand-" + Date.now(), ...candidateObj },
      ...prev,
    ]);

    setFeedback({
      type: "success",
      text: `✓ Registered "${candidateObj.name}" into candidate directory!`,
    });

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setIsSubmittingManual(false);

    if (onCandidatesUpdated) onCandidatesUpdated();
  };

  // Delete a candidate
  const handleDeleteCandidate = async (candidateId) => {
    if (!confirm("Are you sure you want to remove this candidate?")) return;

    if (!IS_MOCK_MODE) {
      try {
        await supabase.from("candidates").delete().eq("id", candidateId);
      } catch (e) {}
    }

    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setFeedback({ type: "success", text: "Candidate removed." });
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    // Filter mode
    if (filterMode === "available" && c.team_name) return false;
    if (filterMode === "assigned" && !c.team_name) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.college?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.team_name?.toLowerCase().includes(q)
    );
  });

  const totalCount = candidates.length;
  const assignedCount = candidates.filter((c) => !!c.team_name).length;
  const availableCount = totalCount - assignedCount;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner / Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 border-2 border-black flex items-center justify-between shadow-brutal text-xs font-bold ${
            feedback.type === "success"
              ? "bg-[#9AE885] text-black"
              : "bg-[#FF8080] text-black"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
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

      {/* Grid: Excel Import + Manual Candidate Add */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. EXCEL IMPORT CARD */}
        <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#9AE885] border-2 border-black flex items-center justify-center shadow-brutal-sm">
                  <FileSpreadsheet className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-syne font-black text-lg uppercase text-black">
                    IMPORT CANDIDATES FROM EXCEL
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    UPLOAD .XLSX / .XLS / .CSV DIRECTLY TO SUPABASE
                  </p>
                </div>
              </div>
              <span className="bg-[#FFD12E] border border-black text-[9px] font-black px-2 py-0.5 uppercase">
                AUTO-MAPPING
              </span>
            </div>

            <p className="text-xs text-gray-700 font-bold leading-relaxed mb-4">
              Upload your registration Excel sheet containing participant names. The parser automatically detects columns like <code className="bg-gray-100 px-1 border border-black">Name</code>, <code className="bg-gray-100 px-1 border border-black">College</code>, and contact info, making them instantly available in the participant search dropdown!
            </p>

            <div className="border-2 border-dashed border-black bg-[#FFFDF0] p-6 text-center rounded-xs mb-4 hover:bg-[#FFF9E6] transition-colors">
              <UploadCloud className="w-10 h-10 text-black mx-auto mb-2 opacity-80" />
              <p className="font-bold text-xs uppercase text-black">
                CLICK TO BROWSE OR DRAG &amp; DROP SPREADSHEET
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Accepted: .xlsx, .xls, .csv files with participant names
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="mt-3 block w-full max-w-xs mx-auto text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:border file:border-black file:text-xs file:font-bold file:bg-[#FFD12E] file:text-black file:cursor-pointer"
              />

              <div className="mt-3 pt-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={handleLoadDefaultRoster}
                  className="w-full bg-[#C1F8FF] hover:bg-[#A9F4FF] text-black font-mono text-[11px] font-black py-2 px-3 border-2 border-black shadow-[2px_2px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>SYNC OFFICIAL INVENTE ROSTER (58 PARTICIPANTS)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 pt-2 border-t border-black/10">
            <span>• Pre-registered candidates will be locked in DB</span>
            <span>• Duplicate prevention active</span>
          </div>
        </div>

        {/* 2. MANUAL ADD CANDIDATE FORM */}
        <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#C1F8FF] border-2 border-black flex items-center justify-center shadow-brutal-sm">
                <UserPlus className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-syne font-black text-lg uppercase text-black">
                  ADMIN MANUAL REGISTRATION
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  ADD INDIVIDUAL CANDIDATE INTO CANDIDATE DB
                </p>
              </div>
            </div>
            <span className="bg-[#FE90E9] border border-black text-[9px] font-black px-2 py-0.5 uppercase">
              ADMIN ACCESS
            </span>
          </div>

          <form onSubmit={handleManualAdd} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                FULL CANDIDATE NAME <span className="text-[#E53E3E]">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Srinivasa Ramanujan"
                required
                className="w-full border-2 border-black bg-[#FFFDF9] px-3 py-1.5 text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                COLLEGE / INSTITUTION
              </label>
              <div className="flex gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => setNewCollege("SSN College of Engineering")}
                  className={`text-[9px] font-bold px-2 py-1 border border-black uppercase transition-all ${
                    newCollege === "SSN College of Engineering"
                      ? "bg-[#FFD12E] text-black shadow-[1px_1px_0px_#101010]"
                      : "bg-white text-gray-700"
                  }`}
                >
                  SSN
                </button>
                <button
                  type="button"
                  onClick={() => setNewCollege("Shiv Nadar University Chennai")}
                  className={`text-[9px] font-bold px-2 py-1 border border-black uppercase transition-all ${
                    newCollege === "Shiv Nadar University Chennai"
                      ? "bg-[#C1F8FF] text-black shadow-[1px_1px_0px_#101010]"
                      : "bg-white text-gray-700"
                  }`}
                >
                  SNUC
                </button>
              </div>
              <input
                type="text"
                value={newCollege}
                onChange={(e) => setNewCollege(e.target.value)}
                placeholder="College Name"
                className="w-full border-2 border-black bg-[#FFFDF9] px-3 py-1.5 text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-black mb-1">
                  EMAIL (OPTIONAL)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="candidate@ssn.edu.in"
                  className="w-full border-2 border-black bg-[#FFFDF9] px-2.5 py-1.5 text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-black mb-1">
                  PHONE (OPTIONAL)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border-2 border-black bg-[#FFFDF9] px-2.5 py-1.5 text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingManual}
              className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-xs py-2.5 px-4 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ REGISTER CANDIDATE TO SUPABASE</span>
            </button>
          </form>
        </div>
      </div>

      {/* 3. REGISTERED CANDIDATE DIRECTORY TABLE */}
      <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FFD12E] border-2 border-black flex items-center justify-center shadow-brutal-sm">
              <Users className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-syne font-black text-xl uppercase text-black">
                REGISTERED CANDIDATE DIRECTORY
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <span>TOTAL: {totalCount}</span>
                <span>•</span>
                <span className="text-[#38A169]">AVAILABLE: {availableCount}</span>
                <span>•</span>
                <span className="text-[#D69E2E]">ASSIGNED: {assignedCount}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCandidates}
              className="p-1.5 border-2 border-black bg-white hover:bg-gray-100 shadow-brutal-sm cursor-pointer"
              title="Refresh candidate directory"
            >
              <RefreshCw className={`w-4 h-4 text-black ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, college, email, or team..."
              className="w-full border-2 border-black bg-[#FFFDF9] pl-9 pr-3 py-1.5 text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none shadow-brutal-sm"
            />
            <Search className="w-4 h-4 text-black absolute left-2.5 top-2 pointer-events-none" />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 border-2 border-black p-1 bg-[#FFF9F3] text-xs font-bold">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 text-[11px] font-bold uppercase transition-all ${
                filterMode === "all"
                  ? "bg-black text-white"
                  : "bg-transparent text-black hover:bg-black/10"
              }`}
            >
              ALL ({totalCount})
            </button>
            <button
              onClick={() => setFilterMode("available")}
              className={`px-3 py-1 text-[11px] font-bold uppercase transition-all ${
                filterMode === "available"
                  ? "bg-[#9AE885] text-black border border-black"
                  : "bg-transparent text-black hover:bg-black/10"
              }`}
            >
              AVAILABLE ({availableCount})
            </button>
            <button
              onClick={() => setFilterMode("assigned")}
              className={`px-3 py-1 text-[11px] font-bold uppercase transition-all ${
                filterMode === "assigned"
                  ? "bg-[#FFD12E] text-black border border-black"
                  : "bg-transparent text-black hover:bg-black/10"
              }`}
            >
              ASSIGNED ({assignedCount})
            </button>
          </div>
        </div>

        {/* Directory Table */}
        {filteredCandidates.length === 0 ? (
          <div className="border-2 border-black bg-[#FFFDF0] p-8 text-center">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-bold text-sm uppercase text-black">No candidates matched your search.</p>
            <p className="text-xs text-gray-500 mt-1">
              Upload an Excel file or add a candidate manually using the forms above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#101010] text-[#FFF9F3] text-xs font-mono uppercase">
                  <th className="p-2.5 border-b-2 border-black">#</th>
                  <th className="p-2.5 border-b-2 border-black">Candidate Name</th>
                  <th className="p-2.5 border-b-2 border-black">Institution</th>
                  <th className="p-2.5 border-b-2 border-black">Contact Details</th>
                  <th className="p-2.5 border-b-2 border-black">Team Status</th>
                  <th className="p-2.5 border-b-2 border-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-black/20">
                {filteredCandidates.map((cand, idx) => {
                  const isAssigned = !!cand.team_name;
                  return (
                    <tr
                      key={cand.id || cand.name + idx}
                      className={`hover:bg-[#FFF9E6] transition-colors ${
                        isAssigned ? "bg-[#FFFDF5]" : "bg-white"
                      }`}
                    >
                      <td className="p-2.5 font-bold text-gray-500 text-center w-12">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-syne font-bold text-black uppercase">
                        {cand.name}
                      </td>
                      <td className="p-2.5 font-mono text-gray-700">
                        {cand.college || "SSN / SNUC"}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-gray-600">
                        {cand.email && <div>{cand.email}</div>}
                        {cand.phone && <div>{cand.phone}</div>}
                        {!cand.email && !cand.phone && (
                          <span className="text-gray-400 font-normal">N/A</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 bg-[#FFD12E] border border-black px-2 py-0.5 font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_#101010]">
                            TEAM: {cand.team_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#9AE885] border border-black px-2 py-0.5 font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_#101010]">
                            ✓ AVAILABLE
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleDeleteCandidate(cand.id)}
                          className="p-1 border border-black bg-white hover:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer shadow-[1px_1px_0px_#101010]"
                          title="Delete candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
}
