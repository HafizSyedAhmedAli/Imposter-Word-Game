import { Shield } from "lucide-react";

export default function PrivacyNotice() {
  return (
    <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-xs text-iw-ink-600">
      <Shield
        className="h-3.5 w-3.5 shrink-0 text-iw-ink-500"
        aria-hidden="true"
      />
      Your game is private and stored only on this device.
    </p>
  );
}
