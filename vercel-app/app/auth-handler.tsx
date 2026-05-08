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

  const { hash, search } = authReturnParams();

  return Boolean(
    search.get("code") ||
      search.get("access_token") ||
      hash.get("access_token") ||
      hash.get("refresh_token") ||
      hash.get("error") ||
      search.get("error"),
  );
}

function authReturnParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return { hash, search };
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
      const { hash, search } = authReturnParams();
      const code = url.searchParams.get("code");
      const accessToken = hash.get("access_token") ?? search.get("access_token");
      const refreshToken = hash.get("refresh_token") ?? search.get("refresh_token");
      const errorDescription =
        hash.get("error_description") ?? search.get("error_description") ?? hash.get("error") ?? search.get("error");
      const next = safeNextPath(url.searchParams.get("next") ?? storedNextPath(fallbackNext));

      try {
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          if (!data.session) {
            throw new Error("No MiseForge session was returned.");
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
      } catch (caught) {
        const detail = caught instanceof Error ? caught.message : "Unknown auth return error.";
        window.sessionStorage.setItem("miseforge.auth.error", detail);

        if (isMounted) {
          setMessage(`MiseForge could not finish sign-in: ${detail}`);
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
