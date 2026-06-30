"use client";

import { useEffect, useRef, useState } from "react";

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const keyboardOpen = viewport.height < window.innerHeight * 0.85;
        const next = keyboardOpen
          ? Math.round(
              Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
            )
          : 0;

        if (Math.abs(offsetRef.current - next) < 8) return;

        offsetRef.current = next;
        setOffset(next);
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return offset;
}