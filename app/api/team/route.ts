import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { canManageAccess, getHubMember } from "../access";
import { initTeamTables } from "./shared";

const fallbackOwner = {
  name: "Sulliman Alikutti",
  email: "msallikutti@gmail.com",
};

type MailEnvironment = {
  RESEND_API_KEY?: string;
  INVITE_FROM_EMAIL?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function deliverInvitation({
  name,
  email,
  role,
  department,
  inviteUrl,
}: {
  name: string;
  email: string;
  role: string;
  department: string;
  inviteUrl: string;
}) {
  const mailEnv = env as unknown as MailEnvironment;
  if (!mailEnv.RESEND_API_KEY || !mailEnv.INVITE_FROM_EMAIL)
    return { delivery: "ready", error: "Email sender not connected" };

  const safeName = escapeHtml(name),
    safeRole = escapeHtml(role),
    safeDepartment = escapeHtml(department),
    safeUrl = escapeHtml(inviteUrl);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${mailEnv.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: mailEnv.INVITE_FROM_EMAIL,
        to: [email],
        subject: "You are invited to the Maliks Group Hub",
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172438"><div style="padding:22px 26px;background:#172438;color:white;border-radius:14px 14px 0 0"><b style="font-size:20px">Maliks Group Hub</b></div><div style="padding:28px;border:1px solid #dfe6ee;border-top:0;border-radius:0 0 14px 14px"><h2 style="margin-top:0">Welcome, ${safeName}</h2><p>You have been invited to join the Maliks Group Hub as <b>${safeRole}</b> for <b>${safeDepartment}</b>.</p><p style="margin:26px 0"><a href="${safeUrl}" style="display:inline-block;padding:13px 20px;border-radius:8px;background:#1769e8;color:white;text-decoration:none;font-weight:bold">Open your Hub invitation</a></p><p><b>To install the Hub:</b> open the invitation, sign in using this email address, then choose <b>Install Hub</b>. It will appear on your phone or computer like an app.</p><p style="color:#6f7b8b;font-size:13px">For security, access only works with the invited email address: ${escapeHtml(email)}</p></div></div>`,
      }),
    });
    if (!response.ok)
      return {
        delivery: "ready",
        error: "The email service did not accept the message",
      };
    return { delivery: "sent", error: "" };
  } catch {
    return { delivery: "ready", error: "The email service is unavailable" };
  }
}

export async function GET() {
  await initTeamTables();
  const user = await getAuthenticatedUser();
  if (!user?.email)
    return Response.json({ error: "Sign in to access the Maliks Group Hub." }, { status: 401 });
  const current = {
    name: user.fullName || user.displayName || user.email,
    email: user.email.toLowerCase(),
  };
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO team_members (name,email,role,department,active,created_by,created_at)
     VALUES (?,?,?,?,1,?,?)
     ON CONFLICT(email) DO UPDATE SET name=excluded.name,active=1,role='Owner / Admin',access_scope='Full company'`,
  )
    .bind(
      fallbackOwner.name,
      fallbackOwner.email,
      "Owner / Admin",
      "Executive",
      fallbackOwner.email,
      now,
    )
    .run();
  const currentMember = await env.DB.prepare(
    "SELECT * FROM team_members WHERE lower(email)=? AND active=1",
  )
    .bind(current.email)
    .first();
  if (!currentMember)
    return Response.json(
      { error: "This email has not been invited to the Maliks Group Hub." },
      { status: 403 },
    );
  await env.DB.prepare("UPDATE team_members SET name=? WHERE lower(email)=?")
    .bind(current.name, current.email)
    .run();
  await env.DB.prepare(
    "UPDATE team_members SET invite_status='Active',access_scope='Full company',accepted_at=CASE WHEN accepted_at='' THEN ? ELSE accepted_at END WHERE lower(email)=?",
  )
    .bind(now, fallbackOwner.email)
    .run();
  const { results } = await env.DB.prepare(
    "SELECT * FROM team_members WHERE active=1 ORDER BY CASE role WHEN 'Owner / Admin' THEN 0 WHEN 'Manager' THEN 1 WHEN 'Member' THEN 2 ELSE 3 END,name",
  ).all();
  const currentRole = String((currentMember as Record<string, unknown>).role || "Read only"),
    visibleMembers = ["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO"].includes(currentRole)
      ? results
      : results.filter((member) => String(member.email).toLowerCase() === current.email);
  const mailEnv = env as unknown as MailEnvironment;
  return Response.json({
    members: visibleMembers,
    current_user: { ...current, ...(currentMember as Record<string, unknown>) },
    email_delivery_ready: Boolean(
      mailEnv.RESEND_API_KEY && mailEnv.INVITE_FROM_EMAIL,
    ),
  });
}

export async function POST(req: Request) {
  await initTeamTables();
  const current = await getAuthenticatedUser();
  const currentMember = await getHubMember();
  if (!current?.email || !canManageAccess(currentMember))
    return Response.json(
      { error: "Only the Hub owner or technical administrator can manage access." },
      { status: 403 },
    );
  const p = (await req.json()) as Record<string, unknown>;
  const email = String(p.email || "")
    .trim()
    .toLowerCase();
  const name = String(p.name || "").trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return Response.json(
      { error: "Enter the team member’s name and a valid email address." },
      { status: 400 },
    );
  const requestedRole = String(p.role || "Member / Contributor"),
    role = [
      "Owner / Admin",
      "Developer / Technical Admin",
      "Executive / EXCO",
      "Regional Manager",
      "Store Manager",
      "Department Manager",
      "Member / Contributor",
      "Read only",
      "Manager",
      "Member",
      "Viewer",
    ].includes(requestedRole)
      ? requestedRole
      : "Member / Contributor",
    requestedScope = ["Full company", "Selected workspaces", "Assigned workspace", "Read only"].includes(String(p.access_scope))
      ? String(p.access_scope)
      : "Assigned workspace",
    accessScope = requestedScope === "Full company" && !["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO"].includes(role)
      ? "Assigned workspace"
      : requestedScope,
    requestedWorkspaces = Array.isArray(p.workspace_access)
      ? Array.from(new Set(p.workspace_access.map((value) => String(value).trim()).filter(Boolean)))
      : [],
    { results: activeWorkspaces } = await env.DB.prepare(
      "SELECT name FROM workspaces WHERE active=1",
    ).all<{ name: string }>(),
    validNames = new Set(activeWorkspaces.map((workspace) => workspace.name)),
    validWorkspaces = requestedWorkspaces.filter((workspace) => validNames.has(workspace)),
    workspaceAccess = JSON.stringify(
      accessScope === "Full company"
        ? []
        : accessScope === "Assigned workspace"
          ? validWorkspaces.slice(0, 1)
          : validWorkspaces,
    ),
    department = accessScope === "Assigned workspace" && validWorkspaces[0]
      ? validWorkspaces[0]
      : String(p.department || "Operations"),
    inviteToken = crypto.randomUUID().replaceAll("-", ""),
    inviteUrl = new URL(
      `/?invite=${encodeURIComponent(inviteToken)}&install=1`,
      req.url,
    ).toString(),
    createdAt = new Date().toISOString();
  if (role === "Owner / Admin" && email !== fallbackOwner.email)
    return Response.json(
      { error: "Sulliman Alikutti is the sole Hub owner. Assign another access role." },
      { status: 403 },
    );
  if (currentMember?.role !== "Owner / Admin" && role === "Owner / Admin")
    return Response.json(
      { error: "Only the Hub owner can grant owner-level access." },
      { status: 403 },
    );
  if (accessScope !== "Full company" && !(JSON.parse(workspaceAccess) as string[]).length)
    return Response.json(
      { error: "Select at least one store or workspace for this user." },
      { status: 400 },
    );
  const row = await env.DB.prepare(
    `INSERT INTO team_members (name,email,role,department,active,created_by,created_at,invite_status,invite_token,invite_sent_at,accepted_at,access_scope,workspace_access)
     VALUES (?,?,?,?,1,?,?,'Ready to send',?,'','',?,?)
     ON CONFLICT(email) DO UPDATE SET name=excluded.name,role=excluded.role,department=excluded.department,active=1,invite_status='Ready to send',invite_token=excluded.invite_token,access_scope=excluded.access_scope,workspace_access=excluded.workspace_access
     RETURNING *`,
  )
    .bind(
      name,
      email,
      role,
      department,
      current?.email || fallbackOwner.email,
      createdAt,
      inviteToken,
      accessScope,
      workspaceAccess,
    )
    .first();
  const mail = await deliverInvitation({
    name,
    email,
    role,
    department,
    inviteUrl,
  });
  if (mail.delivery === "sent")
    await env.DB.prepare(
      "UPDATE team_members SET invite_status='Sent',invite_sent_at=? WHERE lower(email)=?",
    )
      .bind(createdAt, email)
      .run();
  return Response.json(
    {
      member: {
        ...(row || {}),
        invite_status: mail.delivery === "sent" ? "Sent" : "Ready to send",
      },
      invitation: {
        name,
        email,
        role,
        department,
        access_scope: accessScope,
        workspace_access: JSON.parse(workspaceAccess),
        invite_url: inviteUrl,
        delivery: mail.delivery,
        delivery_error: mail.error,
      },
    },
    { status: 201 },
  );
}

export async function PATCH(req: Request) {
  await initTeamTables();
  const current = await getAuthenticatedUser(),
    currentMember = await getHubMember();
  if (!current?.email || !canManageAccess(currentMember))
    return Response.json(
      { error: "Only the Hub owner or technical administrator can change access." },
      { status: 403 },
    );
  const p = (await req.json()) as Record<string, unknown>,
    email = String(p.email || "").trim().toLowerCase();
  if (!email)
    return Response.json({ error: "Member email is required." }, { status: 400 });
  const existing = await env.DB.prepare(
    "SELECT role FROM team_members WHERE lower(email)=? AND active=1",
  )
    .bind(email)
    .first<{ role: string }>();
  if (!existing)
    return Response.json({ error: "Team member not found." }, { status: 404 });
  if (existing.role === "Owner / Admin" && email !== current.email.toLowerCase())
    return Response.json({ error: "Another owner’s access cannot be changed here." }, { status: 403 });
  const requestedRole = String(p.role || existing.role),
    role = [
      "Owner / Admin",
      "Developer / Technical Admin",
      "Executive / EXCO",
      "Regional Manager",
      "Store Manager",
      "Department Manager",
      "Member / Contributor",
      "Read only",
    ].includes(requestedRole)
      ? requestedRole
      : existing.role,
    requestedScope = ["Full company", "Selected workspaces", "Assigned workspace", "Read only"].includes(String(p.access_scope))
      ? String(p.access_scope)
      : "Assigned workspace",
    accessScope = requestedScope === "Full company" && !["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO"].includes(role)
      ? "Assigned workspace"
      : requestedScope,
    requestedWorkspaces = Array.isArray(p.workspace_access)
      ? Array.from(new Set(p.workspace_access.map((value) => String(value).trim()).filter(Boolean)))
      : [],
    { results: activeWorkspaces } = await env.DB.prepare(
      "SELECT name FROM workspaces WHERE active=1",
    ).all<{ name: string }>(),
    validNames = new Set(activeWorkspaces.map((workspace) => workspace.name)),
    validWorkspaces = requestedWorkspaces.filter((workspace) => validNames.has(workspace)),
    assigned = accessScope === "Full company"
      ? []
      : accessScope === "Assigned workspace"
        ? validWorkspaces.slice(0, 1)
        : validWorkspaces;
  if (role === "Owner / Admin" && email !== fallbackOwner.email)
    return Response.json(
      { error: "Sulliman Alikutti is the sole Hub owner. Assign another access role." },
      { status: 403 },
    );
  if (
    currentMember?.role !== "Owner / Admin" &&
    (existing.role === "Owner / Admin" || role === "Owner / Admin")
  )
    return Response.json(
      { error: "Only the Hub owner can change owner-level access." },
      { status: 403 },
    );
  if (accessScope !== "Full company" && !assigned.length)
    return Response.json(
      { error: "Select at least one store or workspace for this user." },
      { status: 400 },
    );
  const department = accessScope === "Assigned workspace"
    ? assigned[0]
    : String(p.department || "Operations");
  const row = await env.DB.prepare(
    "UPDATE team_members SET name=?,role=?,department=?,access_scope=?,workspace_access=? WHERE lower(email)=? RETURNING *",
  )
    .bind(
      String(p.name || email),
      role,
      department,
      accessScope,
      JSON.stringify(assigned),
      email,
    )
    .first();
  return Response.json({ member: row });
}
