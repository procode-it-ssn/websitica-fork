"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/client";
import { IS_MOCK_MODE } from "@/lib/mockData";

// One team = one screen. Each browser joins a per-team Realtime Presence
// channel; the earliest joiner owns the arena and everyone else is blocked.
// Presence releases automatically when a tab closes or a machine dies, so a
// crashed screen never leaves the team locked out.

const CLIENT_ID_KEY = "websitica_client_id";

// Stable per-tab id: survives a refresh (sessionStorage persists across
// reloads in the same tab) so reloading reclaims the lock instead of
// locking the team out of its own round.
function getClientId() {
  try {
    let id = sessionStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = "c-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return "c-" + Date.now().toString(36);
  }
}

// Returns "checking" | "owner" | "blocked".
export function useTeamLock(teamId) {
  const [lockState, setLockState] = useState("checking");

  useEffect(() => {
    // No team yet, or mock mode (no realtime backend): never block.
    if (!teamId) return;
    if (IS_MOCK_MODE) {
      setLockState("owner");
      return;
    }

    const clientId = getClientId();
    let cancelled = false;

    const channel = supabase.channel(`team_lock:${teamId}`, {
      config: { presence: { key: clientId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        if (cancelled) return;

        const state = channel.presenceState();
        const peers = Object.entries(state).map(([key, metas]) => ({
          key,
          at: metas?.[0]?.at ?? Number.MAX_SAFE_INTEGER,
        }));

        if (peers.length === 0) return;

        // Deterministic winner: earliest tracked timestamp, id as tie-break.
        // Both sides of a simultaneous join agree, so neither deadlocks.
        peers.sort((a, b) => a.at - b.at || (a.key < b.key ? -1 : 1));
        setLockState(peers[0].key === clientId ? "owner" : "blocked");
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !cancelled) {
          await channel.track({ at: Date.now() });
        }
      });

    return () => {
      cancelled = true;
      try {
        channel.untrack();
      } catch (e) {}
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return lockState;
}
