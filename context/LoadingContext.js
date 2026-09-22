"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const LoadingContext = createContext({
  isLandingLoading: false,
  setIsLandingLoading: () => {},
});

export function LoadingProvider({ children }) {
  const pathname = usePathname();
  // Landing page "/" starts with loading true
  const [isLandingLoading, setIsLandingLoading] = useState(pathname === "/");

  useEffect(() => {
    if (pathname !== "/") {
      setIsLandingLoading(false);
    }
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ isLandingLoading, setIsLandingLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
