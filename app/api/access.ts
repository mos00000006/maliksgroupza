import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../auth";
import { initTeamTables } from "./team/shared";

export type HubMember = {
  name: string;
  email: string;
  role: string;
  department: string;
  access_scope: string;
  workspace_access: string;
};

export async function getHubMember() {
  await initTeamTables();
  const user = await getAuthenticatedUser();
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  return env.DB.prepare(
    "SELECT name,email,role,department,access_scope,workspace_access FROM team_members WHERE lower(email)=? AND active=1",
  )
    .bind(email)
    .first<HubMember>();
}

function parseWorkspaceAccess(member: HubMember) {
  try {
    const parsed = JSON.parse(member.workspace_access || "[]");
    return Array.isArray(parsed)
      ? Array.from(
          new Set(
            parsed
              .map((value) => String(value).trim())
              .filter(Boolean),
          ),
        )
      : [];
  } catch {
    return [];
  }
}

export function allowedWorkspaces(member: HubMember | null | undefined) {
  if (!member) return [];
  if (member.role === "Owner / Admin" || member.role === "Developer / Technical Admin")
    return null;
  if (member.access_scope === "Full company" && member.role === "Executive / EXCO")
    return null;
  const selected = parseWorkspaceAccess(member);
  if (member.access_scope === "Assigned workspace")
    return selected.slice(0, 1).length ? selected.slice(0, 1) : [member.department].filter(Boolean);
  return selected.length ? selected : [member.department].filter(Boolean);
}

export function canWrite(member: HubMember | null | undefined) {
  return Boolean(member && member.role !== "Read only" && member.role !== "Viewer" && member.access_scope !== "Read only");
}

export function canAccessWorkspace(
  member: HubMember | null | undefined,
  workspace: string,
) {
  const allowed = allowedWorkspaces(member);
  const target = workspace.trim().toLowerCase();
  return allowed === null || allowed.some((name) => name.trim().toLowerCase() === target);
}

export function canManageAccess(member: HubMember | null | undefined) {
  return Boolean(member && ["Owner / Admin", "Developer / Technical Admin"].includes(member.role));
}
