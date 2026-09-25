"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { useLatency } from "@/hooks/useLatency";
import { cn } from "@/lib/utils";

const LOADING_DURATION = 1800;

export default function Loader({ onLoadComplete }) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { latency, isStable, status } = useLatency();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let loadingTimer;

    if (isStable) {
      loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, LOADING_DURATION);
    }

    return () => {
      if (loadingTimer) clearTimeout(loadingTimer);
    };
  }, [isStable]);

  // Safety fallback: ensure UI reveals even if WebSocket latency ping is delayed
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2600);

    return () => clearTimeout(safetyTimer);
  }, []);

  // Lock background scrolling while loader is active
  useEffect(() => {
    if (isLoading) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isLoading]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.06,
      },
    },
    exit: {
      y: "-100%",
      transition: {
        type: "spring",
        damping: 26,
        stiffness: 130,
        duration: 0.6,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 22, rotate: -4 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 220,
      },
    },
  };

  const dotsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const dotVariants = {
    hidden: { y: 0, opacity: 0 },
    visible: {
      y: [-8, 0],
      opacity: 1,
      transition: {
        y: {
          repeat: Infinity,
          repeatType: "reverse",
          duration: 0.55,
          ease: "easeInOut",
        },
        opacity: { duration: 0.2 },
      },
    },
  };

  const text = "Websitica";

  const content = (
    <AnimatePresence
      onExitComplete={() => {
        if (onLoadComplete) onLoadComplete();
      }}
    >
      {isLoading && (
        <motion.div
          key="main-theme-loader"
          className="font-mono flex flex-col items-center justify-between fixed inset-0 h-[100dvh] w-screen z-[999999] select-none bg-[#FFF9F3] bg-grid text-[#101010] p-4 sm:p-6 overflow-hidden pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Top Header Bar: Responsive flex container ensuring zero overlap across all screen widths */}
          <div className="w-full max-w-4xl z-10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-3 shrink-0">
            {/* Left: Institutional & Department Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
              <div className="border-2 border-black bg-white px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] flex items-center gap-1.5 shrink-0">
                <Image
                  src="/invente/ssn.webp"
                  alt="SSN"
                  width={38}
                  height={20}
                  className="h-4 sm:h-5 w-auto object-contain"
                  priority
                />
                <span className="text-[10px] sm:text-xs font-black tracking-wide">SSN</span>
              </div>
              <div className="border-2 border-black bg-white px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] flex items-center gap-1.5 shrink-0">
                <Image
                  src="/invente/snu.webp"
                  alt="SNUC"
                  width={38}
                  height={20}
                  className="h-4 sm:h-5 w-auto object-contain"
                  priority
                />
                <span className="text-[10px] sm:text-xs font-black tracking-wide">SNUC</span>
              </div>
              <span className="border-2 border-black bg-[#9AE885] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] shrink-0">
                <span className="inline sm:hidden">IT DEPT</span>
                <span className="hidden sm:inline">IT DEPARTMENT</span>
              </span>
            </div>

            {/* Right: Event Tag */}
            <div className="border-2 border-black bg-[#FFD12E] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] tracking-wider shrink-0 ml-auto sm:ml-0">
              <span className="inline sm:hidden">INVENTE ’26</span>
              <span className="hidden sm:inline">INVENTE ’26 • TECH FEST</span>
            </div>
          </div>

          {/* Center Stage: Title + Subtitle + Dots */}
          <div className="flex flex-col items-center justify-center text-center z-10 max-w-2xl px-2 sm:px-4 my-auto shrink-0 py-2">
            {/* Out of the Box Eyebrow Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-1.5 sm:mb-4 border-2 border-black bg-[#FE90E9] px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-sm font-black uppercase shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] tracking-wider"
            >
              ★ A GIANT LEAP, OUT OF THE BOX ★
            </motion.div>

            {/* Websitica Main Title in signature Spicy_Rice Font */}
            <div className="font-spicyRice text-4xl xs:text-5xl sm:text-8xl md:text-9xl text-[#101010] flex my-1 sm:my-2 drop-shadow-[3px_3px_0px_#FFD12E] sm:drop-shadow-[4px_4px_0px_#FFD12E]">
              {text.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className={index % 2 === 1 ? "text-[#FF6B35]" : "text-[#101010]"}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Sub-tag banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-1 sm:mt-2 mb-3 sm:mb-6 border-2 border-black bg-[#FFD12E] px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-black uppercase shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] tracking-wider text-center"
            >
              PUZZLE COMPETITION • 16 TILES, 4 CONNECTIONS
            </motion.div>

            {/* 4 Theme Dots (Orange, Yellow, Lime, Cyan) with 2px black borders & brutal shadows */}
            <motion.div
              className="flex gap-2.5 sm:gap-4 items-center justify-center"
              variants={dotsContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { bg: "bg-[#FF6B35]", label: "orange" },
                { bg: "bg-[#FFD12E]", label: "yellow" },
                { bg: "bg-[#9AE885]", label: "lime" },
                { bg: "bg-[#C1F8FF]", label: "cyan" },
              ].map((dot, index) => (
                <motion.span
                  key={index}
                  variants={dotVariants}
                  className={cn(
                    "w-3 h-3 sm:w-5 sm:h-5 rounded-full border-2 border-black shadow-[2px_2px_0px_#101010]",
                    dot.bg
                  )}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom Diagnostics Bar */}
          <div className="w-full max-w-4xl z-10 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-xs font-black shrink-0">
            <div className="border-2 border-black bg-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] flex items-center gap-2 text-[10px] sm:text-xs">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#9AE885] border border-black animate-pulse" />
              <span>{status || "CONNECTING..."} {latency > 0 && `(${latency.toFixed(0)}MS)`}</span>
            </div>
            <div className="border-2 border-black bg-[#C1F8FF] px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-[2px_2px_0px_#101010] sm:shadow-[3px_3px_0px_#101010] uppercase tracking-wider text-[10px] sm:text-xs text-center">
              OUT THINK • OUT BUILD • OUT SHINE
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
