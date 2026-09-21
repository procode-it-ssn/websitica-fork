"use client";
import { motion } from "framer-motion";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────────────────────
   InventeBackground
   Exact recreation of the floating decorative elements visible on
   https://ssnsnucinvente.com/ — the hero-smiley and VHS tape edges.

   Colour palette (sourced from their CSS custom props):
     --color-page:    #faf9f5  (background)
     --color-pink:    #fe90e9
     --color-lime:    #9ae885
     --color-sky:     #c1f8ff
     --color-mustard: #f7cb46
     --color-ink:     #1f1b12

   Smiley ring animation from their CSS:
     .hero-smiley__ring { animation: 16s linear infinite hero-smiley-spin }
     @keyframes hero-smiley-spin { 0% { transform: rotate(0) } 100% { transform: rotate(360deg) } }

   SVG source file: /invente/figma-hero-section.svg (same file from their /hero-assets/)
   VHS tape files:  /invente/vhs-[1-6].svg
     vhs-2 → pink  (#fe90e9)
     vhs-3 → lime  (#9ae885)
     vhs-6 → cyan  (#c1f8ff)
───────────────────────────────────────────────────────────────────────────── */

export default function InventeBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">

      {/* ──────────────────────────────────────────────────────
          TOP-LEFT  —  Cyan VHS tape (vhs-6, #c1f8ff)
          Peek from top-left corner, ~65 % off-screen.
          Gentle downward float matches the site's "alive" feel.
         ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute hidden sm:block"
        style={{ top: "-55px", left: "-42px" }}
        animate={{ y: [0, 9, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "mirror",
        }}
      >
        <Image
          src="/invente/vhs-6.svg"
          alt=""
          aria-hidden="true"
          width={124}
          height={566}
          priority
          style={{ transform: "rotate(-11deg)", opacity: 0.55 }}
          className="w-[124px] h-auto"
        />
      </motion.div>

      {/* ──────────────────────────────────────────────────────
          BOTTOM-LEFT  —  Pink VHS tape (vhs-2, #fe90e9)
          Peek from bottom-left corner, ~60 % off-screen.
         ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute hidden sm:block"
        style={{ bottom: "-75px", left: "-38px" }}
        animate={{ y: [0, -9, 0] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "mirror",
          delay: 1.2,
        }}
      >
        <Image
          src="/invente/vhs-2.svg"
          alt=""
          aria-hidden="true"
          width={124}
          height={450}
          priority
          style={{ transform: "rotate(9deg)", opacity: 0.58 }}
          className="w-[124px] h-auto"
        />
      </motion.div>

      {/* ──────────────────────────────────────────────────────
          TOP-RIGHT  —  Invente '26 Smiley Badge
          Recreation of .hero-smiley from ssnsnucinvente.com
          Ring spins at exactly 16s linear infinite (from their CSS).
          Positioned partially off the right edge of the screen.
         ────────────────────────────────────────────────────── */}
      <div
        className="absolute hidden sm:block"
        style={{ top: "-18px", right: "-36px" }}
      >
        {/* Outer container — same aspect-ratio:1 as .hero-smiley */}
        <div className="relative" style={{ width: 148, height: 148, opacity: 0.62 }}>

          {/* SPINNING RING — exactly 16s linear infinite, same as their CSS */}
          <motion.svg
            viewBox="135 340 200 200"
            fill="none"
            preserveAspectRatio="xMinYMin meet"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full"
            style={{ transformBox: "view-box", transformOrigin: "48.1% 50.1%" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          >
            <use href="/invente/figma-hero-section.svg#Out Think. Out Build. Out Shine. Out Think. Out Build. Out Shine." />
          </motion.svg>

          {/* STATIC FACE — yellow smiley with smile + two eyes */}
          <svg
            viewBox="135 340 200 200"
            fill="none"
            preserveAspectRatio="xMinYMin meet"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full"
          >
            <use href="/invente/figma-hero-section.svg#Ellipse 11_2" />
            <use href="/invente/figma-hero-section.svg#Ellipse 16_2" />
            <use href="/invente/figma-hero-section.svg#Ellipse 17_2" />
            <use href="/invente/figma-hero-section.svg#Ellipse 18_2" />
          </svg>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────
          BOTTOM-RIGHT  —  Lime Green VHS tape (vhs-3, #9ae885)
          Peek from bottom-right corner, ~60 % off-screen.
         ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute hidden md:block"
        style={{ bottom: "-85px", right: "-40px" }}
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "mirror",
          delay: 0.6,
        }}
      >
        <Image
          src="/invente/vhs-3.svg"
          alt=""
          aria-hidden="true"
          width={124}
          height={566}
          priority
          style={{ transform: "rotate(-8deg)", opacity: 0.55 }}
          className="w-[124px] h-auto"
        />
      </motion.div>

      {/* ──────────────────────────────────────────────────────
          RETRO TECH CROSSHAIR MARKERS  (visible in ref image)
         ────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute hidden sm:block font-mono select-none"
        style={{
          top: "36px",
          left: "calc(25% + 8px)",
          fontSize: "11px",
          color: "rgba(31,27,18,0.22)",
          letterSpacing: "0.04em",
        }}
      >
        +[REC_01 // 25-26.09.2026]
      </div>
      <div
        aria-hidden="true"
        className="absolute hidden sm:block font-mono select-none"
        style={{
          bottom: "36px",
          right: "calc(25% + 8px)",
          fontSize: "11px",
          color: "rgba(31,27,18,0.18)",
          letterSpacing: "0.04em",
        }}
      >
        [TAPE_INDEX: 04 // 60 MIN SP] +
      </div>

    </div>
  );
}
