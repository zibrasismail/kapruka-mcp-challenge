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
    <div className="flex flex-wrap gap-2">
      {OCCASIONS.map((occ, i) => (
        <motion.button
          key={occ.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.05 }}
          onClick={() => onSelect(occ.prompt)}
          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span>{occ.emoji}</span>
          {occ.label}
        </motion.button>
      ))}
    </div>
  );
}