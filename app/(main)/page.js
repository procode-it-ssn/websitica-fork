"use client";

import { useState } from "react";
import JoinGame from "@/components/JoinGame";
import Loader from "@/components/Loader";
import { useLoading } from "@/context/LoadingContext";

export default function Page() {
  const { isLandingLoading, setIsLandingLoading } = useLoading();
  const [showLoader, setShowLoader] = useState(isLandingLoading);

  const handleLoadComplete = () => {
    setShowLoader(false);
    setIsLandingLoading(false);
  };

  return (
    <>
      {showLoader && (
        <Loader onLoadComplete={handleLoadComplete} />
      )}
      <JoinGame />
    </>
  );
}
