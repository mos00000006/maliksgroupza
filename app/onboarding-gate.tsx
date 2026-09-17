"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
};

type SelfData = {
  member: {
    name: string;
    email: string;
    role: string;
    department: string;
    access_scope: string;
    workspaces: string[];
  };
  status: {
    installed_app: boolean;
    notifications_enabled: boolean;
    notifications_required: boolean;
    push_devices: number;
    role_confirmed: boolean;
    training_complete: boolean;
    completed: boolean;
    completed_at: string;
    started_at: string;
    last_seen_at: string;
    last_reminded_at: string;
    device_label: string;
  };
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function installedNow() {
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    standaloneNavigator.standalone === true
  );
}

function deviceLabel() {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    "Device";

  return `${platform} · ${navigator.userAgent}`.slice(0, 480);
}

export default function OnboardingGate({
  currentUser,
}: {
  currentUser: CurrentHubUser;
}) {
  const [data, setData] = useState<SelfData | null>(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState("");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");

  const load = async (autoOpen = false) => {
    try {
      const response = await fetch("/api/rollout-onboarding?scope=self", {
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return;

      setData(result);

      const detectedInstalled = installedNow();
      if (detectedInstalled && !result.status?.installed_app) {
        void updateSelf({ installedApp: true }, false);
      }

      const forced =
        new URLSearchParams(window.location.search).get("onboarding") === "1";

      if (
        forced ||
        (autoOpen &&
          !result.status?.completed &&
          window.sessionStorage.getItem(
            "powerbuild-onboarding-dismissed",
          ) !== "1")
      ) {
        setOpen(true);
      }
    } catch {}
  };

  const updateSelf = async (
    values: Record<string, unknown>,
    refresh = true,
  ) => {
    setWorking(String(Object.keys(values)[0] || "saving"));

    try {
      const response = await fetch("/api/rollout-onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "updateSelf",
          deviceLabel: deviceLabel(),
          ...values,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setData(result);
        if (result.status?.completed) {
          setMessage("Setup complete — your PowerBuild Hub is ready.");
        }
      }

      if (refresh && !response.ok) {
        setMessage(result.error || "Setup could not be updated.");
      }
    } finally {
      setWorking("");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(true), 800);

    const onOpen = () => {
      window.sessionStorage.removeItem(
        "powerbuild-onboarding-dismissed",
      );
      setOpen(true);
      void load(false);
    };

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      void updateSelf({ installedApp: true });
    };

    const onNotificationsUpdated = () => {
      window.setTimeout(() => void load(false), 350);
    };

    window.addEventListener("open-onboarding-setup", onOpen);
    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstall as EventListener,
    );
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(
      "powerbuild-notifications-updated",
      onNotificationsUpdated,
    );

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("open-onboarding-setup", onOpen);
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstall as EventListener,
      );
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(
        "powerbuild-notifications-updated",
        onNotificationsUpdated,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = useMemo(() => {
    if (!data) return [];
    return [
      {
        name: "Confirm access",
        done: data.status.role_confirmed,
      },
      {
        name: "Install Hub",
        done: data.status.installed_app,
      },
      {
        name: "Notifications",
        done:
          !data.status.notifications_required ||
          data.status.notifications_enabled,
      },
      {
        name: "Quick guide",
        done: data.status.training_complete,
      },
    ];
  }, [data]);

  const completedSteps = steps.filter((step) => step.done).length;
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) &&
      navigator.maxTouchPoints > 1);

  if (!open || !data) return null;

  return (
    <div className="onboardingOverlay">
      <style>{`
        .onboardingOverlay{position:fixed;inset:0;background:#0e1a2bb0;z-index:180;display:grid;place-items:center;padding:14px}.onboardingModal{width:min(900px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;background:#f6f8fb;border-radius:18px;box-shadow:0 28px 80px #0a152770}.onboardingHero{background:linear-gradient(125deg,#152940,#254b6b);padding:20px 22px;color:#fff;border-radius:18px 18px 0 0;display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.onboardingHero small{display:block;color:#f5ca2e;font-size:8px;font-weight:950;letter-spacing:.12em}.onboardingHero h2{margin:5px 0;font-size:23px}.onboardingHero p{margin:0;color:#cfdae4;font-size:9px;line-height:1.55;max-width:650px}.onboardingHero button{width:34px;height:34px;border:0;border-radius:9px;background:#ffffff18;color:#fff;font-size:18px;cursor:pointer}.onboardingBody{padding:16px;display:grid;gap:12px}.onboardingProgress{background:#fff;border:1px solid #dce5ed;border-radius:12px;padding:12px}.onboardingProgressTop{display:flex;justify-content:space-between;gap:10px;font-size:8px;font-weight:850;color:#365069}.onboardingBar{height:9px;background:#edf2f6;border-radius:999px;margin-top:8px;overflow:hidden}.onboardingBar span{display:block;height:100%;background:#f4c82b;border-radius:999px}.onboardingSteps{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.onboardingCard{background:#fff;border:1px solid #dce5ed;border-radius:12px;padding:13px}.onboardingCardHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.onboardingCard h3{font-size:11px;margin:0;color:#243e56}.onboardingCard p{font-size:8px;color:#6f8091;line-height:1.5;margin:6px 0 0}.onboardingDone{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:999px;background:#def4e8;color:#176b49;font-size:8px;font-weight:950}.onboardingPending{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:999px;background:#fff0ca;color:#8a6200;font-size:8px;font-weight:950}.onboardingInfo{margin-top:9px;background:#f4f7fa;border:1px solid #e0e7ed;border-radius:9px;padding:9px;font-size:7.5px;color:#526b83;line-height:1.5}.onboardingInfo b{color:#2d465f}.onboardingActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.onboardingActions button{border:1px solid #d4dee7;background:#fff;border-radius:8px;padding:8px 10px;font:inherit;font-size:7px;font-weight:900;color:#36516b;cursor:pointer}.onboardingActions .primary{background:#f5ca2e;border-color:#dfba22;color:#172438}.onboardingActions button:disabled{opacity:.55;cursor:not-allowed}.onboardingGuide{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}.onboardingGuide div{background:#f7f9fb;border:1px solid #e3e9ee;border-radius:8px;padding:8px}.onboardingGuide b{display:block;font-size:7.5px;color:#324d66}.onboardingGuide small{display:block;font-size:6.5px;color:#84919e;margin-top:2px;line-height:1.4}.onboardingFooter{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:12px 16px;border-top:1px solid #dfe6ed;background:#fff;border-radius:0 0 18px 18px}.onboardingFooter span{font-size:7.5px;color:#6f8090}.onboardingFooter div{display:flex;gap:7px}.onboardingFooter button{border:1px solid #d4dee7;background:#fff;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:900;color:#3d566f;cursor:pointer}.onboardingFooter .finish{background:#172d46;color:#fff;border-color:#172d46}.onboardingMessage{background:#e6f5ed;border:1px solid #c7e9d8;border-radius:9px;padding:9px;color:#176b49;font-size:8px;font-weight:850}
        @media(max-width:720px){.onboardingSteps{grid-template-columns:1fr}.onboardingGuide{grid-template-columns:1fr}.onboardingFooter{align-items:stretch;flex-direction:column}.onboardingFooter div{width:100%}.onboardingFooter button{flex:1}.onboardingHero h2{font-size:19px}}
      `}</style>

      <section
        className="onboardingModal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="onboardingHero">
          <div>
            <small>POWERBUILD FIRST-TIME SETUP</small>
            <h2>Get your Hub ready</h2>
            <p>
              Four quick checks make sure your access, installed app and
              notifications are ready before the company rollout.
            </p>
          </div>
          <button
            aria-label="Close setup"
            onClick={() => {
              window.sessionStorage.setItem(
                "powerbuild-onboarding-dismissed",
                "1",
              );
              setOpen(false);
            }}
          >
            ×
          </button>
        </div>

        <div className="onboardingBody">
          {message && (
            <div className="onboardingMessage">{message}</div>
          )}

          <div className="onboardingProgress">
            <div className="onboardingProgressTop">
              <span>
                Setup progress · {completedSteps}/{steps.length}
              </span>
              <span>
                {Math.round(
                  (completedSteps / Math.max(1, steps.length)) * 100,
                )}
                %
              </span>
            </div>
            <div className="onboardingBar">
              <span
                style={{
                  width: `${Math.round(
                    (completedSteps / Math.max(1, steps.length)) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="onboardingSteps">
            <article className="onboardingCard">
              <div className="onboardingCardHead">
                <div>
                  <h3>1. Confirm your access</h3>
                  <p>
                    Check that the Hub has the correct role and workspace
                    assignment before you start using company information.
                  </p>
                </div>
                <span
                  className={
                    data.status.role_confirmed
                      ? "onboardingDone"
                      : "onboardingPending"
                  }
                >
                  {data.status.role_confirmed ? "✓" : "1"}
                </span>
              </div>

              <div className="onboardingInfo">
                <b>{data.member.name}</b><br />
                {data.member.role}<br />
                {data.member.workspaces.length
                  ? data.member.workspaces.join(", ")
                  : data.member.department || "Assigned workspace"}
              </div>

              {!data.status.role_confirmed && (
                <div className="onboardingActions">
                  <button
                    className="primary"
                    disabled={working !== ""}
                    onClick={() =>
                      void updateSelf({ roleConfirmed: true })
                    }
                  >
                    This access is correct
                  </button>
                </div>
              )}
            </article>

            <article className="onboardingCard">
              <div className="onboardingCardHead">
                <div>
                  <h3>2. Install PowerBuild Hub</h3>
                  <p>
                    Use the Hub as an app from your phone or computer instead of
                    opening a browser bookmark every time.
                  </p>
                </div>
                <span
                  className={
                    data.status.installed_app
                      ? "onboardingDone"
                      : "onboardingPending"
                  }
                >
                  {data.status.installed_app ? "✓" : "2"}
                </span>
              </div>

              {data.status.installed_app ? (
                <div className="onboardingInfo">
                  <b>Installed and detected.</b><br />
                  This user has opened the Hub from an installed app.
                </div>
              ) : (
                <>
                  <div className="onboardingInfo">
                    {installPrompt ? (
                      <>
                        <b>Install is available on this device.</b><br />
                        Use the button below, then open the new PowerBuild Hub
                        app icon once so the Hub can confirm installation.
                      </>
                    ) : isIos ? (
                      <>
                        <b>iPhone / iPad:</b><br />
                        Open the Hub in Safari → tap Share → Add to Home Screen →
                        Add. Then open PowerBuild Hub from the new icon.
                      </>
                    ) : (
                      <>
                        <b>Computer / Android:</b><br />
                        Use the browser&apos;s Install App / Add to Home Screen
                        option. Then open the installed PowerBuild Hub once.
                      </>
                    )}
                  </div>

                  <div className="onboardingActions">
                    {installPrompt && (
                      <button
                        className="primary"
                        onClick={async () => {
                          await installPrompt.prompt();
                          const choice =
                            await installPrompt.userChoice;
                          if (choice.outcome === "accepted") {
                            setMessage(
                              "Installation accepted. Open the new PowerBuild Hub app icon once to finish this step.",
                            );
                          }
                        }}
                      >
                        Install PowerBuild Hub
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (installedNow()) {
                          void updateSelf({ installedApp: true });
                        } else {
                          setMessage(
                            "The Hub is not running as an installed app on this device yet.",
                          );
                        }
                      }}
                    >
                      Check installation
                    </button>
                  </div>
                </>
              )}
            </article>

            <article className="onboardingCard">
              <div className="onboardingCardHead">
                <div>
                  <h3>3. Enable notifications</h3>
                  <p>
                    Receive task, special, approval and management alerts even
                    when the Hub is not open.
                  </p>
                </div>
                <span
                  className={
                    !data.status.notifications_required ||
                    data.status.notifications_enabled
                      ? "onboardingDone"
                      : "onboardingPending"
                  }
                >
                  {!data.status.notifications_required ||
                  data.status.notifications_enabled
                    ? "✓"
                    : "3"}
                </span>
              </div>

              {!data.status.notifications_required ? (
                <div className="onboardingInfo">
                  <b>Not required for this restricted role.</b><br />
                  HR remains Employee Records only and does not receive normal
                  task notifications.
                </div>
              ) : data.status.notifications_enabled ? (
                <div className="onboardingInfo">
                  <b>Notifications are active.</b><br />
                  {data.status.push_devices} registered device
                  {data.status.push_devices === 1 ? "" : "s"}.
                </div>
              ) : (
                <>
                  <div className="onboardingInfo">
                    <b>Notifications are not registered yet.</b><br />
                    On iPhone, open the Hub from its Home Screen icon before
                    enabling notifications.
                  </div>
                  <div className="onboardingActions">
                    <button
                      className="primary"
                      onClick={() => {
                        setWorking("notifications");
                        window.dispatchEvent(
                          new Event(
                            "powerbuild-enable-notifications",
                          ),
                        );
                        window.setTimeout(() => {
                          setWorking("");
                          void load(false);
                        }, 2200);
                      }}
                    >
                      {working === "notifications"
                        ? "Checking…"
                        : "Enable notifications"}
                    </button>
                  </div>
                </>
              )}
            </article>

            <article className="onboardingCard">
              <div className="onboardingCardHead">
                <div>
                  <h3>4. Quick guide</h3>
                  <p>
                    A short orientation so you know where the important daily
                    functions are.
                  </p>
                </div>
                <span
                  className={
                    data.status.training_complete
                      ? "onboardingDone"
                      : "onboardingPending"
                  }
                >
                  {data.status.training_complete ? "✓" : "4"}
                </span>
              </div>

              <div className="onboardingGuide">
                <div>
                  <b>My Work</b>
                  <small>Your assigned tasks, deadlines and updates.</small>
                </div>
                <div>
                  <b>Inbox</b>
                  <small>New tasks, reminders, specials and approvals.</small>
                </div>
                <div>
                  <b>Store Specials</b>
                  <small>Current promotions and next-promotion planning.</small>
                </div>
                <div>
                  <b>Quick</b>
                  <small>Fast access to common store and management actions.</small>
                </div>
              </div>

              {!data.status.training_complete && (
                <div className="onboardingActions">
                  <button
                    className="primary"
                    disabled={working !== ""}
                    onClick={() =>
                      void updateSelf({
                        trainingComplete: true,
                      })
                    }
                  >
                    I understand the basics
                  </button>
                </div>
              )}
            </article>
          </div>
        </div>

        <div className="onboardingFooter">
          <span>
            Signed in as {currentUser.email}
          </span>
          <div>
            <button
              onClick={() => {
                window.sessionStorage.setItem(
                  "powerbuild-onboarding-dismissed",
                  "1",
                );
                setOpen(false);
              }}
            >
              Finish later
            </button>
            <button
              className="finish"
              disabled={!data.status.completed}
              onClick={() => setOpen(false)}
            >
              {data.status.completed
                ? "Setup complete ✓"
                : `${completedSteps}/4 complete`}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
