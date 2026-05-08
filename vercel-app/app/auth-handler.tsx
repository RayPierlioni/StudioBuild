"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "../lib/supabase/browser";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

function storedNextPath(fallbackNext: string) {
  if (typeof window === "undefined") {
    return fallbackNext;
  }

  const stored = window.localStorage.getItem("miseforge.auth.next");

  return safeNextPath(stored ?? fallbackNext);
}

function hasAuthReturnInUrl() {
  if (typeof window === "undefined") {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return Boolean(
    search.get("code") ||
      search.get("access_token") ||
      hash.get("access_token") ||
      hash.get("refresh_token") ||
      hash.get("error") ||
      search.get("error"),
  );
}

export function AuthReturnHandler({ fallbackNext = "/app", quiet = false }: { fallbackNext?: string; quiet?: boolean }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasAuthReturnInUrl()) {
      return;
    }

    let isMounted = true;

    async function finishSignIn() {
      const supabase = getSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = safeNextPath(url.searchParams.get("next") ?? storedNextPath(fallbackNext));

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          if (!data.session) {
            throw new Error("No MiseForge session was found.");
          }
        }

        window.localStorage.removeItem("miseforge.auth.next");
        window.location.replace(next);
      } catch {
        if (isMounted) {
          setMessage("MiseForge could not finish sign-in. Return to the app and try Google sign-in again.");
        }
      }
    }

    void finishSignIn();

    return () => {
      isMounted = false;
    };
  }, [fallbackNext]);

  if (quiet && !message) {
    return null;
  }

  return message ? (
    <p className="status error" role="status">
      {message}
    </p>
  ) : null;
}

export function rememberAuthReturnPath(nextPath: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("miseforge.auth.next", safeNextPath(nextPath));
}
