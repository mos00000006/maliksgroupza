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

export const HUMAN_RESOURCE_ROLE = "Human Resource (HR)";

export function isHumanResourceRole(member: HubMember | null | undefined) {
  return Boolean(member && member.role === HUMAN_RESOURCE_ROLE);
}

export async function getHubMember(options: { allowEmployeeRecordsOnly?: boolean } = {}) {
  await initTeamTables();
  const user = await getAuthenticatedUser();
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  const member = await env.DB.prepare(
    "SELECT name,email,role,department,access_scope,workspace_access FROM team_members WHERE lower(email)=? AND active=1",
  )
    .bind(email)
    .first<HubMember>();

  // HR is intentionally isolated from the general Hub. Only Employee Records
  // may opt in to this role by passing allowEmployeeRecordsOnly=true.
  if (isHumanResourceRole(member) && !options.allowEmployeeRecordsOnly) return null;
  return member;
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

export function canApproveTasks(member: HubMember | null | undefined) {
  return Boolean(
    member &&
      (member.role === "Owner / Admin" ||
        member.role === "Developer / Technical Admin" ||
        (member.role === "Executive / EXCO" && member.access_scope === "Full company")),
  );
}
