"use client";

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
    <div className="full-bleed-mobile w-full sm:mx-auto sm:max-w-full">
      <div className="carousel-track content-padding flex gap-2 overflow-x-auto pb-2 pt-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 sm:pt-0">
        {OCCASIONS.map((occ) => (
          <button
            key={occ.label}
            type="button"
            onClick={() => onSelect(occ.prompt)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition active:scale-95 hover:border-primary/40 hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
          >
            <span className="text-base leading-none sm:text-sm">{occ.emoji}</span>
            {occ.label}
          </button>
        ))}
        <div className="w-2 shrink-0 sm:hidden" aria-hidden />
      </div>
    </div>
  );
}