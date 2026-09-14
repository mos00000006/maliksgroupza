import { env } from "cloudflare:workers";
import { allowedWorkspaces, getHubMember } from "../../access";
import { initTouch365StockTables } from "../../integrations/touch365/shared";

type WorkspaceRow = { name: string; type: string };
type StockRow = { product_code: string; on_hand: number; updated_at: string };
type SyncRow = { last_synced_at: string; record_count: number; sync_mode: string };

function cleanCodes(value: string | null) {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).slice(0, 100);
}

export async function GET(request: Request) {
  await initTouch365StockTables();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });

  const fullCompany =
    member.access_scope === "Full company" ||
    member.role === "Owner / Admin" ||
    member.role === "Developer / Technical Admin";

  const { results: allWorkspaces } = await env.DB.prepare(
    `SELECT name,type FROM workspaces
     WHERE active=1 AND type NOT IN ('Head Office','Wholesale Division')
     ORDER BY CASE type WHEN 'Store' THEN 0 WHEN 'DC' THEN 1 ELSE 2 END,name`,
  ).all<WorkspaceRow>();

  const restricted = allowedWorkspaces(member);
  const visibleWorkspaces = fullCompany || restricted === null
    ? allWorkspaces
    : allWorkspaces.filter((workspace: WorkspaceRow) =>
        restricted.some((allowed) => allowed.trim().toLowerCase() === workspace.name.trim().toLowerCase()),
      );

  const url = new URL(request.url);
  const requestedStore = String(url.searchParams.get("store") || "").trim();
  const defaultStore = visibleWorkspaces[0]?.name || "";
  const selectedStore = requestedStore || defaultStore;
  if (!selectedStore) {
    return Response.json({
      stores: [],
      selected_store: "",
      can_choose_store: false,
      connected: false,
      stock: {},
      last_synced_at: "",
    });
  }

  const authorised = visibleWorkspaces.some(
    (workspace: WorkspaceRow) => workspace.name.trim().toLowerCase() === selectedStore.toLowerCase(),
  );
  if (!authorised) return Response.json({ error: "You do not have access to this store's stock." }, { status: 403 });

  const canonicalStore = visibleWorkspaces.find(
    (workspace: WorkspaceRow) => workspace.name.trim().toLowerCase() === selectedStore.toLowerCase(),
  )?.name || selectedStore;

  const codes = cleanCodes(url.searchParams.get("codes"));
  const stock: Record<string, { on_hand: number; updated_at: string }> = {};
  if (codes.length) {
    const placeholders = codes.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT product_code,on_hand,updated_at
       FROM touch365_stock_on_hand
       WHERE workspace=? AND product_code IN (${placeholders})`,
    )
      .bind(canonicalStore, ...codes)
      .all<StockRow>();
    for (const row of results) {
      stock[String(row.product_code).toUpperCase()] = {
        on_hand: Number(row.on_hand),
        updated_at: row.updated_at,
      };
    }
  }

  const sync = await env.DB.prepare(
    "SELECT last_synced_at,record_count,sync_mode FROM touch365_stock_sync_status WHERE workspace=?",
  )
    .bind(canonicalStore)
    .first<SyncRow>();

  return Response.json({
    stores: visibleWorkspaces.map((workspace: WorkspaceRow) => workspace.name),
    selected_store: canonicalStore,
    can_choose_store: fullCompany,
    connected: Boolean(sync?.last_synced_at),
    last_synced_at: sync?.last_synced_at || "",
    sync_mode: sync?.sync_mode || "",
    record_count: Number(sync?.record_count || 0),
    stock,
  });
}
