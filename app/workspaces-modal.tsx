"use client";
import { useCallback, useEffect, useState } from "react";

type W = {
  id: number;
  name: string;
  type: string;
  region: string;
  manager: string;
};
export type WorkspaceTask = {
  id: number;
  title: string;
  project: string;
  owner: string;
  assignee: string;
  assignee_email: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: "Not started" | "In progress" | "Blocked" | "Complete";
  description: string;
  task_type: string;
  task_group: string;
  created_by: string;
  created_at: string;
};
type WorkspaceFile = {
  id: number;
  task_id: number;
  name: string;
  type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
  task_title: string;
};
const groups = ["Store Tasks", "Regional Tasks", "Audit Tasks"];
const taskTypes = [
  "General",
  "Operations",
  "Maintenance",
  "Stock",
  "HR / Staffing",
  "Audit",
  "Regional Instruction",
  "CAPEX",
  "Receiving",
  "Dispatch",
  "Sales",
];
const roleAssignees = [
  "Muhammad",
  "Store Manager",
  "Regional Manager",
  "Operations",
  "Property Team",
  "HR Manager",
  "Stock Controller",
  "Receiving Manager",
  "Dispatch Manager",
  "EXCO",
];

export default function WorkspacesModal({
  close,
  onOpenTask,
  onChanged,
  initialName = "",
  initialTasks = [],
  initialWorkspaces = [],
  teamMembers = [],
  initialCreate = false,
}: {
  close: () => void;
  onOpenTask?: (task: WorkspaceTask) => void;
  onChanged?: () => void;
  initialName?: string;
  initialTasks?: WorkspaceTask[];
  initialWorkspaces?: W[];
  initialCreate?: boolean;
  teamMembers?: Array<{
    name: string;
    email: string;
    department: string;
  }>;
}) {
  const [items, setItems] = useState<W[]>(initialWorkspaces);
  const [tasks, setTasks] = useState<WorkspaceTask[]>(initialTasks);
  const [selected, setSelected] = useState<W | null>(
    initialWorkspaces.find((w) => w.name === initialName) || null,
  );
  const [tab, setTab] = useState<"table" | "dashboard" | "files">("table");
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(initialCreate);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [busy, setBusy] = useState(!initialWorkspaces.length);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    type: "Store",
    region: "Unassigned",
    manager: "",
  });
  const [task, setTask] = useState({
    title: "",
    assignee: "Store Manager",
    assignee_email: "",
    due: "2026-08-20",
    status: "Not started",
    task_type: "General",
    task_group: "Store Tasks",
    priority: "Medium",
    description: "",
  });

  const load = useCallback(
    async (showBusy = true) => {
      if (showBusy) setBusy(true);
      setError("");
      try {
        const [wr, tr] = await Promise.all([
          fetch("/api/workspaces"),
          fetch("/api/tasks"),
        ]);
        if (!wr.ok || !tr.ok)
          throw new Error("The workspace service did not respond.");
        const [wj, tj] = await Promise.all([wr.json(), tr.json()]);
        const loaded = (wj.workspaces || []) as W[];
        setItems(loaded);
        setTasks(tj.tasks || []);
        if (initialName) {
          const match = loaded.find((w) => w.name === initialName);
          if (match) setSelected(match);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load workspaces.");
      } finally {
        setBusy(false);
      }
    },
    [initialName],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      void load(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const addWorkspace = async () => {
    if (!draft.name.trim()) {
      setError("Enter the new store name.");
      return;
    }
    setWorkspaceSaving(true);
    setError("");
    try {
      const r = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await r.json();
      if (!r.ok)
        throw new Error(result.error || "The new store could not be created.");
      const created = result.workspace as W;
      setItems((current) => [
        ...current.filter((item) => item.id !== created.id),
        created,
      ]);
      setDraft({
        name: "",
        type: "Store",
        region: "Unassigned",
        manager: "",
      });
      setAdding(false);
      setSelected(created);
      onChanged?.();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The new store could not be created.",
      );
    } finally {
      setWorkspaceSaving(false);
    }
  };
  const belongs = (t: WorkspaceTask, w: W) => {
    const p = (t.project || "").toLowerCase(),
      n = w.name.toLowerCase();
    return (
      p === n ||
      p.includes(n) ||
      n.includes(p) ||
      (w.name.includes("Buster") && p.includes("buster")) ||
      (w.type === "Wholesale Division" && p.includes("wholesale"))
    );
  };
  const workspaceTasks = selected
    ? tasks.filter((t) => belongs(t, selected))
    : [];
  const complete = workspaceTasks.filter((t) => t.status === "Complete").length;
  const blocked = workspaceTasks.filter((t) => t.status === "Blocked").length;
  const openItems = workspaceTasks.length - complete;
  const update = async (id: number, key: string, value: string) => {
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    );
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    onChanged?.();
  };
  const updateAssignee = async (taskId: number, value: string) => {
    const member = value.startsWith("member:")
      ? teamMembers.find((item) => item.email === value.slice(7))
      : undefined;
    const assignee = member ? member.name : value.slice(5);
    const assigneeEmail = member?.email || "";
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, assignee, assignee_email: assigneeEmail }
          : item,
      ),
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assignee,
        assignee_email: assigneeEmail,
      }),
    });
    onChanged?.();
  };
  const setComposerAssignee = (value: string) => {
    const member = value.startsWith("member:")
      ? teamMembers.find((item) => item.email === value.slice(7))
      : undefined;
    setTask({
      ...task,
      assignee: member ? member.name : value.slice(5),
      assignee_email: member?.email || "",
    });
  };
  const beginTask = (group: string) => {
    setTask((current) => ({ ...current, task_group: group }));
    setPendingFile(null);
    setCreatingTask(true);
  };
  const addTask = async () => {
    if (!selected || !task.title.trim()) return;
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...task,
        project: selected.name,
        owner: selected.manager || "Operations",
      }),
    });
    if (r.ok) {
      const j = await r.json();
      if (pendingFile && j.task?.id) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        await fetch(`/api/tasks/${j.task.id}/attachments`, {
          method: "POST",
          body: fd,
        });
      }
      setTask({ ...task, title: "", description: "" });
      setPendingFile(null);
      setCreatingTask(false);
      await load();
      onChanged?.();
    } else setError("The task could not be created.");
  };
  const loadFiles = async () => {
    if (!workspaceTasks.length) {
      setWorkspaceFiles([]);
      return;
    }
    setFileLoading(true);
    try {
      const details = await Promise.all(
        workspaceTasks.map((t) =>
          fetch(`/api/tasks/${t.id}`).then((r) => r.json()),
        ),
      );
      setWorkspaceFiles(
        details.flatMap((d, i) =>
          (d.attachments || []).map((f: WorkspaceFile) => ({
            ...f,
            task_title: workspaceTasks[i].title,
          })),
        ),
      );
    } finally {
      setFileLoading(false);
    }
  };
  const changeTab = (next: "table" | "dashboard" | "files") => {
    setTab(next);
    if (next === "files") void loadFiles();
  };
  const stores = items.filter((x) => x.type === "Store");

  if (selected) {
    const statusData = (
      ["Not started", "In progress", "Blocked", "Complete"] as const
    ).map((name) => ({
      name,
      count: workspaceTasks.filter((t) => t.status === name).length,
    }));
    const max = Math.max(1, ...statusData.map((x) => x.count));
    return (
      <div className="overlay workspaceOverlay">
        <div className="workspaceModal mondayWorkspace">
          <header>
            <span>
              <button
                className="backBtn"
                onClick={() => {
                  setSelected(null);
                  setTab("table");
                }}
              >
                ← Company workspaces
              </button>
              <h2>{selected.name}</h2>
              <p>
                {selected.type} · {selected.region} ·{" "}
                {selected.manager || "Manager not assigned"}
              </p>
            </span>
            <div>
              <button
                className="addStore"
                onClick={() => beginTask("Store Tasks")}
              >
                ＋ New item
              </button>
              <button className="closeX" onClick={close}>
                ×
              </button>
            </div>
          </header>
          <div className="boardTop">
            <nav>
              <button
                className={tab === "table" ? "active" : ""}
                onClick={() => changeTab("table")}
              >
                Main table
              </button>
              <button
                className={tab === "dashboard" ? "active" : ""}
                onClick={() => changeTab("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={tab === "files" ? "active" : ""}
                onClick={() => changeTab("files")}
              >
                Files
              </button>
            </nav>
            <div>
              <button>⌕ Search</button>
              <button>♙ Person</button>
              <button>≡ Filter</button>
              <button>↕ Sort</button>
            </div>
          </div>
          <div className="storeKpis">
            <article>
              <small>Open items</small>
              <b>{openItems}</b>
              <em>Across all groups</em>
            </article>
            <article>
              <small>Completed</small>
              <b>{complete}</b>
              <em>Closed items</em>
            </article>
            <article>
              <small>Needs attention</small>
              <b>{blocked}</b>
              <em>Blocked items</em>
            </article>
            <article>
              <small>Completion</small>
              <b>
                {workspaceTasks.length
                  ? Math.round((complete / workspaceTasks.length) * 100)
                  : 0}
                %
              </b>
              <em>Workspace progress</em>
            </article>
          </div>
          {tab === "table" && (
            <div className="mondayBoard">
              {groups.map((group, index) => {
                const rows = workspaceTasks.filter(
                  (t) => (t.task_group || "Store Tasks") === group,
                );
                return (
                  <section className={`taskGroup group${index}`} key={group}>
                    <header>
                      <span>
                        <i>⌄</i>
                        <h3>{group}</h3>
                        <b>{rows.length}</b>
                      </span>
                    </header>
                    <div className="boardTable">
                      <div className="boardRow boardHead">
                        <span>Item</span>
                        <span>Due Date</span>
                        <span>Status</span>
                        <span>Task Type</span>
                        <span>Priority</span>
                        <span>Assignee</span>
                      </div>
                      {rows.map((t) => (
                        <div className="boardRow" key={t.id}>
                          <button
                            className="itemCell"
                            onClick={() => onOpenTask?.(t)}
                          >
                            <i>□</i>
                            <b>{t.title}</b>
                            <em>Open task</em>
                          </button>
                          <input
                            type="date"
                            value={t.due}
                            onChange={(e) =>
                              update(t.id, "due", e.target.value)
                            }
                          />
                          <select
                            className={`statusCell ${t.status.replaceAll(" ", "").toLowerCase()}`}
                            value={t.status}
                            onChange={(e) =>
                              update(t.id, "status", e.target.value)
                            }
                          >
                            <option>Not started</option>
                            <option>In progress</option>
                            <option>Blocked</option>
                            <option>Complete</option>
                          </select>
                          <select
                            value={t.task_type || "General"}
                            onChange={(e) =>
                              update(t.id, "task_type", e.target.value)
                            }
                          >
                            {taskTypes.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                          <select
                            className={`priorityCell ${t.priority}`}
                            value={t.priority}
                            onChange={(e) =>
                              update(t.id, "priority", e.target.value)
                            }
                          >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                          <select
                            value={
                              t.assignee_email
                                ? `member:${t.assignee_email}`
                                : `role:${t.assignee}`
                            }
                            onChange={(e) =>
                              void updateAssignee(t.id, e.target.value)
                            }
                          >
                            {teamMembers.length > 0 && (
                              <optgroup label="Team members">
                                {teamMembers.map((member) => (
                                  <option
                                    key={member.email}
                                    value={`member:${member.email}`}
                                  >
                                    {member.name} · {member.department}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Unassigned role">
                              {Array.from(
                                new Set([...roleAssignees, t.assignee]),
                              ).map((person) => (
                                <option key={person} value={`role:${person}`}>
                                  {person}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      ))}
                      <button
                        className="addBoardItem"
                        onClick={() => beginTask(group)}
                      >
                        ＋ Add item
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          {tab === "dashboard" && (
            <div className="workspaceDashboardTab">
              <section>
                <h3>Task status</h3>
                <p>Live progress across all workspace groups</p>
                {statusData.map((x, i) => (
                  <div className="workspaceChart" key={x.name}>
                    <label>
                      <span>{x.name}</span>
                      <b>{x.count}</b>
                    </label>
                    <div>
                      <i
                        className={`ws${i}`}
                        style={{ width: `${(x.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </section>
              <section>
                <h3>Group performance</h3>
                <p>Store, regional and audit workloads</p>
                {groups.map((group) => {
                  const rows = workspaceTasks.filter(
                      (t) => (t.task_group || "Store Tasks") === group,
                    ),
                    done = rows.filter((t) => t.status === "Complete").length;
                  return (
                    <article className="groupProgress" key={group}>
                      <span>
                        <b>{group}</b>
                        <small>
                          {rows.length} items · {done} complete
                        </small>
                      </span>
                      <strong>
                        {rows.length
                          ? Math.round((done / rows.length) * 100)
                          : 0}
                        %
                      </strong>
                    </article>
                  );
                })}
              </section>
            </div>
          )}
          {tab === "files" && (
            <div className="workspaceFilesTab">
              <header>
                <span>
                  <h3>Workspace files</h3>
                  <p>
                    All documents and pictures attached to tasks in{" "}
                    {selected.name}
                  </p>
                </span>
                <button onClick={() => beginTask("Store Tasks")}>
                  ＋ New item with file
                </button>
              </header>
              {fileLoading ? (
                <div className="loading">Loading workspace files…</div>
              ) : !workspaceFiles.length ? (
                <div className="moduleEmpty">
                  <b>No files attached in this workspace</b>
                  <p>
                    Add a new item with a file, or open an existing task to
                    attach documents and pictures.
                  </p>
                  <button onClick={() => beginTask("Store Tasks")}>
                    Add item with file
                  </button>
                </div>
              ) : (
                <div className="workspaceFileGrid">
                  {workspaceFiles.map((f) => (
                    <a
                      key={f.id}
                      href={`/api/attachments/${f.id}`}
                      target="_blank"
                    >
                      <i>{f.type.startsWith("image/") ? "▧" : "▤"}</i>
                      <span>
                        <b>{f.name}</b>
                        <small>{f.task_title}</small>
                        <em>
                          {(f.size / 1024).toFixed(0)} KB · {f.uploaded_by}
                        </em>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {creatingTask && (
            <div className="taskComposer">
              <header>
                <span>
                  <h3>Add item to {task.task_group}</h3>
                  <p>{selected.name}</p>
                </span>
                <button onClick={() => setCreatingTask(false)}>×</button>
              </header>
              <div className="composerGrid">
                <label>
                  Item
                  <input
                    autoFocus
                    value={task.title}
                    onChange={(e) =>
                      setTask({ ...task, title: e.target.value })
                    }
                    placeholder="Enter task or action item"
                  />
                </label>
                <label>
                  Task Group
                  <select
                    value={task.task_group}
                    onChange={(e) =>
                      setTask({ ...task, task_group: e.target.value })
                    }
                  >
                    {groups.map((group) => (
                      <option key={group}>{group}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Due Date
                  <input
                    type="date"
                    value={task.due}
                    onChange={(e) => setTask({ ...task, due: e.target.value })}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={task.status}
                    onChange={(e) =>
                      setTask({ ...task, status: e.target.value })
                    }
                  >
                    <option>Not started</option>
                    <option>In progress</option>
                    <option>Blocked</option>
                    <option>Complete</option>
                  </select>
                </label>
                <label>
                  Task Type
                  <select
                    value={task.task_type}
                    onChange={(e) =>
                      setTask({ ...task, task_type: e.target.value })
                    }
                  >
                    {taskTypes.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={task.priority}
                    onChange={(e) =>
                      setTask({ ...task, priority: e.target.value })
                    }
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
                <label>
                  Assignee
                  <select
                    value={
                      task.assignee_email
                        ? `member:${task.assignee_email}`
                        : `role:${task.assignee}`
                    }
                    onChange={(e) => setComposerAssignee(e.target.value)}
                  >
                    {teamMembers.length > 0 && (
                      <optgroup label="Team members">
                        {teamMembers.map((member) => (
                          <option
                            key={member.email}
                            value={`member:${member.email}`}
                          >
                            {member.name} · {member.department}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Unassigned role">
                      {roleAssignees.map((person) => (
                        <option key={person} value={`role:${person}`}>
                          {person}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <label className="wide">
                  Description
                  <textarea
                    value={task.description}
                    onChange={(e) =>
                      setTask({ ...task, description: e.target.value })
                    }
                    placeholder="Instructions and expected outcome"
                  />
                </label>
                <label className="wide attachmentField">
                  Attachment
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) =>
                      setPendingFile(e.target.files?.[0] || null)
                    }
                  />
                  <small>
                    {pendingFile
                      ? `${pendingFile.name} selected`
                      : "Optional — attach a picture or document now"}
                  </small>
                </label>
              </div>
              <footer>
                <button onClick={() => setCreatingTask(false)}>Cancel</button>
                <button className="primary" onClick={addTask}>
                  Add item
                </button>
              </footer>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onMouseDown={close}>
      <div className="workspaceModal" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <span>
            <h2>Company workspaces</h2>
            <p>
              {stores.length} stores plus DC, Head Office and Wholesale — select
              one to open its board
            </p>
          </span>
          <div>
            <button className="addStore" onClick={() => setAdding(true)}>
              ＋ Add new store
            </button>
            <button className="closeX" onClick={close}>
              ×
            </button>
          </div>
        </header>
        {error && (
          <div className="workspaceError">
            {error} <button onClick={() => void load(true)}>Retry</button>
          </div>
        )}
        <div className="workspaceStats">
          <article>
            <b>{stores.length}</b>
            <span>Active stores</span>
          </article>
          <article>
            <b>{items.filter((x) => x.type !== "Store").length}</b>
            <span>Group divisions</span>
          </article>
          <article>
            <b>{items.length}</b>
            <span>Connected workspaces</span>
          </article>
        </div>
        {busy ? (
          <div className="loading">Loading company workspaces…</div>
        ) : (
          <div className="workspaceGrid">
            {items.map((w) => (
              <button
                key={w.id}
                className={w.type !== "Store" ? "division" : ""}
                onClick={() => setSelected(w)}
              >
                <i>{w.type === "Store" ? "▦" : w.type === "DC" ? "▣" : "◆"}</i>
                <span>
                  <b>{w.name}</b>
                  <small>
                    {w.type} · {w.region}
                  </small>
                </span>
                <em>Open board →</em>
              </button>
            ))}
          </div>
        )}
        {adding && (
          <div className="newStore">
            <h3>Create a new store workspace</h3>
            <div>
              <label>
                Name
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="New store name"
                />
              </label>
              <label>
                Type
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                >
                  <option>Store</option>
                  <option>DC</option>
                  <option>Head Office</option>
                  <option>Wholesale Division</option>
                </select>
              </label>
              <label>
                Region
                <input
                  value={draft.region}
                  onChange={(e) =>
                    setDraft({ ...draft, region: e.target.value })
                  }
                  placeholder="Region"
                />
              </label>
              <label>
                Manager
                <input
                  value={draft.manager}
                  onChange={(e) =>
                    setDraft({ ...draft, manager: e.target.value })
                  }
                  placeholder="Manager name"
                />
              </label>
            </div>
            <footer>
              <button onClick={() => setAdding(false)}>Cancel</button>
              <button
                className="primary"
                disabled={workspaceSaving}
                onClick={addWorkspace}
              >
                {workspaceSaving ? "Creating store…" : "Create store & open board"}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
