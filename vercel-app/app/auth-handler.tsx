"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "../lib/supabase/browser";

const authNextKey = "miseforge.auth.next";
const authStartedAtKey = "miseforge.auth.startedAt";
const authErrorKey = "miseforge.auth.error";
const authPendingWindowMs = 10 * 60 * 1000;

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

  const stored = window.localStorage.getItem(authNextKey);

  return safeNextPath(stored ?? fallbackNext);
}

export function hasAuthReturnInCurrentUrl() {
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

export function getPendingAuthDiagnostic() {
  if (typeof window === "undefined") {
    return "";
  }

  const storedError = window.sessionStorage.getItem(authErrorKey);

  if (storedError) {
    return `MiseForge could not finish sign-in: ${storedError}`;
  }

  const startedAt = Number(window.localStorage.getItem(authStartedAtKey) ?? "0");

  if (!startedAt || Date.now() - startedAt > authPendingWindowMs || hasAuthReturnInCurrentUrl()) {
    return "";
  }

  return [
    "Google returned to MiseForge without a Supabase auth code.",
    "In Supabase Authentication > URL Configuration, add these Redirect URLs: https://miseforge.com/app and https://miseforge.com/**.",
  ].join(" ");
}

export function clearAuthReturnState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authNextKey);
  window.localStorage.removeItem(authStartedAtKey);
  window.sessionStorage.removeItem(authErrorKey);
}

function authReturnParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return { hash, search };
}

export function AuthReturnHandler({ fallbackNext = "/app", quiet = false }: { fallbackNext?: string; quiet?: boolean }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasAuthReturnInCurrentUrl()) {
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
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          if (!data.session) {
            throw new Error("Supabase accepted the code but did not return a session.");
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

        clearAuthReturnState();
        window.location.replace(next);
      } catch (caught) {
        const detail = caught instanceof Error ? caught.message : "Unknown auth return error.";
        window.sessionStorage.setItem(authErrorKey, detail);

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

  window.localStorage.setItem(authNextKey, safeNextPath(nextPath));
  window.localStorage.setItem(authStartedAtKey, String(Date.now()));
  window.sessionStorage.removeItem(authErrorKey);
}
