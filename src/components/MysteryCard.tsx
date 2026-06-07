export function MysteryCard({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`grid aspect-[3/4.25] grid-rows-[auto_1fr_auto] border border-gold/70 bg-gradient-to-br from-[#25140f] via-[#744531] to-gold text-center text-paper shadow-2xl ${
        small ? "w-36 p-3" : "w-56 p-5"
      }`}
    >
      <small className="sans text-[10px] uppercase tracking-[0.14em] text-paper/75">
        Tap to draw
      </small>
      <div
        className={`m-auto grid rounded-full border border-paper/60 place-items-center ${
          small ? "h-16 w-16 text-2xl" : "h-24 w-24 text-4xl"
        }`}
      >
        她
      </div>
      <div>
        <strong className={`block font-normal ${small ? "text-lg" : "text-2xl"}`}>杨绛</strong>
        <p className={`m-0 text-paper/85 ${small ? "text-[11px]" : "text-sm"}`}>
          我和谁都不争，和谁争我都不屑。
        </p>
      </div>
    </div>
  );
}
