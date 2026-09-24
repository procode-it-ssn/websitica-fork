"use client";

import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { LoadingProvider } from "./LoadingContext";

export default function Providers({ children }) {
  const pathname = usePathname();

  return (
    <LoadingProvider>
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
    </LoadingProvider>
  );
}
