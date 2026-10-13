"use client";

import { useEffect } from "react";

export default function SystemClientMonitor() {
  useEffect(() => {
    const sent = new Set<string>();

    const report = (
      kind: string,
      message: string,
      source = "",
      stack = "",
    ) => {
      const key = `${kind}|${message}|${source}`;
      if (sent.has(key)) return;
      sent.add(key);

      if (sent.size > 50) {
        const first = sent.values().next().value;
        if (first) sent.delete(first);
      }

      void fetch("/api/system-control-centre", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "logClientError",
          kind,
          message,
          source,
          stack,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      report(
        "Window Error",
        event.message || "Unknown browser error",
        event.filename
          ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}`
          : window.location.pathname,
        event.error instanceof Error ? event.error.stack || "" : "",
      );
    };

    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      report(
        "Unhandled Promise",
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection",
        window.location.pathname,
        reason instanceof Error ? reason.stack || "" : "",
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  return null;
}
