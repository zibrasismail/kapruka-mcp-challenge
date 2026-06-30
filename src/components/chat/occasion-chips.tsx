"use client";

import { motion } from "framer-motion";

const OCCASIONS = [
  { label: "Birthday", prompt: "Birthday gift ekak oni", emoji: "🎂" },
  { label: "Avurudu", prompt: "Avurudu gift package ekak", emoji: "🪔" },
  { label: "Wedding", prompt: "Wedding gift ideas", emoji: "💒" },
  { label: "Anniversary", prompt: "Anniversary gift for my partner", emoji: "💕" },
  { label: "Flowers", prompt: "Fresh flower bouquet Colombo", emoji: "💐" },
  { label: "Sorry", prompt: "Sorry gift — flowers or cake", emoji: "🙏" },
  { label: "Mom", prompt: "Amma birthday gift ideas", emoji: "👩" },
  { label: "Corporate", prompt: "Corporate gift hamper", emoji: "🎁" },
];

export function OccasionChips({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="w-full">
      <div className="carousel-track -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {OCCASIONS.map((occ, i) => (
          <motion.button
            key={occ.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => onSelect(occ.prompt)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3.5 py-2 text-xs font-medium backdrop-blur-sm transition active:scale-95 hover:border-primary/40 hover:bg-primary/5 sm:px-3 sm:py-1.5"
          >
            <span className="text-sm sm:text-base">{occ.emoji}</span>
            {occ.label}
          </motion.button>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground sm:hidden">
        Swipe for more occasions
      </p>
    </div>
  );
}