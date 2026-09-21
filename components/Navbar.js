"use client";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-[#FFF9F3]/95 backdrop-blur-md px-4 py-2 font-mono">
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

        {/* Center: Event Tag */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="border border-black bg-[#FFD12E] px-2.5 py-0.5 uppercase text-[11px] font-black shadow-[2px_2px_0px_#101010]">
            WEBSITICA: CODECTIONS
          </span>
        </div>

        {/* Right: Quick Lab Routing & Master Deck */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <Link
            href="/lab1"
            className="hidden sm:inline-block border border-black bg-white hover:bg-[#FFF9A6] px-2.5 py-1 text-[11px] shadow-[2px_2px_0px_#101010] transition-all uppercase"
          >
            LAB 1
          </Link>
          <Link
            href="/lab2"
            className="hidden sm:inline-block border border-black bg-white hover:bg-[#FFF9A6] px-2.5 py-1 text-[11px] shadow-[2px_2px_0px_#101010] transition-all uppercase"
          >
            LAB 2
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1 border border-black bg-[#C1F8FF] hover:bg-[#A3EDF7] text-black px-2.5 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0px_#101010] transition-all"
          >
            <Trophy className="w-3 h-3" />
            <span>MASTER DECK</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
