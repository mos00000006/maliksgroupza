"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import WorkspacesModal, { type WorkspaceTask } from "./workspaces-modal";
import SidekickModal from "./sidekick-modal";
import OperationalView, { type HubTask } from "./operational-view";
import SopLibrary from "./sop-library";
import PwaInstallButton from "./pwa-install-button";
type Status = "Not started" | "In progress" | "Blocked" | "Complete";
type Task = {
  id: number;
  title: string;
  project: string;
  owner: string;
  assignee: string;
  assignee_email: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: Status;
  description: string;
  task_type: string;
  task_group: string;
  created_by: string;
  created_at: string;
};
type Comment = { id: number; body: string; author: string; created_at: string };
type Attachment = {
  id: number;
  name: string;
  type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
};
type Workspace = {
  id: number;
  name: string;
  type: string;
  region: string;
  manager: string;
};
export type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  invite_status?: string;
  invite_sent_at?: string;
  access_scope?: string;
  workspace_access?: string | string[];
};
type HubInvitation = {
  name: string;
  email: string;
  role: string;
  department: string;
  invite_url: string;
  delivery: "sent" | "ready";
  delivery_error?: string;
  access_scope?: string;
  workspace_access?: string[];
};
type HubNotification = {
  id: number;
  task_id: number;
  title: string;
  message: string;
  read_at: string;
  created_at: string;
  project: string;
  due: string;
  status: string;
};
type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
  department?: string;
  access_scope?: string;
  workspace_access?: string | string[];
};
const nav = [
  "Executive Overview",
  "My Work",
  "Store Operations",
  "Wholesale Division",
  "Developments",
  "Financials & P&L",
  "Receiving & Dispatch",
  "SOP & Manuals",
  "Approvals",
  "Reports",
];
const navigationForUser = (user: CurrentHubUser) => {
  let workspaceAccess: string[] = [];
  if (Array.isArray(user.workspace_access)) workspaceAccess = user.workspace_access;
  else {
    try {
      const parsed = JSON.parse(user.workspace_access || "[]");
      workspaceAccess = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {}
  }
  const accessAdmin = ["Owner / Admin", "Developer / Technical Admin"].includes(
      user.role || "",
    ),
    fullCompany =
      accessAdmin ||
      (user.role === "Executive / EXCO" && user.access_scope === "Full company"),
    wholesale = fullCompany || workspaceAccess.includes("Wholesale Division");
  return nav.filter((item) => {
    if (fullCompany) return true;
    if (item === "Wholesale Division") return wholesale;
    return !["Executive Overview", "Developments", "Approvals", "Reports"].includes(item);
  });
};
const roleAssignees = [
  "Muhammad",
  "Operations",
  "Property Team",
  "HR Manager",
  "Store Managers",
  "EXCO",
];
export default function Home() {
  const [active, setActive] = useState("Executive Overview"),
    [tasks, setTasks] = useState<Task[]>([]),
    [workspaces, setWorkspaces] = useState<Workspace[]>([]),
    [teamMembers, setTeamMembers] = useState<TeamMember[]>([]),
    [emailDeliveryReady, setEmailDeliveryReady] = useState(false),
    [currentUser, setCurrentUser] = useState<CurrentHubUser>({ name: "User", email: "" }),
    [notifications, setNotifications] = useState<HubNotification[]>([]),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [mode, setMode] = useState<"table" | "board">("table"),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(false),
    [selected, setSelected] = useState<Task | null>(null),
    [comments, setComments] = useState<Comment[]>([]),
    [files, setFiles] = useState<Attachment[]>([]),
    [comment, setComment] = useState(""),
    [teamOpen, setTeamOpen] = useState(false),
    [workspaceOpen, setWorkspaceOpen] = useState(false),
    [workspaceTarget, setWorkspaceTarget] = useState(""),
    [workspaceCreate, setWorkspaceCreate] = useState(false),
    [sidekickOpen, setSidekickOpen] = useState(false),
    [toast, setToast] = useState(""),
    [accessDenied, setAccessDenied] = useState(false);
  const [inviteResult, setInviteResult] = useState<HubInvitation | null>(null);
  const [memberDraft, setMemberDraft] = useState({
    name: "",
    email: "",
    role: "Member / Contributor",
    department: "Operations",
    access_scope: "Assigned workspace",
    workspace_access: [] as string[],
  });
  const [memberError, setMemberError] = useState("");
  const [editingMemberEmail, setEditingMemberEmail] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberSuccess, setMemberSuccess] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const memberForm = useRef<HTMLDivElement>(null);
  const memberList = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState({
    title: "",
    project: "Wholesale Division",
    owner: "Muhammad",
    assignee: "Muhammad",
    assignee_email: "",
    due: "2026-08-20",
    priority: "Medium" as Task["priority"],
    status: "Not started" as Status,
    task_type: "General",
    task_group: "Store Tasks",
    description: "",
  });
  const loadNotifications = async () => {
    const r = await fetch("/api/notifications");
    if (r.ok) {
      const j = await r.json();
      setNotifications(j.notifications || []);
    }
  };
  const load = async () => {
    try {
      const [r, n] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/notifications"),
      ]);
      const [j, nj] = await Promise.all([r.json(), n.json()]);
      setTasks(j.tasks || []);
      setNotifications(nj.notifications || []);
    } finally {
      setLoading(false);
    }
  };
  const loadTeam = async () => {
    const r = await fetch("/api/team");
    if (!r.ok) {
      setAccessDenied(r.status === 401 || r.status === 403);
      return;
    }
    setAccessDenied(false);
    const j = await r.json();
    setTeamMembers(j.members || []);
    setEmailDeliveryReady(Boolean(j.email_delivery_ready));
    if (j.current_user) {
      setCurrentUser(j.current_user);
      const allowedNavigation = navigationForUser(j.current_user);
      setActive((current) =>
        allowedNavigation.includes(current)
          ? current
          : allowedNavigation[0] || "My Work",
      );
    }
  };
  const loadWorkspaces = async () => {
    const r = await fetch("/api/workspaces");
    if (!r.ok) return;
    const j = await r.json();
    setWorkspaces(j.workspaces || []);
  };
  const flash = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2300);
  };
  useEffect(() => {
    const starter = window.setTimeout(() => {
      void Promise.all([
        load(),
        loadTeam(),
        loadWorkspaces(),
      ]).catch(() => setLoading(false));
    }, 0);
    const timer = window.setInterval(() => void loadNotifications(), 30000);
    return () => {
      window.clearTimeout(starter);
      window.clearInterval(timer);
    };
  }, []);
  const canManageTeam = ["Owner / Admin", "Developer / Technical Admin"].includes(
      currentUser.role || "",
    ),
    readOnlyAccess =
      currentUser.role === "Read only" || currentUser.access_scope === "Read only",
    availableNav = navigationForUser(currentUser);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (!token) return;
    const accept = async () => {
      const response = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        await loadTeam();
        flash("Invitation accepted — welcome to the Maliks Group Hub");
        const url = new URL(window.location.href);
        url.searchParams.delete("invite");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      }
    };
    void accept();
  }, []);
  const shown = useMemo(
    () =>
      tasks.filter((x) => {
        const hay = (
          x.title +
          " " +
          x.project +
          " " +
          x.owner +
          " " +
          x.assignee +
          " " +
          (x.assignee_email || "") +
          " " +
          (x.task_type || "") +
          " " +
          (x.task_group || "")
        ).toLowerCase();
        const view =
          active === "Executive Overview" || active === "Reports"
            ? true
            : active === "My Work"
              ? Boolean(
                  (currentUser.email &&
                    x.assignee_email?.toLowerCase() ===
                      currentUser.email.toLowerCase()) ||
                    hay.includes(currentUser.name.toLowerCase()) ||
                    hay.includes("muhammad"),
                )
              : active === "Store Operations"
                ? !hay.includes("wholesale")
                : active === "Wholesale Division"
                  ? hay.includes("wholesale")
                  : active === "Developments"
                    ? ["sungate", "midway", "new store"].some((v) =>
                        hay.includes(v),
                      )
                    : active === "Financials & P&L"
                      ? true
                      : active === "Receiving & Dispatch"
                        ? ["receiving", "dispatch"].some((v) => hay.includes(v))
                        : active === "Approvals"
                          ? x.status !== "Complete" &&
                            (x.status === "Blocked" || x.priority === "High")
                          : true;
        return view && hay.includes(search.toLowerCase());
      }),
    [tasks, search, active, currentUser],
  );
  const viewCopy: Record<string, string> = {
    "Executive Overview":
      "Master dashboard rolling up all stores, DC, Head Office and Wholesale.",
    "My Work": `Tasks assigned to or owned by ${currentUser.name}.`,
    "Store Operations": "Operational actions across the store network.",
    "Wholesale Division": "Wholesale projects, targets and assigned actions.",
    Developments: "New-store, relocation and expansion budgets, costs and opening readiness.",
    "Financials & P&L":
      "Monthly P&L reporting for every store, DC, Head Office and Wholesale.",
    "Receiving & Dispatch":
      "Warehouse receiving and dispatch responsibilities.",
    "SOP & Manuals": "Controlled procedures, AI workflows and checklists.",
    Approvals: "High-priority and blocked items requiring a decision.",
    Reports: "Group-wide task and completion reporting.",
  };
  const add = async () => {
    if (!draft.title.trim()) return;
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (r.ok) {
      setOpen(false);
      setDraft({ ...draft, title: "", description: "" });
      await load();
      flash("Task created and assigned");
    }
  };
  const status = async (id: number, value: Status) => {
    setTasks(tasks.map((x) => (x.id === id ? { ...x, status: value } : x)));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
  };
  const updateTaskAssignee = async (task: Task, value: string) => {
    const member = value.startsWith("member:")
      ? teamMembers.find((m) => m.email === value.slice(7))
      : undefined;
    const assignee = member ? member.name : value.slice(5);
    const assigneeEmail = member?.email || "";
    const updated = {
      ...task,
      assignee,
      assignee_email: assigneeEmail,
    };
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? updated : item)),
    );
    setSelected(updated);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assignee,
        assignee_email: assigneeEmail,
      }),
    });
    await loadNotifications();
    flash(member ? `Assigned to ${member.name}` : `Assigned to ${assignee}`);
  };
  const detail = async (t: Task) => {
    setSelected(t);
    const r = await fetch(`/api/tasks/${t.id}`);
    const j = await r.json();
    setSelected(j.task);
    setComments(j.comments || []);
    setFiles(j.attachments || []);
  };
  const addComment = async () => {
    if (!selected || !comment.trim()) return;
    const r = await fetch(`/api/tasks/${selected.id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: comment }),
    });
    if (r.ok) {
      setComment("");
      detail(selected);
    }
  };
  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!selected || !f) return;
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch(`/api/tasks/${selected.id}/attachments`, {
      method: "POST",
      body: fd,
    });
    if (r.ok) {
      detail(selected);
      flash("File attached to task");
    } else flash("Upload failed");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(location.origin);
    flash("Hub link copied");
  };
  const copyInvitation = async (invitation: HubInvitation) => {
    await navigator.clipboard.writeText(invitation.invite_url);
    flash(`Invitation link copied for ${invitation.name}`);
  };
  const emailInvitation = (invitation: HubInvitation) => {
    const subject = "You are invited to the Maliks Group Hub";
    const body = `Hi ${invitation.name},\n\nYou have been invited to the Maliks Group Hub as ${invitation.role} for ${invitation.department}.\n\nOpen your secure invitation:\n${invitation.invite_url}\n\nSign in using ${invitation.email}. Once inside, select Install Hub to add it to your phone or computer.\n\nMaliks Group Hub`;
    window.location.href = `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const createInvitation = async (
    member: Pick<TeamMember, "name" | "email" | "role" | "department"> & {
      access_scope?: string;
      workspace_access?: string | string[];
    },
  ) => {
    setMemberError("");
    const workspaceAccess = Array.isArray(member.workspace_access)
      ? member.workspace_access
      : (() => {
          try {
            return JSON.parse(member.workspace_access || "[]") as string[];
          } catch {
            return [];
          }
        })();
    const r = await fetch("/api/team", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...member, workspace_access: workspaceAccess }),
    });
    const j = await r.json();
    if (!r.ok) {
      setMemberError(j.error || "The team member could not be added.");
      return null;
    }
    setInviteResult(j.invitation || null);
    await loadTeam();
    if (j.invitation?.delivery === "sent")
      flash(`Invitation emailed to ${member.email}`);
    else flash("Invitation created and ready to send");
    return j.invitation as HubInvitation;
  };
  const addMember = async () => {
    if (editingMemberEmail) {
      if (memberSaving) return;
      setMemberError("");
      setMemberSuccess("");
      setMemberSaving(true);
      try {
        const response = await fetch("/api/team", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...memberDraft, email: editingMemberEmail }),
        });
        const result = await response.json();
        if (!response.ok) {
          setMemberError(result.error || "The access settings could not be saved.");
          return;
        }
        if (result.member)
          setTeamMembers((members) =>
            members.map((member) =>
              member.email.toLowerCase() === editingMemberEmail.toLowerCase()
                ? result.member
                : member,
            ),
          );
        const savedName = memberDraft.name || editingMemberEmail;
        setMemberSuccess(
          `${savedName} access saved: ${memberDraft.access_scope}${
            memberDraft.workspace_access.length
              ? ` · ${memberDraft.workspace_access.join(", ")}`
              : ""
          }`,
        );
        setEditingMemberEmail("");
        setMemberDraft({
          name: "",
          email: "",
          role: "Member / Contributor",
          department: "Operations",
          access_scope: "Assigned workspace",
          workspace_access: [],
        });
        window.requestAnimationFrame(() => {
          memberList.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        void loadTeam();
        flash("Access saved successfully");
      } catch {
        setMemberError("The Hub could not confirm the save. Please try once more.");
      } finally {
        setMemberSaving(false);
      }
      return;
    }
    const invitation = await createInvitation(memberDraft);
    if (!invitation) return;
    setMemberDraft({
      name: "",
      email: "",
      role: "Member / Contributor",
      department: "Operations",
      access_scope: "Assigned workspace",
      workspace_access: [],
    });
  };
  const editMemberAccess = (member: TeamMember) => {
    let workspaceAccess: string[] = [];
    if (Array.isArray(member.workspace_access)) workspaceAccess = member.workspace_access;
    else {
      try {
        workspaceAccess = JSON.parse(member.workspace_access || "[]") as string[];
      } catch {}
    }
    setEditingMemberEmail(member.email);
    setMemberDraft({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      access_scope: member.access_scope || "Assigned workspace",
      workspace_access: workspaceAccess,
    });
    setMemberError("");
    setMemberSuccess("");
    window.requestAnimationFrame(() => {
      memberForm.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const setDraftAssignee = (value: string) => {
    if (value.startsWith("member:")) {
      const email = value.slice(7);
      const member = teamMembers.find((m) => m.email === email);
      if (member)
        setDraft({
          ...draft,
          assignee: member.name,
          assignee_email: member.email,
        });
      return;
    }
    setDraft({ ...draft, assignee: value.slice(5), assignee_email: "" });
  };
  const openNotification = async (item: HubNotification) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    setNotificationsOpen(false);
    const task = tasks.find((t) => t.id === item.task_id);
    if (task) await detail(task);
    await loadNotifications();
  };
  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await loadNotifications();
  };
  const openComposer = () => {
    const context: Record<
      string,
      { project: string; task_type: string; task_group: string }
    > = {
      "Wholesale Division": {
        project: "Wholesale Division",
        task_type: "Sales",
        task_group: "Store Tasks",
      },
      Developments: {
        project: "Power Build Midway",
        task_type: "Operations",
        task_group: "Store Tasks",
      },
      "Financials & P&L": {
        project: "Head Office",
        task_type: "CAPEX",
        task_group: "Regional Tasks",
      },
      "Receiving & Dispatch": {
        project: "Power Build Warehouse",
        task_type: "Receiving",
        task_group: "Store Tasks",
      },
      "Store Operations": {
        project: "Power Build Warehouse",
        task_type: "Operations",
        task_group: "Store Tasks",
      },
      Approvals: {
        project: "Head Office",
        task_type: "General",
        task_group: "Regional Tasks",
      },
    };
    setDraft((current) => ({ ...current, ...(context[active] || {}) }));
    setOpen(true);
  };
  const workspaceNames = workspaces.map((w) => w.name);
  const selectedAssigneeValue = draft.assignee_email
    ? `member:${draft.assignee_email}`
    : `role:${draft.assignee}`;
  const unread = notifications.filter((n) => !n.read_at).length;
  if (accessDenied)
    return (
      <main className="hubAccessGate">
        <section>
          <i>◆</i>
          <small>MALIKS GROUP HUB</small>
          <h1>Access invitation required</h1>
          <p>
            This signed-in email has not been approved for the company Hub.
            Ask the Hub owner to send an invitation with the correct access level.
          </p>
          <a href="/cdn-cgi/access/logout">Use another approved email</a>
        </section>
      </main>
    );
  return (
    <main className="shell">
      <aside>
        <div className="brand">
          <b>P</b>
          <span>
            <strong>POWERBUILD</strong>
            <small>COMPANY HUB</small>
          </span>
        </div>
        <button className="company" onClick={() => setWorkspaceOpen(true)}>
          <i>PG</i>
          <span>
            <b>PowerBuild Group</b>
            <small>19 stores · 3 divisions</small>
          </span>
        </button>
        <p>WORKSPACE</p>
        <nav>
          <button onClick={() => setWorkspaceOpen(true)}>
            <i>▦</i>Company Workspaces
          </button>
          {availableNav.map((n) => {
            const i = nav.indexOf(n);
            return (
            <button
              key={n}
              className={active === n ? "active" : ""}
              onClick={() => {
                setActive(n);
                setSearch("");
              }}
            >
              <i>{["⌂", "✓", "▦", "↗", "◆", "▤", "⇄", "▥", "◇", "◫"][i]}</i>
              {n}
              {n === "Approvals" && (
                <em>
                  {
                    tasks.filter(
                      (t) =>
                        t.status !== "Complete" &&
                        (t.status === "Blocked" || t.priority === "High"),
                    ).length
                  }
                </em>
              )}
            </button>
            );
          })}
        </nav>
        <button className="aiSide" onClick={() => setSidekickOpen(true)}>
          ✦ AI Sidekick
        </button>
        {canManageTeam && (
          <button className="inviteSide" onClick={() => setTeamOpen(true)}>
            ＋ Manage user access
          </button>
        )}
        <div className="user">
          <i>{currentUser.name.slice(0, 2).toUpperCase()}</i>
          <span>
            <b>{currentUser.name}</b>
            <small>{currentUser.role || "Hub member"}</small>
          </span>
        </div>
      </aside>
      <section className="main">
        <header>
          <div>
            <h1>{active}</h1>
            <p>
              {active === "Executive Overview"
                ? "Master view · All stores, departments and the wholesale division"
                : viewCopy[active]}
            </p>
          </div>
          <div className="actions">
            <label>
              ⌕
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks, owners..."
              />
            </label>
            <button
              className="notificationBtn"
              onClick={() => setNotificationsOpen(true)}
            >
              ◇ Inbox {unread > 0 && <em>{unread}</em>}
            </button>
            {canManageTeam && (
              <button className="teamBtn" onClick={() => setTeamOpen(true)}>
                ♙ Access
              </button>
            )}
            <PwaInstallButton />
            {!readOnlyAccess && (
              <button className="primary" onClick={openComposer}>
                ＋ Add task
              </button>
            )}
          </div>
        </header>
        {active === "SOP & Manuals" ? (
          <SopLibrary
            onTasksChanged={load}
            teamMembers={teamMembers}
            currentUser={currentUser}
          />
        ) : (
          <OperationalView
            key={active}
            active={active}
            tasks={tasks as HubTask[]}
            shown={shown as HubTask[]}
            loading={loading}
            mode={mode}
            setMode={setMode}
            openTask={(task) => void detail(task as Task)}
            setStatus={status}
            openWorkspaces={(name) => {
              setWorkspaceTarget(name || "");
              setWorkspaceCreate(false);
              setWorkspaceOpen(true);
            }}
            createStore={() => {
              setWorkspaceTarget("");
              setWorkspaceCreate(true);
              setWorkspaceOpen(true);
            }}
            addTask={openComposer}
            workspaces={workspaces}
            navigateTo={(view) => {
              setActive(view);
              setSearch("");
            }}
          />
        )}
      </section>
      {open && (
        <div className="overlay" onMouseDown={() => setOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <span>
                <h2>Add and assign task</h2>
                <p>
                  Create the item inside the correct company module and
                  workspace.
                </p>
              </span>
              <button onClick={() => setOpen(false)}>×</button>
            </header>
            <label>
              Item
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="What needs to be done?"
              />
            </label>
            <label>
              Description
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                placeholder="Instructions, expected outcome and relevant details"
              />
            </label>
            <div className="fields">
              <label>
                Workspace
                <select
                  value={draft.project}
                  onChange={(e) =>
                    setDraft({ ...draft, project: e.target.value })
                  }
                >
                  {workspaceNames.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                Group
                <select
                  value={draft.task_group}
                  onChange={(e) =>
                    setDraft({ ...draft, task_group: e.target.value })
                  }
                >
                  <option>Store Tasks</option>
                  <option>Regional Tasks</option>
                  <option>Audit Tasks</option>
                </select>
              </label>
              <label>
                Due Date
                <input
                  type="date"
                  value={draft.due}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as Status })
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
                  value={draft.task_type}
                  onChange={(e) =>
                    setDraft({ ...draft, task_type: e.target.value })
                  }
                >
                  <option>General</option>
                  <option>Operations</option>
                  <option>Maintenance</option>
                  <option>Stock</option>
                  <option>HR / Staffing</option>
                  <option>Audit</option>
                  <option>Regional Instruction</option>
                  <option>CAPEX</option>
                  <option>Receiving</option>
                  <option>Dispatch</option>
                  <option>Sales</option>
                </select>
              </label>
              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      priority: e.target.value as Task["priority"],
                    })
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
                  value={selectedAssigneeValue}
                  onChange={(e) => setDraftAssignee(e.target.value)}
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
            </div>
            <footer>
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={add}>
                Create task
              </button>
            </footer>
          </div>
        </div>
      )}
      {selected && (
        <div
          className="overlay taskOverlay"
          onMouseDown={() => setSelected(null)}
        >
          <div className="detail" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <span>
                <em className={`tag ${selected.priority}`}>
                  ● {selected.priority}
                </em>
                <h2>{selected.title}</h2>
                <p>
                  {selected.project} · {selected.task_group || "Store Tasks"}
                </p>
              </span>
              <button onClick={() => setSelected(null)}>×</button>
            </header>
            <div className="detailBody">
              <section>
                <h3>Task details</h3>
                <p className="description">
                  {selected.description ||
                    "No additional instructions have been added yet."}
                </p>
                <div className="facts">
                  <span>
                    <small>Assignee</small>
                    <select
                      value={
                        selected.assignee_email
                          ? `member:${selected.assignee_email}`
                          : `role:${selected.assignee}`
                      }
                      onChange={(e) =>
                        void updateTaskAssignee(selected, e.target.value)
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
                          new Set([...roleAssignees, selected.assignee]),
                        ).map((person) => (
                          <option key={person} value={`role:${person}`}>
                            {person}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </span>
                  <span>
                    <small>Task Type</small>
                    <b>{selected.task_type || "General"}</b>
                  </span>
                  <span>
                    <small>Due Date</small>
                    <b>{selected.due}</b>
                  </span>
                  <span>
                    <small>Status</small>
                    <select
                      value={selected.status}
                      onChange={(e) => {
                        const s = e.target.value as Status;
                        status(selected.id, s);
                        setSelected({ ...selected, status: s });
                      }}
                    >
                      <option>Not started</option>
                      <option>In progress</option>
                      <option>Blocked</option>
                      <option>Complete</option>
                    </select>
                  </span>
                </div>
                <h3>Updates & comments</h3>
                <div className="commentBox">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add an update, question or instruction…"
                  />
                  <button onClick={addComment}>Post update</button>
                </div>
                <div className="comments">
                  {comments.map((c) => (
                    <article key={c.id}>
                      <i>{c.author.slice(0, 2).toUpperCase()}</i>
                      <span>
                        <b>{c.author}</b>
                        <small>{new Date(c.created_at).toLocaleString()}</small>
                        <p>{c.body}</p>
                      </span>
                    </article>
                  ))}
                  {!comments.length && <p className="empty">No updates yet.</p>}
                </div>
              </section>
              <aside className="files">
                <h3>Documents & pictures</h3>
                <button
                  className="uploadBtn"
                  onClick={() => upload.current?.click()}
                >
                  ＋ Upload attachment
                </button>
                <input
                  ref={upload}
                  hidden
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={uploadFile}
                />
                <small>Pictures, PDFs, Word and Excel · Max 15MB</small>
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={`/api/attachments/${f.id}`}
                    target="_blank"
                  >
                    <i>{f.type.startsWith("image/") ? "▧" : "▤"}</i>
                    <span>
                      <b>{f.name}</b>
                      <small>
                        {(f.size / 1024).toFixed(0)} KB · {f.uploaded_by}
                      </small>
                    </span>
                  </a>
                ))}
                {!files.length && <p className="empty">No files attached.</p>}
              </aside>
            </div>
          </div>
        </div>
      )}
      {teamOpen && (
        <div className="overlay" onMouseDown={() => setTeamOpen(false)}>
          <div className="teamModal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <span>
                <h2>Team access</h2>
                <p>Invite employees to work in the Maliks Group Hub.</p>
              </span>
              <button onClick={() => setTeamOpen(false)}>×</button>
            </header>
            <div className="inviteCard">
              <i>{emailDeliveryReady ? "✉" : "🔗"}</i>
              <span>
                <b>
                  {emailDeliveryReady
                    ? "Automatic invitation email is connected"
                    : "Secure invitations are ready"}
                </b>
                <p>
                  {emailDeliveryReady
                    ? "Adding an employee sends their secure sign-in and installation email automatically."
                    : "Add each employee below, then email or copy their secure invitation. Automatic sending activates when the company email sender is connected."}
                </p>
              </span>
              <button onClick={copyLink}>Copy link</button>
            </div>
            <div className="teamInviteForm" ref={memberForm}>
              <h3>{editingMemberEmail ? "Edit member access" : "Add team member"}</h3>
              {editingMemberEmail && (
                <div className="accessEditNotice">
                  Editing access for <b>{editingMemberEmail}</b>
                  <button
                    onClick={() => {
                      setEditingMemberEmail("");
                      setMemberError("");
                      setMemberDraft({
                        name: "",
                        email: "",
                        role: "Member / Contributor",
                        department: "Operations",
                        access_scope: "Assigned workspace",
                        workspace_access: [],
                      });
                    }}
                  >
                    Cancel edit
                  </button>
                </div>
              )}
              {memberError && <div className="formError">{memberError}</div>}
              <div>
                <label>
                  Full name
                  <input
                    value={memberDraft.name}
                    onChange={(e) =>
                      setMemberDraft({ ...memberDraft, name: e.target.value })
                    }
                    placeholder="Employee name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    value={memberDraft.email}
                    readOnly={Boolean(editingMemberEmail)}
                    onChange={(e) =>
                      setMemberDraft({ ...memberDraft, email: e.target.value })
                    }
                    placeholder="name@company.co.za"
                  />
                </label>
                <label>
                  Role
                  <select
                    value={memberDraft.role}
                    onChange={(e) => {
                      const role = e.target.value,
                        elevated = [
                          "Owner / Admin",
                          "Developer / Technical Admin",
                          "Executive / EXCO",
                        ].includes(role);
                      setMemberDraft({
                        ...memberDraft,
                        role,
                        access_scope:
                          !elevated && memberDraft.access_scope === "Full company"
                            ? "Assigned workspace"
                            : memberDraft.access_scope,
                      });
                    }}
                  >
                    {(editingMemberEmail === "msallikutti@gmail.com" ||
                      memberDraft.email.toLowerCase() === "msallikutti@gmail.com") && (
                      <option>Owner / Admin</option>
                    )}
                    <option>Developer / Technical Admin</option>
                    <option>Executive / EXCO</option>
                    <option>Regional Manager</option>
                    <option>Store Manager</option>
                    <option>Department Manager</option>
                    <option>Member / Contributor</option>
                    <option>Read only</option>
                  </select>
                </label>
                <label>
                  Department / Store
                  <input
                    value={memberDraft.department}
                    onChange={(e) =>
                      setMemberDraft({
                        ...memberDraft,
                        department: e.target.value,
                      })
                    }
                    placeholder="Operations or store name"
                  />
                </label>
                <label>
                  Access level
                  <select
                    value={memberDraft.access_scope}
                    onChange={(e) =>
                      setMemberDraft({
                        ...memberDraft,
                        access_scope: e.target.value,
                        workspace_access:
                          e.target.value === "Full company"
                            ? []
                            : memberDraft.workspace_access,
                      })
                    }
                  >
                    {[
                      "Owner / Admin",
                      "Developer / Technical Admin",
                      "Executive / EXCO",
                    ].includes(memberDraft.role) && <option>Full company</option>}
                    <option>Selected workspaces</option>
                    <option>Assigned workspace</option>
                    <option>Read only</option>
                  </select>
                </label>
              </div>
              {memberDraft.access_scope === "Assigned workspace" && (
                <div className="workspaceAccessPicker singleWorkspacePicker">
                  <b>Store or division assigned to this person</b>
                  <select
                    value={memberDraft.workspace_access[0] || ""}
                    onChange={(e) =>
                      setMemberDraft({
                        ...memberDraft,
                        department: e.target.value,
                        workspace_access: e.target.value ? [e.target.value] : [],
                      })
                    }
                  >
                    <option value="">Select a store or division</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.name}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {["Selected workspaces", "Read only"].includes(memberDraft.access_scope) && (
                <div className="workspaceAccessPicker">
                  <b>
                    {memberDraft.access_scope === "Read only"
                      ? "Select the stores this person may view (no editing)"
                      : "Select stores and divisions this person may access"}
                  </b>
                  <div>
                    {workspaces.map((workspace) => (
                      <label key={workspace.id}>
                        <input
                          type="checkbox"
                          checked={memberDraft.workspace_access.includes(workspace.name)}
                          onChange={(e) =>
                            setMemberDraft({
                              ...memberDraft,
                              workspace_access: e.target.checked
                                ? [...memberDraft.workspace_access, workspace.name]
                                : memberDraft.workspace_access.filter((name) => name !== workspace.name),
                            })
                          }
                        />
                        {workspace.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="primary"
                disabled={memberSaving}
                onClick={() => void addMember()}
              >
                {editingMemberEmail
                  ? memberSaving
                    ? "Saving access…"
                    : "Save access settings"
                  : emailDeliveryReady
                    ? "Add member & send email"
                    : "Create member invitation"}
              </button>
            </div>
            {inviteResult && (
              <div className={`inviteResult ${inviteResult.delivery}`}>
                <i>{inviteResult.delivery === "sent" ? "✓" : "✉"}</i>
                <span>
                  <b>
                    {inviteResult.delivery === "sent"
                      ? "Invitation email sent"
                      : "Invitation ready to send"}
                  </b>
                  <p>
                    {inviteResult.delivery === "sent"
                      ? `${inviteResult.name} can open the email, sign in and install the Hub.`
                      : "The secure invitation and installation instructions are ready. Email sending will become automatic once the company sender is connected."}
                  </p>
                </span>
                <div>
                  <button onClick={() => void copyInvitation(inviteResult)}>
                    Copy invite
                  </button>
                  {inviteResult.delivery !== "sent" && (
                    <button
                      className="primary"
                      onClick={() => emailInvitation(inviteResult)}
                    >
                      Email invitation
                    </button>
                  )}
                </div>
              </div>
            )}
            <div ref={memberList}>
              <h3>Current members</h3>
              {memberSuccess && (
                <div className="accessSavedBanner">
                  <i>✓</i>
                  <span>
                    <b>Access saved successfully</b>
                    <small>{memberSuccess}</small>
                  </span>
                </div>
              )}
            </div>
            <div className="memberList">
              {teamMembers.map((member) => (
                <article
                  className="member memberManageable"
                  key={member.email}
                  role="button"
                  tabIndex={0}
                  onClick={() => editMemberAccess(member)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      editMemberAccess(member);
                    }
                  }}
                >
                  <i>{member.name.slice(0, 2).toUpperCase()}</i>
                  <span>
                    <b>{member.name}</b>
                    <small>
                      {member.email} · {member.department} · {member.access_scope || "Assigned workspace"}
                    </small>
                  </span>
                  <div className="memberInviteState">
                    <em>{member.role}</em>
                    <button
                      className="editAccessBtn"
                      onClick={(event) => {
                        event.stopPropagation();
                        editMemberAccess(member);
                      }}
                    >
                      Edit access
                    </button>
                    {member.role !== "Owner / Admin" && (
                      <>
                        <small>{member.invite_status || "Active"}</small>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void createInvitation(member);
                          }}
                        >
                          Send invite
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <div className="roles">
              <h3>Role structure</h3>
              <p>
                <b>Owner / Admin</b> — full company access and team management
              </p>
              <p>
                <b>Developer / Technical Admin</b> — back-office maintenance,
                security support and system administration
              </p>
              <p>
                <b>Executive / EXCO</b> — company dashboards, reports and approvals
              </p>
              <p>
                <b>Managers</b> — manage only their selected stores or departments
              </p>
              <p>
                <b>Member / Contributor</b> — creates and updates assigned work
              </p>
              <p>
                <b>Read only</b> — dashboards and documents without editing rights
              </p>
            </div>
            <p className="accessNote">
              Invited employees must sign in with the exact approved email.
              Other accounts cannot enter. Their assignments appear in My Work
              and their Hub Inbox.
            </p>
          </div>
        </div>
      )}
      {notificationsOpen && (
        <div
          className="overlay"
          onMouseDown={() => setNotificationsOpen(false)}
        >
          <div
            className="notificationModal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <span>
                <h2>My Hub Inbox</h2>
                <p>
                  Task assignments sent directly to {currentUser.name || "you"}
                </p>
              </span>
              <div>
                {unread > 0 && (
                  <button onClick={() => void markAllRead()}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setNotificationsOpen(false)}>×</button>
              </div>
            </header>
            <div className="notificationList">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  className={item.read_at ? "" : "unread"}
                  onClick={() => void openNotification(item)}
                >
                  <i>{item.read_at ? "✓" : "●"}</i>
                  <span>
                    <b>{item.title}</b>
                    <p>{item.message}</p>
                    <small>
                      {item.project || "Task"} · Due {item.due || "not set"} ·{" "}
                      {new Date(item.created_at).toLocaleString()}
                    </small>
                  </span>
                  <em>Open task →</em>
                </button>
              ))}
              {!notifications.length && (
                <div className="moduleEmpty">
                  <i>◇</i>
                  <b>Your inbox is clear</b>
                  <p>New tasks assigned to your email will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {workspaceOpen && (
        <WorkspacesModal
          initialTasks={tasks as WorkspaceTask[]}
          initialWorkspaces={workspaces}
          teamMembers={teamMembers}
          initialName={workspaceTarget}
          initialCreate={workspaceCreate}
          close={() => {
            setWorkspaceOpen(false);
            setWorkspaceTarget("");
            setWorkspaceCreate(false);
          }}
          onChanged={() => {
            void load();
            void loadWorkspaces();
          }}
          onOpenTask={(task: WorkspaceTask) => {
            setWorkspaceOpen(false);
            setWorkspaceTarget("");
            setWorkspaceCreate(false);
            void detail(task as Task);
          }}
        />
      )}
      {sidekickOpen && (
        <SidekickModal
          close={() => setSidekickOpen(false)}
          openSops={() => {
            setSidekickOpen(false);
            setActive("SOP & Manuals");
          }}
        />
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
