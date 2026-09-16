"use client";
import { useState } from "react";
import WholesaleCrm from "./wholesale-crm";
import FinancialModule from "./financial-module";
import DevelopmentModule from "./development-module";
import ExecutiveOverview from "./executive-overview";

type Status = "Not started" | "In progress" | "Blocked" | "Complete";
export type HubTask = {
  id: number;
  title: string;
  project: string;
  owner: string;
  assignee: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: Status;
  description: string;
  task_type: string;
  task_group: string;
  created_by: string;
  created_at: string;
};
type Workspace = {
  id: number;
  name: string;
  type: string;
  region: string;
  manager: string;
};
type Metric = "all" | "open" | "complete" | "attention";
type Props = {
  active: string;
  tasks: HubTask[];
  shown: HubTask[];
  loading: boolean;
  mode: "table" | "board";
  setMode: (mode: "table" | "board") => void;
  openTask: (task: HubTask) => void;
  setStatus: (id: number, status: Status) => void;
  openWorkspaces: (name?: string) => void;
  createStore: () => void;
  addTask: () => void;
  workspaces: Workspace[];
  navigateTo: (view: string) => void;
};
const strategic = [
  {
    name: "Sungate PowerBuild",
    kind: "New Store",
    health: "On track",
    colour: "c0",
  },
  {
    name: "Midway PowerBuild",
    kind: "New Store",
    health: "At risk",
    colour: "c1",
  },
  {
    name: "Buster Build Controls",
    kind: "Operations",
    health: "On track",
    colour: "c2",
  },
  {
    name: "Wholesale Launch",
    kind: "Wholesale",
    health: "Attention",
    colour: "c3",
  },
];

function Kpis({
  tasks,
  labels,
  onSelect,
  activeMetric,
}: {
  tasks: HubTask[];
  labels?: [string, string, string, string];
  onSelect?: (metric: Metric) => void;
  activeMetric?: Metric;
}) {
  const complete = tasks.filter((x) => x.status === "Complete").length,
    blocked = tasks.filter((x) => x.status === "Blocked").length,
    high = tasks.filter(
      (x) => x.priority === "High" && x.status !== "Complete",
    ).length,
    attention = tasks.filter(
      (x) =>
        x.status === "Blocked" ||
        (x.priority === "High" && x.status !== "Complete"),
    ).length;
  const names = labels || [
    "Open action items",
    "Completed",
    "Needs attention",
    "Completion rate",
  ];
  const card = (
    metric: Metric,
    icon: string,
    colour: string,
    label: string,
    value: string | number,
    note: string,
  ) => (
    <button
      className={`kpiCard ${activeMetric === metric ? "selected" : ""}`}
      onClick={() => onSelect?.(metric)}
    >
      <i className={colour}>{icon}</i>
      <span>
        <small>{label}</small>
        <b>{value}</b>
        <em>{note}</em>
      </span>
      {onSelect && <strong>View items →</strong>}
    </button>
  );
  return (
    <div className="kpis">
      {card(
        "open",
        "✓",
        "blue",
        names[0],
        tasks.length - complete,
        "Active items",
      )}
      {card("complete", "◎", "green", names[1], complete, "Closed items")}
      {card(
        "attention",
        "!",
        "orange",
        names[2],
        attention,
        `${blocked} blocked · ${high} high priority`,
      )}
      {card(
        "all",
        "%",
        "purple",
        names[3],
        `${tasks.length ? Math.round((complete / tasks.length) * 100) : 0}%`,
        "Click to show all items",
      )}
    </div>
  );
}

function ExecutiveCharts({
  tasks,
  openRows,
}: {
  tasks: HubTask[];
  openRows: (title: string, tasks: HubTask[]) => void;
}) {
  const status = (
    ["Not started", "In progress", "Blocked", "Complete"] as Status[]
  ).map((name) => ({
    name,
    count: tasks.filter((t) => t.status === name).length,
  }));
  const priority = (["High", "Medium", "Low"] as const).map((name) => ({
    name,
    count: tasks.filter((t) => t.priority === name).length,
  }));
  const max = Math.max(
    1,
    ...status.map((x) => x.count),
    ...priority.map((x) => x.count),
  );
  return (
    <section className="executiveCharts">
      <article>
        <header>
          <h2>Workflow by status</h2>
          <p>Live company task distribution</p>
        </header>
        {status.map((x, i) => (
          <button
            className="execBar"
            key={x.name}
            onClick={() =>
              openRows(
                `Workflow status · ${x.name}`,
                tasks.filter((task) => task.status === x.name),
              )
            }
          >
            <label>
              <span>{x.name}</span>
              <b>{x.count}</b>
            </label>
            <div>
              <i
                className={`e${i}`}
                style={{ width: `${(x.count / max) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </article>
      <article>
        <header>
          <h2>Work by priority</h2>
          <p>Current management attention profile</p>
        </header>
        {priority.map((x, i) => (
          <button
            className="execBar"
            key={x.name}
            onClick={() =>
              openRows(
                `Priority · ${x.name}`,
                tasks.filter((task) => task.priority === x.name),
              )
            }
          >
            <label>
              <span>{x.name}</span>
              <b>{x.count}</b>
            </label>
            <div>
              <i
                className={`q${i}`}
                style={{ width: `${(x.count / max) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </article>
    </section>
  );
}

function ActionRegister({
  title,
  subtitle,
  tasks,
  loading,
  mode,
  setMode,
  openTask,
  setStatus,
  addTask,
}: {
  title: string;
  subtitle: string;
  tasks: HubTask[];
  loading: boolean;
  mode: "table" | "board";
  setMode: (m: "table" | "board") => void;
  openTask: (t: HubTask) => void;
  setStatus: (id: number, s: Status) => void;
  addTask: () => void;
}) {
  return (
    <section className="panel tasks">
      <div className="panelhead">
        <span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </span>
        <div className="switch">
          <button
            className={mode === "table" ? "on" : ""}
            onClick={() => setMode("table")}
          >
            ☷ Table
          </button>
          <button
            className={mode === "board" ? "on" : ""}
            onClick={() => setMode("board")}
          >
            ▦ Board
          </button>
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading items…</div>
      ) : !tasks.length ? (
        <div className="moduleEmpty">
          <i>＋</i>
          <b>No items have been added to this module</b>
          <p>
            Create the first item with its due date, status, type, priority and
            assignee.
          </p>
          <button onClick={addTask}>Add item</button>
        </div>
      ) : mode === "table" ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Workspace</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Task Type</th>
                <th>Priority</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((x) => (
                <tr key={x.id}>
                  <td>
                    <button className="taskLink" onClick={() => openTask(x)}>
                      <b>{x.title}</b>
                      <small>{x.task_group || "Store Tasks"} · Open task</small>
                    </button>
                  </td>
                  <td>{x.project}</td>
                  <td>{x.due}</td>
                  <td>
                    <select
                      value={x.status}
                      className={x.status.replaceAll(" ", "").toLowerCase()}
                      onChange={(e) =>
                        setStatus(x.id, e.target.value as Status)
                      }
                    >
                      <option>Not started</option>
                      <option>In progress</option>
                      <option>Blocked</option>
                      <option>Complete</option>
                    </select>
                  </td>
                  <td>{x.task_type || "General"}</td>
                  <td>
                    <em className={`tag ${x.priority}`}>● {x.priority}</em>
                  </td>
                  <td>
                    <i className="mini">
                      {x.assignee.slice(0, 2).toUpperCase()}
                    </i>
                    {x.assignee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="board">
          {(
            ["Not started", "In progress", "Blocked", "Complete"] as Status[]
          ).map((s) => (
            <div className="lane" key={s}>
              <h3>
                {s}
                <b>{tasks.filter((x) => x.status === s).length}</b>
              </h3>
              {tasks
                .filter((x) => x.status === s)
                .map((x) => (
                  <article key={x.id} onClick={() => openTask(x)}>
                    <b>{x.title}</b>
                    <p>
                      {x.project} · {x.task_type || "General"}
                    </p>
                    <footer>
                      <em className={`tag ${x.priority}`}>● {x.priority}</em>
                      <span>{x.assignee}</span>
                    </footer>
                  </article>
                ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TaskDrilldown({
  title,
  tasks,
  close,
  openTask,
  setStatus,
  addTask,
}: {
  title: string;
  tasks: HubTask[];
  close: () => void;
  openTask: (task: HubTask) => void;
  setStatus: (id: number, status: Status) => void;
  addTask: () => void;
}) {
  return (
    <div className="overlay metricOverlay" onMouseDown={close}>
      <div className="metricDrilldown" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <span>
            <small>LIVE TASK DRILL-DOWN</small>
            <h2>{title}</h2>
            <p>{tasks.length} underlying items shown in full</p>
          </span>
          <div>
            <button className="primary" onClick={addTask}>
              ＋ Add task
            </button>
            <button className="closeX" onClick={close}>
              ×
            </button>
          </div>
        </header>
        <div className="metricTable tablewrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Workspace</th>
                <th>Group</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <button className="taskLink" onClick={() => openTask(t)}>
                      <b>{t.title}</b>
                      <small>Open full task</small>
                    </button>
                  </td>
                  <td>{t.project}</td>
                  <td>{t.task_group}</td>
                  <td>{t.due}</td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) =>
                        setStatus(t.id, e.target.value as Status)
                      }
                    >
                      <option>Not started</option>
                      <option>In progress</option>
                      <option>Blocked</option>
                      <option>Complete</option>
                    </select>
                  </td>
                  <td>
                    <em className={`tag ${t.priority}`}>{t.priority}</em>
                  </td>
                  <td>{t.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Reports({
  tasks,
  onSelect,
  activeMetric,
  openRows,
}: {
  tasks: HubTask[];
  onSelect: (m: Metric) => void;
  activeMetric: Metric;
  openRows: (title: string, tasks: HubTask[]) => void;
}) {
  const statuses = (
    ["Not started", "In progress", "Blocked", "Complete"] as Status[]
  ).map((name) => ({
    name,
    count: tasks.filter((t) => t.status === name).length,
  }));
  const priorities = (["High", "Medium", "Low"] as const).map((name) => ({
    name,
    count: tasks.filter((t) => t.priority === name).length,
  }));
  const people = Object.entries(
    tasks.reduce<Record<string, number>>((a, t) => {
      a[t.assignee] = (a[t.assignee] || 0) + 1;
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const workspaces = Object.entries(
    tasks.reduce<Record<string, HubTask[]>>((a, t) => {
      (a[t.project] ??= []).push(t);
      return a;
    }, {}),
  ).sort((a, b) => b[1].length - a[1].length);
  const max = Math.max(
    1,
    ...statuses.map((x) => x.count),
    ...priorities.map((x) => x.count),
    ...people.map((x) => x[1]),
  );
  const exportCsv = () => {
    const rows = [
      [
        "Item",
        "Workspace",
        "Due Date",
        "Status",
        "Task Type",
        "Priority",
        "Assignee",
      ],
      ...tasks.map((t) => [
        t.title,
        t.project,
        t.due,
        t.status,
        t.task_type || "General",
        t.priority,
        t.assignee,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "powerbuild-company-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <Kpis tasks={tasks} onSelect={onSelect} activeMetric={activeMetric} />
      <section className="reportGrid">
        <article className="reportCard">
          <header>
            <span>
              <h2>Tasks by status</h2>
              <p>Current workflow distribution</p>
            </span>
          </header>
          {statuses.map((x, i) => (
            <button
              className="reportBar"
              key={x.name}
              onClick={() =>
                openRows(
                  `Reports · ${x.name} tasks`,
                  tasks.filter((task) => task.status === x.name),
                )
              }
            >
              <label>
                <span>{x.name}</span>
                <b>{x.count}</b>
              </label>
              <div>
                <i
                  className={`r${i}`}
                  style={{ width: `${(x.count / max) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </article>
        <article className="reportCard">
          <header>
            <span>
              <h2>Tasks by priority</h2>
              <p>Workload requiring attention</p>
            </span>
          </header>
          {priorities.map((x, i) => (
            <button
              className="reportBar"
              key={x.name}
              onClick={() =>
                openRows(
                  `Reports · ${x.name} priority`,
                  tasks.filter((task) => task.priority === x.name),
                )
              }
            >
              <label>
                <span>{x.name}</span>
                <b>{x.count}</b>
              </label>
              <div>
                <i
                  className={`p${i}`}
                  style={{ width: `${(x.count / max) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </article>
        <article className="reportCard">
          <header>
            <span>
              <h2>Tasks by assignee</h2>
              <p>Current team workload</p>
            </span>
          </header>
          {people.slice(0, 7).map(([name, count]) => (
            <button
              className="personLoad"
              key={name}
              onClick={() =>
                openRows(
                  `Reports · Assigned to ${name}`,
                  tasks.filter((task) => task.assignee === name),
                )
              }
            >
              <i>{name.slice(0, 2).toUpperCase()}</i>
              <span>
                <b>{name}</b>
                <em>
                  <strong style={{ width: `${(count / max) * 100}%` }} />
                </em>
              </span>
              <small>{count}</small>
            </button>
          ))}
          {!people.length && (
            <p className="reportNone">No assignee data yet.</p>
          )}
        </article>
      </section>
      <section className="panel">
        <div className="panelhead">
          <span>
            <h2>Workspace performance report</h2>
            <p>Live roll-up from every task board</p>
          </span>
          <button onClick={exportCsv}>Export CSV ↓</button>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Total Items</th>
                <th>Open</th>
                <th>Blocked</th>
                <th>Completed</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map(([name, rows]) => {
                const done = rows.filter((t) => t.status === "Complete").length;
                return (
                  <tr
                    className="reportWorkspaceRow"
                    key={name}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      openRows(`Reports · ${name}`, rows)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openRows(`Reports · ${name}`, rows);
                      }
                    }}
                  >
                    <td>
                      <b>{name}</b>
                      <small className="reportOpenCue">View items →</small>
                    </td>
                    <td>{rows.length}</td>
                    <td>{rows.length - done}</td>
                    <td>{rows.filter((t) => t.status === "Blocked").length}</td>
                    <td>{done}</td>
                    <td>
                      <span className="reportProgress">
                        <i
                          style={{
                            width: `${rows.length ? (done / rows.length) * 100 : 0}%`,
                          }}
                        />
                      </span>{" "}
                      {rows.length ? Math.round((done / rows.length) * 100) : 0}
                      %
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default function OperationalView({
  active,
  tasks,
  shown,
  loading,
  mode,
  setMode,
  openTask,
  setStatus,
  openWorkspaces,
  addTask,
  workspaces,
  navigateTo,
}: Props) {
  const [metric, setMetric] = useState<Metric>("all"),
    [drilldown, setDrilldown] = useState<Metric | null>(null),
    [customDrilldown, setCustomDrilldown] = useState<{
      title: string;
      tasks: HubTask[];
    } | null>(null);
  const stores = workspaces.filter((w) => w.type === "Store");
  const drilled =
    metric === "open"
      ? shown.filter((t) => t.status !== "Complete")
      : metric === "complete"
        ? shown.filter((t) => t.status === "Complete")
        : metric === "attention"
          ? shown.filter(
              (t) =>
                t.status === "Blocked" ||
                (t.priority === "High" && t.status !== "Complete"),
            )
          : shown;
  const pick = (value: Metric) => {
    setMetric(value);
    setDrilldown(value);
  };
  const title =
    active === "My Work"
      ? "My assigned work"
      : active === "Store Operations"
        ? "Store operations register"
        : active === "Wholesale Division"
          ? "Wholesale execution board"
          : active === "Developments"
            ? "Development action board"
            : active === "Financials & P&L"
              ? "Monthly P&L and financial reporting"
              : active === "Receiving & Dispatch"
                ? "Receiving and dispatch board"
                : "Approval inbox";
  const subtitle =
    active === "Approvals"
      ? "Review high-priority and blocked submissions requiring management action"
      : "All items in this module use the same controlled workflow columns";
  const scope = active === "Executive Overview" ? tasks : shown,
    drillRows =
      drilldown === "open"
        ? scope.filter((t) => t.status !== "Complete")
        : drilldown === "complete"
          ? scope.filter((t) => t.status === "Complete")
          : drilldown === "attention"
            ? scope.filter(
                (t) =>
                  t.status === "Blocked" ||
                  (t.priority === "High" && t.status !== "Complete"),
              )
            : scope;
  const drillModal = customDrilldown ? (
    <TaskDrilldown
      title={customDrilldown.title}
      tasks={customDrilldown.tasks}
      close={() => setCustomDrilldown(null)}
      openTask={openTask}
      setStatus={setStatus}
      addTask={addTask}
    />
  ) : drilldown ? (
    <TaskDrilldown
      title={`${active} · ${drilldown} items`}
      tasks={drillRows}
      close={() => {
        setDrilldown(null);
        setMetric("all");
      }}
      openTask={openTask}
      setStatus={setStatus}
      addTask={addTask}
    />
  ) : null;
  if (active === "Reports")
    return (
      <>
        <Reports
          tasks={shown}
          onSelect={pick}
          activeMetric={metric}
          openRows={(drillTitle, rows) => {
            setDrilldown(null);
            setCustomDrilldown({ title: drillTitle, tasks: rows });
          }}
        />
        {drillModal}
      </>
    );
  if (active === "Executive Overview")
    return (
      <>
        <ExecutiveOverview tasks={tasks} workspaces={workspaces} navigateTo={navigateTo} openWorkspaces={() => openWorkspaces()} />
        <Kpis tasks={tasks} onSelect={pick} activeMetric={metric} />
        {drillModal}
        <ExecutiveCharts
          tasks={tasks}
          openRows={(drillTitle, rows) => {
            setDrilldown(null);
            setCustomDrilldown({ title: drillTitle, tasks: rows });
          }}
        />
        <section className="panel">
          <div className="panelhead">
            <span>
              <h2>Strategic projects</h2>
              <p>Executive visibility across the group</p>
            </span>
            <button onClick={() => openWorkspaces()}>All workspaces →</button>
          </div>
          <div className="projects">
            {strategic.map((p) => {
              const related = tasks.filter((t) =>
                t.project
                  .toLowerCase()
                  .includes(p.name.split(" ")[0].toLowerCase()),
              );
              const done = related.filter(
                (t) => t.status === "Complete",
              ).length;
              const progress = related.length
                ? Math.round((done / related.length) * 100)
                : 0;
              return (
                <article
                  key={p.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setDrilldown(null);
                    setCustomDrilldown({
                      title: `Strategic project · ${p.name}`,
                      tasks: related,
                    });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setCustomDrilldown({
                        title: `Strategic project · ${p.name}`,
                        tasks: related,
                      });
                    }
                  }}
                >
                  <div>
                    <i className={`projectIcon ${p.colour}`}>
                      {p.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </i>
                    <em
                      className={
                        p.health === "At risk"
                          ? "risk"
                          : p.health === "Attention"
                            ? "attention"
                            : "health"
                      }
                    >
                      {p.health}
                    </em>
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.kind}</p>
                  <label>
                    <span>Task completion</span>
                    <b>{progress}%</b>
                  </label>
                  <div className="bar">
                    <i style={{ width: progress + "%" }} />
                  </div>
                  <footer>
                    <span>{related.length} action items</span>
                    <span>{done} complete</span>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
        <ActionRegister
          title={
            metric === "all"
              ? "Company action register"
              : `${metric.charAt(0).toUpperCase() + metric.slice(1)} items`
          }
          subtitle="Master roll-up from all stores, DC, Head Office and Wholesale"
          tasks={drilled}
          loading={loading}
          mode={mode}
          setMode={setMode}
          openTask={openTask}
          setStatus={setStatus}
          addTask={addTask}
        />
      </>
    );
  if (active === "Store Operations")
    return (
      <>
        <div className="moduleHero storesHero">
          <span>
            <small>STORE NETWORK</small>
            <h2>{stores.length} active store workspaces</h2>
            <p>
              Open an individual store for Store Tasks, Regional Tasks, Audit
              Tasks, documents and pictures.
            </p>
          </span>
          <button onClick={() => openWorkspaces()}>Open store boards →</button>
        </div>
        <Kpis
          tasks={shown}
          labels={[
            "Store items open",
            "Store items complete",
            "Store issues",
            "Store completion",
          ]}
          onSelect={pick}
          activeMetric={metric}
        />
        {drillModal}
        <section className="workspaceStrip">
          {stores.slice(0, 8).map((w) => {
            const rows = tasks.filter(
              (t) =>
                t.project.toLowerCase().includes(w.name.toLowerCase()) ||
                w.name.toLowerCase().includes(t.project.toLowerCase()),
            );
            return (
              <button key={w.id} onClick={() => openWorkspaces(w.name)}>
                <i>▦</i>
                <span>
                  <b>{w.name}</b>
                  <small>
                    {rows.length} items · {w.region}
                  </small>
                </span>
                <em>Open →</em>
              </button>
            );
          })}
          <button className="allStores" onClick={() => openWorkspaces()}>
            <b>＋ {Math.max(0, stores.length - 8)} more stores</b>
            <small>View all workspaces</small>
          </button>
        </section>
        <ActionRegister
          title={title}
          subtitle={subtitle}
          tasks={drilled}
          loading={loading}
          mode={mode}
          setMode={setMode}
          openTask={openTask}
          setStatus={setStatus}
          addTask={addTask}
        />
      </>
    );
  if (active === "Wholesale Division")
    return (
      <>
        <div className="moduleHero wholesaleHero">
          <span>
            <small>WHOLESALE DIVISION</small>
            <h2>Wholesale CRM and sales conversion</h2>
            <p>
              Customer details, regions, quotations, orders, values, GP and
              conversion reporting.
            </p>
          </span>
        </div>
        <WholesaleCrm />
        <ActionRegister
          title="Wholesale internal action board"
          subtitle="Supporting tasks, documents and assigned operational actions"
          tasks={shown}
          loading={loading}
          mode={mode}
          setMode={setMode}
          openTask={openTask}
          setStatus={setStatus}
          addTask={addTask}
        />
      </>
    );
  if (active === "Developments")
    return (
      <>
        <div className="moduleHero newStoreHero">
          <span>
            <small>PROPERTY &amp; STORE DEVELOPMENT</small>
            <h2>New-store development and investment control</h2>
            <p>
              Track every new site from business case and approval through build,
              fit-out, stock, opening and post-opening review.
            </p>
          </span>
        </div>
        <DevelopmentModule />
        <ActionRegister
          title="Development action board"
          subtitle="Supporting owners, milestones, approvals and opening actions"
          tasks={drilled}
          loading={loading}
          mode={mode}
          setMode={setMode}
          openTask={openTask}
          setStatus={setStatus}
          addTask={addTask}
        />
      </>
    );
  if (active === "Financials & P&L")
    return (
      <>
        <div className="moduleHero capexHero">
          <span>
            <small>MONTHLY MANAGEMENT ACCOUNTS</small>
            <h2>Store-by-store Profit &amp; Loss reporting</h2>
            <p>
              Capture turnover, gross profit, fixed and variable expenses,
              petty cash and CAPEX for every reporting month.
            </p>
          </span>
        </div>
        <FinancialModule workspaces={workspaces} />
      </>
    );
  if (active === "Receiving & Dispatch")
    return (
      <>
        <div className="moduleHero logisticsHero">
          <span>
            <small>LOGISTICS CONTROL</small>
            <h2>Receiving and dispatch operations</h2>
            <p>
              Receiving exceptions, GRV actions, dispatch bays, outstanding
              collections and deliveries.
            </p>
          </span>
          <button onClick={addTask}>＋ Add logistics item</button>
        </div>
        <Kpis tasks={shown} onSelect={pick} activeMetric={metric} />
        {drillModal}
        <ActionRegister
          title={title}
          subtitle={subtitle}
          tasks={drilled}
          loading={loading}
          mode={mode}
          setMode={setMode}
          openTask={openTask}
          setStatus={setStatus}
          addTask={addTask}
        />
      </>
    );
  if (active === "Approvals")
    return (
      <>
        <div className="moduleHero approvalHero">
          <span>
            <small>MANAGEMENT CONTROL</small>
            <h2>Approval inbox</h2>
            <p>
              High-priority and blocked items requiring a decision or
              escalation.
            </p>
          </span>
          <b>{shown.length} awaiting review</b>
        </div>
        <div className="approvalList">
          {shown.map((t) => (
            <article key={t.id}>
              <i className={t.priority}>{t.priority[0]}</i>
              <span>
                <small>
                  {t.project} · {t.task_type || "General"}
                </small>
                <b>{t.title}</b>
                <p>{t.description || "No supporting note has been added."}</p>
                <em>
                  Owner: {t.owner} · Due {t.due} · Current status: {t.status}
                </em>
              </span>
              <div>
                <button onClick={() => openTask(t)}>Review</button>
                <button
                  className="approve"
                  onClick={() => setStatus(t.id, "Complete")}
                >
                  Mark approved
                </button>
                <button
                  className="return"
                  onClick={() => setStatus(t.id, "Not started")}
                >
                  Return for rework
                </button>
              </div>
            </article>
          ))}
          {!shown.length && (
            <div className="moduleEmpty">
              <b>No approvals are waiting</b>
              <p>
                Blocked and high-priority items will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </>
    );
  return (
    <>
      <Kpis tasks={shown} onSelect={pick} activeMetric={metric} />
      {drillModal}
      <ActionRegister
        title={title}
        subtitle={subtitle}
        tasks={drilled}
        loading={loading}
        mode={mode}
        setMode={setMode}
        openTask={openTask}
        setStatus={setStatus}
        addTask={addTask}
      />
    </>
  );
}
