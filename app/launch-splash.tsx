"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function LaunchSplash() {
  const pathname = usePathname();
  const publicStorefront = pathname === "/shop" || pathname === "/wholesale-shop";
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (publicStorefront) {
      document.documentElement.classList.remove("powerbuild-splash-active");
      return;
    }
    document.documentElement.classList.add("powerbuild-splash-active");

    const leaveTimer = window.setTimeout(() => setLeaving(true), 1850);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      document.documentElement.classList.remove("powerbuild-splash-active");
    }, 2350);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
      document.documentElement.classList.remove("powerbuild-splash-active");
    };
  }, [publicStorefront]);

  if (publicStorefront || !visible) return null;

  return (
    <div
      className={`powerbuildLaunchSplash${leaving ? " isLeaving" : ""}`}
      role="status"
      aria-label="Welcome to PowerBuild"
    >
      <div className="powerbuildLaunchGlow powerbuildLaunchGlowOne" />
      <div className="powerbuildLaunchGlow powerbuildLaunchGlowTwo" />

      <div className="powerbuildLaunchInner">
        <div className="powerbuildLaunchLogoStage">
          <span className="powerbuildLaunchRing" aria-hidden="true" />
          <img
            src="/powerbuild-logo-transparent.png"
            alt="PowerBuild"
            className="powerbuildLaunchLogo"
          />
        </div>

        <div className="powerbuildLaunchCopy">
          <span>WELCOME TO</span>
          <strong>POWERBUILD</strong>
          <small>COMPANY HUB</small>
        </div>

        <div className="powerbuildLaunchLoader" aria-hidden="true">
          <i />
        </div>
      </div>
    </div>
  );
}
