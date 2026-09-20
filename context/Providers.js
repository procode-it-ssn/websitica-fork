"use client";

import Loader from "@/components/Loader";
import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";

export default function Providers({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      <Loader onLoadComplete={handleLoadComplete} />
      {!isLoading && (
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
      )}
      <Toaster richColors closeButton />
    </>
  );
}
