"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import WorkspacesModal, { type WorkspaceTask } from "./workspaces-modal";
import SidekickModal from "./sidekick-modal";
import OperationalView, { type HubTask } from "./operational-view";
import SopLibrary from "./sop-library";
import PwaInstallButton from "./pwa-install-button";
import Catalogue from "./catalogue";
import StoreControls from "./store-controls";
import EmployeeRecords from "./employee-records";
type Status = "Not started" | "In progress" | "Blocked" | "Returned" | "Complete";
type QuickWorkflowKind = "audit" | "incident" | "capex" | "stock";
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
  approval_status: string;
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
  notification_type?: string;
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
  "Store Audits",
  "Daily Checklists",
  "Store Ranking",
  "Employee Records",
  "Wholesale Division",
  "Developments",
  "Financials & P&L",
  "Receiving & Dispatch",
  "SOP & Manuals",
  "Approvals",
  "Reports",
  "Our Catalogue",
];
const HUMAN_RESOURCE_ROLE = "Human Resource (HR)";
const navigationForUser = (user: CurrentHubUser) => {
  if (user.role === HUMAN_RESOURCE_ROLE) return ["Employee Records"];
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
    const employeeRecordsAccess =
      fullCompany ||
      ["Regional Manager", "Store Manager", "Department Manager"].includes(user.role || "") ||
      /(^|\b)(hr|human resources|people)(\b|$)/i.test(user.department || "");
    if (item === "Employee Records") return employeeRecordsAccess;
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
const urlBase64ToUint8Array = (value: string) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};
export default function Home() {
  const [active, setActive] = useState("Executive Overview"),
    [tasks, setTasks] = useState<Task[]>([]),
    [workspaces, setWorkspaces] = useState<Workspace[]>([]),
    [teamMembers, setTeamMembers] = useState<TeamMember[]>([]),
    [emailDeliveryReady, setEmailDeliveryReady] = useState(false),
    [currentUser, setCurrentUser] = useState<CurrentHubUser>({ name: "User", email: "" }),
    [notifications, setNotifications] = useState<HubNotification[]>([]),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [popupNotification, setPopupNotification] = useState<{ title: string; message: string } | null>(null),
    [loading, setLoading] = useState(true),
    [mode, setMode] = useState<"table" | "board">("table"),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(false),
    [mainTaskSaving, setMainTaskSaving] = useState(false),
    [selected, setSelected] = useState<Task | null>(null),
    [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null),
    [deleteBusy, setDeleteBusy] = useState(false),
    [comments, setComments] = useState<Comment[]>([]),
    [files, setFiles] = useState<Attachment[]>([]),
    [comment, setComment] = useState(""),
    [teamOpen, setTeamOpen] = useState(false),
    [workspaceOpen, setWorkspaceOpen] = useState(false),
    [workspaceTarget, setWorkspaceTarget] = useState(""),
    [workspaceCreate, setWorkspaceCreate] = useState(false),
    [returnWorkspaceAfterTask, setReturnWorkspaceAfterTask] = useState(""),
    [sidekickOpen, setSidekickOpen] = useState(false),
    [mobileNavOpen, setMobileNavOpen] = useState(false),
    [quickActionsOpen, setQuickActionsOpen] = useState(false),
    [photoTaskPickerOpen, setPhotoTaskPickerOpen] = useState(false),
    [quickPhotoUploading, setQuickPhotoUploading] = useState(false),
    [quickWorkflow, setQuickWorkflow] = useState<QuickWorkflowKind | null>(null),
    [quickWorkflowSaving, setQuickWorkflowSaving] = useState(false),
    [quickWorkflowFile, setQuickWorkflowFile] = useState<File | null>(null),
    [quickWorkflowForm, setQuickWorkflowForm] = useState({
      workspace: "", department: "", incidentType: "", eventDateTime: "",
      description: "", estimatedLoss: "", responsiblePerson: "", correctiveAction: "",
      managerSignoff: "", category: "", requirement: "", reason: "", estimatedCost: "",
      supplierQuote: "", urgency: "Normal", countDate: "", countedBy: "", varianceNotes: "",
      supervisorSignoff: "", auditArea: "", auditScore: "", findings: "", dueDate: "",
      auditResponsible: "", auditManagerSignoff: "",
    }),
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
  const quickPhotoInput = useRef<HTMLInputElement>(null);
  const quickPhotoTarget = useRef<Task | null>(null);
  const memberForm = useRef<HTMLDivElement>(null);
  const memberList = useRef<HTMLDivElement>(null);
  const notificationIds = useRef<Set<number>>(new Set());
  const notificationSyncReady = useRef(false);
  const pushReady = useRef(false);
  const notificationPromptStarted = useRef(false);
  const taskAlertsAllowed = useRef(true);
  const popupTimer = useRef<number | null>(null);
  const lastPopup = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const suppressedTaskPopupTitles = useRef<Map<string, number>>(new Map());
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
  const showTaskPopup = (title: string, message: string) => {
    const now = Date.now();
    const normalizedTitle = title.trim().toLowerCase();
    for (const [taskTitle, until] of suppressedTaskPopupTitles.current) {
      if (until < now) suppressedTaskPopupTitles.current.delete(taskTitle);
      else if (normalizedTitle.includes(taskTitle)) return;
    }
    const key = `${normalizedTitle}|${message.trim().toLowerCase()}`;
    if (lastPopup.current.key === key && now - lastPopup.current.at < 15000) return;
    lastPopup.current = { key, at: now };
    setPopupNotification({ title, message });
    if (popupTimer.current) window.clearTimeout(popupTimer.current);
    popupTimer.current = window.setTimeout(() => setPopupNotification(null), 8000);
  };
  const applyNotificationSnapshot = async (items: HubNotification[], announce: boolean) => {
    const unreadItems = items.filter((item) => !item.read_at);
    if (announce && notificationSyncReady.current) {
      const fresh = unreadItems.filter((item) => !notificationIds.current.has(item.id));
      if (fresh.length) {
        const newest = fresh[0];
        showTaskPopup(newest.title, newest.message);
        if (
          "Notification" in window &&
          Notification.permission === "granted" &&
          !pushReady.current &&
          "serviceWorker" in navigator
        ) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(newest.title, {
            body: newest.message,
            icon: "/powerbuild-app-icon-192.png",
            badge: "/powerbuild-app-icon-192.png",
            tag: `task-${newest.task_id}`,
            data: { taskId: newest.task_id, url: "/" },
          });
        }
      }
    }
    notificationIds.current = new Set(items.map((item) => item.id));
    notificationSyncReady.current = true;
    setNotifications(items);
  };
  const loadNotifications = async () => {
    const r = await fetch("/api/notifications");
    if (r.ok) {
      const j = await r.json();
      await applyNotificationSnapshot(j.notifications || [], true);
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
      await applyNotificationSnapshot(nj.notifications || [], false);
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
      const hrOnly = j.current_user.role === HUMAN_RESOURCE_ROLE;
      taskAlertsAllowed.current = !hrOnly;
      setCurrentUser(j.current_user);
      if (hrOnly) {
        setNotifications([]);
        notificationIds.current = new Set();
        notificationSyncReady.current = false;
        setNotificationsOpen(false);
        setPopupNotification(null);
        const badgeNavigator = navigator as Navigator & {
          clearAppBadge?: () => Promise<void>;
        };
        void badgeNavigator.clearAppBadge?.();
        document.title = "PowerBuild Hub";
      }
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
  const enableTaskAlerts = async (requestPermission = true) => {
    if (!taskAlertsAllowed.current) return false;
    if (!("serviceWorker" in navigator)) {
      if (requestPermission) flash("This device cannot run background Hub alerts.");
      return false;
    }

    // Register the service worker even before notification permission. This is
    // important for Safari Home Screen web apps because the worker owns the
    // background push event and home-screen badge update.
    try {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (error) {
      console.error("Service worker registration failed", error);
      if (requestPermission) flash("Could not prepare background Hub alerts.");
      return false;
    }

    if (!("Notification" in window) || !("PushManager" in window)) {
      if (requestPermission) flash("Open the Hub from its Home Screen app icon to receive background alerts.");
      return false;
    }

    let permission = Notification.permission;
    if (permission === "default" && requestPermission) {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      if (requestPermission && permission === "denied")
        flash("Task alerts were not allowed on this device. In-Hub popups and counts will still work.");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const keyResponse = await fetch("/api/push/public-key");
        if (!keyResponse.ok) throw new Error("Push key is unavailable");
        const { publicKey } = await keyResponse.json();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }
      const serialized = subscription.toJSON();
      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(serialized),
      });
      if (!save.ok) throw new Error("Unable to save push subscription");
      pushReady.current = true;

      const unreadCount = notifications.filter((item) => !item.read_at).length;
      const badgeNavigator = navigator as Navigator & {
        setAppBadge?: (count?: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      };
      if (unreadCount > 0) await badgeNavigator.setAppBadge?.(unreadCount);
      else await badgeNavigator.clearAppBadge?.();

      if (requestPermission) flash("Background task alerts and app badge are on.");
      void registration.update();
      return true;
    } catch (error) {
      console.error(error);
      pushReady.current = false;
      if (requestPermission) flash("Could not activate background task alerts on this device.");
      return false;
    }
  };
  useEffect(() => {
    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (!taskAlertsAllowed.current) return;
      if (event.data?.type === "hub-push-notification") {
        const item = event.data.notification || {};
        showTaskPopup(item.title || "New task", item.body || "A task was assigned to you.");
        void loadNotifications();
      }
      if (event.data?.type === "hub-open-inbox") setNotificationsOpen(true);
    };
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);
    const starter = window.setTimeout(() => {
      void loadTeam()
        .then(async () => {
          if (!taskAlertsAllowed.current) {
            setTasks([]);
            setWorkspaces([]);
            setLoading(false);
            return;
          }
          await Promise.all([load(), loadWorkspaces()]);

          // Ordinary Hub users keep the service worker / task alert behaviour.
          if ("serviceWorker" in navigator)
            void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => registration.update());

          if ("Notification" in window && Notification.permission === "granted")
            void enableTaskAlerts(false);
        })
        .catch(() => setLoading(false));
    }, 0);

    // iPhone/iPad and desktop browsers only allow the system permission prompt
    // from a real user gesture. The first normal tap/click/key press in the Hub
    // is used automatically, so users do not need to find a separate setup button.
    const requestAlertsOnFirstInteraction = () => {
      if (!taskAlertsAllowed.current) return;
      if (notificationPromptStarted.current) return;
      if (!("Notification" in window) || Notification.permission !== "default") return;
      if (window.sessionStorage.getItem("maliks-task-alert-permission-attempted") === "1") return;

      const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigatorWithStandalone.standalone === true;
      const isiOS =
        /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      // Web Push on iOS is exposed to Home Screen web apps, not an ordinary Safari tab.
      if (isiOS && !standalone) return;

      notificationPromptStarted.current = true;
      window.sessionStorage.setItem("maliks-task-alert-permission-attempted", "1");
      void enableTaskAlerts(true);
      window.removeEventListener("pointerdown", requestAlertsOnFirstInteraction);
      window.removeEventListener("touchend", requestAlertsOnFirstInteraction);
      window.removeEventListener("keydown", requestAlertsOnFirstInteraction);
    };
    window.addEventListener("pointerdown", requestAlertsOnFirstInteraction, { passive: true });
    window.addEventListener("touchend", requestAlertsOnFirstInteraction, { passive: true });
    window.addEventListener("keydown", requestAlertsOnFirstInteraction);

    const timer = window.setInterval(() => { if (taskAlertsAllowed.current) void loadNotifications(); }, 10000);
    return () => {
      window.clearTimeout(starter);
      window.clearInterval(timer);
      if (popupTimer.current) window.clearTimeout(popupTimer.current);
      window.removeEventListener("pointerdown", requestAlertsOnFirstInteraction);
      window.removeEventListener("touchend", requestAlertsOnFirstInteraction);
      window.removeEventListener("keydown", requestAlertsOnFirstInteraction);
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
    };
  }, []);
  useEffect(() => {
    const count = notifications.filter((item) => !item.read_at).length;
    const badgeNavigator = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    document.title = count > 0 ? `(${count}) PowerBuild Hub` : "PowerBuild Hub";
    if (count > 0) void badgeNavigator.setAppBadge?.(count);
    else void badgeNavigator.clearAppBadge?.();
  }, [notifications]);
  const hrOnlyAccess = currentUser.role === HUMAN_RESOURCE_ROLE,
    canManageTeam = ["Owner / Admin", "Developer / Technical Admin"].includes(
      currentUser.role || "",
    ),
    readOnlyAccess =
      currentUser.role === "Read only" || currentUser.access_scope === "Read only",
    availableNav = navigationForUser(currentUser);
  useEffect(() => {
    const saved = window.localStorage.getItem("powerbuild-active-view");
    if (!saved || !nav.includes(saved)) return;
    const timer = window.setTimeout(() => setActive(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (nav.includes(active)) window.localStorage.setItem("powerbuild-active-view", active);
  }, [active]);
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
                          ? x.status === "Complete" &&
                            x.approval_status === "Awaiting approval"
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
    "Store Audits": "Digital branch audits with scoring, evidence and corrective-action tracking.",
    "Daily Checklists": "Daily manager opening-to-closing compliance and exception control.",
    "Store Ranking": "Executive operational ranking across the store network.",
    "Employee Records": "Store employee files, daily attendance, lateness and disciplinary warning history.",
    "Wholesale Division": "Wholesale projects, targets and assigned actions.",
    Developments: "New-store, relocation and expansion budgets, costs and opening readiness.",
    "Financials & P&L":
      "Monthly P&L reporting for every store, DC, Head Office and Wholesale.",
    "Receiving & Dispatch":
      "Warehouse receiving and dispatch responsibilities.",
    "SOP & Manuals": "Controlled procedures, AI workflows and checklists.",
    Approvals: "Completed tasks awaiting management approval.",
    Reports: "Group-wide task and completion reporting.",
    "Our Catalogue": "PowerBuild group product catalogue, codes, pictures and descriptions.",
  };
  const add = async () => {
    if (!draft.title.trim() || mainTaskSaving) return;
    const createdTitle = draft.title.trim().toLowerCase();
    suppressedTaskPopupTitles.current.set(createdTitle, Date.now() + 15000);
    setMainTaskSaving(true);
    try {
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) {
        suppressedTaskPopupTitles.current.delete(createdTitle);
        flash(result.error || "Task could not be created");
        return;
      }
      setOpen(false);
      setDraft({ ...draft, title: "", description: "" });
      if (result.task) setTasks((current) => [result.task, ...current.filter((item) => item.id !== result.task.id)]);
      void load();
      flash("Task created");
    } finally {
      setMainTaskSaving(false);
    }
  };
  const status = async (id: number, value: Status) => {
    const current = tasks.find((item) => item.id === id);
    const nextApproval =
      value === "Complete"
        ? "Awaiting approval"
        : value === "Returned"
          ? "Returned to work"
          : "";
    setTasks((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: value, approval_status: nextApproval }
          : item,
      ),
    );
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (!response.ok) {
      await load();
      if (current) setSelected((item) => (item?.id === id ? current : item));
      return;
    }
    const result = await response.json();
    if (result.task) {
      setTasks((items) =>
        items.map((item) => (item.id === id ? result.task : item)),
      );
      setSelected((item) => (item?.id === id ? result.task : item));
    }
    if (value === "Complete") flash("Task completed and sent to Approvals");
  };
  const approveTask = async (id: number) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approval_action: "approve" }),
    });
    if (!response.ok) {
      flash("This task could not be approved");
      await load();
      return;
    }
    const result = await response.json();
    if (result.task) {
      setTasks((items) =>
        items.map((item) => (item.id === id ? result.task : item)),
      );
      setSelected((item) => (item?.id === id ? result.task : item));
    }
    void loadNotifications();
    flash("Task approved");
  };
  const returnTaskToWork = async (id: number) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approval_action: "return" }),
    });
    if (!response.ok) {
      flash("This task could not be returned to work");
      await load();
      return;
    }
    const result = await response.json();
    if (result.task) {
      setTasks((items) =>
        items.map((item) => (item.id === id ? result.task : item)),
      );
      setSelected((item) => (item?.id === id ? result.task : item));
    }
    void loadNotifications();
    flash(`Task returned to work at ${result.task?.project || "the workspace"}`);
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
  const closeTaskDetail = () => {
    setSelected(null);
    setComments([]);
    setFiles([]);
    if (returnWorkspaceAfterTask) {
      setWorkspaceTarget(returnWorkspaceAfterTask);
      setWorkspaceCreate(false);
      setWorkspaceOpen(true);
      setReturnWorkspaceAfterTask("");
    }
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
  const deleteTask = async (task: Task) => {
    setDeleteBusy(true);
    try {
      const r = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        flash(j.error || "Task could not be deleted");
        return;
      }

      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotifications((current) =>
        current.filter((item) => item.task_id !== task.id),
      );
      setDeleteConfirmTask(null);
      closeTaskDetail();
      flash("Task deleted");
    } finally {
      setDeleteBusy(false);
    }
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
    if (item.notification_type === "EmployeeAttendance") {
      setActive("Employee Records");
      setSearch("");
      await loadNotifications();
      return;
    }
    const task = tasks.find((t) => t.id === item.task_id);
    if (task) {
      setReturnWorkspaceAfterTask("");
      await detail(task);
    }
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
  const quickDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  };
  const quickDefaultWorkspace = (preferred?: string) => {
    if (preferred && workspaces.some((workspace) => workspace.name === preferred)) return preferred;
    const store = workspaces.find((workspace) => workspace.type === "Store");
    return store?.name || workspaces[0]?.name || draft.project;
  };
  const openStructuredWorkflow = (kind: QuickWorkflowKind) => {
    if (readOnlyAccess) {
      flash("Your Hub access is read only");
      return;
    }
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setQuickWorkflowForm({
      workspace: quickDefaultWorkspace(kind === "capex" ? "Head Office" : undefined),
      department: "",
      incidentType: "",
      eventDateTime: localDateTime,
      description: "",
      estimatedLoss: "",
      responsiblePerson: "",
      correctiveAction: "",
      managerSignoff: currentUser.name || "",
      category: "",
      requirement: "",
      reason: "",
      estimatedCost: "",
      supplierQuote: "",
      urgency: "Normal",
      countDate: new Date().toISOString().slice(0, 10),
      countedBy: currentUser.name || "",
      varianceNotes: "",
      supervisorSignoff: "",
      auditArea: "",
      auditScore: "",
      findings: "",
      dueDate: quickDueDate(),
      auditResponsible: "",
      auditManagerSignoff: currentUser.name || "",
    });
    setQuickWorkflowFile(null);
    setQuickActionsOpen(false);
    setQuickWorkflow(kind);
  };
  const updateQuickWorkflowField = (field: string, value: string) =>
    setQuickWorkflowForm((current) => ({ ...current, [field]: value }));
  const submitQuickWorkflow = async () => {
    if (!quickWorkflow || quickWorkflowSaving) return;
    const f = quickWorkflowForm;
    let title = "";
    let taskType = "General";
    let taskGroup = "Store Tasks";
    let priority: Task["priority"] = "Medium";
    let description = "";
    let due = f.dueDate || quickDueDate();

    if (quickWorkflow === "incident") {
      if (!f.workspace || !f.incidentType || !f.description.trim()) {
        flash("Complete the store, incident type and description");
        return;
      }
      title = `Incident: ${f.incidentType}`;
      taskType = "Incident";
      priority = "High";
      description = [
        `INCIDENT REPORT`, `Store: ${f.workspace}`, `Department: ${f.department || "Not specified"}`,
        `Incident type: ${f.incidentType}`, `Date / time: ${f.eventDateTime || "Not specified"}`,
        `Description: ${f.description}`, `Estimated loss: ${f.estimatedLoss || "R0 / Not stated"}`,
        `Responsible / involved: ${f.responsiblePerson || "Not specified"}`,
        `Corrective action: ${f.correctiveAction || "To be assigned"}`,
        `Manager sign-off: ${f.managerSignoff || currentUser.name || "Pending"}`,
      ].join("\n");
    } else if (quickWorkflow === "capex") {
      if (!f.workspace || !f.category || !f.requirement.trim() || !f.reason.trim()) {
        flash("Complete the workspace, category, requirement and reason");
        return;
      }
      title = `CAPEX: ${f.requirement}`;
      taskType = "CAPEX";
      taskGroup = "Regional Tasks";
      priority = f.urgency === "Urgent" ? "High" : "Medium";
      description = [
        `CAPEX REQUEST`, `Store / workspace: ${f.workspace}`, `Category: ${f.category}`,
        `Item / work required: ${f.requirement}`, `Operational reason: ${f.reason}`,
        `Estimated cost: ${f.estimatedCost || "Not stated"}`, `Supplier / quotation: ${f.supplierQuote || "Not supplied"}`,
        `Urgency: ${f.urgency}`, `Requested by: ${currentUser.name || "Hub user"}`,
      ].join("\n");
    } else if (quickWorkflow === "stock") {
      if (!f.workspace || !f.department || !f.countDate) {
        flash("Complete the store, department/category and count date");
        return;
      }
      title = `Stock count: ${f.department}`;
      taskType = "Stock";
      description = [
        `STOCK COUNT CONTROL`, `Store: ${f.workspace}`, `Department / category: ${f.department}`,
        `Count date: ${f.countDate}`, `Counted by: ${f.countedBy || currentUser.name || "Not specified"}`,
        `Variance notes: ${f.varianceNotes || "No variance notes entered"}`,
        `Supervisor sign-off: ${f.supervisorSignoff || "Pending"}`,
      ].join("\n");
      due = f.countDate;
    } else {
      if (!f.workspace || !f.auditArea || !f.findings.trim()) {
        flash("Complete the store, audit area and findings");
        return;
      }
      title = `Store audit: ${f.auditArea}`;
      taskType = "Audit";
      taskGroup = "Audit Tasks";
      priority = "High";
      description = [
        `STORE AUDIT`, `Store: ${f.workspace}`, `Department / area: ${f.auditArea}`,
        `Score: ${f.auditScore || "Not scored"}`, `Findings: ${f.findings}`,
        `Corrective action: ${f.correctiveAction || "To be assigned"}`,
        `Responsible person: ${f.auditResponsible || "Not assigned"}`, `Corrective action due: ${f.dueDate || "Not set"}`,
        `Manager sign-off: ${f.auditManagerSignoff || currentUser.name || "Pending"}`,
      ].join("\n");
    }

    setQuickWorkflowSaving(true);
    try {
      const payload = {
        ...draft,
        title,
        project: f.workspace,
        due,
        priority,
        status: "Not started" as Status,
        task_type: taskType,
        task_group: taskGroup,
        description,
      };
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.task) {
        flash(result.error || "The workflow record could not be created");
        return;
      }
      if (quickWorkflowFile) {
        const formData = new FormData();
        formData.append("file", quickWorkflowFile);
        await fetch(`/api/tasks/${result.task.id}/attachments`, { method: "POST", body: formData });
      }
      setTasks((current) => [result.task, ...current.filter((item) => item.id !== result.task.id)]);
      setQuickWorkflow(null);
      setQuickWorkflowFile(null);
      void load();
      flash(`${quickWorkflow === "incident" ? "Incident" : quickWorkflow === "capex" ? "CAPEX request" : quickWorkflow === "stock" ? "Stock count" : "Store audit"} created`);
    } finally {
      setQuickWorkflowSaving(false);
    }
  };
  const quickNavigate = (view: string) => {
    if (!availableNav.includes(view)) {
      flash("This section is not available for your access level");
      return;
    }
    setQuickActionsOpen(false);
    setSearch("");
    setActive(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const beginQuickPhoto = () => {
    if (readOnlyAccess) {
      flash("Your Hub access is read only");
      return;
    }
    const openTasks = tasks.filter((task) => task.status !== "Complete");
    if (!openTasks.length) {
      setQuickActionsOpen(false);
      flash("Create or open a task before adding photo evidence");
      return;
    }
    setQuickActionsOpen(false);
    setPhotoTaskPickerOpen(true);
  };
  const chooseQuickPhotoTask = (task: Task) => {
    quickPhotoTarget.current = task;
    setPhotoTaskPickerOpen(false);
    quickPhotoInput.current?.click();
  };
  const uploadQuickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const task = quickPhotoTarget.current;
    if (!file || !task) return;
    setQuickPhotoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        body: form,
      });
      if (response.ok) flash(`Photo attached to ${task.title}`);
      else flash("Photo upload failed");
    } catch {
      flash("Photo upload failed");
    } finally {
      setQuickPhotoUploading(false);
      quickPhotoTarget.current = null;
      event.target.value = "";
    }
  };
  const quickPhotoTasks = [...tasks]
    .filter((task) => task.status !== "Complete")
    .sort((a, b) => (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31"))
    .slice(0, 12);
  const workspaceNames = workspaces.map((w) => w.name);
  const selectedAssigneeValue = draft.assignee_email
    ? `member:${draft.assignee_email}`
    : `role:${draft.assignee}`;
  const unread = notifications.filter((n) => !n.read_at).length;
  const isStoreControlView = ["Store Audits", "Daily Checklists", "Store Ranking"].includes(active);
  const isEmployeeRecordsView = active === "Employee Records";
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
      <aside className={mobileNavOpen ? "mobileOpen" : ""}>
        <div className="brand">
          <img
            className="brandLogoMark"
            src="/powerbuild-logo-transparent.png"
            alt="PowerBuild logo"
          />
          <span>
            <strong>POWERBUILD</strong>
            <small>COMPANY HUB</small>
          </span>
        </div>
        {!hrOnlyAccess ? (
          <>
            <button
              className="company"
              onClick={() => {
                setWorkspaceOpen(true);
                setMobileNavOpen(false);
              }}
            >
              <i>PG</i>
              <span>
                <b>PowerBuild Group</b>
                <small>19 stores · 3 divisions</small>
              </span>
            </button>
            <p>WORKSPACE</p>
          </>
        ) : (
          <>
            <div className="company">
              <i>HR</i>
              <span>
                <b>Human Resources</b>
                <small>Employee Records only</small>
              </span>
            </div>
            <p>EMPLOYEE RECORDS</p>
          </>
        )}
        <nav>
          {!hrOnlyAccess && (
            <button
              onClick={() => {
                setWorkspaceOpen(true);
                setMobileNavOpen(false);
              }}
            >
              <i>▦</i>Company Workspaces
            </button>
          )}
          {availableNav.map((n) => {
            return (
            <button
              key={n}
              className={active === n ? "active" : ""}
              onClick={() => {
                setActive(n);
                setSearch("");
                setMobileNavOpen(false);
              }}
            >
              <i>{({
                "Executive Overview": "⌂",
                "My Work": "✓",
                "Store Operations": "▦",
                "Store Audits": "◎",
                "Daily Checklists": "☑",
                "Store Ranking": "◆",
                "Employee Records": "♙",
                "Wholesale Division": "↗",
                "Developments": "◇",
                "Financials & P&L": "▤",
                "Receiving & Dispatch": "⇄",
                "SOP & Manuals": "▥",
                "Approvals": "◫",
                "Reports": "▧",
                "Our Catalogue": "▦",
              } as Record<string,string>)[n] || "•"}</i>
              {n}
              {n === "Approvals" && (
                <em>
                  {
                    tasks.filter(
                      (t) =>
                        t.status === "Complete" &&
                        t.approval_status === "Awaiting approval",
                    ).length
                  }
                </em>
              )}
            </button>
            );
          })}
        </nav>
        {!hrOnlyAccess && (
          <button
            className="aiSide"
            onClick={() => {
              setSidekickOpen(true);
              setMobileNavOpen(false);
            }}
          >
            ✦ AI Sidekick
          </button>
        )}
        {canManageTeam && (
          <button
            className="inviteSide"
            onClick={() => {
              setTeamOpen(true);
              setMobileNavOpen(false);
            }}
          >
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
      {mobileNavOpen && (
        <button
          className="mobileNavBackdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <section className="main">
        <header>
          <button
            className="mobileMenuBtn"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            ☰
          </button>
          <div className="headerTitle">
            <h1>{active}</h1>
            <p>
              {active === "Executive Overview"
                ? "Master view · All stores, departments and the wholesale division"
                : viewCopy[active]}
            </p>
          </div>
          <div className="actions">
            {active !== "Our Catalogue" && !isStoreControlView && !isEmployeeRecordsView && (
              <label>
                ⌕
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks, owners..."
                />
              </label>
            )}
            {!hrOnlyAccess && (
              <>
                <button
                  className="quickActionsHeaderBtn"
                  onClick={() => setQuickActionsOpen(true)}
                >
                  ⚡ Quick
                </button>
                <button
                  className="notificationBtn"
                  onClick={() => setNotificationsOpen(true)}
                >
                  ◇ Inbox {unread > 0 && <em>{unread}</em>}
                </button>
              </>
            )}
            {canManageTeam && (
              <button className="teamBtn" onClick={() => setTeamOpen(true)}>
                ♙ Access
              </button>
            )}
            <PwaInstallButton />
            {!readOnlyAccess && active !== "Our Catalogue" && !isStoreControlView && !isEmployeeRecordsView && (
              <button className="primary" onClick={openComposer}>
                ＋ Add task
              </button>
            )}
          </div>
        </header>
        {isStoreControlView ? (
          <StoreControls
            initialView={active}
            currentUser={currentUser}
            onNavigate={(view) => {
              setActive(view);
              setSearch("");
            }}
          />
        ) : isEmployeeRecordsView ? (
          <EmployeeRecords currentUser={currentUser} />
        ) : active === "Our Catalogue" ? (
          <Catalogue currentUserEmail={currentUser.email} />
        ) : active === "SOP & Manuals" ? (
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
            openTask={(task) => {
              setReturnWorkspaceAfterTask("");
              void detail(task as Task);
            }}
            setStatus={status}
            approveTask={approveTask}
            returnTaskToWork={returnTaskToWork}
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
      {!hrOnlyAccess && (
        <button
          className="mobileQuickActionsFab"
          onClick={() => setQuickActionsOpen(true)}
          aria-label="Open quick actions"
        >
          <i>＋</i><span>Quick</span>
        </button>
      )}
      <input
        ref={quickPhotoInput}
        className="quickPhotoInput"
        hidden
        type="file"
        accept="image/*"
        onChange={uploadQuickPhoto}
      />
      {quickActionsOpen && !hrOnlyAccess && (
        <div className="overlay quickActionsOverlay" onMouseDown={() => setQuickActionsOpen(false)}>
          <section className="quickActionsSheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <span>
                <small>POWERBUILD MOBILE</small>
                <h2>Quick actions</h2>
                <p>Start the most common store and management actions in one tap.</p>
              </span>
              <button className="quickActionsClose" onClick={() => setQuickActionsOpen(false)} aria-label="Close quick actions">×</button>
            </header>
            <div className="quickActionsGrid">
              {!readOnlyAccess && <button onClick={() => { setQuickActionsOpen(false); openComposer(); }}><i className="qaBlue">＋</i><span><b>New Task</b><small>Create and assign a task</small></span></button>}
              <button onClick={() => quickNavigate("Store Audits")}><i className="qaGold">✓</i><span><b>Audit Store</b><small>Open the digital store audit</small></span></button>
              <button onClick={() => quickNavigate("Daily Checklists")}><i className="qaGreen">☑</i><span><b>Daily Checklist</b><small>Complete today&apos;s manager controls</small></span></button>
              {availableNav.includes("Employee Records") && <button onClick={() => quickNavigate("Employee Records")}><i className="qaTeal">♙</i><span><b>Staff Attendance</b><small>Mark at work, absent or late</small></span></button>}
              {!readOnlyAccess && <button onClick={() => openStructuredWorkflow("incident")}><i className="qaRed">!</i><span><b>Report Incident</b><small>Capture an urgent store issue</small></span></button>}
              {!readOnlyAccess && <button onClick={beginQuickPhoto} disabled={quickPhotoUploading}><i className="qaPurple">▧</i><span><b>{quickPhotoUploading ? "Uploading…" : "Upload Photo"}</b><small>Add evidence to an open task</small></span></button>}
              {!readOnlyAccess && <button onClick={() => openStructuredWorkflow("capex")}><i className="qaGreen">R</i><span><b>CAPEX Request</b><small>Submit an expenditure request</small></span></button>}
              {!readOnlyAccess && <button onClick={() => openStructuredWorkflow("stock")}><i className="qaOrange">#</i><span><b>Stock Count</b><small>Start a controlled count task</small></span></button>}
              {availableNav.includes("Wholesale Division") && <button onClick={() => quickNavigate("Wholesale Division")}><i className="qaTeal">↗</i><span><b>Customer Visit</b><small>Open Wholesale CRM and visits</small></span></button>}
              {availableNav.includes("Approvals") && <button onClick={() => quickNavigate("Approvals")}><i className="qaNavy">◇</i><span><b>Approve Item</b><small>Review completed work awaiting approval</small></span></button>}
            </div>
          </section>
        </div>
      )}
      {quickWorkflow && (
        <div className="overlay quickWorkflowOverlay" onMouseDown={() => !quickWorkflowSaving && setQuickWorkflow(null)}>
          <section className="quickWorkflowModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <span>
                <small>POWERBUILD QUICK WORKFLOW</small>
                <h2>{quickWorkflow === "incident" ? "Report Incident" : quickWorkflow === "capex" ? "CAPEX Request" : quickWorkflow === "stock" ? "Stock Count" : "Store Audit"}</h2>
                <p>Complete the required control fields. The record is saved into the Hub and can be followed through to completion.</p>
              </span>
              <button className="quickActionsClose" onClick={() => setQuickWorkflow(null)} aria-label="Close workflow">×</button>
            </header>
            <div className="quickWorkflowBody">
              <div className="quickWorkflowFields twoCol">
                <label>Store / Workspace<select value={quickWorkflowForm.workspace} onChange={(e) => updateQuickWorkflowField("workspace", e.target.value)}>{workspaceNames.map((name) => <option key={name}>{name}</option>)}</select></label>
                {quickWorkflow !== "capex" && <label>Department / Area<input value={quickWorkflow === "audit" ? quickWorkflowForm.auditArea : quickWorkflowForm.department} onChange={(e) => updateQuickWorkflowField(quickWorkflow === "audit" ? "auditArea" : "department", e.target.value)} placeholder="e.g. Receiving, Yard, Paint" /></label>}
              </div>

              {quickWorkflow === "incident" && <>
                <div className="quickWorkflowFields twoCol">
                  <label>Incident Type<select value={quickWorkflowForm.incidentType} onChange={(e) => updateQuickWorkflowField("incidentType", e.target.value)}><option value="">Select type</option><option>Stock loss / shortage</option><option>Damage / breakage</option><option>Theft / security</option><option>Customer incident</option><option>Staff incident</option><option>Vehicle / delivery</option><option>Safety incident</option><option>Other</option></select></label>
                  <label>Date & Time<input type="datetime-local" value={quickWorkflowForm.eventDateTime} onChange={(e) => updateQuickWorkflowField("eventDateTime", e.target.value)} /></label>
                </div>
                <label>Description<textarea value={quickWorkflowForm.description} onChange={(e) => updateQuickWorkflowField("description", e.target.value)} placeholder="What happened? Include the facts and immediate action taken." /></label>
                <div className="quickWorkflowFields twoCol"><label>Estimated Loss (R)<input inputMode="decimal" value={quickWorkflowForm.estimatedLoss} onChange={(e) => updateQuickWorkflowField("estimatedLoss", e.target.value)} placeholder="0.00" /></label><label>Responsible / Involved Person<input value={quickWorkflowForm.responsiblePerson} onChange={(e) => updateQuickWorkflowField("responsiblePerson", e.target.value)} /></label></div>
                <label>Corrective Action<textarea value={quickWorkflowForm.correctiveAction} onChange={(e) => updateQuickWorkflowField("correctiveAction", e.target.value)} placeholder="Action required to close or prevent recurrence" /></label>
                <label>Manager Sign-off<input value={quickWorkflowForm.managerSignoff} onChange={(e) => updateQuickWorkflowField("managerSignoff", e.target.value)} /></label>
              </>}

              {quickWorkflow === "capex" && <>
                <div className="quickWorkflowFields twoCol"><label>CAPEX Category<select value={quickWorkflowForm.category} onChange={(e) => updateQuickWorkflowField("category", e.target.value)}><option value="">Select category</option><option>Shelving / Fixtures</option><option>Systems / IT</option><option>Renovation / Building</option><option>Equipment</option><option>Vehicle</option><option>Signage</option><option>Security</option><option>Other</option></select></label><label>Urgency<select value={quickWorkflowForm.urgency} onChange={(e) => updateQuickWorkflowField("urgency", e.target.value)}><option>Normal</option><option>Urgent</option></select></label></div>
                <label>Item / Work Required<input value={quickWorkflowForm.requirement} onChange={(e) => updateQuickWorkflowField("requirement", e.target.value)} placeholder="What must be purchased or completed?" /></label>
                <label>Operational Reason<textarea value={quickWorkflowForm.reason} onChange={(e) => updateQuickWorkflowField("reason", e.target.value)} placeholder="Why is this CAPEX required?" /></label>
                <div className="quickWorkflowFields twoCol"><label>Estimated Cost (R)<input inputMode="decimal" value={quickWorkflowForm.estimatedCost} onChange={(e) => updateQuickWorkflowField("estimatedCost", e.target.value)} /></label><label>Supplier / Quote Reference<input value={quickWorkflowForm.supplierQuote} onChange={(e) => updateQuickWorkflowField("supplierQuote", e.target.value)} placeholder="Supplier name or quotation no." /></label></div>
              </>}

              {quickWorkflow === "stock" && <>
                <div className="quickWorkflowFields twoCol"><label>Count Date<input type="date" value={quickWorkflowForm.countDate} onChange={(e) => updateQuickWorkflowField("countDate", e.target.value)} /></label><label>Counted By<input value={quickWorkflowForm.countedBy} onChange={(e) => updateQuickWorkflowField("countedBy", e.target.value)} /></label></div>
                <label>Variance Notes<textarea value={quickWorkflowForm.varianceNotes} onChange={(e) => updateQuickWorkflowField("varianceNotes", e.target.value)} placeholder="Record shortages, overages, recounts or exceptions" /></label>
                <label>Supervisor Sign-off<input value={quickWorkflowForm.supervisorSignoff} onChange={(e) => updateQuickWorkflowField("supervisorSignoff", e.target.value)} placeholder="Supervisor name" /></label>
              </>}

              {quickWorkflow === "audit" && <>
                <div className="quickWorkflowFields twoCol"><label>Audit Score (%)<input type="number" min="0" max="100" value={quickWorkflowForm.auditScore} onChange={(e) => updateQuickWorkflowField("auditScore", e.target.value)} placeholder="0 - 100" /></label><label>Corrective Action Due<input type="date" value={quickWorkflowForm.dueDate} onChange={(e) => updateQuickWorkflowField("dueDate", e.target.value)} /></label></div>
                <label>Findings<textarea value={quickWorkflowForm.findings} onChange={(e) => updateQuickWorkflowField("findings", e.target.value)} placeholder="Record observations, non-compliance and good practice" /></label>
                <label>Corrective Action<textarea value={quickWorkflowForm.correctiveAction} onChange={(e) => updateQuickWorkflowField("correctiveAction", e.target.value)} placeholder="What must be corrected?" /></label>
                <div className="quickWorkflowFields twoCol"><label>Responsible Person<input value={quickWorkflowForm.auditResponsible} onChange={(e) => updateQuickWorkflowField("auditResponsible", e.target.value)} /></label><label>Manager Sign-off<input value={quickWorkflowForm.auditManagerSignoff} onChange={(e) => updateQuickWorkflowField("auditManagerSignoff", e.target.value)} /></label></div>
              </>}

              <label className="quickWorkflowFile">Photo / Supporting Document<input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setQuickWorkflowFile(e.target.files?.[0] || null)} /><small>{quickWorkflowFile ? quickWorkflowFile.name : "Optional — attach photo evidence, quotation or count sheet."}</small></label>
            </div>
            <footer><button disabled={quickWorkflowSaving} onClick={() => setQuickWorkflow(null)}>Cancel</button><button className="primary" disabled={quickWorkflowSaving} onClick={() => void submitQuickWorkflow()}>{quickWorkflowSaving ? "Saving…" : quickWorkflow === "incident" ? "Submit Incident" : quickWorkflow === "capex" ? "Submit CAPEX" : quickWorkflow === "stock" ? "Save Stock Count" : "Save Audit"}</button></footer>
          </section>
        </div>
      )}
      {photoTaskPickerOpen && (
        <div className="overlay quickActionsOverlay" onMouseDown={() => setPhotoTaskPickerOpen(false)}>
          <section className="quickPhotoSheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <span><small>PHOTO EVIDENCE</small><h2>Choose the task</h2><p>The photo will be attached directly to the selected task.</p></span>
              <button className="quickActionsClose" onClick={() => setPhotoTaskPickerOpen(false)} aria-label="Close photo task picker">×</button>
            </header>
            <div className="quickPhotoTaskList">
              {quickPhotoTasks.map((task) => (
                <button key={task.id} onClick={() => chooseQuickPhotoTask(task)}>
                  <i>▧</i>
                  <span><b>{task.title}</b><small>{task.project} · {task.status}</small></span>
                  <em>{task.due || "No due date"}</em>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
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
                  <option>Incident</option>
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
              <button className="primary" disabled={mainTaskSaving} onClick={() => void add()}>
                {mainTaskSaving ? "Creating…" : "Create task"}
              </button>
            </footer>
          </div>
        </div>
      )}
      {deleteConfirmTask && (
        <div
          className="overlay deleteConfirmOverlay"
          onMouseDown={() => !deleteBusy && setDeleteConfirmTask(null)}
        >
          <div
            className="deleteConfirmModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="deleteConfirmIcon">!</div>
            <h2 id="delete-task-title">Delete task?</h2>
            <p>
              Are you sure you want to delete <strong>“{deleteConfirmTask.title}”</strong>?
            </p>
            <small>
              This will permanently remove the task, its comments, attachments and task notifications.
            </small>
            <div className="deleteConfirmActions">
              <button
                type="button"
                className="deleteConfirmCancel"
                disabled={deleteBusy}
                onClick={() => setDeleteConfirmTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="deleteConfirmButton"
                disabled={deleteBusy}
                onClick={() => void deleteTask(deleteConfirmTask)}
              >
                {deleteBusy ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div
          className="overlay taskOverlay"
          onMouseDown={closeTaskDetail}
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
              <div className="taskHeaderActions">
                {!readOnlyAccess && (
                  <button
                    className="deleteTaskBtn"
                    onClick={() => setDeleteConfirmTask(selected)}
                    title="Delete task"
                  >
                    Delete
                  </button>
                )}
                <button
                  className="taskCloseBtn"
                  onClick={closeTaskDetail}
                  aria-label="Close task"
                >
                  ×
                </button>
              </div>
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
                      <option value="Returned" disabled>Returned</option>
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
                      const isHr = role === HUMAN_RESOURCE_ROLE;
                      setMemberDraft({
                        ...memberDraft,
                        role,
                        department: isHr ? "Human Resources" : memberDraft.department,
                        access_scope:
                          isHr
                            ? "Assigned workspace"
                            : !elevated && memberDraft.access_scope === "Full company"
                              ? "Assigned workspace"
                              : memberDraft.access_scope,
                        workspace_access: isHr
                          ? memberDraft.workspace_access.slice(0, 1)
                          : memberDraft.workspace_access,
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
                    <option>{HUMAN_RESOURCE_ROLE}</option>
                    <option>Member / Contributor</option>
                    <option>Read only</option>
                  </select>
                </label>
                <label>
                  Department / Store
                  <input
                    value={memberDraft.role === HUMAN_RESOURCE_ROLE ? "Human Resources" : memberDraft.department}
                    readOnly={memberDraft.role === HUMAN_RESOURCE_ROLE}
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
                    disabled={memberDraft.role === HUMAN_RESOURCE_ROLE}
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
              {memberDraft.role === HUMAN_RESOURCE_ROLE && (
                <div className="accessEditNotice">
                  <span>
                    <b>Human Resource (HR) — Employee Records only</b><br />
                    This user is restricted to one assigned store. They cannot view tasks, dashboards, financials,
                    wholesale, SOPs, catalogue, company workspaces, AI Sidekick or Hub task notifications.
                  </span>
                </div>
              )}
              {memberDraft.access_scope === "Assigned workspace" && (
                <div className="workspaceAccessPicker singleWorkspacePicker">
                  <b>
                    {memberDraft.role === HUMAN_RESOURCE_ROLE
                      ? "Store assigned to this HR user (Employee Records only)"
                      : "Store or division assigned to this person"}
                  </b>
                  <select
                    value={memberDraft.workspace_access[0] || ""}
                    onChange={(e) =>
                      setMemberDraft({
                        ...memberDraft,
                        department: memberDraft.role === HUMAN_RESOURCE_ROLE ? "Human Resources" : e.target.value,
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
                <b>Human Resource (HR)</b> — Employee Records only for one assigned store; may maintain staff files,
                attendance, lateness, warnings and HR history, but has no access to tasks, company dashboards or Hub task notifications
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
      {notificationsOpen && !hrOnlyAccess && (
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
                  Tasks, approvals, employee attendance and workflow alerts for {currentUser.name || "you"}
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
                      {item.notification_type === "EmployeeAttendance"
                        ? `Employee Records · ${new Date(item.created_at).toLocaleString()}`
                        : `${item.project || "Task"} · Due ${item.due || "not set"} · ${new Date(item.created_at).toLocaleString()}`}
                    </small>
                  </span>
                  <em>{item.notification_type === "EmployeeAttendance" ? "View employee records →" : "Open task →"}</em>
                </button>
              ))}
              {!notifications.length && (
                <div className="moduleEmpty">
                  <i>◇</i>
                  <b>Your inbox is clear</b>
                  <p>New tasks, approvals and returned-to-work alerts will appear here.</p>
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
          onTaskCreated={(task: WorkspaceTask) => {
            suppressedTaskPopupTitles.current.set(task.title.trim().toLowerCase(), Date.now() + 15000);
            setTasks((current) => [task as Task, ...current.filter((item) => item.id !== task.id)]);
          }}
          onOpenTask={(task: WorkspaceTask) => {
            setReturnWorkspaceAfterTask(task.project);
            setWorkspaceOpen(false);
            setWorkspaceTarget(task.project);
            setWorkspaceCreate(false);
            void detail(task as Task);
          }}
        />
      )}
      {!hrOnlyAccess && (
        <button
          className="mobileAiFab"
          onClick={() => setSidekickOpen(true)}
          aria-label="Open AI Sidekick"
        >
          ✦ <span>AI</span>
        </button>
      )}
      {sidekickOpen && !hrOnlyAccess && (
        <SidekickModal
          close={() => setSidekickOpen(false)}
          openSops={() => {
            setSidekickOpen(false);
            setActive("SOP & Manuals");
          }}
        />
      )}
      {popupNotification && !hrOnlyAccess && (
        <button
          className="taskNotificationPopup"
          onClick={() => {
            setPopupNotification(null);
            setNotificationsOpen(true);
          }}
        >
          <img src="/powerbuild-app-icon-192.png" alt="" />
          <span>
            <small>POWERBUILD HUB ALERT</small>
            <b>{popupNotification.title}</b>
            <p>{popupNotification.message}</p>
          </span>
          <em>View →</em>
        </button>
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
