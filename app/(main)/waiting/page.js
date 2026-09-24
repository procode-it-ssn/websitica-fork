"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PlayerWaiting from "@/components/PlayerWaiting";
import { supabase } from "@/lib/client";
import { whereLab } from "@/lib/utils";
import {
  IS_MOCK_MODE,
  DEFAULT_MOCK_PLAYER,
  DEFAULT_MOCK_TEAM,
  MOCK_UPCOMING_SESSION,
} from "@/lib/mockData";

export default function PlayerWaitingPage() {
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const checkSessionStatus = useCallback(async (playerId, teamData) => {
    if (IS_MOCK_MODE) {
      return;
    }

    const { data: sessionData, error } = await whereLab(
      supabase.from("quiz_sessions").select("*").eq("status", "active"),
      teamData.lab,
    )
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active session, check for upcoming
        await checkForUpcomingSession(teamData);
      } else {
        console.error("Error checking session status:", error);
      }
    } else if (sessionData) {
      // There's an active session, check if player has already submitted
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("*")
        .eq("player_id", playerId)
        .eq("session_id", sessionData.id)
        .limit(1)
        .single();

      if (submissionData) {
        // Player has already completed this session
        setMessage("You've completed the current session. Please wait for the next one.");
      } else {
        // Player hasn't submitted for this session, redirect to game
        router.push('/game');
      }
    }
  }, [router]);

  const checkForUpcomingSession = async (teamData) => {
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
  };

  const verifyPlayerData = useCallback(async (playerData, teamData) => {
    if (!playerData || !teamData) return false;

    if (IS_MOCK_MODE) {
      setPlayer(playerData);
      setTeam(teamData);
      return true;
    }

    // Check if player exists in the database
    const { data: playerDbData, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerData.id)
      .single();

    if (playerError || !playerDbData) {
      console.error("Player not found in database:", playerError);
      return false;
    }

    // Check if team exists in the database
    const { data: teamDbData, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamData.id)
      .single();

    if (teamError || !teamDbData) {
      console.error("Team not found in database:", teamError);
      return false;
    }

    // Check if player is associated with the correct team
    if (playerDbData.team_id !== teamDbData.id) {
      console.error("Player-team association mismatch");
      return false;
    }

    // Update local storage with fresh data from the database
    localStorage.setItem('playerData', JSON.stringify(playerDbData));
    localStorage.setItem('teamData', JSON.stringify(teamDbData));

    setPlayer(playerDbData);
    setTeam(teamDbData);

    return true;
  }, []);

  useEffect(() => {
    const initializePlayer = async () => {
      let playerData = JSON.parse(localStorage.getItem('playerData'));
      let teamData = JSON.parse(localStorage.getItem('teamData'));

      if ((!playerData || !teamData) && IS_MOCK_MODE) {
        playerData = DEFAULT_MOCK_PLAYER;
        teamData = DEFAULT_MOCK_TEAM;
        localStorage.setItem('playerData', JSON.stringify(playerData));
        localStorage.setItem('teamData', JSON.stringify(teamData));
      }
      
      const isValid = await verifyPlayerData(playerData, teamData);
      
      if (isValid) {
        if (IS_MOCK_MODE) {
          setUpcomingSession(MOCK_UPCOMING_SESSION);
        } else {
          checkSessionStatus(playerData.id, teamData);
        }
      } else {
        handleLogout();
      }
    };

    initializePlayer();
  }, [checkSessionStatus, verifyPlayerData]);

  useEffect(() => {
    if (IS_MOCK_MODE) return;

    const subscription = supabase
      .channel("quiz_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_sessions" },
        (payload) => {
          if (payload.new.status === "active" && player && team && payload.new.lab === team.lab) {
            checkSessionStatus(player.id, team);
          }
          if (payload.new.status === "scheduled" && team && payload.new.lab === team.lab) {
            setUpcomingSession(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [player, team, checkSessionStatus]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('playerData');
    localStorage.removeItem('teamData');
    router.push('/');
  }, [router]);

  const handleStartGame = () => {
    router.push('/game');
  };

  if (!player || !team) {
    return (
      <div key="loading" className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center relative bg-transparent overflow-hidden">
        <div className="font-mono text-sm font-bold text-black/60 bg-white border-2 border-black px-4 py-2 shadow-[3px_3px_0px_#101010] relative z-10">
          Loading session standby...
        </div>
      </div>
    );
  }

  return (
    <PlayerWaiting
      player={player}
      team={team}
      upcomingSession={upcomingSession}
      message={message}
      onLogout={handleLogout}
      onStartGame={handleStartGame}
    />
  );
}