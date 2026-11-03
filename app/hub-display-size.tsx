"use client";

import { useEffect, useState } from "react";

/** Client-only display magnification. No catalogue, price or access data is changed. */
const KEY = "maliks-hub-display-size-v1";
const LEVELS = [100, 110, 125, 135, 150] as const;
type Level = (typeof LEVELS)[number];

function validLevel(value: number): value is Level {
  return LEVELS.includes(value as Level);
}

function isInternalHubPath(path: string) {
  // No user-facing controls or state changes on public shopping, QR, or API routes.
  return path === "/" || /^\/(price-tags|assessments|attendance|vehicles)(\/|$)/.test(path);
}

export default function HubDisplaySize() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>(100);

  useEffect(() => {
    const enabled = isInternalHubPath(window.location.pathname);
    if (!enabled) return;
    // Schedule React state updates outside the effect body for React 19 lint rules.
    const start = window.setTimeout(() => {
      setActive(true);
      try {
        const stored = Number(window.localStorage.getItem(KEY));
        if (validLevel(stored)) {
          setLevel(stored);
          document.documentElement.style.zoom = String(stored / 100);
        }
      } catch {
        // Storage may be disabled; the control remains usable.
      }
    }, 0);
    return () => {
      window.clearTimeout(start);
      document.documentElement.style.removeProperty("zoom");
    };
  }, []);

  function changeSize(next: Level) {
    setLevel(next);
    document.documentElement.style.zoom = String(next / 100);
    try {
      window.localStorage.setItem(KEY, String(next));
    } catch {
      // Apply the preference for the current session even without storage.
    }
  }

  if (!active) return null;

  return (
    <div className="hubDisplaySize" aria-label="Hub accessibility display settings">
      {open && (
        <section className="hubDisplaySizePanel" aria-label="Choose display size">
          <div className="hubDisplaySizeHeading">Display size</div>
          <p>Enlarge text, buttons and forms on this device.</p>
          <div className="hubDisplaySizeOptions" role="group" aria-label="Interface size">
            {LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={level === option}
                onClick={() => changeSize(option)}
              >
                {option}%
              </button>
            ))}
          </div>
          <div className="hubDisplaySizeActions">
            <button type="button" onClick={() => changeSize(100)}>Reset to normal</button>
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
        </section>
      )}
      <button
        type="button"
        className="hubDisplaySizeToggle"
        aria-expanded={open}
        aria-label={`Display size, currently ${level} percent`}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">Aa</span> Display size <span>{level}%</span>
      </button>
    </div>
  );
}
