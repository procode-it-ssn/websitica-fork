"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/client";
import { whereLab } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IS_MOCK_MODE } from "@/lib/mockData";

const schema = z.object({
  playerName: z.string().min(2, "Contestant name must be at least 2 characters"),
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  lab: z.enum(["1", "2"], { errorMap: () => ({ message: "Please select your lab" }) }),
});

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

export default function JoinGame({ lab = null }) {
  // Cinematic Continuous Physical Interaction Lifecycle:
  // FORWARD:  form -> sealing -> morphing -> aligning -> inserting -> shrinking_player -> revealing_dashboard -> waiting
  // REVERSE:  waiting -> retracting_dashboard -> expanding_player -> ejecting -> showing_tape -> unmorphing -> form
  const [animPhase, setAnimPhase] = useState("form");
  const [insertionProgress, setInsertionProgress] = useState(0); // 0 -> 25 -> 50 -> 75 -> 100 (or reverse)
  const [activePlayer, setActivePlayer] = useState(null);
  const [activeTeam, setActiveTeam] = useState(null);
  const [waitingTime, setWaitingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      playerName: "",
      teamName: "",
      lab: lab ? String(lab) : "1",
    },
  });

  const selectedLab = watch("lab");
  const watchedPlayer = watch("playerName");
  const watchedTeam = watch("teamName");

  // Restore saved player data if user returns
  useEffect(() => {
    try {
      const savedPlayer = localStorage.getItem("playerData");
      const savedTeam = localStorage.getItem("teamData");
      if (savedPlayer && savedTeam) {
        const p = JSON.parse(savedPlayer);
        const t = JSON.parse(savedTeam);
        if (p?.name) setValue("playerName", p.name);
        if (t?.name) setValue("teamName", t.name);
        if (t?.lab) setValue("lab", String(t.lab));
      }
    } catch (e) {
      // ignore
    }
  }, [setValue]);

  // ===========================================================================
  // FORWARD FLOW: FORM → TAPE → TRANSPARENT INSERTION → SHRINK → REVEAL LOBBY
  // ===========================================================================
  const executeJoin = async (playerName, teamName, labNum) => {
    setIsSubmitting(true);

    const targetTeam = { id: "team-" + Date.now(), name: teamName, lab: labNum, score: 0 };
    const targetPlayer = { id: "player-" + Date.now(), name: playerName };

    if (!IS_MOCK_MODE) {
      try {
        const { data: existingTeam } = await supabase
          .from("teams")
          .select("*")
          .eq("name", teamName)
          .single();

        if (existingTeam && existingTeam.lab !== labNum) {
          alert(`Team name "${teamName}" is already taken in Lab ${existingTeam.lab}.`);
          setIsSubmitting(false);
          return;
        }

        let { data: teamData, error: teamError } = await whereLab(
          supabase.from("teams").select("*").eq("name", teamName),
          labNum,
        ).single();

        if (teamError && teamError.code === "PGRST116") {
          const { data, error } = await supabase
            .from("teams")
            .insert({ name: teamName, score: 0, lab: labNum })
            .select()
            .single();
          if (error) throw error;
          teamData = data;
        } else if (teamError) {
          throw teamError;
        }

        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .insert({ name: playerName, team_id: teamData.id })
          .select()
          .single();

        if (playerError) throw playerError;

        targetPlayer.id = playerData.id;
        targetTeam.id = teamData.id;
      } catch (err) {
        console.error("Database connection error:", err);
      }
    }

    // Persist immediately in localStorage
    localStorage.setItem("playerData", JSON.stringify(targetPlayer));
    localStorage.setItem("teamData", JSON.stringify(targetTeam));
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

  const onSubmit = (data) => {
    executeJoin(data.playerName.trim(), data.teamName.trim(), parseInt(data.lab, 10));
  };

  // ===========================================================================
  // REVERSE FLOW: WAITING → RETRACT → EXPAND PLAYER → EJECT TAPE → SHOW TAPE FIRST → UNFOLD FORM
  // (Exact symmetrical, continuous reverse with zero jumps or fragmentation)
  // ===========================================================================
  const handleEjectCassette = () => {
    setIsSubmitting(false);

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
    }, 8100);
  };

  const handleStartGame = () => {
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
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center relative bg-transparent py-8 px-4 font-mono select-none overflow-hidden">
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
          className="flex flex-col items-center text-center overflow-hidden w-full"
        >
          {/* Institution & Department Eyebrow Badges */}
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#9AE885] border-2 border-black px-3 py-0.5 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#101010] text-black">
              SSN × SNUC INVENTE &apos;26
            </span>
            <span className="bg-[#C1F8FF] border-2 border-black px-3 py-0.5 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#101010] text-black">
              IT DEPARTMENT
            </span>
          </div>

          {/* Grand Centered Headline */}
          <h1 className="font-syne text-5xl sm:text-6xl md:text-7xl font-black text-[#101010] tracking-tight uppercase leading-none my-1">
            CODECTIONS
          </h1>

          {/* Subtitle Yellow Banner */}
          <div className="mt-1.5 bg-[#FFD12E] border-2 border-black px-3 sm:px-4 py-1 font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_#101010] text-black tracking-wide">
            A GIANT LEAP, OUT OF THE BOX • 4 GROUPS OF 4 WORDS
          </div>
        </motion.div>



        {/* ======================================================== */}
        {/* STAGE CONTAINER: UNBROKEN CONTINUITY                     */}
        {/* ======================================================== */}
        <div className="w-full flex flex-col items-center relative min-h-[480px] justify-center">

          {/* ================================================================= */}
          {/* SCENE 1: FORM ↔ TAPE MORPH & UNMORPHING BACK TO FORM             */}
          {/* (Active during form, sealing, morphing, showing_tape, unmorphing) */}
          {/* ================================================================= */}
          {isFormStageActive && (
            <motion.div
              initial={
                isUnmorphing
                  ? {
                      width: "320px",
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
                      width: "320px",
                      backgroundColor: "#1c1c1c",
                      borderRadius: "16px",
                      scale: 1,
                      y: 0,
                      boxShadow: "6px 6px 0px #101010",
                      transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                    }
                  : isUnmorphing
                  ? {
                      width: "448px",
                      backgroundColor: "#ffffff",
                      borderRadius: "0px",
                      scale: 1,
                      y: 0,
                      boxShadow: "8px 8px 0px #101010",
                      transition: { duration: 2.0, ease: [0.22, 1, 0.36, 1] },
                    }
                  : isSealing
                  ? {
                      width: "448px",
                      backgroundColor: "#ffffff",
                      borderRadius: "0px",
                      scale: 0.99,
                      y: 2,
                      boxShadow: "4px 4px 0px #101010",
                      transition: { duration: 0.2 },
                    }
                  : {
                      width: "448px",
                      backgroundColor: "#ffffff",
                      borderRadius: "0px",
                      scale: 1,
                      y: 0,
                      boxShadow: "8px 8px 0px #101010",
                    }
              }
              className="w-full max-w-full border-3 border-black relative z-30 transition-shadow overflow-hidden"
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
                    ? `LAB ${selectedLab || 1} • CASSETTE`
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

                  {/* CONTESTANT NAME FIELD */}
                  <div className={isMorphing ? "mb-1.5" : "mb-3"}>
                    <label className={`block font-bold uppercase tracking-wider text-black ${
                      isMorphing ? "text-[9px] mb-0.5" : "text-[11px] mb-1"
                    }`}>
                      {isMorphing ? "A 1: CONTESTANT" : "CONTESTANT NAME"}
                    </label>
                    <div className="relative">
                      <input
                        {...register("playerName")}
                        placeholder="e.g. Alan Turing"
                        disabled={isSubmitting || isUnmorphing}
                        className={`w-full border-2 border-black bg-[#FFFDF9] px-3 py-2 font-mono text-sm font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none transition-opacity duration-700 ${
                          isFormMode
                            ? "opacity-100 pointer-events-auto"
                            : isUnmorphing
                            ? "opacity-100 pointer-events-none"
                            : "opacity-0 pointer-events-none absolute inset-0"
                        }`}
                        autoComplete="off"
                      />
                      {isMorphing && (
                        <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-xs tracking-tight truncate flex items-center justify-between">
                          <span>{watchedPlayer || "ALAN TURING"}</span>
                          <span className="text-[8px] text-gray-500 font-bold">[PRINTED]</span>
                        </div>
                      )}
                    </div>
                    {errors.playerName && isFormMode && (
                      <p className="text-[#E53E3E] text-xs font-bold mt-1">
                        ⚠️ {errors.playerName.message}
                      </p>
                    )}
                  </div>

                  {/* TEAM NAME FIELD */}
                  <div className={isMorphing ? "mb-1.5" : "mb-2"}>
                    <label className={`block font-bold uppercase tracking-wider text-black ${
                      isMorphing ? "text-[9px] mb-0.5" : "text-[11px] mb-1"
                    }`}>
                      {isMorphing ? "A 2: TEAM SQUAD" : "TEAM NAME"}
                    </label>
                    <div className="relative">
                      <input
                        {...register("teamName")}
                        placeholder="e.g. Binary Beasts"
                        disabled={isSubmitting || isUnmorphing}
                        className={`w-full border-2 border-black bg-[#FFFDF9] px-3 py-2 font-mono text-sm font-bold text-black placeholder:text-gray-400 focus:bg-[#FFF9A6] focus:outline-none transition-opacity duration-700 ${
                          isFormMode
                            ? "opacity-100 pointer-events-auto"
                            : isUnmorphing
                            ? "opacity-100 pointer-events-none"
                            : "opacity-0 pointer-events-none absolute inset-0"
                        }`}
                        autoComplete="off"
                      />
                      {isMorphing && (
                        <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-xs tracking-tight truncate flex items-center justify-between">
                          <span>{watchedTeam || "BINARY BEASTS"}</span>
                          <span className="text-[8px] text-gray-500 font-bold">[PRINTED]</span>
                        </div>
                      )}
                    </div>
                    {errors.teamName && isFormMode && (
                      <p className="text-[#E53E3E] text-xs font-bold mt-1">
                        ⚠️ {errors.teamName.message}
                      </p>
                    )}
                  </div>

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
                  className="space-y-4"
                >
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
                          onClick={() => setValue("lab", "1")}
                          disabled={isSubmitting}
                          className={`py-2 font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                            selectedLab === "1"
                              ? "bg-[#FFD12E] text-black shadow-[2px_2px_0px_#101010]"
                              : "bg-white text-gray-700 hover:bg-[#FFF9A6]"
                          }`}
                        >
                          LAB 1 (OS LAB)
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue("lab", "2")}
                          disabled={isSubmitting}
                          className={`py-2 font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer ${
                            selectedLab === "2"
                              ? "bg-[#FFD12E] text-black shadow-[2px_2px_0px_#101010]"
                              : "bg-white text-gray-700 hover:bg-[#FFF9A6]"
                          }`}
                        >
                          LAB 2 (SE LAB)
                        </button>
                      </div>
                    )}
                    {errors.lab && (
                      <p className="text-[#E53E3E] text-xs font-bold mt-1">
                        ⚠️ {errors.lab.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-base py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                  >
                    {isSealing ? (
                      <span className="flex items-center gap-2 animate-pulse">
                        <span>⚙️ ENCODING &amp; PRINTING TAPE...</span>
                      </span>
                    ) : (
                      <span>INSERT CASSETTE &amp; PLAY ▶</span>
                    )}
                  </button>
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
                        padding: "24px",
                        scale: 1,
                        opacity: 1,
                      }
                    : isRevealingDashboard
                    ? {
                        backgroundColor: ["rgba(255,255,255,0)", "#ffffff"],
                        borderWidth: ["0px", "3px"],
                        borderColor: "#000000",
                        boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "8px 8px 0px #101010"],
                        padding: ["0px", "24px"],
                        scale: [0.98, 1],
                        opacity: 1,
                        transition: { duration: 0.7, ease: "easeOut" },
                      }
                    : isRetractingDashboard
                    ? {
                        backgroundColor: ["#ffffff", "rgba(255,255,255,0)"],
                        borderWidth: ["3px", "0px"],
                        boxShadow: ["8px 8px 0px #101010", "0px 0px 0px rgba(0,0,0,0)"],
                        padding: ["24px", "0px"],
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
                    <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-5 text-xs font-bold w-full">
                      <span className="bg-[#FFD12E] border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0px_#101010] text-black">
                        STANDBY • LAB {activeTeam?.lab || selectedLab || 1}
                      </span>
                      <span className="text-black/80 font-bold uppercase tracking-wider text-[11px]">
                        WEBSITICA • CODECTIONS
                      </span>
                      <span className="bg-[#9AE885] border-2 border-black px-2.5 py-0.5 shadow-[2px_2px_0px_#101010] text-black">
                        INVENTE ’26
                      </span>
                    </div>

                    {/* Contestant & Team Banner */}
                    <div className="border-2 border-black bg-white p-4 mb-5 shadow-[3px_3px_0px_#101010] flex items-center justify-between w-full">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          CONTESTANT
                        </p>
                        <p className="font-syne text-xl font-bold text-black uppercase mt-0.5">
                          {activePlayer?.name || watchedPlayer || "CONTESTANT"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          TEAM SQUAD
                        </p>
                        <p className="text-xs font-black text-black bg-[#C1F8FF] border border-black px-2.5 py-1 shadow-[2px_2px_0px_#101010] uppercase inline-block mt-0.5">
                          {activeTeam?.name || watchedTeam || "TEAM"}
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
                  className="flex flex-col items-center text-center relative"
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
                            width: "360px",
                            height: "340px",
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
                            width: "256px",
                            height: "68px",
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
                            width: "256px",
                            height: "68px",
                            backgroundColor: "#ffffff",
                            borderRadius: "0px",
                            borderWidth: "2px",
                            boxShadow: "4px 4px 0px #101010",
                            opacity: 1,
                            y: 0,
                          }
                        : isExpandingPlayer
                        ? {
                            width: ["256px", "360px"],
                            height: ["68px", "340px"],
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
                            width: "360px",
                            height: "340px",
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
                            width: "360px",
                            height: "340px",
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
                            width: "360px",
                            height: "340px",
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
                            width: "360px",
                            height: "340px",
                            backgroundColor: "transparent",
                            borderRadius: "16px",
                            borderWidth: "0px",
                            boxShadow: "none",
                            opacity: 1,
                            y: [165, 850],
                            transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                          }
                        : {
                            width: "360px",
                            height: "340px",
                            backgroundColor: "#181a1e",
                            borderRadius: "16px",
                            borderWidth: "3px",
                            boxShadow: "8px 8px 0px #101010",
                            opacity: 1,
                            y: 0,
                          }
                    }
                    className={`border-black relative font-mono flex flex-col justify-between ${
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
                          className="w-[320px] border-3 border-black bg-[#1c1c1c] rounded-2xl absolute left-[20px] top-0 z-10 shadow-[6px_6px_0px_#101010] overflow-hidden"
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
                                LAB {selectedLab || 1} • CASSETTE
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
                                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5 text-black">
                                    A 1: CONTESTANT
                                  </div>
                                  <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-xs tracking-tight truncate flex items-center justify-between">
                                    <span>{watchedPlayer || "ALAN TURING"}</span>
                                    <span className="text-[8px] text-gray-500 font-bold">[PRINTED]</span>
                                  </div>
                                </div>

                                {/* Team Squad Line */}
                                <div className="mb-1.5">
                                  <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5 text-black">
                                    A 2: TEAM SQUAD
                                  </div>
                                  <div className="border-b border-black/40 pb-0.5 text-black font-black uppercase text-xs tracking-tight truncate flex items-center justify-between">
                                    <span>{watchedTeam || "BINARY BEASTS"}</span>
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
                        WARMING UP TAPE...
                      </h2>
                      <p className="text-xs font-semibold text-gray-600 mt-1 max-w-xs">
                        The puzzle arena will open automatically when the round begins.
                      </p>
                      <div className="mt-4 border-2 border-black bg-[#FE90E9] px-4 py-1 font-mono text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#101010] text-black">
                        QUEUE TIMER: {Math.floor(waitingTime / 60)}:{(waitingTime % 60).toString().padStart(2, "0")}
                      </div>
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
                    <button
                      onClick={handleStartGame}
                      className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-syne font-black text-base py-3 px-4 border-2 border-black shadow-[4px_4px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>▶ ENTER GAME ARENA ▶</span>
                    </button>

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
