"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigateInternal } from "@/lib/offline-navigation";

type AppLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: ReactNode;
  };

/**
 * Same API as next/link -- this is a straight swap, `import Link from
 * "next/link"` -> `import AppLink from "@/components/pwa/AppLink"` --
 * except that while offline, clicking a link to a known app route (see
 * lib/app-routes.ts) does a full document navigation instead of Next's
 * normal client-side (RSC-fetching) transition. See
 * lib/offline-navigation.ts for why that's necessary.
 *
 * Every <Link> in the app that points at one of our own screens uses
 * this instead of next/link directly.
 */
export default function AppLink({ href, onClick, ...rest }: AppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    // Only take over plain left-clicks -- let the browser handle
    // ctrl/cmd/shift-click (open in new tab/window) and middle-click
    // itself, same as Next's own Link would.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = typeof href === "string" ? href : (href.pathname ?? "");
    if (navigateInternal(target)) {
      event.preventDefault();
    }
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
