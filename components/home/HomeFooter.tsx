import { Heart } from "lucide-react";

export default function HomeFooter() {
  return (
    <footer className="flex items-center justify-center gap-2 pb-2 pt-1 text-xs text-iw-ink-600">
      <span>Imposter Word v1.0.0</span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3 w-3 fill-iw-red text-iw-red" aria-hidden="true" />
        Made for fun
      </span>
    </footer>
  );
}
