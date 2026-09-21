"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLatency } from "@/hooks/useLatency";
import { cn } from "@/lib/utils";

const LOADING_DURATION = 1400;

export default function Loader({ onLoadComplete }) {
  const [isLoading, setIsLoading] = useState(true);
  const { latency, isStable, status } = useLatency();

  useEffect(() => {
    let loadingTimer;

    if (isStable) {
      loadingTimer = setTimeout(() => {
        setIsLoading(false);
        onLoadComplete();
      }, LOADING_DURATION);
    }

    return () => {
      loadingTimer && clearTimeout(loadingTimer);
    };
  }, [isStable, onLoadComplete]);

  // Safety fallback: ensure UI reveals even if WebSocket latency ping is unreachable
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      onLoadComplete();
    }, 2800);

    return () => clearTimeout(safetyTimer);
  }, [onLoadComplete]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
    exit: {
      y: "-100%",
      transition: {
        type: "spring",
        damping: 24,
        stiffness: 120,
        duration: 0.7,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 14, stiffness: 200 },
    },
  };

  const text = "WEBSITICA";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="invente-loader"
          className="flex flex-col items-center justify-center fixed inset-0 z-50 bg-[#FFF9F3] bg-grid text-[#101010] p-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Top Bar with SSN & SNUC badges */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="border-2 border-black bg-white px-3 py-1 shadow-[3px_3px_0px_#101010] flex items-center gap-2">
              <Image src="/invente/ssn.webp" alt="SSN" width={40} height={20} className="h-5 w-auto" />
              <span className="text-xs font-bold font-mono">SSN</span>
            </div>
            <div className="border-2 border-black bg-white px-3 py-1 shadow-[3px_3px_0px_#101010] flex items-center gap-2">
              <Image src="/invente/snu.webp" alt="SNU" width={40} height={20} className="h-5 w-auto" />
              <span className="text-xs font-bold font-mono">SNUC</span>
            </div>
          </div>

          {/* Top Right Tag */}
          <div className="absolute top-6 right-6 border-2 border-black bg-[#FFD12E] px-4 py-1 font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#101010]">
            INVENTE ’26 // TECH FEST
          </div>

          {/* Centerpiece: Cassette Loading Box */}
          <div className="w-full max-w-md border-3 border-black bg-white p-8 shadow-[8px_8px_0px_#101010] flex flex-col items-center text-center relative">
            {/* Top Tape Label */}
            <div className="w-full border-b-2 border-black pb-3 mb-6 flex justify-between items-center text-xs font-mono font-bold">
              <span className="bg-[#FF6B35] text-white px-2 py-0.5 border border-black">[REC 01]</span>
              <span>CALIBRATING CASSETTE</span>
              <span className="bg-[#9AE885] text-black px-2 py-0.5 border border-black">SP 60</span>
            </div>

            {/* Invente Logo Graphic */}
            <div className="mb-4">
              <Image
                src="/invente/invente_notag.webp"
                alt="INVENTE '26"
                width={260}
                height={55}
                className="h-12 w-auto object-contain mx-auto"
                priority
              />
            </div>

            {/* Animated Cassette Reels Graphic - Concentric SVG */}
            <div className="my-3 border-2 border-black bg-[#FBF9F4] p-2.5 w-52 rounded-none flex justify-around items-center shadow-[3px_3px_0px_#101010]">
              <svg width={36} height={36} viewBox="0 0 40 40" className="flex-shrink-0">
                <circle cx="20" cy="20" r="18.5" fill="#FFF9F3" stroke="#101010" strokeWidth="2" />
                <motion.g
                  animate={{ rotate: 360 }}
                  style={{ transformOrigin: "20px 20px" }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="20" cy="20" r="12" fill="none" stroke="#101010" strokeWidth="1.8" strokeDasharray="4 3" />
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <line key={angle} x1="20" y1="7.5" x2="20" y2="11.5" stroke="#101010" strokeWidth="2" strokeLinecap="round" transform={`rotate(${angle} 20 20)`} />
                  ))}
                </motion.g>
                <circle cx="20" cy="20" r="5" fill="#101010" />
                <circle cx="20" cy="20" r="2.5" fill="#FFF9F3" stroke="#101010" strokeWidth="0.8" />
              </svg>
              <div className="h-2 w-14 bg-black/20 border border-black/40 rounded-none" />
              <svg width={36} height={36} viewBox="0 0 40 40" className="flex-shrink-0">
                <circle cx="20" cy="20" r="18.5" fill="#FFF9F3" stroke="#101010" strokeWidth="2" />
                <motion.g
                  animate={{ rotate: 360 }}
                  style={{ transformOrigin: "20px 20px" }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="20" cy="20" r="12" fill="none" stroke="#101010" strokeWidth="1.8" strokeDasharray="4 3" />
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <line key={angle} x1="20" y1="7.5" x2="20" y2="11.5" stroke="#101010" strokeWidth="2" strokeLinecap="round" transform={`rotate(${angle} 20 20)`} />
                  ))}
                </motion.g>
                <circle cx="20" cy="20" r="5" fill="#101010" />
                <circle cx="20" cy="20" r="2.5" fill="#FFF9F3" stroke="#101010" strokeWidth="0.8" />
              </svg>
            </div>

            {/* Big Event Title */}
            <div className="flex justify-center my-3 font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-[#101010]">
              {text.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className={index % 2 === 0 ? "text-[#101010]" : "text-[#FF6B35]"}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            <p className="font-mono text-sm font-semibold tracking-wider text-black/70 mb-4">
              CODECTIONS // 16 TILES • 4 CONNECTIONS
            </p>

            {/* Retro 4-color Barrels */}
            <div className="flex gap-2 mb-2">
              {["bg-[#C1F8FF]", "bg-[#9AE885]", "bg-[#FE90E9]", "bg-[#FFD12E]"].map((color, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [-3, 0, -3] }}
                  transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                  className={cn("w-4 h-4 border-2 border-black shadow-[2px_2px_0px_#101010]", color)}
                />
              ))}
            </div>
          </div>

          {/* Bottom Diagnostics Indicator */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono font-bold text-black/80 gap-2">
            <span className="border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_#101010]">
              {status || "CONNECTING..."} {latency > 0 && `(${latency.toFixed(0)}MS)`}
            </span>
            <span className="border-2 border-black bg-[#C1F8FF] px-3 py-1 shadow-[2px_2px_0px_#101010]">
              OUT THINK • OUT BUILD • OUT SHINE
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
