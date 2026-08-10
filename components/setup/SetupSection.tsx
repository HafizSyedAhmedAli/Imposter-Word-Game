export default function SetupSection({
  title,
  description,
  children,
  delay,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: string;
}) {
  return (
    <section
      className="rounded-3xl border border-iw-border bg-iw-surface/40 p-4 backdrop-blur-sm animate-iw-fade-up sm:p-5"
      style={delay ? { animationDelay: delay } : undefined}
    >
      <h2 className="font-display text-lg font-semibold tracking-wide text-iw-ink-100 sm:text-xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-iw-ink-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
