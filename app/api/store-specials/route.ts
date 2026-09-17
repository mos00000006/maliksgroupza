import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { getHubMember } from "../access";
import {
  canManageStoreSpecials,
  canSelectAllBranches,
  initStoreSpecialTables,
  listStoreBranches,
  memberCanSeeStoreSpecial,
  notifyUpcomingStoreSpecial,
  parseSpecialWorkspaces,
  saDateString,
  syncStoreSpecialLifecycleNotifications,
  type StoreSpecialRow,
} from "./shared";

type DbRow = Record<string, string | number | null>;

function clean(value: FormDataEntryValue | string | null | undefined) {
  return String(value ?? "").trim();
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "promotion-image";
}

function parseRequestedBranches(value: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.map((item) => String(item).trim()).filter(Boolean)))
      : [];
  } catch {
    return [];
  }
}

async function specialById(id: number) {
  return env.DB.prepare("SELECT * FROM store_specials WHERE id=? AND active=1")
    .bind(id)
    .first<StoreSpecialRow>();
}

async function uploadImages(specialId: number, files: File[]) {
  if (files.length > 12) throw new Error("Upload a maximum of 12 promotion pictures at a time.");

  const count = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM store_special_images WHERE special_id=?",
  )
    .bind(specialId)
    .first<{ total: number }>();
  let sortOrder = Number(count?.total || 0);

  for (const file of files) {
    if (!file.type.startsWith("image/"))
      throw new Error(`${file.name} is not an image file.`);
    if (file.size > 25 * 1024 * 1024)
      throw new Error(`${file.name} is larger than 25 MB.`);

    const objectKey = `store-specials/${specialId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    await env.BUCKET.put(objectKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "image/jpeg" },
    });
    sortOrder += 1;
    await env.DB.prepare(
      `INSERT INTO store_special_images
        (special_id,object_key,file_name,content_type,sort_order,created_at)
       VALUES (?,?,?,?,?,?)`,
    )
      .bind(
        specialId,
        objectKey,
        file.name || `promotion-${sortOrder}.jpg`,
        file.type || "image/jpeg",
        sortOrder,
        new Date().toISOString(),
      )
      .run();
  }
}

export async function GET() {
  await initStoreSpecialTables();
  await syncStoreSpecialLifecycleNotifications();

  const member = await getHubMember();
  if (!member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });

  const [branchRows, specialRows, imageRows] = await Promise.all([
    listStoreBranches(member),
    env.DB.prepare(
      `SELECT *
       FROM store_specials
       WHERE active=1
       ORDER BY
         CASE WHEN end_date>=? THEN 0 ELSE 1 END,
         start_date DESC,
         id DESC`,
    )
      .bind(saDateString())
      .all<StoreSpecialRow>(),
    env.DB.prepare(
      `SELECT id,special_id,file_name,content_type,sort_order,created_at
       FROM store_special_images
       ORDER BY special_id,sort_order,id`,
    ).all<DbRow>(),
  ]);

  const visible = specialRows.results.filter((special) =>
    memberCanSeeStoreSpecial(member, special),
  );
  const visibleIds = new Set(visible.map((special) => Number(special.id)));

  const imagesBySpecial = new Map<number, Array<Record<string, unknown>>>();
  for (const image of imageRows.results) {
    const specialId = Number(image.special_id);
    if (!visibleIds.has(specialId)) continue;
    const items = imagesBySpecial.get(specialId) || [];
    items.push({
      id: Number(image.id),
      file_name: String(image.file_name || ""),
      content_type: String(image.content_type || ""),
      sort_order: Number(image.sort_order || 0),
      url: `/api/store-specials/images/${Number(image.id)}`,
    });
    imagesBySpecial.set(specialId, items);
  }

  return Response.json({
    today: saDateString(),
    branches: branchRows,
    specials: visible.map((special) => ({
      ...special,
      workspaces: parseSpecialWorkspaces(special.workspaces_json),
      images: imagesBySpecial.get(Number(special.id)) || [],
    })),
    permissions: {
      canManage: canManageStoreSpecials(member),
      canSelectAllBranches: canSelectAllBranches(member),
    },
  });
}

export async function POST(req: Request) {
  await initStoreSpecialTables();
  const member = await getHubMember();
  if (!member || !canManageStoreSpecials(member))
    return Response.json({ error: "You are not authorised to manage store specials." }, { status: 403 });

  const user = await getAuthenticatedUser();
  const form = await req.formData();
  const action = clean(form.get("action")) || "create";

  if (action === "addImages") {
    const specialId = Number(form.get("specialId") || 0);
    const special = await specialById(specialId);
    if (!special || !memberCanSeeStoreSpecial(member, special))
      return Response.json({ error: "Special not found or access denied." }, { status: 404 });
    const files = form.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (!files.length)
      return Response.json({ error: "Choose at least one promotion picture." }, { status: 400 });
    try {
      await uploadImages(specialId, files);
      return Response.json({ ok: true });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Pictures could not be uploaded." }, { status: 400 });
    }
  }

  const title = clean(form.get("title"));
  const description = clean(form.get("description"));
  const startDate = clean(form.get("startDate"));
  const endDate = clean(form.get("endDate"));
  const requestedAll = clean(form.get("allBranches")) === "true";
  const allBranches = requestedAll && canSelectAllBranches(member);
  const requestedBranches = parseRequestedBranches(clean(form.get("branches")));

  if (!title || !startDate || !endDate)
    return Response.json({ error: "Special name, start date and end date are required." }, { status: 400 });
  if (endDate < startDate)
    return Response.json({ error: "End date cannot be before the start date." }, { status: 400 });

  const availableBranches = await listStoreBranches(member);
  const allowedNames = new Set(availableBranches.map((row) => String(row.name || "")));
  const branches = allBranches
    ? []
    : requestedBranches.filter((name) => allowedNames.has(name));

  if (!allBranches && !branches.length)
    return Response.json({ error: "Select at least one branch for the special." }, { status: 400 });

  const files = form.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const now = new Date().toISOString();

  try {
    const insertResult = await env.DB.prepare(
      `INSERT INTO store_specials
        (title,description,start_date,end_date,all_branches,workspaces_json,active,created_by,created_at,updated_at,upcoming_notified_at,started_notified_at)
       VALUES (?,?,?,?,?,?,1,?,?,?,'','')`,
    )
      .bind(
        title,
        description,
        startDate,
        endDate,
        allBranches ? 1 : 0,
        JSON.stringify(branches),
        user?.email || member.email,
        now,
        now,
      )
      .run();

    const insertedId = Number(insertResult.meta?.last_row_id || 0);
    const created =
      insertedId > 0
        ? await env.DB.prepare("SELECT * FROM store_specials WHERE id=?")
            .bind(insertedId)
            .first<StoreSpecialRow>()
        : await env.DB.prepare(
            `SELECT *
             FROM store_specials
             WHERE created_by=? AND created_at=? AND title=?
             ORDER BY id DESC LIMIT 1`,
          )
            .bind(user?.email || member.email, now, title)
            .first<StoreSpecialRow>();

    if (!created)
      return Response.json(
        { error: "The promotion was inserted, but the Hub could not read it back from D1." },
        { status: 500 },
      );

    if (files.length) {
      try {
        await uploadImages(created.id, files);
      } catch (error) {
        return Response.json(
          {
            special: created,
            warning:
              error instanceof Error
                ? error.message
                : "The special was created, but one or more promotion pictures could not be uploaded.",
          },
          { status: 201 },
        );
      }
    }

    // Notifications are deliberately non-fatal: a promotion must never be lost
    // because one recipient/push subscription has a problem.
    try {
      if (startDate > saDateString()) await notifyUpcomingStoreSpecial(created.id);
      else await syncStoreSpecialLifecycleNotifications();
    } catch (error) {
      console.error("Store-special notification scheduling failed", error);
    }

    return Response.json({ special: created }, { status: 201 });
  } catch (error) {
    console.error("Store special creation failed", error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        error: message
          ? `Special could not be created: ${message}`
          : "Special could not be created because the database request failed.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  await initStoreSpecialTables();
  const member = await getHubMember();
  if (!member || !canManageStoreSpecials(member))
    return Response.json({ error: "You are not authorised to manage store specials." }, { status: 403 });

  const payload = (await req.json()) as {
    id?: number;
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    allBranches?: boolean;
    branches?: string[];
  };
  const id = Number(payload.id || 0);
  const existing = await specialById(id);
  if (!existing || !memberCanSeeStoreSpecial(member, existing))
    return Response.json({ error: "Special not found or access denied." }, { status: 404 });

  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const startDate = String(payload.startDate || "").trim();
  const endDate = String(payload.endDate || "").trim();
  if (!title || !startDate || !endDate)
    return Response.json({ error: "Special name, start date and end date are required." }, { status: 400 });
  if (endDate < startDate)
    return Response.json({ error: "End date cannot be before the start date." }, { status: 400 });

  const requestedAll = Boolean(payload.allBranches);
  const allBranches = requestedAll && canSelectAllBranches(member);
  const availableBranches = await listStoreBranches(member);
  const allowedNames = new Set(availableBranches.map((row) => String(row.name || "")));
  const branches = allBranches
    ? []
    : (payload.branches || []).map(String).filter((name) => allowedNames.has(name));

  if (!allBranches && !branches.length)
    return Response.json({ error: "Select at least one branch." }, { status: 400 });

  const updated = await env.DB.prepare(
    `UPDATE store_specials SET
       title=?,description=?,start_date=?,end_date=?,all_branches=?,workspaces_json=?,
       updated_at=?,upcoming_notified_at='',started_notified_at=''
     WHERE id=? AND active=1
     RETURNING *`,
  )
    .bind(
      title,
      description,
      startDate,
      endDate,
      allBranches ? 1 : 0,
      JSON.stringify(branches),
      new Date().toISOString(),
      id,
    )
    .first<StoreSpecialRow>();

  if (!updated)
    return Response.json({ error: "Special could not be updated." }, { status: 500 });

  try {
    if (startDate > saDateString()) await notifyUpcomingStoreSpecial(id);
    else await syncStoreSpecialLifecycleNotifications();
  } catch (error) {
    console.error("Store-special update notification scheduling failed", error);
  }

  return Response.json({ special: updated });
}

export async function DELETE(req: Request) {
  await initStoreSpecialTables();
  const member = await getHubMember();
  if (!member || !canManageStoreSpecials(member))
    return Response.json({ error: "You are not authorised to manage store specials." }, { status: 403 });

  const payload = (await req.json().catch(() => ({}))) as { id?: number };
  const id = Number(payload.id || 0);
  const special = await specialById(id);
  if (!special || !memberCanSeeStoreSpecial(member, special))
    return Response.json({ error: "Special not found or access denied." }, { status: 404 });

  const { results } = await env.DB.prepare(
    "SELECT id,object_key FROM store_special_images WHERE special_id=?",
  )
    .bind(id)
    .all<{ id: number; object_key: string }>();

  await env.DB.prepare(
    "UPDATE store_specials SET active=0,updated_at=? WHERE id=?",
  )
    .bind(new Date().toISOString(), id)
    .run();

  for (const image of results) {
    try {
      await env.BUCKET.delete(image.object_key);
    } catch {}
  }
  await env.DB.prepare("DELETE FROM store_special_images WHERE special_id=?").bind(id).run();

  return Response.json({ ok: true });
}
