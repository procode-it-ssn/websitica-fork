import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/client";
import {
  CircleUserRound,
  Heart,
  Loader2,
  Shuffle,
  Timer,
  X,
  Trophy,
  Sparkles,
  Disc3,
  Award,
  Flame,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn, whereLab } from "@/lib/utils";
import {
  IS_MOCK_MODE,
  MOCK_SESSION,
  MOCK_CATEGORIES_DATA,
} from "@/lib/mockData";

const QUESTION_DURATION = 60; // 1 minute in seconds
const TOTAL_CATEGORIES = 4;
const POINTS_POSSIBLE = 1000;
const MAX_LIVES = 4;

// Invente neo-brutalist pastel palette for solved category banners
const categoryColorMap = {
  "Browser Dev Tools": "bg-[#C1F8FF]",
  "URL Components": "bg-[#9AE885]",
  "CSS Display Values": "bg-[#FE90E9]",
  "Frontend Frameworks": "bg-[#FFD12E]",

  "Programming Languages": "bg-[#D4A5FF]",
  Databases: "bg-[#FF6B35] text-white",
  "Web APIs": "bg-[#C1F8FF]",
  "Web Security Threats": "bg-[#FE90E9]",

  "API Authentication": "bg-[#9AE885]",
  "Mobile Frameworks": "bg-[#FFD12E]",
  "CSS Units": "bg-[#D4A5FF]",
  "JavaScript Concepts": "bg-[#C1F8FF]",

  "Protocols": "bg-[#FE90E9]",
  "Backend Frameworks": "bg-[#FF6B35] text-white",
  "Frontend Toolkits": "bg-[#9AE885]",
  "HTML Elements": "bg-[#FFD12E]",

  "Version Control": "bg-[#C1F8FF]",
  "Database Concepts": "bg-[#D4A5FF]",
  "Cloud Providers": "bg-[#FFD12E]",
  "Data Formats": "bg-[#9AE885]",

  "HTTP Methods": "bg-[#FE90E9]",
  "Network Topologies": "bg-[#C1F8FF]",
  "SDLC Methods": "bg-[#FF6B35] text-white",
  "Software Testing Tools": "bg-[#9AE885]",
};

const fallbackRibbonColors = [
  "bg-[#FFD12E]",
  "bg-[#9AE885]",
  "bg-[#FE90E9]",
  "bg-[#C1F8FF]",
];

export default function PlayerGame({ player, team, onGameEnd }) {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [completedCategories, setCompletedCategories] = useState([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [shakeHeart, setShakeHeart] = useState(false);
  const [teamScores, setTeamScores] = useState({ p1: 0, p2: 0, total: 0 });
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const getAttemptKey = (sessionId) => {
    const sId = sessionId || currentSession?.id;
    if (!sId) return null;
    const playerKey = `p${player?.participantNumber || 1}_${player?.name || ""}`;
    return `codections_attempt_${sId}_${playerKey}`;
  };

  const saveAttemptState = (partial) => {
    const key = getAttemptKey();
    if (!key || typeof window === "undefined") return;
    try {
      const existing = JSON.parse(sessionStorage.getItem(key) || "{}");
      sessionStorage.setItem(key, JSON.stringify({ ...existing, ...partial }));
    } catch (e) {}
  };

  const clearAttemptState = (sessionId) => {
    const key = getAttemptKey(sessionId);
    if (!key || typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
  };

  const handleConfirmQuit = async () => {
    setIsQuitting(true);
    clearAttemptState(currentSession?.id);
    try {
      await endGame(totalScore);
    } catch (e) {
      console.warn("Error during quit end game:", e);
    }

    try {
      sessionStorage.setItem("inWaitingRoom", "true");
    } catch (e) {}

    setShowQuitConfirm(false);
    setIsQuitting(false);

    if (onGameEnd) {
      onGameEnd();
    } else if (router) {
      router.push("/waiting");
    } else if (typeof window !== "undefined") {
      window.location.href = "/waiting";
    }
  };

  // Prevent accidental browser reload / tab close during active quiz playback
  useEffect(() => {
    if (gameStatus !== "active") return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameStatus]);

  useEffect(() => {
    checkAndStartGame();

    // Fetch initial scores from teams record
    const fetchTeamScores = async () => {
      if (IS_MOCK_MODE || !team?.id) return;
      try {
        const { data } = await supabase
          .from("teams")
          .select("participant1_score, participant2_score, codections_score, score")
          .eq("id", team.id)
          .single();
        if (data) {
          setTeamScores({
            p1: data.participant1_score || 0,
            p2: data.participant2_score || 0,
            total: data.codections_score || data.score || 0,
          });
        }
      } catch (e) {}
    };
    fetchTeamScores();

    if (!IS_MOCK_MODE) {
      const sessionSub = supabase
        .channel("quiz_sessions")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "quiz_sessions" },
          handleSessionUpdate
        )
        .subscribe();

      const teamSub = team?.id
        ? supabase
            .channel(`team_score_sync_${team.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "teams",
                filter: `id=eq.${team.id}`,
              },
              (payload) => {
                if (payload.new) {
                  setTeamScores({
                    p1: payload.new.participant1_score || 0,
                    p2: payload.new.participant2_score || 0,
                    total: payload.new.codections_score || payload.new.score || 0,
                  });
                }
              }
            )
            .subscribe()
        : null;

      return () => {
        supabase.removeChannel(sessionSub);
        if (teamSub) supabase.removeChannel(teamSub);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer;
    if (gameStatus === "active" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, timeLeft]);

  const checkAndStartGame = async () => {
    if (IS_MOCK_MODE) {
      setCurrentSession(MOCK_SESSION);
      startGame(MOCK_SESSION);
      return;
    }

    const { data: sessionData } = await whereLab(
      supabase.from("quiz_sessions").select("*").eq("status", "active"),
      team.lab
    )
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (sessionData) {
      setCurrentSession(sessionData);

      // 1. Check local session completion cache per individual contestant
      const playerKey = `completed_session_${sessionData.id}_p${player?.participantNumber || 1}_${player?.name || ""}`;
      const localStatus =
        typeof window !== "undefined"
          ? localStorage.getItem(playerKey) || sessionStorage.getItem(playerKey)
          : null;

      if (localStatus === "completed" || localStatus === "true") {
        onGameEnd();
        return;
      }

      // 2. Check if THIS contestant has already submitted for this session in database
      let currentPID = player?.id;
      if (!currentPID || (typeof currentPID === "string" && currentPID.startsWith("player-"))) {
        try {
          const { data: pRec } = await supabase
            .from("players")
            .select("id")
            .eq("team_id", team?.id)
            .ilike("name", player?.name || "")
            .limit(1)
            .maybeSingle();
          if (pRec?.id) currentPID = pRec.id;
        } catch (e) {}
      }

      let hasSubmitted = false;
      try {
        if (currentPID && !String(currentPID).startsWith("player-")) {
          const { data: playerSubs } = await supabase
            .from("submissions")
            .select("id, score")
            .eq("player_id", currentPID)
            .eq("session_id", sessionData.id)
            .limit(1);
          if (playerSubs && playerSubs.length > 0) {
            hasSubmitted = true;
          }
        }
      } catch (e) {
        console.warn("Error checking submissions in PlayerGame:", e);
      }

      if (hasSubmitted) {
        try {
          localStorage.setItem(playerKey, "completed");
          sessionStorage.setItem(playerKey, "completed");
        } catch (e) {}
        onGameEnd();
      } else {
        // Player hasn't completed this session yet, start the game!
        startGame(sessionData);
      }
    } else {
      // No active session, return to waiting room
      onGameEnd();
    }
  };

  const handleSessionUpdate = async (payload) => {
    console.log("Session update", payload);

    if (payload.new.status === "active") {
      const { data: activeSession } = await whereLab(
        supabase.from("quiz_sessions").select("*").eq("id", payload.new.id),
        team.lab
      ).single();

      if (activeSession) {
        setCurrentSession(activeSession);
        if (gameStatus === "waiting") {
          startGame(activeSession);
        }
      }
    } else if (payload.new.status === "completed") {
      const { data: currentActiveSession } = await whereLab(
        supabase.from("quiz_sessions").select("*").eq("status", "active"),
        team.lab
      )
        .order("start_time", { ascending: false })
        .limit(1)
        .single();
      if (!currentActiveSession || currentActiveSession.id === payload.new.id) {
        endGame();
      }
    }
  };

  const startGame = async (sessionData) => {
    const key = getAttemptKey(sessionData?.id);
    let savedAttempt = null;
    if (key && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) savedAttempt = JSON.parse(raw);
      } catch (e) {}
    }

    if (savedAttempt && savedAttempt.startTime) {
      const elapsed = Math.floor((Date.now() - savedAttempt.startTime) / 1000);
      const remaining = Math.max(0, QUESTION_DURATION - elapsed);
      if (remaining <= 0) {
        clearAttemptState(sessionData?.id);
        setGameStatus("completed");
        endGame(savedAttempt.score || 0);
        return;
      }
      if (savedAttempt.grid && savedAttempt.grid.length > 0) {
        setGrid(savedAttempt.grid);
      } else {
        await fetchNewGrid(sessionData);
      }
      setGameStatus("active");
      setTimeLeft(remaining);
      setQuestionStartTime(savedAttempt.startTime);
      setCompletedCategories(savedAttempt.completedCategories || []);
      setTotalScore(savedAttempt.score || 0);
      setLives(savedAttempt.lives !== undefined ? savedAttempt.lives : MAX_LIVES);
      return;
    }

    const newStartTime = Date.now();
    await fetchNewGrid(sessionData);
    setGameStatus("active");
    setTimeLeft(QUESTION_DURATION);
    setQuestionStartTime(newStartTime);
    setCompletedCategories([]);
    setTotalScore(0);
    setLives(MAX_LIVES);

    if (key && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            startTime: newStartTime,
            score: 0,
            lives: MAX_LIVES,
            completedCategories: [],
          })
        );
      } catch (e) {}
    }
  };

  const calculateScore = (responseTime) => {
    const timeFraction = responseTime / QUESTION_DURATION;
    const scoreMultiplier = 1 - timeFraction / 2;
    const calculatedScore = Math.round(POINTS_POSSIBLE * scoreMultiplier);
    return Math.max(0, calculatedScore);
  };

  const fetchNewGrid = async (sessionData) => {
    const categories = [
      sessionData?.category1 || "Frontend Frameworks",
      sessionData?.category2 || "Databases",
      sessionData?.category3 || "CSS Units",
      sessionData?.category4 || "Programming Languages",
    ].filter(Boolean);

    if (IS_MOCK_MODE) {
      const newGrid = categories.flatMap((category) => {
        const categoryWords =
          MOCK_CATEGORIES_DATA[category] || [
            "Item 1",
            "Item 2",
            "Item 3",
            "Item 4",
          ];
        return categoryWords.map((word, index) => ({
          id: `${category}-${index}`,
          text: word,
          category: category,
        }));
      });

      setGrid(newGrid.sort(() => Math.random() - 0.5));
      return;
    }

    const { data: words, error } = await supabase
      .from("words")
      .select("word, category")
      .in("category", categories);

    if (error) {
      console.error("Error fetching words:", error);
      return;
    }

    const newGrid = categories.flatMap((category) => {
      const categoryWords = words.filter((word) => word.category === category);
      return categoryWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
        .map((word, index) => ({
          id: `${category}-${index}`,
          text: word.word,
          category: word.category,
        }));
    });

    setGrid(newGrid.sort(() => Math.random() - 0.5));
  };

  const handleItemClick = (item) => {
    if (gameStatus !== "active" || completedCategories.includes(item.category))
      return;

    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else if (selectedItems.length < 4) {
      setSelectedItems([...selectedItems, item]);
    }

    if (selectedItems.length === 3 && !selectedItems.includes(item)) {
      checkCategory([...selectedItems, item]);
    }
  };

  const checkCategory = async (items) => {
    const category = items[0].category;
    const isCorrect = items.every((item) => item.category === category);

    if (isCorrect && !completedCategories.includes(category)) {
      const responseTime = (Date.now() - questionStartTime) / 1000;
      const categoryScore = calculateScore(responseTime);

      const newTotalScore = totalScore + categoryScore;
      setTotalScore(newTotalScore);

      const newCompletedCategories = [...completedCategories, category];
      setCompletedCategories(newCompletedCategories);

      console.log("New Score: " + categoryScore);
      await updateTeamScore(categoryScore);

      const newGrid = [
        ...grid.filter((item) => item.category === category),
        ...grid.filter((item) => item.category !== category),
      ];

      setGrid(newGrid);
      setSelectedItems([]);

      saveAttemptState({
        score: newTotalScore,
        completedCategories: newCompletedCategories,
        grid: newGrid,
      });

      if (newCompletedCategories.length === TOTAL_CATEGORIES) {
        endGame(newTotalScore);
      }
    } else {
      const newLives = lives - 1;
      setShakeHeart(true);
      setTimeout(() => {
        setShakeHeart(false);
      }, 500);
      setLives(newLives);
      saveAttemptState({ lives: newLives });

      if (newLives === 0) {
        endGame(totalScore);
      }
      setSelectedItems([]);
    }
  };

  const updateTeamScore = async (scoreIncrement) => {
    if (IS_MOCK_MODE) {
      console.log("[MOCK] Team score updated by +", scoreIncrement);
      return;
    }

    if (!team) {
      console.error("Missing team data");
      return;
    }

    const participantNum = player?.participantNumber || 1;

    const { data: currentTeamData, error: fetchError } = await supabase
      .from("teams")
      .select("score, bidding_score, participant1_score, participant2_score, codections_score, r1_web_total, r2_total_score")
      .eq("id", team.id)
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching team score:", fetchError);
      return;
    }

    let p1 = currentTeamData?.participant1_score || 0;
    let p2 = currentTeamData?.participant2_score || 0;

    if (participantNum === 2) {
      p2 += scoreIncrement;
    } else {
      p1 += scoreIncrement;
    }

    const newCodections = p1 + p2;
    const biddingScore = currentTeamData?.bidding_score || 0;
    const r1WebTotal = currentTeamData?.r1_web_total || 0;
    const r1TotalScore = r1WebTotal + newCodections + biddingScore;
    const r2Total = currentTeamData?.r2_total_score || 0;
    const grandTotalScore = r1TotalScore + r2Total;

    // Synchronize both codections_score, individual participant scores, and total_score
    const { error } = await supabase
      .from("teams")
      .update({
        score: newCodections,
        codections_score: newCodections,
        participant1_score: p1,
        participant2_score: p2,
        r1_total_score: r1TotalScore,
        grand_total_score: grandTotalScore,
        total_score: r1TotalScore,
      })
      .eq("id", team.id);

    if (error) {
      // Fallback in case migration columns are not yet applied in Supabase
      console.warn("Fallback to legacy score column:", error.message);
      await supabase
        .from("teams")
        .update({ score: newCodections })
        .eq("id", team.id);
    } else {
      console.log(
        `Team score updated: P${participantNum} +${scoreIncrement}, total Codections = ${newCodections}`
      );
    }
  };

  const endGame = async (finalScore) => {
    setGameStatus("completed");
    await submitResult(finalScore !== undefined ? finalScore : totalScore);
  };

  const submitResult = async (finalScore) => {
    // Guard against duplicate execution (e.g. timeout + lives 0 at the same moment)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. Store session completion per contestant so returning to lobby won't redirect back
    const isFullCompletion = completedCategories.length === TOTAL_CATEGORIES;
    const completionVal = isFullCompletion ? "completed" : "incomplete";

    if (currentSession?.id) {
      clearAttemptState(currentSession.id);
      try {
        const playerKey = `completed_session_${currentSession.id}_p${player?.participantNumber || 1}_${player?.name || ""}`;
        localStorage.setItem(playerKey, completionVal);
        sessionStorage.setItem(playerKey, completionVal);
        localStorage.setItem(`${playerKey}_score`, String(finalScore));
        localStorage.setItem(`${playerKey}_is_correct`, String(isFullCompletion));
      } catch (e) {}
    }

    if (IS_MOCK_MODE) {
      console.log("[MOCK] Game session completed. Score:", finalScore);
      return;
    }

    if (!team || !currentSession) {
      console.error("Missing team or session data");
      return;
    }

    let validPlayerId = player?.id;
    if (!validPlayerId || (typeof validPlayerId === "string" && validPlayerId.startsWith("player-"))) {
      try {
        const { data: pData } = await supabase
          .from("players")
          .select("id")
          .eq("team_id", team.id)
          .ilike("name", player?.name || "")
          .limit(1)
          .maybeSingle();
        if (pData?.id) validPlayerId = pData.id;
        else validPlayerId = null;
      } catch (e) {
        validPlayerId = null;
      }
    }

    try {
      const submissionPayload = {
        team_id: team.id,
        session_id: currentSession.id,
        is_correct: completedCategories.length === TOTAL_CATEGORIES,
        submitted_at: new Date().toISOString(),
        score: finalScore,
      };
      if (validPlayerId) {
        submissionPayload.player_id = validPlayerId;
      }

      const { error } = await supabase.from("submissions").insert(submissionPayload);

      if (error) {
        console.error("Error submitting result to database:", error);
      }

      // Mark session completion in local storage per player
      try {
        const playerKey = `completed_session_${currentSession.id}_p${player?.participantNumber || 1}_${player?.name || ""}`;
        localStorage.setItem(playerKey, completionVal);
        sessionStorage.setItem(playerKey, completionVal);
        localStorage.setItem(`${playerKey}_score`, String(finalScore));
        localStorage.setItem(`${playerKey}_is_correct`, String(isFullCompletion));
      } catch (e) {}

      // Automatically store and persist final Codections score directly to the team record in Supabase
      try {
        const participantNum = player?.participantNumber || 1;
        const { data: teamRecord } = await supabase
          .from("teams")
          .select("participant1_score, participant2_score, codections_score, r1_web_total, bidding_score, r2_total_score")
          .eq("id", team.id)
          .single();

        if (teamRecord) {
          let p1 = teamRecord.participant1_score || 0;
          let p2 = teamRecord.participant2_score || 0;
          if (participantNum === 2) {
            p2 = Math.max(p2, finalScore);
          } else {
            p1 = Math.max(p1, finalScore);
          }
          const totalCod = p1 + p2;
          const r1Web = teamRecord.r1_web_total || 0;
          const bidding = teamRecord.bidding_score || 0;
          const r1Total = r1Web + totalCod + bidding;
          const r2Total = teamRecord.r2_total_score || 0;
          const grandTotal = r1Total + r2Total;

          setTeamScores({ p1, p2, total: totalCod });

          await supabase
            .from("teams")
            .update({
              participant1_score: p1,
              participant2_score: p2,
              codections_score: totalCod,
              score: totalCod,
              r1_total_score: r1Total,
              grand_total_score: grandTotal,
              total_score: r1Total,
            })
            .eq("id", team.id);
        }
      } catch (errSync) {
        console.warn("Could not final sync team score:", errSync);
      }
    } catch (err) {
      console.error("Exception submitting result:", err);
    }
  };

  const shuffleGrid = () => {
    if (gameStatus !== "active") return;

    const completedItems = grid.filter((item) =>
      completedCategories.includes(item.category)
    );
    const remainingItems = grid.filter(
      (item) => !completedCategories.includes(item.category)
    );

    const shuffledRemainingItems = [...remainingItems].sort(
      () => Math.random() - 0.5
    );

    setGrid([...completedItems, ...shuffledRemainingItems]);
    setSelectedItems([]);
  };

  const deselectAll = () => {
    if (gameStatus !== "active") return;
    setSelectedItems([]);
  };

  const renderCompletedCategories = () => {
    return completedCategories.map((category, idx) => {
      const categoryItems = grid.filter((item) => item.category === category);
      const ribbonColor =
        categoryColorMap[category] ||
        fallbackRibbonColors[idx % fallbackRibbonColors.length];

      return (
        <div
          key={category}
          className={cn(
            "w-full mb-3 p-4 border-2 border-black shadow-brutal flex flex-col items-center justify-center text-center transition-all animate-in fade-in zoom-in-95",
            ribbonColor
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-black" />
            <p className="text-base sm:text-lg font-black font-syne uppercase tracking-wider text-black">
              {category}
            </p>
          </div>
          <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wide text-black/80">
            {categoryItems.map((item) => item.text).join(" • ")}
          </p>
        </div>
      );
    });
  };

  const renderLives = () => {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {[...Array(MAX_LIVES)].map((_, index) => {
          const isAlive = index < lives;
          const isLosing = index === lives && shakeHeart;

          return (
            <div
              key={index}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 border-2 border-black flex items-center justify-center transition-all",
                isAlive
                  ? "bg-[#FF6B35] text-white shadow-[2px_2px_0px_#101010]"
                  : "bg-gray-200 text-gray-400 opacity-40 border-dashed",
                isLosing && "animate-shake bg-red-600 text-white"
              )}
              title={isAlive ? "Active Life" : "Life Lost"}
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  isAlive ? "fill-white text-white" : "text-gray-400"
                )}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderRemainingGrid = () => {
    const remainingItems = grid.filter(
      (item) => !completedCategories.includes(item.category)
    );
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {remainingItems.map((item) => {
          const isSelected = selectedItems.includes(item);
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={gameStatus !== "active"}
              className={cn(
                "min-h-[72px] sm:min-h-[86px] p-3 text-xs sm:text-sm font-black font-mono uppercase tracking-tight rounded-none border-2 border-black transition-all duration-150 flex items-center justify-center text-center select-none",
                isSelected
                  ? "bg-[#FFD12E] text-black translate-x-1 translate-y-1 shadow-[1px_1px_0px_#101010] ring-2 ring-black"
                  : "bg-white text-[#101010] shadow-brutal hover:bg-[#FFF9A6] hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#101010]",
                gameStatus !== "active" && "opacity-50 cursor-not-allowed"
              )}
            >
              {item.text}
            </button>
          );
        })}
      </div>
    );
  };

  if (gameStatus === "waiting") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="card-brutal p-8 bg-white border-3 border-black shadow-brutal-lg max-w-md w-full flex flex-col items-center gap-4 text-center relative z-10">
          <Disc3 className="w-12 h-12 animate-spin text-[#FF6B35]" />
          <h3 className="font-syne font-black text-2xl uppercase tracking-tight text-black">
            CALIBRATING CASSETTE
          </h3>
          <p className="font-mono text-sm text-gray-600">
            Mounting magnetic tape sectors & synchronizing with game master...
          </p>
          <div className="w-full bg-[#101010] h-2 border border-black overflow-hidden mt-2">
            <div className="bg-[#FFD12E] h-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-transparent text-[#101010] py-6 sm:py-8 px-3 sm:px-6 font-mono overflow-x-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Top Header / Arena Info Bar */}
        <div className="card-brutal bg-white border-2 border-black shadow-brutal p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Contestant Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD12E] border-2 border-black flex items-center justify-center font-syne font-black text-xl shadow-[2px_2px_0px_#101010]">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#101010] text-[#FFF9F3] text-[10px] font-mono font-bold px-1.5 py-0.5 border border-black uppercase">
                  CONTESTANT {player?.participantNumber || 1}
                </span>
                <span className="bg-[#C1F8FF] text-black text-[10px] font-mono font-bold px-1.5 py-0.5 border border-black uppercase">
                  {team?.lab
                    ? String(team.lab).toLowerCase().startsWith("lab")
                      ? String(team.lab).toUpperCase()
                      : `LAB ${team.lab}`
                    : "LAB 1"}
                </span>
              </div>
              <h2 className="font-syne font-black text-lg sm:text-xl uppercase tracking-tight text-[#101010] leading-tight mt-0.5">
                {player?.name || "PLAYER 1"}
                <span className="text-xs font-mono font-normal text-gray-500 ml-2">
                  [{team?.name || "ALPHA"}]
                </span>
              </h2>
              {/* Teammate & Combined Scores Pill */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap font-mono text-[10px]">
                <span className="bg-[#9AE885] border border-black px-1.5 py-0.2 font-bold">
                  YOUR PTS: {player?.participantNumber === 2 ? teamScores.p2 : teamScores.p1}
                </span>
                <span className="bg-[#FE90E9] border border-black px-1.5 py-0.2 font-bold">
                  TEAMMATE: {player?.participantNumber === 2 ? teamScores.p1 : teamScores.p2}
                </span>
                <span className="bg-[#FFD12E] border border-black px-1.5 py-0.2 font-black">
                  SQUAD TOTAL: {teamScores.total}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Lives */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="text-[10px] font-mono font-bold uppercase text-gray-500 tracking-wider">
              LIVES REMAINING ({lives}/{MAX_LIVES})
            </span>
            {renderLives()}
          </div>

          {/* Right: Digital Timer & Quit Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#101010] text-[#FFD12E] border-2 border-black px-4 py-2 shadow-[2px_2px_0px_#FF6B35]">
              <Timer className="w-5 h-5 text-[#FF6B35] animate-pulse" />
              <span className="font-mono font-black text-2xl tracking-widest">
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowQuitConfirm(true)}
              disabled={gameStatus === "completed" || isQuitting}
              className="btn-brutal bg-white hover:bg-red-50 text-red-600 border-2 border-black px-3.5 py-2.5 font-mono font-black text-xs uppercase shadow-brutal flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              title="Quit quiz and return to waiting room"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="hidden sm:inline">QUIT QUIZ</span>
            </button>
          </div>
        </div>

        {/* Main Game Stage Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Mission Control & Actions */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Mission Card */}
            <div className="card-brutal bg-white border-2 border-black shadow-brutal p-5">
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                <span className="font-syne font-black text-base uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF6B35]" /> CODECTIONS
                </span>
                <span className="bg-[#FE90E9] text-black text-[10px] font-bold px-2 py-0.5 border border-black">
                  ROUND 1
                </span>
              </div>
              <p className="font-mono text-xs text-gray-700 leading-relaxed">
                Find groups of <strong>4 words</strong> that share a common
                computer science or technical thread. Tap 4 tiles to verify.
              </p>

              {/* Progress Counters */}
              <div className="mt-4 pt-3 border-t border-dashed border-gray-300 grid grid-cols-2 gap-2">
                <div className="bg-[#FFF9F3] border border-black p-2 text-center">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">
                    SOLVED
                  </div>
                  <div className="text-xl font-syne font-black text-black">
                    {completedCategories.length} / {TOTAL_CATEGORIES}
                  </div>
                </div>
                <div className="bg-[#C1F8FF] border border-black p-2 text-center">
                  <div className="text-[10px] font-bold text-gray-700 uppercase">
                    SCORE
                  </div>
                  <div className="text-xl font-syne font-black text-black">
                    {totalScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Grid Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={gameStatus === "completed"}
                onClick={deselectAll}
                className="btn-brutal bg-white hover:bg-gray-100 text-black border-2 border-black font-mono font-black text-xs uppercase py-3 px-2 shadow-brutal flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <X className="w-4 h-4 text-red-500" /> CLEAR ALL
              </button>
              <button
                disabled={gameStatus === "completed"}
                onClick={shuffleGrid}
                className="btn-brutal bg-[#FFD12E] hover:bg-[#FFE57F] text-black border-2 border-black font-mono font-black text-xs uppercase py-3 px-2 shadow-brutal flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4 text-black" /> SHUFFLE 🔀
              </button>
            </div>

            {/* Quit Round Action */}
            <button
              type="button"
              onClick={() => setShowQuitConfirm(true)}
              disabled={gameStatus === "completed" || isQuitting}
              className="btn-brutal w-full bg-white hover:bg-red-50 text-red-600 border-2 border-black font-syne font-black text-xs uppercase py-3 px-3 shadow-brutal flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 text-red-600" /> QUIT QUIZ &amp; RETURN TO WAITING ROOM
            </button>

            {/* Invente Logo Watermark Pill */}
            <div className="bg-[#FF6B35] text-white border-2 border-black p-3 shadow-brutal flex items-center justify-between text-xs font-mono font-bold">
              <span>INVENTE &apos;26 ARENA</span>
              <span className="bg-black text-[#FFD12E] px-1.5 py-0.5 text-[10px]">
                LIVE TAPE
              </span>
            </div>
          </div>

          {/* Right Column: Active Puzzle Grid */}
          <div className="lg:col-span-8">
            <div
              className={cn(
                "transition-all duration-200",
                gameStatus === "completed" && "opacity-60 pointer-events-none"
              )}
            >
              {/* Solved Ribbons (Stack on top) */}
              {renderCompletedCategories()}

              {/* 4x4 Grid of Tiles */}
              {renderRemainingGrid()}
            </div>

            {/* Game Complete Modal / Card */}
            {gameStatus === "completed" && (
              <div className="mt-6 card-brutal bg-white border-3 border-black shadow-brutal-lg p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 mx-auto bg-[#FFD12E] border-2 border-black shadow-brutal flex items-center justify-center mb-4">
                  {completedCategories.length === TOTAL_CATEGORIES ? (
                    <Trophy className="w-8 h-8 text-black" />
                  ) : (
                    <Award className="w-8 h-8 text-black" />
                  )}
                </div>

                <h3 className="font-syne font-black text-3xl sm:text-4xl uppercase tracking-tight text-black">
                  {completedCategories.length === TOTAL_CATEGORIES
                    ? "CASSETTE ARCHIVED!"
                    : "PLAYBACK HALTED"}
                </h3>

                <p className="font-mono text-sm text-gray-700 mt-2 max-w-md mx-auto">
                  {completedCategories.length === TOTAL_CATEGORIES
                    ? "Flawless playback! All 4 magnetic tape sectors were successfully decrypted and saved to the SSN-SNUC database."
                    : "Playback stopped before all sectors could be connected. Your progress has been securely registered."}
                </p>

                <div className="flex items-center justify-center gap-4 my-6">
                  <div className="bg-[#FFF9F3] border-2 border-black px-4 py-2 shadow-brutal">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">
                      SECTORS SOLVED
                    </span>
                    <span className="font-syne font-black text-2xl text-black">
                      {completedCategories.length} / {TOTAL_CATEGORIES}
                    </span>
                  </div>
                  <div className="bg-[#9AE885] border-2 border-black px-4 py-2 shadow-brutal">
                    <span className="text-[10px] font-bold uppercase text-black/70 block">
                      FINAL SCORE
                    </span>
                    <span className="font-syne font-black text-2xl text-black">
                      {totalScore} PTS
                    </span>
                  </div>
                </div>

                <button
                  onClick={onGameEnd}
                  className="btn-brutal bg-[#FF6B35] hover:bg-[#ff8050] text-white border-2 border-black font-syne font-black text-base uppercase py-3 px-8 shadow-brutal active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  RETURN TO LOBBY ▶
                </button>
              </div>
            )}

            {/* Quit Confirmation Modal */}
            {showQuitConfirm && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="card-brutal bg-white border-3 border-black shadow-brutal-lg max-w-md w-full p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5 text-red-600 border-b-2 border-black pb-3 mb-4">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                    <h3 className="font-syne font-black text-xl uppercase tracking-tight text-black">
                      QUIT QUIZ SESSION?
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-gray-700 leading-relaxed mb-4">
                    Are you sure you want to stop this Codections round?
                    <br /><br />
                    Your current score of{" "}
                    <strong className="text-black bg-[#9AE885] px-1.5 py-0.5 border border-black font-black">
                      {totalScore} PTS
                    </strong>{" "}
                    will be saved to your squad record, and you will return to the waiting lounge.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-dashed border-gray-300">
                    <button
                      type="button"
                      onClick={() => setShowQuitConfirm(false)}
                      className="btn-brutal w-full sm:w-1/2 bg-white hover:bg-gray-100 text-black border-2 border-black font-syne font-black text-xs uppercase py-3 shadow-brutal cursor-pointer text-center"
                    >
                      KEEP PLAYING
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmQuit}
                      disabled={isQuitting}
                      className="btn-brutal w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white border-2 border-black font-syne font-black text-xs uppercase py-3 shadow-brutal flex items-center justify-center gap-1.5 cursor-pointer text-center disabled:opacity-50"
                    >
                      {isQuitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> EXITING...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" /> YES, QUIT &amp; EXIT ▶
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

