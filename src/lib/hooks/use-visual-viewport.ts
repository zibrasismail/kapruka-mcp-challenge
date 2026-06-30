"use client";

import { useEffect, useState } from "react";

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const keyboardOpen = viewport.height < window.innerHeight * 0.85;
      if (!keyboardOpen) {
        setOffset(0);
        return;
      }
      setOffset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return offset;
}