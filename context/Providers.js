"use client";

import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";

export default function Providers({ children }) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence
        mode="wait"
        initial={true}
        onExitComplete={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0 });
          }
        }}
      >
        <div key={pathname}>{children}</div>
      </AnimatePresence>
      <Toaster richColors closeButton />
    </>
  );
}
