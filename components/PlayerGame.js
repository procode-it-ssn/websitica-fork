import { useState, useEffect } from "react";
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

  useEffect(() => {
    checkAndStartGame();
    if (!IS_MOCK_MODE) {
      const subscription = supabase
        .channel("quiz_sessions")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "quiz_sessions" },
          handleSessionUpdate
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
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

      // Check if player has already submitted for this session
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("*")
        .eq("player_id", player.id)
        .eq("session_id", sessionData.id)
        .limit(1)
        .single();

      if (submissionData) {
        // Player has already completed this session, return to waiting room
        onGameEnd();
      } else {
        // Player hasn't completed this session, start the game
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
    await fetchNewGrid(sessionData);
    setGameStatus("active");
    setTimeLeft(QUESTION_DURATION);
    setQuestionStartTime(Date.now());
    setCompletedCategories([]);
    setTotalScore(0);
    setLives(MAX_LIVES);
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

    const { data: currentTeamData, error: fetchError } = await supabase
      .from("teams")
      .select("score")
      .eq("id", team.id)
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching team score:", fetchError);
      return;
    }

    const newScore = (currentTeamData.score || 0) + scoreIncrement;

    const { error } = await supabase
      .from("teams")
      .update({ score: newScore })
      .eq("id", team.id);

    if (error) {
      console.error("Error updating team score:", error);
    } else {
      console.log("Team score updated successfully");
    }
  };

  const endGame = async (finalScore) => {
    setGameStatus("completed");
    await submitResult(finalScore !== undefined ? finalScore : totalScore);
  };

  const submitResult = async (finalScore) => {
    if (IS_MOCK_MODE) {
      console.log("[MOCK] Game session completed. Score:", finalScore);
      return;
    }

    if (!player || !team || !currentSession) {
      console.error("Missing player, team, or session data");
      return;
    }

    const { error } = await supabase.from("submissions").insert({
      player_id: player.id,
      team_id: team.id,
      session_id: currentSession.id,
      is_correct: completedCategories.length === TOTAL_CATEGORIES,
      submitted_at: new Date().toISOString(),
      score: finalScore,
    });

    if (error) {
      console.error("Error submitting result:", error);
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
                  CONTESTANT
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
            </div>
          </div>

          {/* Center: Lives */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="text-[10px] font-mono font-bold uppercase text-gray-500 tracking-wider">
              LIVES REMAINING ({lives}/{MAX_LIVES})
            </span>
            {renderLives()}
          </div>

          {/* Right: Digital Timer */}
          <div className="flex items-center gap-2 bg-[#101010] text-[#FFD12E] border-2 border-black px-4 py-2 shadow-[2px_2px_0px_#FF6B35]">
            <Timer className="w-5 h-5 text-[#FF6B35] animate-pulse" />
            <span className="font-mono font-black text-2xl tracking-widest">
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}

