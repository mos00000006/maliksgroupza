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
