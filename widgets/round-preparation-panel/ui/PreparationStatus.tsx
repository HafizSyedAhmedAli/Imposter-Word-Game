export default function PreparationStatus({ text }: { text: string }) {
  return (
    <p
      key={text}
      aria-live="polite"
      className="animate-iw-fade-in text-center text-base font-medium text-iw-ink-300 sm:text-lg"
    >
      {text}
    </p>
  );
}
