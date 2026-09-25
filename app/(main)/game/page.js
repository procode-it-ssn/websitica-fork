"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayerGame from "@/components/PlayerGame";
import { Loader2, MonitorX } from "lucide-react";
import { IS_MOCK_MODE, DEFAULT_MOCK_PLAYER, DEFAULT_MOCK_TEAM } from "@/lib/mockData";
import { useTeamLock } from "@/hooks/useTeamLock";

export default function PlayerGamePage() {
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const router = useRouter();

  // One screen per team. Enforced here too, so opening /game directly by URL
  // cannot bypass the lobby's check.
  const lockState = useTeamLock(team?.id);

  useEffect(() => {
    let playerData = JSON.parse(localStorage.getItem("playerData"));
    let teamData = JSON.parse(localStorage.getItem("teamData"));

    if ((!playerData || !teamData) && IS_MOCK_MODE) {
      playerData = DEFAULT_MOCK_PLAYER;
      teamData = DEFAULT_MOCK_TEAM;
      localStorage.setItem("playerData", JSON.stringify(playerData));
      localStorage.setItem("teamData", JSON.stringify(teamData));
    }

    if (playerData && teamData) {
      setPlayer(playerData);
      setTeam(teamData);
    } else {
      router.push("/");
    }
  }, [router]);

  const handleGameEnd = () => {
    try {
      sessionStorage.setItem("inWaitingRoom", "true");
    } catch (e) {}
    router.push("/waiting");
  };

  if (!player || !team) {
    return (
      <div
        key="loading-player-data"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="max-w-md flex flex-1 items-center justify-center bg-white/80 backdrop-blur-sm relative z-10 space-x-8 rounded p-4">
          <span className="text-blue-500 text-xl">
            Waiting for player data...
          </span>
          <Loader2 className="text-center w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (lockState === "blocked") {
    return (
      <div
        key="team-already-playing"
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="card-brutal p-8 bg-white border-2 border-black shadow-[6px_6px_0px_#101010] max-w-md w-full flex flex-col items-center gap-4 text-center relative z-10">
          <MonitorX className="w-12 h-12 text-[#FF6B35]" />
          <h3 className="font-syne font-black text-2xl uppercase tracking-tight text-black">
            ALREADY IN PLAY
          </h3>
          <p className="font-mono text-sm text-gray-700">
            Team <span className="font-bold">{team.name}</span> is already
            playing on another screen. This round is played together on one
            device.
          </p>
          <p className="font-mono text-xs text-gray-500">
            Close this window and return to your team&apos;s screen.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-white hover:bg-gray-50 text-black font-mono text-xs font-bold py-2.5 px-4 border-2 border-black shadow-[3px_3px_0px_#101010] active:translate-x-0.5 active:translate-y-0.5 transition-all uppercase cursor-pointer"
          >
            Back to entry
          </button>
        </div>
      </div>
    );
  }

  return <PlayerGame player={player} team={team} onGameEnd={handleGameEnd} />;
}
