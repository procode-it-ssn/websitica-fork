"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/client";
import { whereLab } from "@/lib/utils";
import { useTeamLock } from "@/hooks/useTeamLock";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MonitorX,
  Search,
  UserCheck,
  Users,
  X,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  CheckCircle2,
  LogIn,
  UserPlus,
  Sparkles,
} from "lucide-react";
import {
  IS_MOCK_MODE,
  DEFAULT_MOCK_PLAYER,
  DEFAULT_MOCK_TEAM,
  MOCK_UPCOMING_SESSION,
  MOCK_CANDIDATES,
  MOCK_TEAMS,
} from "@/lib/mockData";

// Searchable Autocomplete Candidate Selector (Pick from registered candidate DB only)
function CandidateSelector({
  label,
  placeholder,
  selectedCandidate,
  onSelect,
  onClear,
  candidates,
  excludeId,
  disabled,
  isRequired = false,
  error,
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCandidates = (candidates || []).filter((c) => {
    if (excludeId && c.id === excludeId) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.college?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
          {label} {isRequired && <span className="text-[#E53E3E] font-black">*</span>}
        </label>
        <span className="text-[9px] text-gray-500 font-mono">
          {isRequired ? "[PRE-REGISTERED CANDIDATE]" : "[OPTIONAL SECOND MEMBER]"}
        </span>
      </div>

      {selectedCandidate ? (
        <div className="w-full border-2 border-black bg-[#9AE885]/25 p-2 flex items-center justify-between shadow-[2px_2px_0px_#101010]">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38A169] flex-shrink-0 animate-pulse" />
            <div className="truncate">
              <span className="font-bold text-xs uppercase text-black block truncate">
                {selectedCandidate.name}
              </span>
              <span className="text-[9px] text-gray-600 font-mono block truncate">
                {selectedCandidate.college || selectedCandidate.email || "Verified Candidate"}
              </span>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              className="px-2 py-0.5 border border-black bg-white hover:bg-red-50 text-[10px] font-bold text-red-600 transition-colors uppercase cursor-pointer shadow-[1px_1px_0px_#101010]"
            >
              ✕ Change
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full border-2 border-black bg-[#FFFDF9] pl-8 pr-3 py-1.5 font-mono text-xs font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
              autoComplete="off"
            />
            <Search className="w-3.5 h-3.5 text-black absolute left-2.5 pointer-events-none" />
          </div>

          {isOpen && !disabled && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto bg-white border-2 border-black shadow-[4px_4px_0px_#101010] z-40 divide-y divide-black/10">
                <div className="p-1.5 bg-[#FFF9F3] text-[9px] font-bold text-gray-500 uppercase border-b border-black flex justify-between items-center">
                  <span>Directory ({filteredCandidates.length} candidate{filteredCandidates.length === 1 ? "" : "s"})</span>
                  <span className="text-[8px] text-gray-400">SELECT TO LOCK NAME</span>
                </div>
                {filteredCandidates.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500 font-bold text-center">
                    No matching registered candidate found.
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      Please check spelling or contact tournament desk.
                    </p>
                  </div>
                ) : (
                  filteredCandidates.map((c) => {
                    const isAssigned = !!c.team_name;
                    return (
                      <button
                        key={c.id || c.name}
                        type="button"
                        disabled={isAssigned}
                        onClick={() => {
                          onSelect(c);
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className={`w-full text-left p-2 transition-colors flex items-center justify-between text-xs ${
                          isAssigned
                            ? "bg-gray-100 opacity-60 cursor-not-allowed"
                            : "hover:bg-[#FFD12E]/30 cursor-pointer"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-black block truncate">{c.name}</span>
                          <span className="text-[9px] text-gray-500 block truncate">
                            {c.college || c.email || "Registered"}
                          </span>
                        </div>
                        {isAssigned ? (
                          <span className="text-[8px] bg-red-100 border border-red-600 px-1.5 py-0.5 text-red-700 font-bold uppercase flex-shrink-0">
                            ALREADY IN: {c.team_name}
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#38A169] font-black uppercase flex-shrink-0">
                            SELECT +
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[#E53E3E] text-[11px] font-bold mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// Mathematically Concentric Cassette Reel (Dead-center cx=20, cy=20)
function CassetteReel({ size = 40, duration = 2.8, reverse = false, isSpinning = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="flex-shrink-0"
    >
      {/* Outer Rim */}
      <circle
        cx="20"
        cy="20"
        r="18.5"
        fill="#FFF9F3"
        stroke="#101010"
        strokeWidth="2"
      />

      {/* Rotating Cog Spool */}
      <motion.g
        animate={isSpinning ? { rotate: reverse ? -360 : 360 } : { rotate: 0 }}
        style={{ transformOrigin: "20px 20px" }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="20"
          cy="20"
          r="12"
          fill="none"
          stroke="#101010"
          strokeWidth="1.8"
          strokeDasharray="4 3"
        />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={angle}
            x1="20"
            y1="7.5"
            x2="20"
            y2="11.5"
            stroke="#101010"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 20 20)`}
          />
        ))}
      </motion.g>

      {/* Center Spindle Hub & Axle Hole */}
      <circle cx="20" cy="20" r="5" fill="#101010" />
      <circle
        cx="20"
        cy="20"
        r="2.5"
        fill="#FFF9F3"
        stroke="#101010"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export default function JoinGame({
  lab = null,
  initialPhase = null,
  initialPlayer = null,
  initialTeam = null,
}) {
  // Cinematic Continuous Physical Interaction Lifecycle:
  // FORWARD:  form -> sealing -> morphing -> aligning -> inserting -> shrinking_player -> revealing_dashboard -> waiting
  // REVERSE:  waiting -> retracting_dashboard -> expanding_player -> ejecting -> showing_tape -> unmorphing -> form
  const [animPhase, setAnimPhase] = useState(() => {
    if (initialPhase) return initialPhase;
    return "form";
  });
  const [insertionProgress, setInsertionProgress] = useState(
    initialPhase === "waiting" ? 100 : 0
  );
  const [activePlayer, setActivePlayer] = useState(initialPlayer || null);
  const [activeTeam, setActiveTeam] = useState(initialTeam || null);

  // One team = one screen; blocks a second browser on the same squad.
  const teamLockState = useTeamLock(activeTeam?.id);
  const [waitingTime, setWaitingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionStatusInfo, setSessionStatusInfo] = useState(null);
  const [activeSessionRunning, setActiveSessionRunning] = useState(false);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const router = useRouter();

  // Candidates & Form State
  const [candidates, setCandidates] = useState([]);
  const [selectedP1, setSelectedP1] = useState(null);
  const [selectedP2, setSelectedP2] = useState(null);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [selectedLabOption, setSelectedLabOption] = useState(
    lab ? String(lab) : initialTeam?.lab ? String(initialTeam.lab) : "1"
  );
  const currentLab = lab ? String(lab) : selectedLabOption || "1";
  const [p1Error, setP1Error] = useState("");
  const [teamNameError, setTeamNameError] = useState("");

  // Passkey & Login Mode states
  const [entryMode, setEntryMode] = useState("register"); // "register" | "login"
  const [registeredSuccessData, setRegisteredSuccessData] = useState(null);
  const [copiedPasskey, setCopiedPasskey] = useState(false);

  // Login Mode State
  const [loginTeamName, setLoginTeamName] = useState("");
  const [loginPasskeyInput, setLoginPasskeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [verifiedTeam, setVerifiedTeam] = useState(null);
  const [activeParticipantNum, setActiveParticipantNum] = useState(1);

  // Fetch candidates from Supabase & cross-reference active squads
  const loadCandidates = useCallback(async () => {
    try {
      let rawCandidates = [];
      if (!IS_MOCK_MODE) {
        const { data, error } = await supabase
          .from("candidates")
          .select("*")
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          rawCandidates = data;
        } else {
          rawCandidates = MOCK_CANDIDATES;
        }

        // Cross-reference active players from players table to always know real team assignments
        try {
          const { data: activePlayers } = await supabase
            .from("players")
            .select("name, team_id, teams:team_id(name)");

          if (activePlayers && activePlayers.length > 0) {
            const playerMap = new Map();
            activePlayers.forEach((p) => {
              if (p.name) {
                playerMap.set(p.name.toLowerCase().trim(), p.teams?.name || `Squad #${p.team_id}`);
              }
            });

            rawCandidates = rawCandidates.map((c) => {
              const assignedTeam = playerMap.get((c.name || "").toLowerCase().trim()) || c.team_name;
              return {
                ...c,
                team_name: assignedTeam || null,
              };
            });
          }
        } catch (playerErr) {
          console.warn("Could not check active players for assignment:", playerErr);
        }
      } else {
        rawCandidates = MOCK_CANDIDATES;
      }

      setCandidates(rawCandidates);
    } catch (err) {
      setCandidates(MOCK_CANDIDATES);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Live timer once settled in waiting lobby
  useEffect(() => {
    let timer;
    if (animPhase === "waiting") {
      timer = setInterval(() => {
        setWaitingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [animPhase]);

  const checkForUpcomingSession = useCallback(async (teamData) => {
    if (IS_MOCK_MODE) {
      setUpcomingSession(MOCK_UPCOMING_SESSION);
      return;
    }

    const { data, error } = await whereLab(
      supabase.from("quiz_sessions").select("*").eq("status", "scheduled"),
      teamData.lab,
    )
      .order("start_time", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error("[WAITING] Error checking for upcoming session:", error);
    } else if (data) {
      setUpcomingSession(data);
    }
  }, []);

  const checkSessionStatus = useCallback(
    async (playerId, teamData) => {
      if (IS_MOCK_MODE) {
        return;
      }

      if (!teamData) return;

      const { data: sessionData, error } = await whereLab(
        supabase.from("quiz_sessions").select("*").eq("status", "active"),
        teamData.lab,
      )
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        setActiveSessionRunning(false);
        if (error.code === "PGRST116") {
          // No active session, reset completion info and check for upcoming
          setSessionStatusInfo(null);
          setMessage("");
          await checkForUpcomingSession(teamData);
        } else {
          console.error("Error checking session status:", error);
        }
      } else if (sessionData) {
        setActiveSessionRunning(true);

        // Find database player ID for current contestant
        let currentPID = playerId;
        if (!currentPID || String(currentPID).startsWith("player-")) {
          try {
            const { data: pRec } = await supabase
              .from("players")
              .select("id")
              .eq("team_id", teamData.id)
              .ilike("name", activePlayer?.name || "")
              .limit(1)
              .maybeSingle();
            if (pRec?.id) currentPID = pRec.id;
          } catch (e) {}
        }

        // Query submissions table with is_correct and score
        let playerSub = null;
        try {
          if (currentPID && !String(currentPID).startsWith("player-")) {
            const { data: playerSubs } = await supabase
              .from("submissions")
              .select("id, is_correct, score")
              .eq("player_id", currentPID)
              .eq("session_id", sessionData.id)
              .order("created_at", { ascending: false })
              .limit(1);

            if (playerSubs && playerSubs.length > 0) {
              playerSub = playerSubs[0];
            }
          }
        } catch (subErr) {
          console.warn("Error checking submissions table:", subErr);
        }

        const playerKey = `completed_session_${sessionData.id}_p${activePlayer?.participantNumber || 1}_${activePlayer?.name || ""}`;
        const localStatus =
          typeof window !== "undefined"
            ? localStorage.getItem(playerKey) || sessionStorage.getItem(playerKey)
            : null;
        const localScore =
          typeof window !== "undefined"
            ? parseInt(localStorage.getItem(`${playerKey}_score`) || "0", 10)
            : 0;

        const isCompleted =
          Boolean(playerSub) ||
          localStatus === "completed" ||
          localStatus === "true";

        if (isCompleted) {
          const finalScore =
            playerSub?.score !== undefined ? playerSub.score : localScore;
          setSessionStatusInfo({
            type: "completed",
            score: finalScore,
            description:
              "You've completed the current session. Please wait for the next broadcast.",
          });
          setMessage(
            "You've completed the current session. Please wait for the next broadcast."
          );
        } else {
          // Contestant has NOT completed this session yet and session is active by admin:
          // Directly let the user enter the match!
          setSessionStatusInfo(null);
          setMessage("");
          try {
            sessionStorage.setItem("inWaitingRoom", "true");
          } catch (e) {}
          router.push("/game");
        }
      }
    },
    [router, checkForUpcomingSession, activePlayer?.name, activePlayer?.participantNumber]
  );

  // Restore saved player data if user returns or initialize waiting lobby if in waiting room
  useEffect(() => {
    try {
      let savedPlayer = localStorage.getItem("playerData");
      let savedTeam = localStorage.getItem("teamData");
      let p = savedPlayer ? JSON.parse(savedPlayer) : null;
      let t = savedTeam ? JSON.parse(savedTeam) : null;

      const shouldBeInWaiting =
        initialPhase === "waiting" ||
        (typeof window !== "undefined" &&
          (window.location.pathname === "/waiting" ||
            sessionStorage.getItem("inWaitingRoom") === "true"));

      if ((!p || !t) && IS_MOCK_MODE && shouldBeInWaiting) {
        p = DEFAULT_MOCK_PLAYER;
        t = DEFAULT_MOCK_TEAM;
        localStorage.setItem("playerData", JSON.stringify(p));
        localStorage.setItem("teamData", JSON.stringify(t));
      }

      if (p && t) {
        setActivePlayer(p);
        setActiveTeam(t);
        if (p?.participant1 || p?.name) {
          setSelectedP1({ name: p.participant1 || p.name, college: "Registered Candidate" });
        }
        if (p?.participant2) {
          setSelectedP2({ name: p.participant2, college: "Registered Candidate" });
        }
        if (t?.name) setTeamNameInput(t.name);
        if (t?.lab) setSelectedLabOption(String(t.lab));

        if (shouldBeInWaiting) {
          setAnimPhase("waiting");
          setInsertionProgress(100);
          try {
            sessionStorage.setItem("inWaitingRoom", "true");
          } catch (e) {}
        }
      } else if (shouldBeInWaiting && !IS_MOCK_MODE) {
        // If on /waiting or marked as waiting room without any player data, restore form at /
        setAnimPhase("form");
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          router.replace("/");
        }
      }
    } catch (e) {
      // ignore
    }
  }, [initialPhase, router]);

  // Real-time listener for active sessions while waiting
  useEffect(() => {
    if (animPhase !== "waiting" || !activePlayer || !activeTeam) return;

    if (IS_MOCK_MODE) {
      setUpcomingSession(MOCK_UPCOMING_SESSION);
      return;
    }

    checkSessionStatus(activePlayer.id, activeTeam);

    const subscription = supabase
      .channel("quiz_sessions_lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_sessions" },
        (payload) => {
          if (
            payload.new?.status === "active" &&
            activePlayer &&
            activeTeam &&
            payload.new?.lab === activeTeam.lab
          ) {
            checkSessionStatus(activePlayer.id, activeTeam);
          }
          if (
            payload.new?.status === "scheduled" &&
            activeTeam &&
            payload.new?.lab === activeTeam.lab
          ) {
            setUpcomingSession(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [animPhase, activePlayer, activeTeam, checkSessionStatus]);

  // ===========================================================================
  // FORWARD FLOW: FORM → TAPE → TRANSPARENT INSERTION → SHRINK → REVEAL LOBBY
  // ===========================================================================
  // Validate team name uniqueness asynchronously
  const validateTeamNameUniqueness = async (name) => {
    if (!name || name.trim().length < 2) return true;
    const trimmed = name.trim();
    if (IS_MOCK_MODE) {
      return !MOCK_TEAMS.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    }
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, lab")
        .ilike("name", trimmed);
      if (error) return true;
      return !(data && data.length > 0);
    } catch (e) {
      return true;
    }
  };

  const checkParticipantAssignment = async (candidateName) => {
    if (!candidateName) return null;
    const trimmed = candidateName.trim().toLowerCase();

    if (IS_MOCK_MODE) {
      const assigned = MOCK_TEAMS.find(
        (t) =>
          (t.participant1_name && t.participant1_name.toLowerCase().trim() === trimmed) ||
          (t.participant2_name && t.participant2_name.toLowerCase().trim() === trimmed)
      );
      if (assigned) {
        return { isAssigned: true, teamName: assigned.name };
      }
      return null;
    }

    try {
      // 1. Direct check in players table
      const { data: players } = await supabase
        .from("players")
        .select("id, name, team_id, teams:team_id(id, name)")
        .ilike("name", candidateName.trim())
        .limit(1);

      if (players && players.length > 0) {
        const teamName = players[0].teams?.name || `Squad #${players[0].team_id}`;
        return { isAssigned: true, teamName };
      }

      // 2. Direct check in candidates table
      const { data: cand } = await supabase
        .from("candidates")
        .select("team_name, team_id")
        .ilike("name", candidateName.trim())
        .limit(1);

      if (cand && cand.length > 0 && (cand[0].team_name || cand[0].team_id)) {
        return {
          isAssigned: true,
          teamName: cand[0].team_name || `Squad #${cand[0].team_id}`,
        };
      }
    } catch (e) {
      console.warn("Error checking participant assignment:", e);
    }

    return null;
  };

  const generatePasskey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "WS-";
    for (let i = 0; i < 4; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const startForwardSequence = (targetPlayer, targetTeam) => {
    setIsSubmitting(true);
    // Explicitly reset any stale contestant dropdown choices so active participant identity remains pure
    setSelectedP1(null);
    setSelectedP2(null);
    localStorage.setItem("playerData", JSON.stringify(targetPlayer));
    localStorage.setItem("teamData", JSON.stringify(targetTeam));
    try {
      sessionStorage.setItem("inWaitingRoom", "true");
    } catch (e) {}
    setActivePlayer(targetPlayer);
    setActiveTeam(targetTeam);

    // Forward Step 1: Tactile button press & label printing stamp
    setAnimPhase("sealing");
    setInsertionProgress(0);

    // Forward Step 2: Form physically folds & morphs into the vertical Cassette Tape (Smooth & slow)
    setTimeout(() => {
      setAnimPhase("morphing");
    }, 450);

    // Forward Step 3: Cassette is fully formed and complete! Sits clearly in view for 1.55s.
    // Walkman Player rises from the bottom to meet it (3800ms -> 5100ms)
    setTimeout(() => {
      setAnimPhase("aligning");
      setInsertionProgress(0);
    }, 3800);

    // Forward Step 4: Direct Vertical Insertion through Transparent Glass Window (0% → 100%) (5100ms -> 7300ms)
    setTimeout(() => {
      setAnimPhase("inserting");
      setInsertionProgress(0);
    }, 5100);

    // Synchronized insertion progress steps
    setTimeout(() => setInsertionProgress(25), 5650);
    setTimeout(() => setInsertionProgress(50), 6200);
    setTimeout(() => setInsertionProgress(75), 6750);
    setTimeout(() => setInsertionProgress(100), 7300);

    // Forward Step 5: TRANSFORM & SHRINK ENTIRE PLAYER INTO THE 2D TAPE STRIP FIRST!
    setTimeout(() => {
      setAnimPhase("shrinking_player");
    }, 8000);

    // Forward Step 6: REMAINING WAITING ROOM ELEMENTS SMOOTHLY ADD AROUND IT IN ORIGINAL POSITION!
    setTimeout(() => {
      setAnimPhase("revealing_dashboard");
    }, 9200);

    // Forward Step 7: Fully settled in official waiting room layout
    setTimeout(() => {
      setAnimPhase("waiting");
      setIsSubmitting(false);
    }, 10300);
  };

  // ===========================================================================
  // REGISTRATION FLOW WITH UNIQUE SECRET PASSKEY
  // ===========================================================================
  const executeJoin = async (p1, p2, teamName, labNum) => {
    setIsSubmitting(true);
    setP1Error("");
    setTeamNameError("");

    if (!p1) {
      setP1Error("Contestant 1 is required. Please search and select your registered name.");
      setIsSubmitting(false);
      return;
    }

    if (p2 && p1.name.toLowerCase().trim() === p2.name.toLowerCase().trim()) {
      setP2Error("Contestant 1 and Contestant 2 cannot be the same person. Each squad must have distinct members.");
      setIsSubmitting(false);
      return;
    }

    if (!teamName || teamName.trim().length < 2) {
      setTeamNameError("Team name must be at least 2 characters.");
      setIsSubmitting(false);
      return;
    }

    const trimmedTeam = teamName.trim();

    // STRICT VALIDATION 1: Enforce strictly unique team name
    const isUnique = await validateTeamNameUniqueness(trimmedTeam);
    if (!isUnique) {
      setTeamNameError(
        `Team name "${trimmedTeam}" is already registered. Every squad must have a unique team name.`
      );
      setIsSubmitting(false);
      return;
    }

    // STRICT VALIDATION 2: Verify Contestant 1 is NOT already registered in any squad
    const p1Existing = await checkParticipantAssignment(p1.name);
    if (p1Existing) {
      setP1Error(
        `Contestant "${p1.name}" is already registered in squad "${p1Existing.teamName}". Each participant can belong to only ONE squad.`
      );
      setIsSubmitting(false);
      return;
    }

    // STRICT VALIDATION 3: Verify Contestant 2 is NOT already registered in any squad
    if (p2) {
      const p2Existing = await checkParticipantAssignment(p2.name);
      if (p2Existing) {
        setP2Error(
          `Contestant "${p2.name}" is already registered in squad "${p2Existing.teamName}". Each participant can belong to only ONE squad.`
        );
        setIsSubmitting(false);
        return;
      }
    }

    const passkey = generatePasskey();

    const targetTeam = {
      id: "team-" + Date.now(),
      name: trimmedTeam,
      passkey: passkey,
      lab: labNum,
      score: 0,
      codections_score: 0,
      participant1_score: 0,
      participant2_score: 0,
      bidding_score: 0,
      r1_web_total: 0,
      r1_total_score: 0,
      r2_total_score: 0,
      grand_total_score: 0,
      total_score: 0,
      participant1_name: p1.name,
      participant2_name: p2?.name || null,
    };

    const targetPlayer = {
      id: "player-" + Date.now(),
      name: p1.name,
      participantNumber: 1,
      participant1: p1.name,
      participant2: p2?.name || null,
    };

    if (!IS_MOCK_MODE) {
      try {
        // Attempt full insert with all columns
        let { data: teamData, error: teamError } = await supabase
          .from("teams")
          .insert({
            name: trimmedTeam,
            passkey: passkey,
            score: 0,
            codections_score: 0,
            participant1_score: 0,
            participant2_score: 0,
            bidding_score: 0,
            total_score: 0,
            lab: labNum,
            player_count: p2 ? 2 : 1,
            participant1_name: p1.name,
            participant2_name: p2?.name || null,
          })
          .select()
          .single();

        if (teamError) {
          console.warn("Retrying team insert with base columns:", teamError.message);
          // Fallback to base columns that always exist in Supabase
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("teams")
            .insert({
              name: trimmedTeam,
              score: 0,
              lab: labNum,
              player_count: p2 ? 2 : 1,
            })
            .select()
            .single();

          if (fallbackError) throw fallbackError;
          teamData = fallbackData;
        }

        if (!teamData?.id) {
          throw new Error("Team record could not be confirmed in database.");
        }

        targetTeam.id = teamData.id;

        // Securely store passkey locally so passkey auth works regardless of Supabase columns
        try {
          localStorage.setItem("websitica_passkey_" + trimmedTeam.toLowerCase(), passkey);
          localStorage.setItem("websitica_passkey_id_" + teamData.id, passkey);
        } catch (storageErr) {}

        // Insert participant 1 into players table
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .insert({ name: p1.name, team_id: teamData.id })
          .select()
          .single();

        if (playerData) {
          targetPlayer.id = playerData.id;
        }

        // Insert participant 2 if present
        if (p2) {
          await supabase
            .from("players")
            .insert({ name: p2.name, team_id: teamData.id });
        }

        // Update candidate records in database with team assignment
        try {
          await supabase
            .from("candidates")
            .update({ team_id: teamData.id, team_name: trimmedTeam })
            .ilike("name", p1.name);

          if (p2) {
            await supabase
              .from("candidates")
              .update({ team_id: teamData.id, team_name: trimmedTeam })
              .ilike("name", p2.name);
          }
        } catch (candErr) {
          console.warn("Could not sync candidate team status:", candErr);
        }

        // Immediately lock candidates in local state so dropdown reflects assignment
        setCandidates((prev) =>
          prev.map((c) => {
            const match1 = c.name.toLowerCase().trim() === p1.name.toLowerCase().trim();
            const match2 = p2 && c.name.toLowerCase().trim() === p2.name.toLowerCase().trim();
            if (match1 || match2) {
              return { ...c, team_id: teamData.id, team_name: trimmedTeam };
            }
            return c;
          })
        );
      } catch (err) {
        console.error("Database registration error:", err);
        setTeamNameError("Failed to register squad in database: " + (err.message || "Network error. Please try again."));
        setIsSubmitting(false);
        return;
      }
    } else {
      MOCK_TEAMS.push(targetTeam);
    }

    setIsSubmitting(false);

    // Keep the user in a logged out state so they must log in with their passkey
    try {
      localStorage.removeItem("playerData");
      localStorage.removeItem("teamData");
      sessionStorage.removeItem("inWaitingRoom");
    } catch (e) {}
    setActivePlayer(null);
    setActiveTeam(null);

    // Present the "Squad Registered Successfully" dialog with passkey
    setRegisteredSuccessData({
      team: targetTeam,
      player: targetPlayer,
      passkey: passkey,
    });
  };

  const handleGoToLoginAfterRegistration = () => {
    if (!registeredSuccessData) return;
    const registeredName = registeredSuccessData.team.name;
    const registeredKey = registeredSuccessData.passkey;
    const registeredTeam = registeredSuccessData.team;
    setRegisteredSuccessData(null);
    setEntryMode("login");
    setLoginTeamName(registeredName);
    setLoginPasskeyInput(registeredKey);
    // Seamlessly authenticate the newly registered squad so creator can immediately choose their contestant slot
    setVerifiedTeam(registeredTeam);
    setActiveParticipantNum(1);
    setLoginError("");
    setSelectedP1(null);
    setSelectedP2(null);
    setTeamNameInput("");
  };

  // ===========================================================================
  // SQUAD AUTHENTICATION & LOGIN WITH PASSKEY
  // ===========================================================================
  const handleVerifySquadLogin = async () => {
    setLoginError("");
    const trimmedName = loginTeamName.trim();
    const trimmedKey = loginPasskeyInput.trim().toUpperCase();

    if (!trimmedName) {
      setLoginError("Please enter your team squad name.");
      return;
    }
    if (!trimmedKey) {
      setLoginError("Please enter your secret squad passkey.");
      return;
    }

    setIsSubmitting(true);

    try {
      let foundTeam = null;

      if (IS_MOCK_MODE) {
        foundTeam = MOCK_TEAMS.find(
          (t) =>
            t.name.toLowerCase() === trimmedName.toLowerCase() &&
            (!t.passkey || t.passkey.toUpperCase() === trimmedKey)
        );
      } else {
        const { data, error } = await supabase
          .from("teams")
          .select("*")
          .ilike("name", trimmedName)
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setLoginError(`Squad "${trimmedName}" not found. Please verify spelling or register.`);
          setIsSubmitting(false);
          return;
        }

        // Expected passkey from DB column or localStorage fallback
        let expectedPasskey = data.passkey;
        if (!expectedPasskey && typeof window !== "undefined") {
          expectedPasskey =
            localStorage.getItem("websitica_passkey_" + trimmedName.toLowerCase()) ||
            localStorage.getItem("websitica_passkey_id_" + data.id);
        }

        if (expectedPasskey && expectedPasskey.trim().toUpperCase() !== trimmedKey) {
          setLoginError("Incorrect secret passkey for this squad. Please check your credentials.");
          setIsSubmitting(false);
          return;
        }

        // Ensure participants are attached to data for player selection
        if (!data.participant1_name) {
          try {
            const { data: teamPlayers } = await supabase
              .from("players")
              .select("name")
              .eq("team_id", data.id)
              .order("id", { ascending: true });

            if (teamPlayers && teamPlayers.length > 0) {
              data.participant1_name = teamPlayers[0]?.name;
              if (teamPlayers.length > 1) {
                data.participant2_name = teamPlayers[1]?.name;
              }
            }
          } catch (pErr) {
            console.warn("Could not fetch players for team:", pErr);
          }
        }

        if (!data.participant1_name) {
          data.participant1_name = data.name;
        }

        foundTeam = data;
      }

      if (!foundTeam) {
        setLoginError("Invalid squad name or passkey combination.");
        setIsSubmitting(false);
        return;
      }

      // Verified successfully!
      setVerifiedTeam(foundTeam);
      setActiveParticipantNum(1);
    } catch (err) {
      console.error(err);
      setLoginError("Failed to authenticate squad. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedLoginToVenue = async () => {
    if (!verifiedTeam) return;
    setIsSubmitting(true);

    const activeName =
      activeParticipantNum === 2
        ? verifiedTeam.participant2_name || "Contestant 2"
        : verifiedTeam.participant1_name || verifiedTeam.name;

    const targetPlayer = {
      id: "player-" + Date.now(),
      name: activeName,
      participantNumber: activeParticipantNum,
      participant1: verifiedTeam.participant1_name,
      participant2: verifiedTeam.participant2_name,
      team_name: verifiedTeam.name,
    };

    if (!IS_MOCK_MODE) {
      try {
        const { data: pData } = await supabase
          .from("players")
          .select("id")
          .ilike("name", activeName)
          .eq("team_id", verifiedTeam.id)
          .limit(1)
          .maybeSingle();

        if (pData?.id) {
          targetPlayer.id = pData.id;
        }
      } catch (e) {}
    }

    // Clear stale registration states
    setSelectedP1(null);
    setSelectedP2(null);

    startForwardSequence(targetPlayer, verifiedTeam);
  };

  const handleJoinSubmit = () => {
    executeJoin(
      selectedP1,
      selectedP2,
      teamNameInput,
      parseInt(selectedLabOption, 10)
    );
  };

  // ===========================================================================
  // REVERSE FLOW: WAITING → RETRACT → EXPAND PLAYER → EJECT TAPE → SHOW TAPE FIRST → UNFOLD FORM
  // (Exact symmetrical, continuous reverse with zero jumps or fragmentation)
  // ===========================================================================
  const handleEjectCassette = () => {
    setIsSubmitting(false);
    setSessionStatusInfo(null);
    setMessage("");
    setActiveSessionRunning(false);
    try {
      sessionStorage.removeItem("inWaitingRoom");
    } catch (e) {}

    // Reverse Step 1: Retract waiting room dashboard elements around the 2D tape strip (0ms -> 650ms)
    setAnimPhase("retracting_dashboard");

    // Reverse Step 2: Smoothly expand the 2D tape strip in place into the Walkman player! (650ms -> 1800ms)
    setTimeout(() => {
      setAnimPhase("expanding_player");
      setInsertionProgress(100);
    }, 650);

    // Reverse Step 3: Smoothly Eject the Tape UP and out of the player slot (100% -> 0%)! (1800ms -> 3600ms)
    setTimeout(() => {
      setAnimPhase("ejecting");
    }, 1800);

    // Synchronized reverse progress countdown
    setTimeout(() => setInsertionProgress(75), 2250);
    setTimeout(() => setInsertionProgress(50), 2700);
    setTimeout(() => setInsertionProgress(25), 3150);
    setTimeout(() => setInsertionProgress(0), 3600);

    // Reverse Step 4: Player drops completely off-screen, tape sits still alone at center of screen! (3600ms -> 5900ms)
    // 3600ms to 4500ms (0.9s): Player slides smoothly down and fades out off screen.
    // 4500ms to 5900ms (1.40s): The cassette tape floats completely alone in the center of the screen!
    setTimeout(() => {
      setAnimPhase("showing_tape");
    }, 3600);

    // Reverse Step 5: After viewing the tape alone, it smoothly, subtly transforms into the form! (5900ms -> 8100ms, 2.2s duration!)
    setTimeout(() => {
      setAnimPhase("unmorphing");
    }, 5900);

    // Reverse Step 6: Fully settled back in interactive form state
    setTimeout(() => {
      setAnimPhase("form");
      setWaitingTime(0);
      setActivePlayer(null);
      setActiveTeam(null);
      try {
        sessionStorage.removeItem("inWaitingRoom");
        localStorage.removeItem("playerData");
        localStorage.removeItem("teamData");
      } catch (e) {}
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        router.replace("/");
      }
    }, 8100);
  };

  const handleStartGame = () => {
    if (teamLockState === "blocked") return;
    try {
      sessionStorage.setItem("inWaitingRoom", "true");
    } catch (e) {}
    router.push("/game");
  };

  // Phase checkers
  const isFormMode = animPhase === "form";
  const isSealing = animPhase === "sealing";
  const isMorphing = animPhase === "morphing";
  const isAligning = animPhase === "aligning";
  const isInserting = animPhase === "inserting";
  const isShrinkingPlayer = animPhase === "shrinking_player";
  const isRevealingDashboard = animPhase === "revealing_dashboard";
  const isWaiting = animPhase === "waiting";

  // Reverse phase checkers
  const isRetractingDashboard = animPhase === "retracting_dashboard";
  const isExpandingPlayer = animPhase === "expanding_player";
  const isEjecting = animPhase === "ejecting";
  const isShowingTape = animPhase === "showing_tape";
  const isUnmorphing = animPhase === "unmorphing";

  // Scene 1: Form / Morph / Unmorph
  // Scene 2: Unified Walkman Player, Ejected Tape Alone, & Standby Waiting Lobby
  const isFormStageActive =
    isFormMode || isSealing || isMorphing || isUnmorphing;
  const isPlayerLobbyActive =
    isAligning ||
    isInserting ||
    isShrinkingPlayer ||
    isRevealingDashboard ||
    isWaiting ||
    isRetractingDashboard ||
    isExpandingPlayer ||
    isEjecting ||
    isShowingTape;

  const isDashboardVisible =
    isRevealingDashboard || isWaiting || isRetractingDashboard;

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center relative bg-transparent py-6 sm:py-8 px-3 sm:px-4 font-mono select-none overflow-hidden">
      <div className="w-full max-w-lg flex flex-col items-center relative z-10">
        {/* ======================================================== */}
        {/* TOP HEADER & TITLE (Matching media_1790005724810.png)    */}
        {/* Smoothly collapses during insertion so text is never covered */}
        {/* ======================================================== */}
        <motion.div
          animate={
            isFormMode || isSealing || isUnmorphing
              ? { maxHeight: 220, opacity: 1, y: 0, marginBottom: "16px" }
              : { maxHeight: 0, opacity: 0, y: -25, marginBottom: "0px" }
          }
          transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center overflow-hidden w-full px-2"
        >
          {/* Institution & Department Eyebrow Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap justify-center">
            <span className="bg-[#9AE885] border-2 border-black px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#101010] text-black">
              SSN × SNUC INVENTE &apos;26
            </span>
            <span className="bg-[#C1F8FF] border-2 border-black px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#101010] text-black">
              IT DEPARTMENT
            </span>
          </div>

          {/* Grand Centered Headline */}
          <h1 className="font-syne text-4xl sm:text-6xl md:text-7xl font-black text-[#101010] tracking-tight uppercase leading-none my-1">
            CODECTIONS
          </h1>

          {/* Subtitle Yellow Banner */}
          <div className="mt-1.5 bg-[#FFD12E] border-2 border-black px-2.5 sm:px-4 py-1 font-mono font-bold text-[10px] sm:text-xs uppercase shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] text-black tracking-wide text-center">
            A GIANT LEAP, OUT OF THE BOX • 4 GROUPS OF 4 WORDS
          </div>
        </motion.div>



        {/* ======================================================== */}
        {/* STAGE CONTAINER: UNBROKEN CONTINUITY                     */}
        {/* ======================================================== */}
        <div className="w-full flex flex-col items-center relative min-h-[480px] justify-center">

          {/* Registration Success Modal Overlay */}
          {registeredSuccessData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white border-3 border-black shadow-brutal-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="font-syne font-black text-xl uppercase tracking-tight text-black">
                    SQUAD REGISTERED SUCCESSFULLY!
                  </h3>
                </div>
                <p className="text-xs text-gray-600 font-mono mb-4">
                  Your squad has been registered in the database. You are currently <strong>logged out</strong>.
                </p>

                {/* Squad details badge */}
                <div className="bg-[#FFFDF9] border-2 border-black p-3 mb-4 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase">SQUAD NAME:</span>
                    <span className="font-black text-black font-syne text-sm uppercase">
                      {registeredSuccessData.team.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase">ARENA LAB:</span>
                    <span className="font-bold text-black uppercase">
                      {registeredSuccessData.team.lab === 2 ? "LAB 2 (SE LAB)" : "LAB 1 (OS LAB)"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase">CONTESTANTS:</span>
                    <span className="font-bold text-black uppercase">
                      {registeredSuccessData.team.participant1_name}
                      {registeredSuccessData.team.participant2_name ? ` & ${registeredSuccessData.team.participant2_name}` : " (Solo)"}
                    </span>
                  </div>
                </div>

                {/* Large Passkey Display */}
                <div className="bg-[#FFD12E]/30 border-2 border-black p-3.5 mb-4 text-center">
                  <span className="text-[10px] font-mono font-bold uppercase text-gray-700 block mb-1">
                    SECRET SQUAD PASSKEY
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-black text-black tracking-widest bg-white px-3 py-1 border-2 border-black shadow-brutal-sm">
                      {registeredSuccessData.passkey}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator?.clipboard) {
                          navigator.clipboard.writeText(registeredSuccessData.passkey);
                          setCopiedPasskey(true);
                          setTimeout(() => setCopiedPasskey(false), 2000);
                        }
                      }}
                      className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors cursor-pointer shadow-brutal-sm"
                      title="Copy Passkey"
                    >
                      {copiedPasskey ? (
                        <Check className="w-5 h-5 text-[#38A169]" />
                      ) : (
                        <Copy className="w-5 h-5 text-black" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono mt-2">
                    🔑 Copy and save this key! You must now enter this passkey on the login screen to access the arena.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoToLoginAfterRegistration}
                  className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-sm py-3 px-4 border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>PROCEED TO SQUAD LOGIN 🔑</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SCENE 1: FORM ↔ TAPE MORPH & UNMORPHING BACK TO FORM             */}
          {/* (Active during form, sealing, morphing, showing_tape, unmorphing) */}
          {/* ================================================================= */}
          {isFormStageActive && (
            <motion.div
              initial={
                isUnmorphing
                  ? {
                      width: 320,
                      backgroundColor: "#1c1c1c",
                      borderRadius: "16px",
                      scale: 1,
                      y: 0,
                      boxShadow: "6px 6px 0px #101010",
                    }
                  : false
              }
              animate={
                isMorphing
                  ? {
                      width: 320,
                      backgroundColor: "#1c1c1c",
                      borderRadius: "16px",
                      scale: 1,
                      y: 0,
                      boxShadow: "6px 6px 0px #101010",
                      transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                    }
                  : isUnmorphing
                  ? {
                      width: 448,
                      backgroundColor: "#ffffff",
                      borderRadius: "0px",
                      scale: 1,
                      y: 0,
                      boxShadow: "8px 8px 0px #101010",
                      transition: { duration: 2.0, ease: [0.22, 1, 0.36, 1] },
                    }
                  : isSealing
                  ? {
                      width: 448,
                      backgroundColor: "#ffffff",
                      borderRadius: "0px",
                      scale: 0.99,
                      y: 2,
                      boxShadow: "4px 4px 0px #101010",
                      transition: { duration: 0.2 },
                    }
                  : {
                      width: 448,
                      backgroundColor: "#ffffff",
                      borderRadius: "0px",
                      scale: 1,
                      y: 0,
                      boxShadow: "8px 8px 0px #101010",
                    }
              }
              className="w-full max-w-md border-3 border-black relative z-30 transition-shadow overflow-hidden mx-auto"
            >
              {/* Corner Screws */}
              <motion.div
                initial={isUnmorphing ? { opacity: 1, scale: 1, rotate: 90 } : false}
                animate={
                  isMorphing
                    ? { opacity: 1, scale: 1, rotate: 90 }
                    : isUnmorphing
                    ? { opacity: 0, scale: 0, rotate: 0 }
                    : { opacity: 0, scale: 0 }
                }
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none"
              >
                +
              </motion.div>
              <motion.div
                initial={isUnmorphing ? { opacity: 1, scale: 1, rotate: 90 } : false}
                animate={
                  isMorphing
                    ? { opacity: 1, scale: 1, rotate: 90 }
                    : isUnmorphing
                    ? { opacity: 0, scale: 0, rotate: 0 }
                    : { opacity: 0, scale: 0 }
                }
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none"
              >
                +
              </motion.div>
              <motion.div
                initial={isUnmorphing ? { opacity: 1, scale: 1, rotate: 90 } : false}
                animate={
                  isMorphing
                    ? { opacity: 1, scale: 1, rotate: 90 }
                    : isUnmorphing
                    ? { opacity: 0, scale: 0, rotate: 0 }
                    : { opacity: 0, scale: 0 }
                }
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none"
              >
                +
              </motion.div>
              <motion.div
                initial={isUnmorphing ? { opacity: 1, scale: 1, rotate: 90 } : false}
                animate={
                  isMorphing
                    ? { opacity: 1, scale: 1, rotate: 90 }
                    : isUnmorphing
                    ? { opacity: 0, scale: 0, rotate: 0 }
                    : { opacity: 0, scale: 0 }
                }
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none"
              >
                +
              </motion.div>

              {/* Header Bar of the Form / Cassette Top Ridge */}
              <div className="bg-[#181818] text-white px-3.5 py-1.5 border-b-2 border-black flex items-center justify-between font-mono text-[11px] font-bold relative z-20">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E53E3E] animate-pulse" />
                  <span className="tracking-wider text-gray-200">[REC 01 • SIDE A]</span>
                </div>

                <motion.span
                  initial={isUnmorphing ? { backgroundColor: "#FFD12E", scale: 0.95 } : false}
                  animate={
                    isMorphing
                      ? { backgroundColor: "#FFD12E", scale: 0.95 }
                      : { backgroundColor: "#FE90E9", scale: 1 }
                  }
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  className="text-black text-[9px] font-mono font-black px-1.5 py-0.5 border border-black uppercase"
                >
                  {isMorphing
                    ? `LAB ${currentLab} • CASSETTE`
                    : "PLAYER ONBOARDING"}
                </motion.span>
              </div>

              {/* Body Content of Form / Cassette Body */}
              <motion.div
                initial={isUnmorphing ? { padding: "10px" } : false}
                animate={
                  isMorphing
                    ? { padding: "10px" }
                    : { padding: "16px" }
                }
                transition={{ duration: 1.6, ease: "easeInOut" }}
                className="font-mono relative z-20"
              >
                {/* THE CASSETTE LABEL STICKER */}
                <motion.div
                  initial={
                    isUnmorphing
                      ? {
                          backgroundColor: "#FFFDF0",
                          borderColor: "#101010",
                          borderWidth: "2px",
                          padding: "8px",
                          borderRadius: "4px",
                        }
                      : false
                  }
                  animate={
                    isMorphing
                      ? {
                          backgroundColor: "#FFFDF0",
                          borderColor: "#101010",
                          borderWidth: "2px",
                          padding: "8px",
                          borderRadius: "4px",
                        }
                      : isUnmorphing
                      ? {
                          backgroundColor: "rgba(255,253,240,0)",
                          borderColor: "rgba(16,16,16,0)",
                          borderWidth: "0px",
                          padding: "0px",
                          borderRadius: "0px",
                        }
                      : {
                          backgroundColor: "transparent",
                          borderWidth: "0px",
                          padding: "0px",
                        }
                  }
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                  className="border-black relative overflow-hidden"
                >
                  {/* Cassette Label Header Stripe */}
                  <motion.div
                    initial={isUnmorphing ? { height: 18, opacity: 1, marginBottom: 6 } : false}
                    animate={
                      isMorphing
                        ? { height: 18, opacity: 1, marginBottom: 6 }
                        : { height: 0, opacity: 0, marginBottom: 0 }
                    }
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    className="overflow-hidden flex justify-between items-center border-b-2 border-black pb-0.5 text-[9px] font-black"
                  >
                    <div className="flex items-center gap-1">
                      <span className="bg-[#FF6B35] text-white px-1 py-0.5 border border-black text-[8px]">SIDE A</span>
                      <span className="text-black uppercase text-[8px]">TYPE I // 60 MIN SP</span>
                    </div>
                    <span className="bg-[#9AE885] border border-black px-1 py-0.5 uppercase text-[8px]">
                      RECORDING VERIFIED
                    </span>
                  </motion.div>

                  {/* CONTESTANT 1 & 2 SELECTION + TEAM NAME OR PASSKEY LOGIN */}
                  {isFormMode ? (
                    <div className="space-y-1">
                      {/* Mode Switcher Tabs */}
                      <div className="grid grid-cols-2 gap-1 mb-2.5 border-2 border-black p-0.5 bg-[#FFF9F3]">
                        <button
                          type="button"
                          onClick={() => {
                            setEntryMode("register");
                            setLoginError("");
                          }}
                          className={`py-1.5 text-[11px] font-syne font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            entryMode === "register"
                              ? "bg-[#FFD12E] text-black border border-black shadow-[1px_1px_0px_#101010]"
                              : "text-gray-600 hover:text-black"
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>REGISTER SQUAD</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEntryMode("login");
                            setP1Error("");
                            setTeamNameError("");
                          }}
                          className={`py-1.5 text-[11px] font-syne font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            entryMode === "login"
                              ? "bg-[#C1F8FF] text-black border border-black shadow-[1px_1px_0px_#101010]"
                              : "text-gray-600 hover:text-black"
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>PASSKEY LOGIN</span>
                        </button>
                      </div>

                      {entryMode === "register" ? (
                        <>
                          {/* PARTICIPANT 1 (LEAD) */}
                          <CandidateSelector
                            label="CONTESTANT 1 (LEAD)"
                            placeholder="Search your registered name..."
                            selectedCandidate={selectedP1}
                            onSelect={(cand) => {
                              setSelectedP1(cand);
                              setP1Error("");
                            }}
                            onClear={() => setSelectedP1(null)}
                            candidates={candidates}
                            excludeId={selectedP2?.id}
                            disabled={isSubmitting || isUnmorphing}
                            isRequired={true}
                            error={p1Error}
                          />

                          {/* PARTICIPANT 2 (OPTIONAL SECOND MEMBER) */}
                          <CandidateSelector
                            label="CONTESTANT 2 (TEAMMATE)"
                            placeholder="Search teammate's name (optional)..."
                            selectedCandidate={selectedP2}
                            onSelect={(cand) => setSelectedP2(cand)}
                            onClear={() => setSelectedP2(null)}
                            candidates={candidates}
                            excludeId={selectedP1?.id}
                            disabled={isSubmitting || isUnmorphing}
                            isRequired={false}
                          />

                          {/* TEAM NAME FIELD */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                                TEAM SQUAD NAME <span className="text-[#E53E3E] font-black">*</span>
                              </label>
                              <span className="text-[9px] text-gray-500 font-mono">
                                [STRICTLY UNIQUE]
                              </span>
                            </div>
                            <input
                              type="text"
                              value={teamNameInput}
                              onChange={(e) => {
                                setTeamNameInput(e.target.value);
                                setTeamNameError("");
                              }}
                              placeholder="e.g. Binary Beasts"
                              disabled={isSubmitting || isUnmorphing}
                              className="w-full border-2 border-black bg-[#FFFDF9] px-3 py-1.5 font-mono text-xs sm:text-sm font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
                              autoComplete="off"
                            />
                            {teamNameError && (
                              <p className="text-[#E53E3E] text-[11px] font-bold mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                <span>{teamNameError}</span>
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* PASSKEY LOGIN VIEW */
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                              REGISTERED SQUAD NAME <span className="text-[#E53E3E] font-black">*</span>
                            </label>
                            <input
                              type="text"
                              value={loginTeamName}
                              onChange={(e) => {
                                setLoginTeamName(e.target.value);
                                setVerifiedTeam(null);
                                setLoginError("");
                              }}
                              placeholder="e.g. Steam Coders"
                              disabled={isSubmitting}
                              className="w-full border-2 border-black bg-[#FFFDF9] px-3 py-1.5 font-mono text-xs sm:text-sm font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none"
                              autoComplete="off"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                              SECRET TEAM PASSKEY <span className="text-[#E53E3E] font-black">*</span>
                            </label>
                            <input
                              type="text"
                              value={loginPasskeyInput}
                              onChange={(e) => {
                                setLoginPasskeyInput(e.target.value);
                                setVerifiedTeam(null);
                                setLoginError("");
                              }}
                              placeholder="e.g. WS-7K39"
                              disabled={isSubmitting}
                              className="w-full border-2 border-black bg-[#FFFDF9] px-3 py-1.5 font-mono text-xs sm:text-sm font-black uppercase text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none tracking-wider"
                              autoComplete="off"
                            />
                          </div>

                          {loginError && (
                            <p className="text-[#E53E3E] text-[11px] font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{loginError}</span>
                            </p>
                          )}

                          {/* Verified Team - single shared session, both members play together */}
                          {verifiedTeam && (
                            <div className="p-2.5 border-2 border-black bg-[#9AE885]/20 animate-in fade-in">
                              <div className="flex items-center gap-1.5 text-xs font-syne font-black text-[#2F855A] mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>SQUAD AUTHENTICATED: {verifiedTeam.name}</span>
                              </div>
                              <p className="text-[10px] text-gray-700 font-mono mb-2">
                                One shared screen &mdash; both teammates play this session together:
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 border-2 border-black text-left text-xs font-bold bg-[#FFD12E] shadow-[2px_2px_0px_#101010]">
                                  <div className="text-[8px] uppercase text-gray-600 font-mono">
                                    TEAMMATE 1
                                  </div>
                                  <div className="truncate text-black font-black">
                                    {verifiedTeam.participant1_name || "Lead"}
                                  </div>
                                </div>

                                <div className={`p-2 border-2 border-black text-left text-xs font-bold shadow-[2px_2px_0px_#101010] ${
                                  verifiedTeam.participant2_name ? "bg-[#FE90E9]" : "bg-white opacity-40"
                                }`}>
                                  <div className="text-[8px] uppercase text-gray-600 font-mono">
                                    TEAMMATE 2
                                  </div>
                                  <div className="truncate text-black font-black">
                                    {verifiedTeam.participant2_name || "(Solo Team)"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CASSETTE PRINTED LABEL STRIP (DURING MORPHING / SEALING) */
                    <div className="space-y-1.5 mb-1.5">
                      <div>
                        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider mb-0.5 text-black">
                          <span>A 1: CONTESTANT ({activePlayer?.participantNumber === 2 ? "CONTESTANT 2" : "CONTESTANT 1"})</span>
                          <span className="bg-[#FFD12E] text-black px-1 text-[7px] font-black border border-black">
                            {activePlayer?.participantNumber === 2 ? "P2" : "P1"}
                          </span>
                        </div>
                        <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-[11px] tracking-tight truncate flex items-center justify-between">
                          <span>
                            {activePlayer?.name || selectedP1?.name || "CONTESTANT"}
                          </span>
                          <span className="text-[7px] text-gray-500 font-bold">[PRINTED]</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[8px] font-bold uppercase tracking-wider mb-0.5 text-black">
                          A 2: TEAM SQUAD
                        </div>
                        <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-[11px] tracking-tight truncate flex items-center justify-between">
                          <span>{activeTeam?.name || teamNameInput || "SQUAD"}</span>
                          <span className="text-[7px] text-gray-500 font-bold">[PRINTED]</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CENTER TAPE WINDOW WITH ROTATING SPOOLS */}
                  <motion.div
                    initial={isUnmorphing ? { height: 44, opacity: 1, marginTop: 4 } : false}
                    animate={
                      isMorphing
                        ? { height: 44, opacity: 1, marginTop: 4 }
                        : { height: 0, opacity: 0, marginTop: 0 }
                    }
                    transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full bg-black/15 border-2 border-black relative flex items-center justify-between px-3 overflow-hidden rounded-xs mt-1"
                  >
                    <div className="absolute inset-x-5 h-2 bg-[#3B1F0E] border-y border-black/70 z-0 opacity-95" />

                    <div className="relative z-10">
                      <CassetteReel size={32} duration={2.6} isSpinning={isMorphing} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center bg-white/90 border border-black px-1.5 py-0.5">
                      <span className="text-[7px] font-mono font-black text-[#FF6B35]">[TAPE 60]</span>
                      <div className="w-10 h-1 bg-black/20 border border-black my-0.5 flex items-center">
                        <div className="h-full bg-black/80 w-3/5" />
                      </div>
                      <span className="text-[6px] font-mono font-bold text-black/70">100 • 50 • 0</span>
                    </div>

                    <div className="relative z-10">
                      <CassetteReel size={32} duration={2.6} isSpinning={isMorphing} />
                    </div>
                  </motion.div>
                </motion.div>

                {/* FORM CONTROLS (LAB & SUBMIT) */}
                <motion.div
                  initial={isUnmorphing ? { maxHeight: 0, opacity: 0, overflow: "hidden", marginTop: 0 } : false}
                  animate={
                    isMorphing
                      ? { maxHeight: 0, opacity: 0, overflow: "hidden", marginTop: 0 }
                      : isUnmorphing
                      ? { maxHeight: 280, opacity: 1, overflow: "hidden", marginTop: 14 }
                      : { maxHeight: 280, opacity: 1, marginTop: 14 }
                  }
                  transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3"
                >
                  {entryMode === "register" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-black">
                        ALLOCATED COMPUTER LAB
                      </label>
                      {lab ? (
                        <div className="border-2 border-black bg-[#C1F8FF] p-2 text-center font-mono font-black text-xs uppercase">
                          ARENA LOCKED: LAB {lab}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLabOption("1")}
                            disabled={isSubmitting}
                            className={`py-2 font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                              selectedLabOption === "1"
                                ? "bg-[#FFD12E] text-black shadow-[2px_2px_0px_#101010]"
                                : "bg-white text-gray-700 hover:bg-[#FFF9A6]"
                            }`}
                          >
                            LAB 1 (OS LAB)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLabOption("2")}
                            disabled={isSubmitting}
                            className={`py-2 font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                              selectedLabOption === "2"
                                ? "bg-[#FFD12E] text-black shadow-[2px_2px_0px_#101010]"
                                : "bg-white text-gray-700 hover:bg-[#FFF9A6]"
                            }`}
                          >
                            LAB 2 (SE LAB)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {entryMode === "register" ? (
                    <button
                      type="button"
                      onClick={handleJoinSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-base py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                    >
                      {isSealing ? (
                        <span className="flex items-center gap-2 animate-pulse">
                          <span>⚙️ ENCODING &amp; PRINTING TAPE...</span>
                        </span>
                      ) : (
                        <span>REGISTER SQUAD &amp; GET PASSKEY ▶</span>
                      )}
                    </button>
                  ) : (
                    <div>
                      {verifiedTeam ? (
                        <button
                          type="button"
                          onClick={handleProceedLoginToVenue}
                          disabled={isSubmitting}
                          className="w-full bg-[#9AE885] hover:bg-[#85DE6E] text-black font-syne font-black text-base py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>INSERT CASSETTE &amp; ENTER ARENA ▶</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifySquadLogin}
                          disabled={isSubmitting}
                          className="w-full bg-[#C1F8FF] hover:bg-[#A6F1FF] text-black font-syne font-black text-base py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <KeyRound className="w-5 h-5 text-black" />
                          <span>AUTHENTICATE SQUAD PASSKEY 🔑</span>
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Form Footer Strip */}
                <motion.div
                  initial={isUnmorphing ? { maxHeight: 0, opacity: 0, marginTop: 0 } : false}
                  animate={
                    isMorphing
                      ? { maxHeight: 0, opacity: 0, marginTop: 0 }
                      : { maxHeight: 40, opacity: 1, marginTop: 16 }
                  }
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                  className="border-t-2 border-dashed border-gray-300 pt-2 flex items-center justify-between text-[10px] font-mono font-bold text-gray-500 uppercase overflow-hidden"
                >
                  <span>[FORMAT: 4X4 GRID]</span>
                  <span>[SESSION LIMIT: 60 SEC]</span>
                </motion.div>

                {/* Bottom Trapezoid Head Notch */}
                <motion.div
                  initial={isUnmorphing ? { height: 15, opacity: 1, marginTop: 4 } : false}
                  animate={
                    isMorphing
                      ? { height: 15, opacity: 1, marginTop: 4 }
                      : { height: 0, opacity: 0, marginTop: 0 }
                  }
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  className="mx-auto w-32 bg-[#121212] border-t-2 border-x-2 border-black flex items-center justify-around px-3 overflow-hidden rounded-t-xs mt-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-black border border-gray-500" />
                  <div className="w-6 h-1 bg-[#3B1F0E] border border-black" />
                  <div className="w-1.5 h-1.5 rounded-full bg-black border border-gray-500" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================= */}
          {/* SCENE 2: UNIFIED WALKMAN PLAYER & STANDBY WAITING DASHBOARD       */}
          {/* Continuous unbroken lifecycle:                                    */}
          {/* Forward: Player Insertion -> Shrinks directly into Waiting Page   */}
          {/* Reverse: Tape in Waiting Page expands directly into Player Unit   */}
          {/* -> Tape Ejects -> Tape Shown Alone -> Unfolds to Form             */}
          {/* ================================================================= */}
          {isPlayerLobbyActive && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={
                isShowingTape
                  ? "absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none py-1"
                  : "w-full flex flex-col items-center relative py-1"
              }
            >
              {/* 
                THE WAITING ROOM DASHBOARD CARD CONTAINER:
                - When aligning, inserting, expanding_player, ejecting, showing_tape:
                  Transparent, 0px border, no shadow, padding 0px.
                - When shrinking_player, revealing_dashboard, waiting, retracting_dashboard:
                  Smoothly forms the official white neo-brutalist card around the player!
              */}
              <motion.div
                initial={false}
                animate={
                  isWaiting
                    ? {
                        backgroundColor: "#ffffff",
                        borderWidth: "3px",
                        borderColor: "#000000",
                        boxShadow: "8px 8px 0px #101010",
                        padding: "clamp(16px, 4vw, 24px)",
                        scale: 1,
                        opacity: 1,
                      }
                    : isRevealingDashboard
                    ? {
                        backgroundColor: ["rgba(255,255,255,0)", "#ffffff"],
                        borderWidth: ["0px", "3px"],
                        borderColor: "#000000",
                        boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "8px 8px 0px #101010"],
                        padding: ["0px", "clamp(16px, 4vw, 24px)"],
                        scale: [0.98, 1],
                        opacity: 1,
                        transition: { duration: 0.7, ease: "easeOut" },
                      }
                    : isRetractingDashboard
                    ? {
                        backgroundColor: ["#ffffff", "rgba(255,255,255,0)"],
                        borderWidth: ["3px", "0px"],
                        boxShadow: ["8px 8px 0px #101010", "0px 0px 0px rgba(0,0,0,0)"],
                        padding: ["clamp(16px, 4vw, 24px)", "0px"],
                        scale: [1, 0.98],
                        opacity: 1,
                        transition: { duration: 0.45, ease: "easeIn" },
                      }
                    : {
                        backgroundColor: "rgba(255,255,255,0)",
                        borderWidth: "0px",
                        borderColor: "transparent",
                        boxShadow: "0px 0px 0px rgba(0,0,0,0)",
                        padding: "0px",
                        scale: 1,
                        opacity: 1,
                      }
                }
                className="w-full max-w-lg relative z-30 font-mono flex flex-col items-center"
              >
                {/* ----------------------------------------------------------- */}
                {/* 1. TOP DASHBOARD ELEMENTS (Header tags & Contestant Banner) */}
                {/* ----------------------------------------------------------- */}
                {isDashboardVisible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: -20 }}
                    animate={
                      isRetractingDashboard
                        ? { height: 0, opacity: 0, y: -20 }
                        : { height: "auto", opacity: 1, y: 0 }
                    }
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="w-full overflow-hidden flex flex-col"
                  >
                    {/* Top Standby Header Tags */}
                    <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-1.5 border-b-2 border-black pb-3 mb-4 sm:mb-5 text-[10px] sm:text-xs font-bold w-full">
                      <span className="bg-[#FFD12E] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#101010] text-black">
                        STANDBY • LAB {activeTeam?.lab || currentLab}
                      </span>
                      <span className="text-black/80 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                        WEBSITICA • CODECTIONS
                      </span>
                      <span className="bg-[#9AE885] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#101010] text-black">
                        INVENTE ’26
                      </span>
                    </div>

                    {/* Contestant & Team Banner */}
                    <div className="border-2 border-black bg-white p-3 sm:p-4 mb-4 sm:mb-5 shadow-[3px_3px_0px_#101010] flex items-center justify-between w-full">
                      <div className="truncate mr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            ACTIVE CONTESTANT
                          </p>
                          <span className="bg-[#FFD12E] text-black text-[9px] font-mono font-black px-1.5 py-0.2 border border-black uppercase">
                            {activePlayer?.participantNumber === 2 ? "CONTESTANT 2" : "CONTESTANT 1"}
                          </span>
                        </div>
                        <p className="font-syne text-sm sm:text-base font-black text-black uppercase truncate">
                          {activePlayer?.name || "CONTESTANT"}
                        </p>
                        {(activePlayer?.participantNumber === 2 ? activePlayer?.participant1 : activePlayer?.participant2) && (
                          <p className="text-[10px] font-mono text-gray-600 mt-0.5 truncate">
                            Teammate: <span className="font-bold text-black">{activePlayer?.participantNumber === 2 ? activePlayer?.participant1 : activePlayer?.participant2}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          TEAM SQUAD
                        </p>
                        <p className="text-[11px] sm:text-xs font-black text-black bg-[#C1F8FF] border border-black px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-[2px_2px_0px_#101010] uppercase inline-block mt-0.5 truncate max-w-[130px] sm:max-w-none">
                          {activeTeam?.name || teamNameInput || "TEAM"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ----------------------------------------------------------- */}
                {/* 2. CENTER SECTION: DASHED WELL ENCLOSING THE PLAYER UNIT     */}
                {/* ----------------------------------------------------------- */}
                <motion.div
                  initial={false}
                  animate={
                    isWaiting
                      ? {
                          borderColor: "rgba(156, 163, 175, 1)",
                          borderWidth: "2px",
                          borderStyle: "dashed",
                          padding: "20px",
                          marginBottom: "20px",
                          width: "100%",
                        }
                      : isRevealingDashboard
                      ? {
                          borderColor: ["rgba(156, 163, 175, 0)", "rgba(156, 163, 175, 1)"],
                          borderWidth: "2px",
                          borderStyle: "dashed",
                          padding: ["0px", "20px"],
                          marginBottom: ["0px", "20px"],
                          width: "100%",
                          transition: { duration: 0.6, ease: "easeOut" },
                        }
                      : isRetractingDashboard
                      ? {
                          borderColor: ["rgba(156, 163, 175, 1)", "rgba(156, 163, 175, 0)"],
                          borderWidth: "2px",
                          borderStyle: "dashed",
                          padding: ["20px", "0px"],
                          marginBottom: ["20px", "0px"],
                          width: "100%",
                          transition: { duration: 0.45, ease: "easeIn" },
                        }
                      : {
                          borderColor: "rgba(156, 163, 175, 0)",
                          borderWidth: "0px",
                          padding: "0px",
                          marginBottom: "0px",
                          width: "auto",
                        }
                  }
                  transition={{ duration: 0.5 }}
                  className="w-full flex flex-col items-center text-center relative"
                >
                  {/* 
                    THE WALKMAN PLAYER CONTAINER:
                    - In insertion: 360x340
                    - In shrinking_player: Smoothly shrinks into 256x68 right here in the dashed well!
                    - In waiting: Renders as the 2D white tape strip inside the dashed well!
                    - In expanding_player: Smoothly expands in place from 256x68 to 360x340!
                    - In ejecting: Tape glides upwards out through the transparent glass!
                    - In showing_tape: Casing drops away, tape rests centered at y: 0!
                  */}
                  <motion.div
                    initial={
                      isAligning
                        ? {
                            width: 360,
                            height: 340,
                            backgroundColor: "#181a1e",
                            borderRadius: "16px",
                            borderWidth: "3px",
                            boxShadow: "8px 8px 0px #101010",
                            opacity: 1,
                            y: 360,
                          }
                        : false
                    }
                    animate={
                      isShrinkingPlayer
                        ? {
                            width: 256,
                            height: 68,
                            backgroundColor: "#ffffff",
                            borderRadius: "0px",
                            borderWidth: "2px",
                            boxShadow: "4px 4px 0px #101010",
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                          }
                        : isWaiting || isRevealingDashboard || isRetractingDashboard
                        ? {
                            width: 256,
                            height: 68,
                            backgroundColor: "#ffffff",
                            borderRadius: "0px",
                            borderWidth: "2px",
                            boxShadow: "4px 4px 0px #101010",
                            opacity: 1,
                            y: 0,
                          }
                        : isExpandingPlayer
                        ? {
                            width: [256, 360],
                            height: [68, 340],
                            backgroundColor: ["#ffffff", "#181a1e"],
                            borderRadius: ["0px", "16px"],
                            borderWidth: ["2px", "3px"],
                            boxShadow: ["4px 4px 0px #101010", "8px 8px 0px #101010"],
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                          }
                        : isAligning
                        ? {
                            width: 360,
                            height: 340,
                            backgroundColor: "#181a1e",
                            borderRadius: "16px",
                            borderWidth: "3px",
                            boxShadow: "8px 8px 0px #101010",
                            opacity: 1,
                            y: [360, 165],
                            transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
                          }
                        : isInserting
                        ? {
                            width: 360,
                            height: 340,
                            backgroundColor: "#181a1e",
                            borderRadius: "16px",
                            borderWidth: "3px",
                            boxShadow: "8px 8px 0px #101010",
                            opacity: 1,
                            y: [165, 0],
                            transition: { duration: 2.2, ease: [0.22, 1, 0.36, 1] },
                          }
                        : isEjecting
                        ? {
                            width: 360,
                            height: 340,
                            backgroundColor: "#181a1e",
                            borderRadius: "16px",
                            borderWidth: "3px",
                            boxShadow: "8px 8px 0px #101010",
                            opacity: 1,
                            y: [0, 165],
                            transition: { duration: 1.8, ease: [0.25, 0.1, 0.25, 1] },
                          }
                        : isShowingTape
                        ? {
                            width: 360,
                            height: 340,
                            backgroundColor: "transparent",
                            borderRadius: "16px",
                            borderWidth: "0px",
                            boxShadow: "none",
                            opacity: 1,
                            y: [165, 850],
                            transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                          }
                        : {
                            width: 360,
                            height: 340,
                            backgroundColor: "#181a1e",
                            borderRadius: "16px",
                            borderWidth: "3px",
                            boxShadow: "8px 8px 0px #101010",
                            opacity: 1,
                            y: 0,
                          }
                    }
                    className={`w-full max-w-[360px] border-black relative font-mono flex flex-col justify-between mx-auto ${
                      isAligning || isInserting || isEjecting || isShowingTape
                        ? "overflow-visible"
                        : "overflow-hidden"
                    }`}
                  >
                    {/* ----------------------------------------------------------- */}
                    {/* STATE A: PHYSICAL WALKMAN INSERTION & EJECTION MODE         */}
                    {/* Only mounted and visible during full Walkman player modes!  */}
                    {/* ----------------------------------------------------------- */}
                    {!(isWaiting || isRevealingDashboard || isRetractingDashboard) && (
                      <motion.div
                        initial={isExpandingPlayer ? { opacity: 0 } : { opacity: 1 }}
                        animate={
                          isShrinkingPlayer
                            ? { opacity: [1, 0.3, 0] }
                            : isExpandingPlayer
                            ? { opacity: [0, 0.3, 1] }
                            : { opacity: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className={`w-full h-full relative flex flex-col justify-between ${
                          isShrinkingPlayer ? "pointer-events-none" : ""
                        }`}
                      >
                        {/* LAYER 1: REAR PLAYER CAVITY (Behind the moving tape) */}
                        <motion.div
                          animate={
                            isShowingTape
                              ? { y: 0, opacity: [1, 0] }
                              : { y: 0, opacity: 1 }
                          }
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0 bg-[#0d0e11] z-0 flex flex-col items-center rounded-2xl overflow-hidden pointer-events-none"
                        >
                          {/* Internal Drive Spindles */}
                          <div className="absolute inset-x-12 top-[135px] flex justify-between items-center pointer-events-none opacity-60">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full bg-white/60 border border-black flex items-center justify-center text-[7px] font-black">
                                •
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full bg-white/60 border border-black flex items-center justify-center text-[7px] font-black">
                                •
                              </div>
                            </div>
                          </div>

                          {/* Internal Bottom Magnetic Pickup Head */}
                          <div className="absolute bottom-11 inset-x-16 h-3 bg-[#1a1a1a] border-t border-black/60 flex items-center justify-around px-3 opacity-70">
                            <div className="w-3 h-1.5 bg-[#FF6B35]" />
                            <div className="w-8 h-2 bg-black border border-gray-600 rounded-[1px]" />
                            <div className="w-3 h-1.5 bg-[#FF6B35]" />
                          </div>
                        </motion.div>

                        {/* LAYER 2: THE CASSETTE TAPE (GLIDES VERTICALLY IN / OUT - CONTINUOUS!) */}
                        <motion.div
                          initial={isAligning ? { y: -360, opacity: 1 } : false}
                          animate={
                            isAligning
                              ? {
                                  // Stationary on screen: local [-360, -165] exactly offsets player [360, 165] = net 0!
                                  y: [-360, -165],
                                  opacity: 1,
                                  transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
                                }
                              : isInserting
                              ? {
                                  // Forward Insertion: Tape glides down through transparent glass into cavity
                                  y: [-165, -95, -30, 25, 52, 55, 51, 52],
                                  transition: {
                                    duration: 2.2,
                                    times: [0, 0.25, 0.5, 0.75, 0.9, 0.94, 0.97, 1],
                                    ease: "easeInOut",
                                  },
                                }
                              : isEjecting
                              ? {
                                  // Reverse Ejection: Symmetrical smooth glide UP out of slot (100% -> 0%)
                                  y: [52, -165],
                                  transition: {
                                    duration: 1.8,
                                    ease: [0.25, 0.1, 0.25, 1],
                                  },
                                }
                              : isShowingTape
                              ? {
                                  // Counteracts player [165 -> 850] drop: [-165 -> -850] = net 0 stationary on screen!
                                  y: [-165, -850],
                                  opacity: 1,
                                  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                                }
                              : { y: 52, opacity: 1 }
                          }
                          className="w-[320px] max-w-[calc(100%-20px)] border-3 border-black bg-[#1c1c1c] rounded-2xl absolute inset-x-0 mx-auto top-0 z-10 shadow-[6px_6px_0px_#101010] overflow-hidden"
                        >
                            {/* 4 Corner Screws */}
                            <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none">
                              +
                            </div>
                            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none">
                              +
                            </div>
                            <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none">
                              +
                            </div>
                            <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#353535] border border-black flex items-center justify-center text-[8px] text-gray-300 font-mono font-black z-40 pointer-events-none">
                              +
                            </div>

                            {/* Top Black Bar */}
                            <div className="bg-[#181818] text-white px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-mono text-[11px] font-bold relative z-20">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#E53E3E] animate-pulse" />
                                <span className="tracking-wider text-gray-200">[REC 01 // SIDE A]</span>
                              </div>
                              <span className="text-black text-[9px] font-mono font-black px-1.5 py-0.5 border border-black uppercase bg-[#FFD12E]">
                                LAB {currentLab} • CASSETTE
                              </span>
                            </div>

                            {/* Cassette Body / Cream Sticker Label */}
                            <div className="p-2.5 font-mono relative z-20">
                              <div className="bg-[#FFFDF0] border-2 border-black p-2 rounded-xs">
                                {/* Label Header Stripe */}
                                <div className="flex justify-between items-center border-b-2 border-black pb-0.5 mb-1.5 text-[9px] font-black">
                                  <div className="flex items-center gap-1">
                                    <span className="bg-[#FF6B35] text-white px-1 py-0.5 border border-black text-[8px]">SIDE A</span>
                                    <span className="text-black uppercase text-[8px]">TYPE I // 60 MIN SP</span>
                                  </div>
                                  <span className="bg-[#9AE885] border border-black px-1 py-0.5 uppercase text-[8px]">
                                    RECORDING VERIFIED
                                  </span>
                                </div>

                                {/* Contestant Line */}
                                <div className="mb-1.5">
                                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider mb-0.5 text-black">
                                    <span>A 1: CONTESTANT ({activePlayer?.participantNumber === 2 ? "P2" : "P1"})</span>
                                  </div>
                                  <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-xs tracking-tight truncate flex items-center justify-between">
                                    <span>
                                      {activePlayer?.name || "ALAN TURING"}
                                    </span>
                                    <span className="text-[8px] text-gray-500 font-bold">[PRINTED]</span>
                                  </div>
                                </div>

                                {/* Team Squad Line */}
                                <div className="mb-1.5">
                                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5 text-black">
                                    A 2: TEAM SQUAD
                                  </div>
                                  <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-xs tracking-tight truncate flex items-center justify-between">
                                    <span>{activeTeam?.name || teamNameInput || "BINARY BEASTS"}</span>
                                    <span className="text-[8px] text-gray-500 font-bold">[PRINTED]</span>
                                  </div>
                                </div>

                                {/* Center Tape Window with Concentric Spools */}
                                <div className="w-full h-[44px] bg-black/15 border-2 border-black relative flex items-center justify-between px-3 overflow-hidden rounded-xs mt-1">
                                  <div className="absolute inset-x-5 h-2 bg-[#3B1F0E] border-y border-black/70 z-0 opacity-95" />

                                  <div className="relative z-10">
                                    <CassetteReel
                                      size={32}
                                      duration={2.6}
                                      isSpinning={insertionProgress >= 75 && !isEjecting && !isShowingTape}
                                    />
                                  </div>

                                  <div className="relative z-10 flex flex-col items-center bg-white/90 border border-black px-1.5 py-0.5">
                                    <span className="text-[7px] font-mono font-black text-[#FF6B35]">[TAPE 60]</span>
                                    <div className="w-10 h-1 bg-black/20 border border-black my-0.5 flex items-center">
                                      <div className="h-full bg-black/80 w-3/5" />
                                    </div>
                                    <span className="text-[6px] font-mono font-bold text-black/70">100 • 50 • 0</span>
                                  </div>

                                  <div className="relative z-10">
                                    <CassetteReel
                                      size={32}
                                      duration={2.6}
                                      isSpinning={insertionProgress >= 75 && !isEjecting && !isShowingTape}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Head Notch */}
                              <div className="mx-auto w-32 h-[15px] bg-[#121212] border-t-2 border-x-2 border-black flex items-center justify-around px-3 overflow-hidden rounded-t-xs mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-black border border-gray-500" />
                                <div className="w-6 h-1 bg-[#3B1F0E] border border-black" />
                                <div className="w-1.5 h-1.5 rounded-full bg-black border border-gray-500" />
                              </div>
                            </div>
                          </motion.div>

                        {/* LAYER 3: FRONT FACEPLATE & TRANSPARENT GLASS WINDOW (z-20) */}
                        <motion.div
                          animate={
                            isShowingTape
                              ? { y: 0, opacity: [1, 0] }
                              : { y: 0, opacity: 1 }
                          }
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="w-full flex-1 flex flex-col justify-between z-20 pointer-events-none"
                        >
                          {/* Top Physical Controls Bar */}
                          <div className="w-full bg-[#181a1e] border-b-2 border-black/90 px-3 py-2 flex flex-col relative shadow-sm pointer-events-auto">
                            <div className="w-full flex items-center justify-between text-[10px] font-black pb-1.5">
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={
                                    insertionProgress === 100 && !isEjecting && !isShowingTape
                                      ? { y: 2, backgroundColor: "#E55A25", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }
                                      : { y: 0, backgroundColor: "#FF6B35", boxShadow: "0 2px 0px #000" }
                                  }
                                  transition={{ duration: 0.15 }}
                                  className="w-10 h-4 border border-black rounded-[2px] flex items-center justify-center text-[7px] text-white font-black tracking-wider select-none"
                                >
                                  PLAY ▶
                                </motion.div>
                                <div className="w-7 h-4 bg-[#111] border border-black rounded-[2px] flex items-center justify-center text-[7px] text-gray-400 font-bold">
                                  STOP
                                </div>
                                <div className="w-7 h-4 bg-[#111] border border-black rounded-[2px] flex items-center justify-center text-[7px] text-gray-400 font-bold">
                                  FFWD
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[#FFD12E] text-[9px] uppercase tracking-wider font-bold">
                                  {isEjecting
                                    ? `EJECTING ${insertionProgress}%`
                                    : isShowingTape
                                    ? "EJECTED"
                                    : insertionProgress === 100
                                    ? "PLAYING"
                                    : insertionProgress > 0
                                    ? `INSERTING ${insertionProgress}%`
                                    : "SLOT READY"}
                                </span>
                                <div className="w-4 h-4 rounded-full bg-[#2a2c30] border border-black flex items-center justify-center text-[7px] text-gray-300 font-bold">
                                  VOL
                                </div>
                              </div>
                            </div>

                            {/* Slot Entrance Bevel */}
                            <div className="w-full h-2 bg-black border border-gray-700 rounded-t-sm flex items-center justify-center">
                              <div className="w-3/4 h-1 bg-gray-900 rounded-full" />
                            </div>
                          </div>

                          {/* Middle Section: Opaque side borders & transparent center window */}
                          <div className="w-full flex-1 relative flex items-stretch px-1 pointer-events-none">
                            <div className="w-8 bg-[#181a1e] border-r-2 border-black/80 shadow-md flex flex-col items-center justify-center">
                              <div className="w-1.5 h-16 bg-black/40 rounded-full" />
                            </div>

                            <div className="flex-1 mx-1 bg-black/20 backdrop-blur-[0.5px] border-2 border-black/80 rounded-lg relative overflow-hidden shadow-inner flex flex-col justify-between">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-transparent pointer-events-none z-30" />
                              <div className="w-full text-right pr-2 pt-1">
                                <span className="text-[7px] font-mono font-bold text-white/40 uppercase tracking-widest">
                                  ACRYLIC VIEW • 60M
                                </span>
                              </div>
                            </div>

                            <div className="w-8 bg-[#181a1e] border-l-2 border-black/80 shadow-md flex flex-col items-center justify-center">
                              <div className="w-1.5 h-16 bg-black/40 rounded-full" />
                            </div>
                          </div>

                          {/* Bottom Mechanical Status & Progress Bar */}
                          <div className="w-full bg-[#181a1e] border-t border-gray-800 px-3 py-1.5 flex flex-col gap-1 text-[9px] font-mono pointer-events-auto">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 uppercase text-[8px]">
                                {isEjecting ? "EJECT DEPTH:" : "INSERTION DEPTH:"}
                              </span>
                              <span className="font-black text-[#FFD12E] text-[9px]">
                                {insertionProgress === 100 ? "100% • SEATED" : `${insertionProgress}%`}
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-black border border-gray-700 rounded-xs flex overflow-hidden">
                              <motion.div
                                animate={{ width: `${insertionProgress}%` }}
                                transition={{ duration: 0.3 }}
                                className="h-full bg-[#9AE885]"
                              />
                            </div>

                            <div className="flex items-center justify-between text-[8px] text-gray-500">
                              <span>HEAD: {insertionProgress >= 75 ? "COUPLED" : "OPEN"}</span>
                              <span className="text-[#9AE885] font-black">
                                {isEjecting
                                  ? "EJECT TRACKING"
                                  : isShowingTape
                                  ? "TAPE FREED"
                                  : insertionProgress === 100
                                  ? "✓ [CLICK! TAPE LOCKED]"
                                  : "GUIDE TRACKING"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* ----------------------------------------------------------- */}
                    {/* STATE B: SEAMLESS 2D WHITE CASSETTE STRIP (WHEN COMPACT)    */}
                    {/* Shown when shrinking, waiting, or expanding!               */}
                    {/* ----------------------------------------------------------- */}
                    {(isShrinkingPlayer || isExpandingPlayer || isWaiting || isRevealingDashboard || isRetractingDashboard) && (
                      <motion.div
                        initial={isShrinkingPlayer ? { opacity: 0 } : { opacity: 1 }}
                        animate={
                          isShrinkingPlayer
                            ? { opacity: [0, 0.4, 1], scale: [0.96, 1] }
                            : isExpandingPlayer
                            ? { opacity: [1, 0.4, 0], scale: [1, 0.96] }
                            : { opacity: 1, scale: 1 }
                        }
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="absolute inset-0 p-2.5 flex items-center justify-between bg-white z-30 select-none pointer-events-none"
                      >
                        <CassetteReel size={44} duration={2.8} isSpinning={true} />

                        <div className="flex flex-col items-center px-1 flex-1">
                          <span className="text-[10px] font-mono font-black tracking-widest text-[#FF6B35]">
                            [TAPE 60]
                          </span>
                          <div className="w-16 h-3 bg-[#101010]/15 border border-black my-1 relative overflow-hidden flex items-center">
                            <div className="h-full bg-black/80 w-3/5" />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-black/60">
                            SIDE A
                          </span>
                        </div>

                        <CassetteReel size={44} duration={2.8} isSpinning={true} />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Dashed Well Subtitle & Queue Timer Pill */}
                  {isDashboardVisible && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: 15 }}
                      animate={
                        isRetractingDashboard
                          ? { height: 0, opacity: 0, y: 15 }
                          : { height: "auto", opacity: 1, y: 0 }
                      }
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="w-full flex flex-col items-center overflow-hidden mt-3"
                    >
                      <h2 className="font-syne text-2xl sm:text-3xl font-black text-black tracking-tight uppercase mt-1">
                        {sessionStatusInfo?.type === "completed"
                          ? "SESSION COMPLETED"
                          : "WARMING UP TAPE..."}
                      </h2>
                      <p className="text-xs font-semibold text-gray-600 mt-1 max-w-xs">
                        {sessionStatusInfo?.type === "completed"
                          ? "Your round score has been registered in the database."
                          : "The puzzle arena will open automatically when the round begins."}
                      </p>
                      {sessionStatusInfo?.type !== "completed" && (
                        <div className="mt-4 border-2 border-black bg-[#FE90E9] px-4 py-1 font-mono text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#101010] text-black">
                          QUEUE TIMER: {Math.floor(waitingTime / 60)}:{(waitingTime % 60).toString().padStart(2, "0")}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* ----------------------------------------------------------- */}
                {/* 3. BOTTOM ACTION BUTTONS                                    */}
                {/* ----------------------------------------------------------- */}
                {isDashboardVisible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: 20 }}
                    animate={
                      isRetractingDashboard
                        ? { height: 0, opacity: 0, y: 20 }
                        : { height: "auto", opacity: 1, y: 0 }
                    }
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="w-full overflow-hidden space-y-3"
                  >
                    {sessionStatusInfo?.type === "completed" ? (
                      <div className="p-4 border-2 border-black bg-[#9AE885]/35 text-center shadow-[4px_4px_0px_#101010] mb-2">
                        <div className="flex items-center justify-center gap-2 text-black font-syne font-black text-sm uppercase mb-1">
                          <CheckCircle2 className="w-5 h-5 text-[#227a3c]" />
                          <span>SESSION COMPLETED ✓</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-800">
                          {sessionStatusInfo.description || "You've completed the current session. Please wait for the next broadcast."}
                        </p>
                        {sessionStatusInfo.score !== undefined && (
                          <div className="mt-2 inline-block bg-black text-[#9AE885] font-mono text-xs font-bold px-3 py-1 border border-black shadow-[2px_2px_0px_#101010]">
                            FINAL SCORE: {sessionStatusInfo.score} PTS
                          </div>
                        )}
                      </div>
                    ) : teamLockState === "blocked" ? (
                      <div className="p-4 border-2 border-black bg-[#FF6B35]/20 text-center shadow-[4px_4px_0px_#101010] mb-2">
                        <div className="flex items-center justify-center gap-2 text-black font-syne font-black text-sm uppercase mb-1">
                          <MonitorX className="w-5 h-5 text-[#FF6B35]" />
                          <span>ALREADY IN PLAY</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-800">
                          Your squad is already on another screen. This round is
                          played together on one device.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartGame}
                        className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-base py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>▶ ENTER GAME ARENA ▶</span>
                      </button>
                    )}

                    <button
                      onClick={handleEjectCassette}
                      className="w-full bg-white hover:bg-gray-50 text-black font-mono text-xs font-bold py-2.5 px-4 border-2 border-black shadow-[3px_3px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#101010] transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>EJECT CASSETTE / CHANGE DETAILS</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
