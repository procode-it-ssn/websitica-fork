"use client";
import React from "react";
import { useLoading } from "@/context/LoadingContext";

export default function Footer() {
  const { isLandingLoading } = useLoading();

  // If the landing loader is active, completely remove footer from DOM
  if (isLandingLoading) return null;

  return (
    <footer className="w-full py-3 sm:py-4 px-3 sm:px-6 font-mono select-none z-10 mt-auto pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto border-t-2 border-black/15 pt-3 sm:pt-4">
        {/* Mobile View: Clean, balanced, vertically structured stack (never overlaps or wraps awkwardly) */}
        <div className="flex flex-col items-center gap-2 sm:hidden text-center">
          <div className="flex items-center gap-1.5 justify-center text-[10px] font-bold text-black/70">
            <span className="bg-white border border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_#101010] text-black font-black">
              SSN × SNU
            </span>
            <span className="text-black/40">•</span>
            <span className="uppercase tracking-wider">
              Dept of Information Technology
            </span>
          </div>

          <div className="flex items-center gap-2 justify-center flex-wrap pt-0.5">
            <span className="bg-[#FFD12E] border border-black px-2.5 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_#101010] text-black tracking-wide">
              WEBSITICA &apos;26 • CODECTIONS
            </span>
            <span className="bg-[#9AE885] border border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#101010] text-black">
              INVENTE &apos;26
            </span>
          </div>
        </div>

        {/* Desktop / Laptop / Tablet View: Spacious, aligned horizontal bar */}
        <div className="hidden sm:flex items-center justify-between gap-4 text-xs font-bold text-black/70">
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-white border border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_#101010] text-black font-black text-xs">
              SSN × SNU
            </span>
            <span className="text-black/40">•</span>
            <span className="uppercase tracking-wider text-xs">
              Department of Information Technology
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#FFD12E] border-2 border-black px-3 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_#101010] text-black tracking-wider">
              WEBSITICA &apos;26 • CODECTIONS
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#9AE885] border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_#101010] text-black">
              INVENTE &apos;26
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
