"use client";

import { useTheme } from "./theme-provider";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "size-9 rounded-full border border-border/60 bg-card/80",
          className
        )}
        aria-hidden
      />
    );
  }

  const active = theme ?? "system";

  const toggleMobileTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleMobileTheme}
        title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur-sm transition hover:bg-card sm:hidden",
          className
        )}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
      </button>

      <div
        className={cn(
          "hidden items-center rounded-full border border-border/60 bg-card/80 p-0.5 backdrop-blur-sm sm:flex",
          className
        )}
        role="group"
        aria-label="Theme"
      >
        {THEMES.map(({ value, label, icon: Icon }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              title={label}
              aria-label={`${label} theme`}
              aria-pressed={isActive}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {value === "system" && resolvedTheme && (
                <span className="sr-only">
                  ({resolvedTheme === "dark" ? "dark" : "light"})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}