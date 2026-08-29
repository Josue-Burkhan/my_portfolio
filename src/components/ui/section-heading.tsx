type SectionHeadingProps = {
  dark?: boolean;
  index: string;
  label: string;
  title: string;
};

export function SectionHeading({
  dark = false,
  index,
  label,
  title,
}: SectionHeadingProps) {
  return (
    <div className="mb-14 grid gap-8 lg:mb-20 lg:grid-cols-[1fr_2fr]">
      <div className={`section-marker ${dark ? "text-white/45" : ""}`}>
        <span>{index}</span>
        <span
          className={`h-px w-14 ${dark ? "bg-white/20" : "bg-[var(--line-strong)]"}`}
        />
        <span>{label}</span>
      </div>
      <h2
        className={`max-w-4xl font-serif text-[clamp(2.8rem,5vw,5.5rem)] leading-[0.95] tracking-[-0.035em] ${
          dark ? "text-[var(--paper)]" : "text-[var(--ink)]"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
