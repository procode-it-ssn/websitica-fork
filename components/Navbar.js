"use client";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/context/LoadingContext";

export default function Navbar() {
  const { isLandingLoading } = useLoading();

  return (
    <AnimatePresence>
      {!isLandingLoading && (
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="sticky top-0 z-50 w-full border-b-2 border-black bg-[#FFF9F3]/95 backdrop-blur-md px-4 py-2 font-mono"
        >
      <nav className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Official Invente Logo & Department Tag */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center shrink-0 py-0.5 hover:opacity-90 transition-opacity">
            <Image
              src="/invente/invente_notag.webp"
              alt="INVENTE '26 Logo"
              width={140}
              height={36}
              className="h-7 w-auto object-contain object-left"
              priority
            />
          </Link>
          <span className="hidden sm:inline-block border border-black bg-[#9AE885] px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_#101010]">
            SSN × SNU • IT DEPT
          </span>
        </div>

        {/* Center: Event Tag (Websitica) */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <Link
            href="/"
            className="border-2 border-black bg-[#FFD12E] hover:bg-[#FFDA58] px-3.5 py-0.5 uppercase text-xs font-black shadow-[2px_2px_0px_#101010] tracking-wider transition-all text-black"
          >
            WEBSITICA
          </Link>
        </div>

        {/* Right: Contest Lab Selectors & Admin Deck */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <div className="hidden sm:flex items-center border-2 border-black bg-white shadow-[2px_2px_0px_#101010] overflow-hidden text-[11px] font-black">
            <span className="px-2 py-0.5 text-[10px] text-gray-500 uppercase border-r border-black bg-[#FBF9F4]">
              CONTEST
            </span>
            <Link
              href="/lab1"
              className="px-2.5 py-0.5 hover:bg-[#FFD12E] transition-colors uppercase border-r border-black"
            >
              LAB 1
            </Link>
            <Link
              href="/lab2"
              className="px-2.5 py-0.5 hover:bg-[#FFD12E] transition-colors uppercase"
            >
              LAB 2
            </Link>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 border-2 border-black bg-[#C1F8FF] hover:bg-[#A3EDF7] text-black px-2.5 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0px_#101010] transition-all"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>ADMIN DECK</span>
          </Link>
        </div>
      </nav>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
