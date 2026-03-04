"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

type AuthModalLauncherProps = {
  forceRedirectUrl: string;
};

export function AuthModalLauncher({ forceRedirectUrl }: AuthModalLauncherProps) {
  const clerk = useClerk();
  const pathname = usePathname();
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;

    clerk.openSignUp({
      forceRedirectUrl,
      signInForceRedirectUrl: forceRedirectUrl,
    });

    window.history.replaceState(window.history.state, "", pathname);
  }, [clerk, forceRedirectUrl, pathname]);

  return null;
}
