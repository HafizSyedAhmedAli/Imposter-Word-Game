import {
  ClipboardList,
  Cloud,
  Users,
  ShieldQuestion,
  Baby,
  Settings2,
  History,
  Mail,
} from "lucide-react";
import SpaceBackdrop from "@/components/home/SpaceBackdrop";
import PrivacyHeader from "./PrivacyHeader";
import PrivacySectionCard from "./PrivacySectionCard";

/**
 * Content mirrors /mnt/user-data/outputs/privacy-policy.md exactly -- keep
 * both in sync if the policy changes. The markdown file is the portable
 * source (e.g. for App Store Connect or other listing forms that want a
 * plain-text URL); this page is the canonical hosted version linked from
 * Play Console and from Settings.
 *
 */
export default function PrivacyPolicyScreen() {
  return (
    <div className="relative flex min-h-dvh w-full justify-center">
      <SpaceBackdrop />

      <div className="flex w-full max-w-[1400px] flex-col px-4 pl-safe pr-safe pt-safe pb-safe sm:px-6 sm:py-8 lg:px-10">
        <PrivacyHeader />

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-6 lg:max-w-4xl">
          <p className="text-center text-xs text-iw-ink-500">
            Last updated: August 27, 2026
          </p>

          <PrivacySectionCard icon={ShieldQuestion} title="Summary" delayMs={0}>
            <p>
              Imposter Word Game is a local, pass-the-phone party game. It does
              not require an account, does not collect personal information, and
              does not use analytics or advertising services. Almost everything
              the app needs to run stays on your device.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard
            icon={Users}
            title="Information You Enter (Stays on Your Device)"
            delayMs={60}
          >
            <p>
              <strong className="text-iw-ink-100">Player names</strong> you type
              in during game setup are stored only on your device (in local
              browser/app storage) so the game can display them during play.
              They are never sent to our servers or any third party, and they
              are never included in requests to the AI word-generation service
              described below.
            </p>
            <p>
              <strong className="text-iw-ink-100">
                Game settings and statistics
              </strong>{" "}
              (e.g. sound preferences, round history, win/loss counts) are
              stored locally on your device to let the game resume sessions and
              show your stats over time.
            </p>
            <p>
              None of the above leaves your device. Uninstalling the app or
              clearing its storage deletes this data.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard
            icon={Cloud}
            title="Information Sent to Our Server"
            delayMs={120}
          >
            <p>
              When generating a new round, the app may send the following to our
              server, which forwards a request to a third-party AI provider
              (Google Gemini) to generate a secret word and hint:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                The selected{" "}
                <strong className="text-iw-ink-100">category</strong> (e.g.
                &ldquo;Food&rdquo;, &ldquo;Animals&rdquo;, or
                &ldquo;random&rdquo;)
              </li>
              <li>
                The selected{" "}
                <strong className="text-iw-ink-100">difficulty</strong> level
              </li>
              <li>
                A list of{" "}
                <strong className="text-iw-ink-100">recently used words</strong>{" "}
                to avoid repeating them
              </li>
            </ul>
            <p>
              This request never includes player names, device identifiers, or
              any other personal information. If this AI request fails for any
              reason, the app falls back to a built-in local word list and no
              network request is made.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard
            icon={ClipboardList}
            title="Third-Party Services"
            delayMs={180}
          >
            <p>
              We use the{" "}
              <strong className="text-iw-ink-100">Google Gemini API</strong>{" "}
              solely to generate game words and hints, as described above.
              Google&rsquo;s handling of that request is governed by{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-iw-violet-300 underline underline-offset-2 hover:text-iw-violet-200"
              >
                Google&rsquo;s Privacy Policy
              </a>
              . We do not use any advertising, analytics, or tracking SDKs.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard
            icon={History}
            title="Data Storage and Retention"
            delayMs={240}
          >
            <p>
              On-device data (player names, settings, statistics, cached words)
              remains on your device until you clear the app&rsquo;s storage or
              uninstall it. We do not operate a database of player-identifiable
              information, because none is ever transmitted to us.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard
            icon={Baby}
            title="Children's Privacy"
            delayMs={300}
          >
            <p>
              Imposter Word Game does not knowingly collect personal information
              from anyone, including children. Since no account or personal data
              is required to play, the app is safe for family use as a local
              party game.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard
            icon={Settings2}
            title="Your Choices"
            delayMs={360}
          >
            <p>
              Because nothing personally identifiable ever leaves your device,
              there is no account data for us to export or delete on request.
              You can remove all locally stored data at any time by clearing the
              app&rsquo;s storage or uninstalling it.
            </p>
          </PrivacySectionCard>

          <PrivacySectionCard icon={Mail} title="Contact" delayMs={420}>
            <p>
              If you have questions about this policy, contact:{" "}
              <a
                href="mailto:hafizsyedahmedali12@gmail.com"
                className="text-iw-violet-300 underline underline-offset-2 hover:text-iw-violet-200"
              >
                hafizsyedahmedali12@gmail.com
              </a>
            </p>
            <p className="text-xs text-iw-ink-500">
              We may update this policy as the app changes. The &ldquo;Last
              updated&rdquo; date at the top reflects the most recent revision.
            </p>
          </PrivacySectionCard>

          <p className="pt-2 text-center text-xs text-iw-ink-500">
            Imposter Word Game is made by Syed Ahmed Ali.
          </p>
        </main>
      </div>
    </div>
  );
}
