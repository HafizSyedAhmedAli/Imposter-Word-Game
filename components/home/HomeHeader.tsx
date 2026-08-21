import Link from "next/link";
import { Settings, HelpCircle } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";
import { playSound } from "@/lib/sound-engine";

function IconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={() => playSound("ui-tap")}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-iw-border bg-iw-surface/60 text-iw-ink-100 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-iw-border-strong hover:bg-iw-surface-2 active:translate-y-0 active:scale-95"
    >
      {children}
    </Link>
  );
}

export default function HomeHeader() {
  return (
    <header className="flex items-center justify-between gap-2">
      <ConnectionStatus />
      <div className="flex items-center gap-2">
        <IconButton href="/settings" label="Open settings">
          <Settings className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </IconButton>
        <IconButton href="/how-to-play" label="How to play">
          <HelpCircle className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </IconButton>
      </div>
    </header>
  );
}
