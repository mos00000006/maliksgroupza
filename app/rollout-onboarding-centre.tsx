"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
};

type RolloutUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  access_scope: string;
  workspaces: string[];
  invite_status: string;
  installed_app: boolean;
  push_devices: number;
  notifications_required: boolean;
  notifications_ready: boolean;
  role_confirmed: boolean;
  training_complete: boolean;
  ready: boolean;
  rollout_status: "Ready" | "In Progress" | "Not Started";
  completed_at: string;
  started_at: string;
  last_seen_at: string;
  last_reminded_at: string;
  device_label: string;
};

type RolloutData = {
  server_time: string;
  stats: {
    total: number;
    ready: number;
    outstanding: number;
    installed: number;
    notifications: number;
    training: number;
    confirmed: number;
    in_progress: number;
    not_started: number;
    completion_percent: number;
  };
  by_role: Array<{
    role: string;
    total: number;
    ready: number;
  }>;
  users: RolloutUser[];
};

function fmt(value: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function pct(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export default function RolloutOnboardingCentre({
  currentUser,
}: {
  currentUser: CurrentHubUser;
}) {
  const [data, setData] = useState<RolloutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  const flash = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/rollout-onboarding?scope=admin",
        { cache: "no-store" },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        flash(
          result.error ||
            "Rollout & Onboarding Centre could not be loaded.",
        );
        return;
      }

      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const users = useMemo(() => {
    if (!data) return [];
    if (filter === "Outstanding")
      return data.users.filter((user) => !user.ready);
    if (filter === "Ready")
      return data.users.filter((user) => user.ready);
    if (filter === "Not Started")
      return data.users.filter(
        (user) => user.rollout_status === "Not Started",
      );
    return data.users;
  }, [data, filter]);

  const remind = async (
    payload: Record<string, unknown>,
    key: string,
  ) => {
    setWorking(key);

    try {
      const response = await fetch("/api/rollout-onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        flash(result.error || "Reminder could not be sent.");
        return;
      }

      flash(
        payload.action === "remindOutstanding"
          ? `${Number(result.reminded || 0)} outstanding user${Number(result.reminded || 0) === 1 ? "" : "s"} reminded.`
          : "Onboarding reminder sent.",
      );

      await load();
    } finally {
      setWorking("");
    }
  };

  if (loading && !data)
    return (
      <div className="rolloutLoading">
        Loading Rollout & Onboarding Centre…
      </div>
    );

  if (!data)
    return (
      <div className="rolloutLoading">
        Rollout & Onboarding Centre is unavailable.
      </div>
    );

  const allReady = data.stats.outstanding === 0 && data.stats.total > 0;

  return (
    <section className="rolloutCentre">
      <style>{`
        .rolloutCentre{display:grid;gap:14px;padding-bottom:45px;min-width:0;max-width:100%;overflow-x:hidden}.rolloutLoading{background:#fff;border:1px solid #dce5ed;border-radius:13px;padding:24px;color:#64778a}.rolloutToast{position:fixed;top:92px;right:22px;z-index:120;background:#fff;border:1px solid #d7e1e9;border-radius:10px;padding:10px 13px;box-shadow:0 18px 45px #1724382b;color:#365069;font-size:8.5px;font-weight:850}.rolloutHero{background:linear-gradient(125deg,#14263d,#254a69);border-radius:17px;padding:20px 22px;color:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:15px;align-items:center;min-width:0;max-width:100%;overflow:hidden}.rolloutHero small{display:block;color:#f5ca2e;font-size:8px;font-weight:950;letter-spacing:.13em}.rolloutHero h2{font-size:24px;margin:5px 0}.rolloutHero p{margin:0;color:#cedae5;font-size:9px;line-height:1.55;max-width:780px}.rolloutHeroActions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;min-width:0}.rolloutHeroActions button{height:39px;border:1px solid #ffffff35;border-radius:9px;background:#fff;color:#27435c;padding:0 12px;font:inherit;font-size:8px;font-weight:900;cursor:pointer}.rolloutHeroActions .yellow{background:#f5ca2e;border-color:#ddb91e;color:#172438}.rolloutStatus{margin-top:9px;display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:6px 9px;background:#ffffff14;border:1px solid #ffffff24;font-size:7px;font-weight:850}.rolloutStatus i{width:9px;height:9px;border-radius:50%;background:#f2b93b}.rolloutStatus.ready i{background:#28ad78}.rolloutCards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;min-width:0}.rolloutCard{background:#fff;border:1px solid #dce5ed;border-radius:12px;padding:13px;min-width:0;overflow:hidden}.rolloutCard span{display:block;color:#7c8997;font-size:7px;text-transform:uppercase;font-weight:900}.rolloutCard b{display:block;font-size:21px;color:#243e56;margin-top:5px}.rolloutCard small{display:block;color:#8996a3;font-size:7px;margin-top:3px}.rolloutGrid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:11px;min-width:0}.rolloutPanel{background:#fff;border:1px solid #dce5ed;border-radius:13px;padding:14px;min-width:0;max-width:100%;overflow:hidden}.rolloutPanelHeader{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:11px}.rolloutPanelHeader h3{margin:0;color:#263f57;font-size:13px}.rolloutPanelHeader p{margin:3px 0 0;color:#81909f;font-size:7.5px}.rolloutPanelHeader button{border:1px solid #d4dee7;background:#fff;border-radius:8px;padding:7px 9px;font:inherit;font-size:7px;font-weight:850;color:#36516b;cursor:pointer}.rolloutProgressList{display:grid;gap:9px}.rolloutProgressRow{border:1px solid #e1e7ed;border-radius:9px;padding:10px}.rolloutProgressTop{display:flex;justify-content:space-between;gap:10px;font-size:7.5px;font-weight:850;color:#405970}.rolloutBar{height:8px;background:#edf2f6;border-radius:999px;margin-top:7px;overflow:hidden}.rolloutBar span{display:block;height:100%;background:#f4c82b;border-radius:999px}.roleGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;min-width:0}.roleCard{border:1px solid #e0e7ed;border-radius:9px;padding:9px;background:#fbfcfd;min-width:0;overflow:hidden}.roleCard b{display:block;color:#304a62;font-size:8px}.roleCard small{display:block;color:#84919e;font-size:6.5px;margin-top:3px}.roleBar{height:6px;background:#ebf0f4;border-radius:99px;margin-top:6px;overflow:hidden}.roleBar span{display:block;height:100%;background:#2b587d;border-radius:99px}.rolloutToolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.rolloutFilters{display:flex;gap:5px;flex-wrap:wrap}.rolloutFilters button{border:1px solid #d6e0e8;background:#fff;border-radius:999px;padding:6px 9px;font:inherit;font-size:6.5px;font-weight:850;color:#587086;cursor:pointer}.rolloutFilters button.active{background:#172d46;color:#fff;border-color:#172d46}.rolloutTableWrap{overflow:hidden;border:1px solid #e0e7ed;border-radius:10px;margin-top:10px;max-width:100%;min-width:0}.rolloutTable{width:100%;border-collapse:collapse;table-layout:fixed;min-width:0}.rolloutTable th,.rolloutTable td{text-align:left;padding:8px 7px;border-bottom:1px solid #e8edf1;font-size:6.7px;color:#52687d;vertical-align:middle;min-width:0;overflow-wrap:anywhere;word-break:break-word}.rolloutTable th{background:#f7f9fb;color:#738292;text-transform:uppercase;font-size:6.2px;font-weight:900;position:sticky;top:0}.rolloutTable tr:last-child td{border-bottom:0}.rolloutTable b{display:block;color:#2e485f;font-size:8px}.rolloutTable small{display:block;color:#8a97a4;font-size:6.3px;margin-top:2px}.rolloutTable button{border:1px solid #d4dee7;background:#fff;border-radius:7px;padding:6px 8px;font:inherit;font-size:6.5px;font-weight:850;color:#36516b;cursor:pointer}.rolloutTag{display:inline-flex;border-radius:999px;padding:4px 7px;background:#edf2f6;color:#5e7285;font-size:6.3px;font-weight:850}.rolloutTag.good{background:#def4e8;color:#176b49}.rolloutTag.warn{background:#fff0ca;color:#8a6200}.rolloutTag.bad{background:#f8e3e5;color:#a13c48}.rolloutCheck{font-size:11px;font-weight:950}.rolloutCheck.yes{color:#17906a}.rolloutCheck.no{color:#c44b58}
        @media(max-width:1380px){.rolloutCards{grid-template-columns:repeat(3,minmax(0,1fr))}.rolloutGrid{grid-template-columns:1fr}.rolloutHero{grid-template-columns:minmax(0,1fr) auto}.roleGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:980px){.rolloutCards{grid-template-columns:repeat(2,minmax(0,1fr))}.rolloutHero{grid-template-columns:1fr}.rolloutHeroActions{justify-content:flex-start}.rolloutTableWrap{overflow-x:auto}.rolloutTable{min-width:900px}}
        @media(max-width:720px){.rolloutCards{grid-template-columns:1fr 1fr}.roleGrid{grid-template-columns:1fr}.rolloutHeroActions{justify-content:flex-start}}
        @media(max-width:520px){.rolloutCards{grid-template-columns:1fr}.rolloutHeroActions button{flex:1 1 auto}}
      `}</style>

      {message && <div className="rolloutToast">{message}</div>}

      <div className="rolloutHero">
        <div>
          <small>POWERBUILD GROUP ROLLOUT</small>
          <h2>Rollout & Onboarding Centre</h2>
          <p>
            Track who has installed the Hub, enabled notifications, confirmed
            their access and completed the quick guide before company-wide
            rollout.
          </p>

          <span
            className={`rolloutStatus ${allReady ? "ready" : ""}`}
          >
            <i />
            {allReady
              ? "All active Hub users are rollout-ready"
              : `${data.stats.outstanding} user${data.stats.outstanding === 1 ? "" : "s"} still need setup`}
          </span>
        </div>

        <div className="rolloutHeroActions">
          <button onClick={() => void load()}>↻ Refresh</button>
          <button
            className="yellow"
            disabled={
              working === "all" ||
              data.stats.outstanding === 0
            }
            onClick={() =>
              void remind(
                { action: "remindOutstanding" },
                "all",
              )
            }
          >
            {working === "all"
              ? "Sending…"
              : "🔔 Remind outstanding"}
          </button>
        </div>
      </div>

      <div className="rolloutCards">
        <article className="rolloutCard">
          <span>Rollout ready</span>
          <b>{data.stats.ready}/{data.stats.total}</b>
          <small>{data.stats.completion_percent}% complete</small>
        </article>
        <article className="rolloutCard">
          <span>Hub installed</span>
          <b>{data.stats.installed}</b>
          <small>{pct(data.stats.installed, data.stats.total)}% installed</small>
        </article>
        <article className="rolloutCard">
          <span>Notifications ready</span>
          <b>{data.stats.notifications}</b>
          <small>{pct(data.stats.notifications, data.stats.total)}% ready</small>
        </article>
        <article className="rolloutCard">
          <span>Training complete</span>
          <b>{data.stats.training}</b>
          <small>{pct(data.stats.training, data.stats.total)}% complete</small>
        </article>
        <article className="rolloutCard">
          <span>Access confirmed</span>
          <b>{data.stats.confirmed}</b>
          <small>{pct(data.stats.confirmed, data.stats.total)}% confirmed</small>
        </article>
        <article className="rolloutCard">
          <span>Not started</span>
          <b>{data.stats.not_started}</b>
          <small>{data.stats.in_progress} currently in progress</small>
        </article>
      </div>

      <div className="rolloutGrid">
        <section className="rolloutPanel">
          <div className="rolloutPanelHeader">
            <div>
              <h3>Rollout readiness</h3>
              <p>Each bar should be complete before a full-company release.</p>
            </div>
          </div>

          <div className="rolloutProgressList">
            {[
              ["App installation", data.stats.installed],
              ["Notification setup", data.stats.notifications],
              ["Role / access confirmation", data.stats.confirmed],
              ["Quick guide completion", data.stats.training],
              ["Fully rollout-ready", data.stats.ready],
            ].map(([label, value]) => (
              <div className="rolloutProgressRow" key={String(label)}>
                <div className="rolloutProgressTop">
                  <span>{String(label)}</span>
                  <span>
                    {Number(value)}/{data.stats.total} ·{" "}
                    {pct(Number(value), data.stats.total)}%
                  </span>
                </div>
                <div className="rolloutBar">
                  <span
                    style={{
                      width: `${pct(
                        Number(value),
                        data.stats.total,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rolloutPanel">
          <div className="rolloutPanelHeader">
            <div>
              <h3>Readiness by role</h3>
              <p>See which management/user group still needs attention.</p>
            </div>
          </div>

          <div className="roleGrid">
            {data.by_role.map((role) => (
              <article className="roleCard" key={role.role}>
                <b>{role.role}</b>
                <small>
                  {role.ready}/{role.total} ready ·{" "}
                  {pct(role.ready, role.total)}%
                </small>
                <div className="roleBar">
                  <span
                    style={{
                      width: `${pct(role.ready, role.total)}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="rolloutPanel">
        <div className="rolloutToolbar">
          <div>
            <h3 style={{margin:0,color:"#263f57",fontSize:"13px"}}>
              User rollout tracker
            </h3>
            <p style={{margin:"3px 0 0",color:"#81909f",fontSize:"7.5px"}}>
              Last checked {fmt(data.server_time)}
            </p>
          </div>

          <div className="rolloutFilters">
            {["All", "Outstanding", "Ready", "Not Started"].map(
              (item) => (
                <button
                  key={item}
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="rolloutTableWrap">
          <table className="rolloutTable">
            <thead>
              <tr>
                <th style={{width:"17%"}}>User</th>
                <th style={{width:"17%"}}>Role / workspace</th>
                <th style={{width:"10%"}}>Overall</th>
                <th style={{width:"7%"}}>Installed</th>
                <th style={{width:"11%"}}>Notifications</th>
                <th style={{width:"7%"}}>Access</th>
                <th style={{width:"7%"}}>Guide</th>
                <th style={{width:"12%"}}>Last seen</th>
                <th style={{width:"12%"}}>Reminder</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>
                    <b>{user.name}</b>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    {user.role}
                    <small>
                      {user.workspaces.length
                        ? user.workspaces.slice(0, 2).join(", ")
                        : user.department || user.access_scope}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`rolloutTag ${
                        user.ready
                          ? "good"
                          : user.rollout_status === "In Progress"
                            ? "warn"
                            : "bad"
                      }`}
                    >
                      {user.rollout_status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`rolloutCheck ${user.installed_app ? "yes" : "no"}`}
                    >
                      {user.installed_app ? "✓" : "×"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`rolloutCheck ${user.notifications_ready ? "yes" : "no"}`}
                    >
                      {user.notifications_ready ? "✓" : "×"}
                    </span>
                    <small>
                      {!user.notifications_required
                        ? "Not required"
                        : `${user.push_devices} device${user.push_devices === 1 ? "" : "s"}`}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`rolloutCheck ${user.role_confirmed ? "yes" : "no"}`}
                    >
                      {user.role_confirmed ? "✓" : "×"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`rolloutCheck ${user.training_complete ? "yes" : "no"}`}
                    >
                      {user.training_complete ? "✓" : "×"}
                    </span>
                  </td>
                  <td>
                    {fmt(user.last_seen_at)}
                  </td>
                  <td>
                    {user.ready ? (
                      <span className="rolloutTag good">
                        Complete
                      </span>
                    ) : (
                      <button
                        disabled={working === user.email}
                        onClick={() =>
                          void remind(
                            {
                              action: "remindUser",
                              email: user.email,
                            },
                            user.email,
                          )
                        }
                      >
                        {working === user.email
                          ? "Sending…"
                          : "Send reminder"}
                      </button>
                    )}
                    {user.last_reminded_at && (
                      <small>
                        Last {fmt(user.last_reminded_at)}
                      </small>
                    )}
                  </td>
                </tr>
              ))}

              {!users.length && (
                <tr>
                  <td colSpan={9}>
                    No users match this rollout filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rolloutPanel">
        <div className="rolloutPanelHeader">
          <div>
            <h3>Owner rollout checklist</h3>
            <p>
              Final checks before handing the Hub to every store and manager.
            </p>
          </div>
        </div>

        <div className="rolloutProgressList">
          <div className="rolloutProgressRow">
            <div className="rolloutProgressTop">
              <span>System Control Centre healthy</span>
              <span>Verify Database, R2, backup and errors separately</span>
            </div>
          </div>
          <div className="rolloutProgressRow">
            <div className="rolloutProgressTop">
              <span>Every active user onboarded</span>
              <span>
                {data.stats.ready}/{data.stats.total}
              </span>
            </div>
          </div>
          <div className="rolloutProgressRow">
            <div className="rolloutProgressTop">
              <span>Pilot stores tested</span>
              <span>Head Office + 2–3 stores recommended</span>
            </div>
          </div>
          <div className="rolloutProgressRow">
            <div className="rolloutProgressTop">
              <span>Emergency access tested</span>
              <span>Disable/re-enable one non-protected test user</span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
