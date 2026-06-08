export function BookStack() {
  return (
    <div className="relative h-24 min-w-44">
      <div className="absolute bottom-2 left-4 right-1 h-px bg-paper/40" />
      {[
        ["right-28 top-1 rotate-[-8deg] bg-gradient-to-br from-[#2a1710] via-[#704431] to-gold", "Day"],
        ["right-16 top-0 rotate-[5deg] bg-gradient-to-br from-paper to-[#cfa778] text-ink/70", "Cards"],
        ["right-3 top-3 rotate-[-2deg] bg-gradient-to-br from-[#7b4a37] to-[#b77d70]", "AI"],
      ].map(([classes, label]) => (
        <div
          key={label}
          className={`absolute h-20 w-14 border border-paper/50 shadow-2xl ${classes}`}
        >
          <div className="absolute inset-2 border border-paper/25" />
          <div className="sans absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-[0.12em] text-paper/80">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
