import { Heart } from "lucide-react";
import InstallAppButton from "@/components/pwa/InstallAppButton";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

export default function HomeFooter() {
  return (
    <footer className="flex flex-col items-center gap-2 pb-2 pt-1">
      <InstallAppButton />
      <div className="flex items-center justify-center gap-2 text-xs text-iw-ink-600">
        <span>Imposter Word {APP_VERSION ? `v${APP_VERSION}` : "Version unavailable"}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Heart
            className="h-3 w-3 fill-iw-red text-iw-red"
            aria-hidden="true"
          />
          Made for fun
        </span>
      </div>
    </footer>
  );
}
