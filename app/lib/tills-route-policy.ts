/** Restrict Sales / Tills employees to their own checkout surface at the edge.
 * Non-cashier roles continue through the Hub's existing authorisation rules.
 * Note: public QR-tag and static asset requests are handled before this policy.
 */
export const SALES_TILLS_ROLE = "Sales / Tills";

export function cashierPathPolicy(pathname: string, method: string): "redirect" | "allow" | "deny" {
  if (pathname === "/") return method === "GET" || method === "HEAD" ? "redirect" : "deny";
  if ((pathname === "/tills" || pathname === "/tills/") && (method === "GET" || method === "HEAD")) return "allow";
  if ((pathname === "/api/tills" || pathname.startsWith("/api/tills/")) && (method === "GET" || method === "HEAD")) return "allow";
  // Invitation acceptance is authenticated and checks the email + invitation token.
  if (pathname === "/api/team/accept" && method === "POST") return "allow";
  return "deny";
}

/** Hub role/scope authorisation for opening the Sales / Tills workspace.
 * A Full company scope must belong to an executive role; it must not let
 * restricted roles such as Read only or Buyer escalate into checkout.
 * Branch-level authorisation is evaluated separately by tillBranches().
 */
export function canOpenTills(role: string, accessScope: string): boolean {
  if (role === SALES_TILLS_ROLE) return true;
  if (role === "Owner / Admin" || role === "Developer / Technical Admin") return true;
  if (role === "Store Manager" || role === "Regional Manager") return true;
  return role === "Executive / EXCO" && accessScope === "Full company";
}
