"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

type LaunchEventProperties = Record<string, string | number | boolean>;

export function trackLaunchEvent(eventName: string, properties: LaunchEventProperties = {}) {
  try {
    track(eventName, properties);
  } catch {
    // Analytics must never interrupt the filmmaking workflow.
  }
}

export function LaunchAnalytics() {
  useEffect(() => {
    function trackMarkedClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-analytics-event]") : null;

      if (!target) {
        return;
      }

      const eventName = target.dataset.analyticsEvent;

      if (!eventName) {
        return;
      }

      const properties: LaunchEventProperties = {};

      if (target.dataset.analyticsArea) {
        properties.area = target.dataset.analyticsArea;
      }

      if (target.dataset.analyticsTarget) {
        properties.target = target.dataset.analyticsTarget;
      }

      trackLaunchEvent(eventName, properties);
    }

    document.addEventListener("click", trackMarkedClick);

    return () => {
      document.removeEventListener("click", trackMarkedClick);
    };
  }, []);

  return null;
}
