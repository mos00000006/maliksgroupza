"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
};

type HealthItem = {
  ok: boolean;
  message?: string;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  active: number;
  access_scope: string;
  workspace_access_parsed: string[];
  invite_status: string;
  access_preview: {
    modules: string[];
    workspaces: string[];
  };
};

type SystemData = {
  release: string;
  server_time: string;
  current_user: CurrentHubUser;
  health: {
    database: HealthItem;
    storage: HealthItem;
    notifications: HealthItem & {
      subscriptions: number;
      users_with_push: number;
      coverage_percent: number;
      unread: number;
    };
    backup: HealthItem & {
      last_snapshot: Record<string, unknown> | null;
      retention: number;
    };
  };
  stats: {
    active_users: number;
    inactive_users: number;
    active_workspaces: number;
    open_tasks: number;
    complete_tasks: number;
    errors_24h: number;
    unresolved_errors: number;
    data_changes_24h: number;
  };
  users: UserRow[];
  admin_audit: Array<Record<string, unknown>>;
  data_changes: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
  backups: Array<Record<string, unknown>>;
};

const tabs = [
  "Overview",
  "User Access",
  "Audit Log",
  "Errors",
  "Backups",
  "Access Test",
] as const;

type Tab = (typeof tabs)[number];

function fmtDate(value: unknown) {
  const text = String(value || "");
  if (!text) return "—";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

function fmtBytes(value: unknown) {
  const bytes = Number(value || 0);
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusClass(ok: boolean) {
  return ok ? "good" : "bad";
}

export default function SystemControlCentre({
  currentUser,
}: {
  currentUser: CurrentHubUser;
}) {
  const [data, setData] = useState<SystemData | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");

  const flash = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system-control-centre", {
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        flash(result.error || "System Control Centre could not be loaded.");
        return;
      }

      setData(result);
      setSelectedEmail((current) => current || result.users?.[0]?.email || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedUser = useMemo(
    () => data?.users.find((user) => user.email === selectedEmail) || null,
    [data?.users, selectedEmail],
  );

  const action = async (
    payload: Record<string, unknown>,
    success: string,
  ) => {
    setWorking(String(payload.action || "working"));
    try {
      const response = await fetch("/api/system-control-centre", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        flash(result.error || "System action failed.");
        return false;
      }
      flash(success);
      await load();
      return true;
    } finally {
      setWorking("");
    }
  };

  const setUserActive = async (user: UserRow, active: boolean) => {
    const verb = active ? "re-enable" : "disable";
    if (
      !window.confirm(
        `Are you sure you want to ${verb} ${user.name} (${user.email})?`,
      )
    )
      return;

    setWorking(user.email);
    try {
      const response = await fetch("/api/system-control-centre", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "setUserActive",
          email: user.email,
          active,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        flash(result.error || `Could not ${verb} this user.`);
        return;
      }

      flash(
        active
          ? `${user.name} can access the Hub again.`
          : `${user.name} has been disabled and push subscriptions removed.`,
      );
      await load();
    } finally {
      setWorking("");
    }
  };

  if (loading && !data)
    return <div className="systemControlLoading">Loading System Control Centre…</div>;

  if (!data)
    return (
      <div className="systemControlLoading">
        System Control Centre is unavailable.
      </div>
    );

  const lastBackup = data.backups[0];

  return (
    <section className="systemControlCentre">
      <style>{`
        .systemControlCentre{display:grid;gap:14px;padding-bottom:50px}
        .systemControlLoading{background:#fff;border:1px solid #d9e3ec;border-radius:14px;padding:24px;color:#50657a}
        .sysToast{position:fixed;z-index:120;right:22px;top:92px;background:#fff;border:1px solid #d8e2eb;border-radius:11px;padding:11px 14px;box-shadow:0 20px 50px #17243829;color:#304a63;font-size:10px;font-weight:850}
        .sysHero{background:linear-gradient(125deg,#14263d,#244868);border-radius:17px;padding:20px 22px;color:#fff;display:grid;grid-template-columns:1fr auto;gap:15px;align-items:center}
        .sysHero small{display:block;color:#f6ca2d;font-size:8px;font-weight:950;letter-spacing:.14em}.sysHero h2{font-size:24px;margin:5px 0}.sysHero p{margin:0;color:#cbd8e4;font-size:9px;line-height:1.55;max-width:850px}.sysHeroActions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.sysHeroActions button{height:38px;border:1px solid #ffffff38;border-radius:9px;background:#fff;color:#203b55;padding:0 12px;font:inherit;font-size:8px;font-weight:900;cursor:pointer}.sysHeroActions .yellow{background:#f5ca2e;border-color:#ddba20;color:#172438}
        .sysRelease{margin-top:9px;display:flex;gap:6px;flex-wrap:wrap}.sysRelease span{background:#ffffff14;border:1px solid #ffffff24;border-radius:999px;padding:5px 8px;font-size:6.5px;color:#dce7f1;font-weight:800}
        .sysTabs{display:flex;gap:5px;flex-wrap:wrap;background:#fff;border:1px solid #dae4ed;border-radius:12px;padding:6px}.sysTabs button{border:0;background:transparent;border-radius:8px;padding:9px 11px;font:inherit;font-size:8px;font-weight:850;color:#63778b;cursor:pointer}.sysTabs button.active{background:#172d46;color:#fff}
        .sysCards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}.sysCard{background:#fff;border:1px solid #dbe4ec;border-radius:12px;padding:13px;min-height:102px}.sysCardTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.sysCard span{display:block;color:#7f8c99;font-size:7px;font-weight:900;text-transform:uppercase}.sysCard b{display:block;color:#223c55;font-size:21px;margin-top:5px}.sysCard small{display:block;color:#8996a4;font-size:7px;line-height:1.4;margin-top:4px}.sysDot{width:10px;height:10px;border-radius:50%;background:#9ba7b3;box-shadow:0 0 0 4px #eef2f5}.sysDot.good{background:#1ea672;box-shadow:0 0 0 4px #e1f4ec}.sysDot.bad{background:#dd5361;box-shadow:0 0 0 4px #f9e5e8}
        .sysPanel{background:#fff;border:1px solid #dbe4ec;border-radius:13px;padding:14px}.sysPanelHeader{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:11px}.sysPanelHeader h3{margin:0;color:#223c55;font-size:13px}.sysPanelHeader p{margin:3px 0 0;color:#82909e;font-size:7.5px}.sysPanelHeader button{border:1px solid #d6e0e9;background:#fff;border-radius:8px;padding:7px 9px;font:inherit;font-size:7px;font-weight:850;color:#38526a;cursor:pointer}.sysPanelHeader .danger{border-color:#f0c5ca;color:#a83d49}.sysPanelHeader .primary{background:#172d46;color:#fff;border-color:#172d46}
        .sysGrid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}.sysHealthList{display:grid;gap:8px}.sysHealthRow{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #e0e7ed;border-radius:9px;padding:10px}.sysHealthRow strong{font-size:8.5px;color:#314a62}.sysHealthRow small{display:block;font-size:7px;color:#83909d;margin-top:3px}.sysHealthValue{display:flex;align-items:center;gap:7px;font-size:7px;font-weight:850;color:#607388}
        .sysTableWrap{overflow:auto;border:1px solid #e0e7ed;border-radius:10px}.sysTable{width:100%;border-collapse:collapse;min-width:760px}.sysTable th,.sysTable td{text-align:left;padding:9px 10px;border-bottom:1px solid #e8edf2;font-size:7.5px;color:#4d6379;vertical-align:top}.sysTable th{background:#f7f9fb;color:#718091;text-transform:uppercase;font-size:6.5px;font-weight:900;letter-spacing:.03em;position:sticky;top:0}.sysTable tr:last-child td{border-bottom:0}.sysTable b{color:#263f57;font-size:8px}.sysTable small{display:block;color:#8a97a4;margin-top:2px}.sysTable button{border:1px solid #d6e0e9;background:#fff;border-radius:7px;padding:6px 8px;font:inherit;font-size:6.5px;font-weight:850;cursor:pointer;color:#36516b}.sysTable button.danger{border-color:#f0c2c8;color:#aa3e4a}.sysTable button.good{border-color:#bce5d2;color:#177050}
        .sysTag{display:inline-flex;border-radius:999px;padding:4px 7px;background:#edf2f6;color:#5e7285;font-size:6.5px;font-weight:850}.sysTag.good{background:#def4e8;color:#176b49}.sysTag.bad{background:#f8e3e5;color:#a13c48}.sysTag.warn{background:#fff0ca;color:#8a6200}
        .sysAuditList{display:grid;gap:7px}.sysAuditItem{border:1px solid #e0e7ed;border-radius:10px;padding:10px;background:#fbfcfd;display:grid;grid-template-columns:125px 1fr auto;gap:10px;align-items:start}.sysAuditItem time{font-size:6.5px;color:#8b97a4}.sysAuditItem b{font-size:8px;color:#2e475f}.sysAuditItem p{margin:3px 0 0;color:#62768a;font-size:7px;line-height:1.45}.sysAuditItem code{font-size:6.5px;color:#718397;background:#eef3f7;border-radius:6px;padding:4px 6px}
        .sysError{border-left:4px solid #d95362}.sysResolved{opacity:.58;border-left-color:#6eb894}.sysErrorMessage{white-space:pre-wrap;word-break:break-word}
        .backupCards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.backupCard{border:1px solid #dce5ed;border-radius:11px;padding:11px;background:#fbfcfd}.backupCard b{display:block;color:#2b455e;font-size:8.5px}.backupCard small{display:block;color:#83909d;font-size:6.5px;margin-top:3px;line-height:1.4}.backupCard button{margin-top:8px;border:1px solid #d3dee8;background:#fff;border-radius:7px;padding:6px 8px;font:inherit;font-size:6.5px;font-weight:850;color:#36516b;cursor:pointer}
        .accessTester{display:grid;grid-template-columns:300px 1fr;gap:12px}.accessTester select{width:100%;border:1px solid #d5dfe8;border-radius:9px;padding:9px;font:inherit;font-size:8px;color:#294159;background:#fff}.accessPreview{display:grid;gap:10px}.accessPreviewHeader{background:#f4f7fa;border:1px solid #dfe7ed;border-radius:10px;padding:11px}.accessPreviewHeader b{font-size:10px;color:#2a435c}.accessPreviewHeader small{display:block;color:#7e8d9c;font-size:7px;margin-top:3px}.chipList{display:flex;gap:5px;flex-wrap:wrap}.chipList span{background:#eef3f7;border-radius:999px;padding:5px 8px;color:#526a82;font-size:6.5px;font-weight:800}
        .sysEmpty{padding:24px;text-align:center;border:1px dashed #ccd7e1;border-radius:10px;color:#81909f;font-size:8px}.sysEmpty b{display:block;color:#465d74;margin-bottom:4px}
        @media(max-width:1180px){.sysCards{grid-template-columns:repeat(3,1fr)}.backupCards{grid-template-columns:1fr 1fr}}
        @media(max-width:900px){.sysHero{grid-template-columns:1fr}.sysHeroActions{justify-content:flex-start}.sysGrid2{grid-template-columns:1fr}.accessTester{grid-template-columns:1fr}.sysAuditItem{grid-template-columns:1fr}.sysCards{grid-template-columns:1fr 1fr}}
        @media(max-width:620px){.sysCards{grid-template-columns:1fr 1fr}.backupCards{grid-template-columns:1fr}.sysHeroActions button{flex:1 1 auto}.sysTabs{overflow-x:auto;flex-wrap:nowrap}.sysTabs button{white-space:nowrap}}
      `}</style>

      {message && <div className="sysToast">{message}</div>}

      <div className="sysHero">
        <div>
          <small>POWERBUILD OWNER CONTROL</small>
          <h2>System Control Centre</h2>
          <p>
            Launch-readiness, access control, audit activity, errors, notification
            coverage and database snapshots in one protected admin area.
          </p>
          <div className="sysRelease">
            <span>{data.release}</span>
            <span>Server {fmtDate(data.server_time)}</span>
            <span>Signed in: {currentUser.email}</span>
          </div>
        </div>

        <div className="sysHeroActions">
          <button onClick={() => void load()}>↻ Refresh</button>
          <button
            onClick={() =>
              void action(
                { action: "testPush" },
                "Test notification sent. Check this device and your Hub Inbox.",
              )
            }
            disabled={working === "testPush"}
          >
            🔔 Test notification
          </button>
          <button
            className="yellow"
            onClick={() =>
              void action(
                { action: "createSnapshot" },
                "Database snapshot created and stored securely in R2.",
              )
            }
            disabled={working === "createSnapshot"}
          >
            {working === "createSnapshot" ? "Creating…" : "⬇ Create snapshot"}
          </button>
        </div>
      </div>

      <div className="sysTabs">
        {tabs.map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <div className="sysCards">
            <article className="sysCard">
              <div className="sysCardTop">
                <div><span>Database</span><b>{data.health.database.ok ? "Online" : "Issue"}</b></div>
                <i className={`sysDot ${statusClass(data.health.database.ok)}`} />
              </div>
              <small>{data.health.database.message}</small>
            </article>

            <article className="sysCard">
              <div className="sysCardTop">
                <div><span>File storage</span><b>{data.health.storage.ok ? "Online" : "Issue"}</b></div>
                <i className={`sysDot ${statusClass(data.health.storage.ok)}`} />
              </div>
              <small>{data.health.storage.message}</small>
            </article>

            <article className="sysCard">
              <div className="sysCardTop">
                <div><span>Push coverage</span><b>{data.health.notifications.coverage_percent}%</b></div>
                <i className={`sysDot ${statusClass(data.health.notifications.ok)}`} />
              </div>
              <small>{data.health.notifications.users_with_push} users · {data.health.notifications.subscriptions} devices</small>
            </article>

            <article className="sysCard">
              <div className="sysCardTop">
                <div><span>Active users</span><b>{data.stats.active_users}</b></div>
                <i className="sysDot good" />
              </div>
              <small>{data.stats.inactive_users} disabled accounts</small>
            </article>

            <article className="sysCard">
              <div className="sysCardTop">
                <div><span>Unresolved errors</span><b>{data.stats.unresolved_errors}</b></div>
                <i className={`sysDot ${data.stats.unresolved_errors ? "bad" : "good"}`} />
              </div>
              <small>{data.stats.errors_24h} recorded in the last 24 hours</small>
            </article>

            <article className="sysCard">
              <div className="sysCardTop">
                <div><span>Backup</span><b>{lastBackup ? "Protected" : "Missing"}</b></div>
                <i className={`sysDot ${lastBackup ? "good" : "bad"}`} />
              </div>
              <small>{lastBackup ? `Last: ${fmtDate(lastBackup.created_at)}` : "Create the first database snapshot"}</small>
            </article>
          </div>

          <div className="sysGrid2">
            <section className="sysPanel">
              <div className="sysPanelHeader">
                <div>
                  <h3>Launch health</h3>
                  <p>Core services that should be green before group-wide rollout.</p>
                </div>
              </div>

              <div className="sysHealthList">
                <div className="sysHealthRow">
                  <div>
                    <strong>D1 database</strong>
                    <small>Tasks, employees, financials and Hub records.</small>
                  </div>
                  <div className="sysHealthValue">
                    <i className={`sysDot ${statusClass(data.health.database.ok)}`} />
                    {data.health.database.ok ? "Ready" : "Needs attention"}
                  </div>
                </div>

                <div className="sysHealthRow">
                  <div>
                    <strong>R2 file storage</strong>
                    <small>Attachments, catalogue images and system snapshots.</small>
                  </div>
                  <div className="sysHealthValue">
                    <i className={`sysDot ${statusClass(data.health.storage.ok)}`} />
                    {data.health.storage.ok ? "Ready" : "Needs attention"}
                  </div>
                </div>

                <div className="sysHealthRow">
                  <div>
                    <strong>Push notifications</strong>
                    <small>{data.health.notifications.users_with_push} active user emails have at least one registered device.</small>
                  </div>
                  <div className="sysHealthValue">
                    <i className={`sysDot ${statusClass(data.health.notifications.ok)}`} />
                    {data.health.notifications.coverage_percent}% coverage
                  </div>
                </div>

                <div className="sysHealthRow">
                  <div>
                    <strong>Database snapshot</strong>
                    <small>In-Hub business-data snapshot stored in R2. Auth/push secrets are excluded.</small>
                  </div>
                  <div className="sysHealthValue">
                    <i className={`sysDot ${lastBackup ? "good" : "bad"}`} />
                    {lastBackup ? fmtDate(lastBackup.created_at) : "Not created"}
                  </div>
                </div>
              </div>
            </section>

            <section className="sysPanel">
              <div className="sysPanelHeader">
                <div>
                  <h3>Operational footprint</h3>
                  <p>Current scale being managed by the Hub.</p>
                </div>
              </div>

              <div className="sysHealthList">
                <div className="sysHealthRow">
                  <div><strong>Active workspaces</strong><small>Stores/divisions currently enabled.</small></div>
                  <div className="sysHealthValue">{data.stats.active_workspaces}</div>
                </div>
                <div className="sysHealthRow">
                  <div><strong>Open tasks</strong><small>Not yet complete.</small></div>
                  <div className="sysHealthValue">{data.stats.open_tasks}</div>
                </div>
                <div className="sysHealthRow">
                  <div><strong>Completed tasks</strong><small>Historical complete task records.</small></div>
                  <div className="sysHealthValue">{data.stats.complete_tasks}</div>
                </div>
                <div className="sysHealthRow">
                  <div><strong>Data changes (24h)</strong><small>Critical-table insert/update/delete events recorded by D1 audit triggers.</small></div>
                  <div className="sysHealthValue">{data.stats.data_changes_24h}</div>
                </div>
                <div className="sysHealthRow">
                  <div><strong>Unread Hub notifications</strong><small>Across all users.</small></div>
                  <div className="sysHealthValue">{data.health.notifications.unread}</div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {tab === "User Access" && (
        <section className="sysPanel">
          <div className="sysPanelHeader">
            <div>
              <h3>User access & emergency revoke</h3>
              <p>
                Disable lost-device/resigned-user access immediately. Disabling also
                removes that user's push subscriptions.
              </p>
            </div>
          </div>

          <div className="sysTableWrap">
            <table className="sysTable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Scope</th>
                  <th>Workspace</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.access_scope}</td>
                    <td>
                      {user.access_preview.workspaces.slice(0, 3).join(", ")}
                      {user.access_preview.workspaces.length > 3 ? "…" : ""}
                    </td>
                    <td>
                      <span className={`sysTag ${user.active ? "good" : "bad"}`}>
                        {user.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      {user.active ? (
                        <button
                          className="danger"
                          disabled={working === user.email}
                          onClick={() => void setUserActive(user, false)}
                        >
                          Disable access
                        </button>
                      ) : (
                        <button
                          className="good"
                          disabled={working === user.email}
                          onClick={() => void setUserActive(user, true)}
                        >
                          Re-enable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Audit Log" && (
        <div className="sysGrid2">
          <section className="sysPanel">
            <div className="sysPanelHeader">
              <div>
                <h3>Admin audit</h3>
                <p>Exact user identity for sensitive System Control Centre actions.</p>
              </div>
            </div>

            <div className="sysAuditList">
              {data.admin_audit.map((item) => (
                <div className="sysAuditItem" key={String(item.id)}>
                  <time>{fmtDate(item.created_at)}</time>
                  <div>
                    <b>{String(item.action || "")}</b>
                    <p>
                      {String(item.actor_name || item.actor_email || "")}
                      {item.target_id ? ` · ${String(item.target_id)}` : ""}
                    </p>
                  </div>
                  <code>{String(item.target_type || "system")}</code>
                </div>
              ))}
              {!data.admin_audit.length && <div className="sysEmpty"><b>No admin actions yet</b>System-control actions will appear here.</div>}
            </div>
          </section>

          <section className="sysPanel">
            <div className="sysPanelHeader">
              <div>
                <h3>Critical data changes</h3>
                <p>Automatic D1 trigger log for core business tables.</p>
              </div>
            </div>

            <div className="sysAuditList">
              {data.data_changes.map((item) => (
                <div className="sysAuditItem" key={String(item.id)}>
                  <time>{fmtDate(item.changed_at)}</time>
                  <div>
                    <b>
                      {String(item.change_type || "")} · {String(item.table_name || "")}
                    </b>
                    <p>
                      Record {String(item.row_id || "—")}
                      {item.item_hint ? ` · ${String(item.item_hint)}` : ""}
                    </p>
                    {item.actor_hint && (
                      <p>Recorded user field: {String(item.actor_hint)}</p>
                    )}
                  </div>
                  <code>{String(item.table_name || "")}</code>
                </div>
              ))}
              {!data.data_changes.length && <div className="sysEmpty"><b>No tracked changes yet</b>Critical-table changes will appear after this Control Centre is deployed.</div>}
            </div>
          </section>
        </div>
      )}

      {tab === "Errors" && (
        <section className="sysPanel">
          <div className="sysPanelHeader">
            <div>
              <h3>Client error log</h3>
              <p>
                Browser runtime errors reported by Hub devices. Useful when a store says
                “the button did nothing” or a screen failed.
              </p>
            </div>

            {data.stats.unresolved_errors > 0 && (
              <button
                className="danger"
                disabled={working === "resolveErrors"}
                onClick={() =>
                  void action(
                    { action: "resolveErrors" },
                    "All current system errors marked resolved.",
                  )
                }
              >
                Mark all resolved
              </button>
            )}
          </div>

          <div className="sysAuditList">
            {data.errors.map((item) => (
              <div
                className={`sysAuditItem sysError ${item.resolved_at ? "sysResolved" : ""}`}
                key={String(item.id)}
              >
                <time>{fmtDate(item.created_at)}</time>
                <div>
                  <b>
                    {String(item.error_kind || "Error")} ·{" "}
                    {String(item.user_email || "Unknown user")}
                  </b>
                  <p className="sysErrorMessage">{String(item.message || "")}</p>
                  {item.source && <p>{String(item.source)}</p>}
                </div>
                <span className={`sysTag ${item.resolved_at ? "good" : "bad"}`}>
                  {item.resolved_at ? "Resolved" : "Open"}
                </span>
              </div>
            ))}

            {!data.errors.length && (
              <div className="sysEmpty">
                <b>No client errors recorded</b>
                This is a good sign. Browser runtime errors from Hub users will appear here.
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "Backups" && (
        <section className="sysPanel">
          <div className="sysPanelHeader">
            <div>
              <h3>Database snapshots</h3>
              <p>
                Business-data JSON snapshots stored in the Hub's R2 bucket. Push/VAPID
                secrets and notification noise are excluded.
              </p>
            </div>

            <button
              className="primary"
              disabled={working === "createSnapshot"}
              onClick={() =>
                void action(
                  { action: "createSnapshot" },
                  "Database snapshot created.",
                )
              }
            >
              {working === "createSnapshot" ? "Creating…" : "＋ Create snapshot"}
            </button>
          </div>

          <div className="backupCards">
            {data.backups.map((backup) => (
              <article className="backupCard" key={String(backup.id)}>
                <b>{fmtDate(backup.created_at)}</b>
                <small>{Number(backup.table_count || 0)} tables · {Number(backup.row_count || 0)} rows</small>
                <small>{fmtBytes(backup.size_bytes)} · created by {String(backup.created_by || "")}</small>
                <button
                  onClick={() =>
                    window.open(
                      `/api/system-control-centre?downloadBackup=${encodeURIComponent(String(backup.id))}`,
                      "_blank",
                    )
                  }
                >
                  Download snapshot
                </button>
              </article>
            ))}

            {!data.backups.length && (
              <div className="sysEmpty" style={{gridColumn:"1/-1"}}>
                <b>No System Control Centre snapshot yet</b>
                Create the first snapshot before broad rollout.
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "Access Test" && (
        <section className="sysPanel">
          <div className="sysPanelHeader">
            <div>
              <h3>Access test mode</h3>
              <p>
                Preview what a user should be able to see before handing them the Hub.
              </p>
            </div>
          </div>

          <div className="accessTester">
            <div>
              <select
                value={selectedEmail}
                onChange={(event) => setSelectedEmail(event.target.value)}
              >
                {data.users.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.name} · {user.role}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser ? (
              <div className="accessPreview">
                <div className="accessPreviewHeader">
                  <b>{selectedUser.name}</b>
                  <small>
                    {selectedUser.email} · {selectedUser.role} ·{" "}
                    {selectedUser.access_scope}
                  </small>
                </div>

                <div>
                  <b style={{fontSize:"8px",color:"#405970"}}>Visible modules</b>
                  <div className="chipList" style={{marginTop:"7px"}}>
                    {selectedUser.access_preview.modules.map((module) => (
                      <span key={module}>{module}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <b style={{fontSize:"8px",color:"#405970"}}>Workspace access</b>
                  <div className="chipList" style={{marginTop:"7px"}}>
                    {selectedUser.access_preview.workspaces.map((workspace) => (
                      <span key={workspace}>{workspace}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className={`sysTag ${selectedUser.active ? "good" : "bad"}`}>
                    {selectedUser.active ? "Account active" : "Account disabled"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="sysEmpty">Select a Hub user.</div>
            )}
          </div>
        </section>
      )}
    </section>
  );
}
