"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

function CassetteReel({ size = 44, duration = 2.8, reverse = false }) {
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

      {/* Rotating Cog Spool - Centered at (20, 20) */}
      <motion.g
        animate={{ rotate: reverse ? -360 : 360 }}
        style={{ transformOrigin: "20px 20px" }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {/* Dashed gear track */}
        <circle
          cx="20"
          cy="20"
          r="12"
          fill="none"
          stroke="#101010"
          strokeWidth="1.8"
          strokeDasharray="4 3"
        />
        {/* Symmetrical Tape Drive Teeth */}
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

      {/* Spindle Hub and Axle Hole - Exact Dead Center */}
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

export default function PlayerWaiting({
  player,
  team,
  upcomingSession,
  message,
  onLogout,
  onStartGame,
}) {
  const [waitingTime, setWaitingTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime((prevTime) => prevTime + 1);
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-120px)] py-10 sm:py-16 px-4 flex flex-col items-center justify-center relative bg-transparent overflow-hidden">
      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg border-3 border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#101010] relative z-10"
      >
        {/* Top Header Tag */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6 font-mono text-xs font-bold">
          <span className="bg-[#FFD12E] border border-black px-2.5 py-0.5 shadow-[2px_2px_0px_#101010]">
            STANDBY • LAB {team.lab || 1}
          </span>
          <span className="text-black/70 uppercase">
            WEBSITICA • CODECTIONS
          </span>
          <span className="bg-[#9AE885] border border-black px-2.5 py-0.5 shadow-[2px_2px_0px_#101010]">
            INVENTE ’26
          </span>
        </div>

        {/* Player & Team Banner */}
        <div className="border-2 border-black bg-[#FBF9F4] p-4 mb-6 shadow-[3px_3px_0px_#101010] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono font-bold text-black/60 uppercase">Contestant</p>
            <p className="font-heading text-xl font-bold text-black">{player.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-mono font-bold text-black/60 uppercase">Team Squad</p>
            <p className="font-mono text-sm font-bold text-black bg-[#C1F8FF] border border-black px-2 py-0.5 shadow-[2px_2px_0px_#101010]">
              {team.name}
            </p>
          </div>
        </div>

        {/* Centerpiece: Animated Cassette Tape */}
        <div className="flex flex-col items-center justify-center my-4 py-4 border-2 border-dashed border-black/30 bg-[#FFF9F3] rounded-md">
          {/* Cassette Graphic with Mathematically Concentric Spinning Reels */}
          <div className="border-2 border-black bg-white p-3.5 w-60 rounded-none shadow-[4px_4px_0px_#101010] flex items-center justify-between mb-4 relative">
            <CassetteReel size={44} duration={2.8} />

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

            <CassetteReel size={44} duration={2.8} />
          </div>

          <h2 className="font-heading text-3xl font-extrabold text-black tracking-tight text-center">
            WARMING UP TAPE...
          </h2>
          <p className="font-mono text-xs font-semibold text-black/70 text-center mt-1 px-4">
            The puzzle arena will open automatically when the round begins.
          </p>

          {/* Time Counter Badge */}
          <div className="mt-4 border-2 border-black bg-[#FE90E9] px-4 py-1.5 font-mono text-sm font-bold shadow-[2px_2px_0px_#101010] flex items-center gap-2">
            <span>QUEUE TIMER:</span>
            <span className="font-extrabold">{Math.floor(waitingTime / 60)}:{(waitingTime % 60).toString().padStart(2, "0")}</span>
          </div>
        </div>

        {/* Message notification if any */}
        {message && (
          <div className="mb-4 p-3 border-2 border-black bg-[#C1F8FF] text-xs font-mono font-bold text-center shadow-[2px_2px_0px_#101010]">
            ℹ️ {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          {onStartGame && (
            <button
              onClick={onStartGame}
              className="w-full bg-[#FFD12E] hover:bg-[#FFDA58] text-black font-heading font-extrabold text-lg py-3 px-6 border-2 border-black shadow-[4px_4px_0px_#101010] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#101010] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#101010] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ENTER GAME ARENA ▶</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full bg-white hover:bg-gray-100 text-black font-mono text-xs font-bold py-2.5 px-4 border-2 border-black shadow-[3px_3px_0px_#101010] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#101010] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_#101010] transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EJECT CASSETTE / CHANGE DETAILS</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
