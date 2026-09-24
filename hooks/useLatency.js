import { useState, useEffect } from 'react';
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { supabase } from "@/lib/client";
import { nanoid } from "nanoid";
import { IS_MOCK_MODE } from "@/lib/mockData";

const LATENCY_THRESHOLD = 400;

export function useLatency() {
  const [latency, setLatency] = useState(IS_MOCK_MODE ? 15 : 0);
  const [isStable, setIsStable] = useState(IS_MOCK_MODE ? true : false);
  const [status, setStatus] = useState(IS_MOCK_MODE ? 'Network Stable 👍' : 'Connecting...');

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setLatency(15);
      setIsStable(true);
      setStatus('Network Stable 👍');
      return;
    }

    const userId = nanoid();
    let pingIntervalId;
    let pingChannel;

    try {
      pingChannel = supabase.channel(`ping:${userId}`, {
        config: { broadcast: { ack: true } },
      });

      pingChannel.subscribe((subStatus) => {
        if (subStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          setStatus('Analyzing Network ...');
          pingIntervalId = setInterval(async () => {
            const start = performance.now();
            try {
              const resp = await pingChannel.send({
                type: "broadcast",
                event: "PING",
                payload: {},
              });

              if (resp !== "ok") {
                setLatency(-1);
                setStatus('Connection Error');
              } else {
                const end = performance.now();
                const newLatency = end - start;
                setLatency(newLatency);

                if (newLatency < LATENCY_THRESHOLD) {
                  setIsStable(true);
                  setStatus('Network Stable 👍');
                } else {
                  setIsStable(false);
                  setStatus('Network Unstable 👎');
                }
              }
            } catch (e) {
              setLatency(-1);
              setStatus('Connection Error');
            }
          }, 1000);
        }
      });
    } catch (err) {
      console.error("useLatency error:", err);
      setIsStable(true);
      setStatus('Offline / Mock');
    }

    return () => {
      pingIntervalId && clearInterval(pingIntervalId);
      if (pingChannel) {
        try {
          supabase.removeChannel(pingChannel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return { latency, isStable, status };
}