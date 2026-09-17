"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
  department?: string;
  access_scope?: string;
  workspace_access?: string | string[];
};

type Branch = {
  id: number;
  name: string;
  type: string;
  region: string;
  manager: string;
};

type SpecialImage = {
  id: number;
  file_name: string;
  content_type: string;
  sort_order: number;
  url: string;
};

type StoreSpecial = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_branches: number;
  workspaces: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  images: SpecialImage[];
};

type ApiData = {
  today: string;
  branches: Branch[];
  specials: StoreSpecial[];
  permissions: {
    canManage: boolean;
    canSelectAllBranches: boolean;
  };
};

type Filter = "Current" | "Upcoming" | "Past";

const emptyForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  allBranches: false,
  branches: [] as string[],
};

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00+02:00`);
  return parsed.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function specialStatus(special: StoreSpecial, today: string) {
  if (today < special.start_date) return "Upcoming";
  if (today > special.end_date) return "Past";
  return "Current";
}

function branchLabel(special: StoreSpecial) {
  if (Number(special.all_branches) === 1) return "All branches";
  if (special.workspaces.length === 1) return special.workspaces[0];
  if (special.workspaces.length === 2) return `${special.workspaces[0]} + ${special.workspaces[1]}`;
  return `${special.workspaces.length} selected branches`;
}

async function responseMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error || fallback;
  } catch {
    const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return clean ? `${fallback} ${clean.slice(0, 220)}` : fallback;
  }
}

function validatePromotionImages(selected: File[]) {
  const maxBytes = 25 * 1024 * 1024;
  if (selected.length > 12)
    return { ok: false, error: "Choose a maximum of 12 promotion pictures at a time." };

  for (const file of selected) {
    if (!file.type.startsWith("image/"))
      return { ok: false, error: `${file.name} is not an image file.` };
    if (file.size > maxBytes)
      return { ok: false, error: `${file.name} is larger than 25 MB.` };
  }

  return { ok: true, error: "" };
}

function PromotionCarousel({ images, title }: { images: SpecialImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

  const active = images[index] || images[0];

  const moveTo = (nextIndex: number, nextDirection: "next" | "prev") => {
    if (images.length <= 1 || animating || nextIndex === index) return;
    setDirection(nextDirection);
    setAnimating(true);
    window.setTimeout(() => {
      setIndex(nextIndex);
      window.setTimeout(() => setAnimating(false), 30);
    }, 180);
  };

  const previous = () =>
    moveTo((index - 1 + images.length) % images.length, "prev");

  const next = () =>
    moveTo((index + 1) % images.length, "next");

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const x = event.touches[0]?.clientX ?? null;
    setTouchStartX(x);
    setTouchCurrentX(x);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchCurrentX(event.touches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || touchCurrentX === null) {
      setTouchStartX(null);
      setTouchCurrentX(null);
      return;
    }

    const distance = touchCurrentX - touchStartX;
    const threshold = 45;

    if (distance <= -threshold) next();
    else if (distance >= threshold) previous();

    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  if (!active)
    return (
      <div className="specialNoImage">
        <span>Promotion artwork</span>
        <small>No picture uploaded</small>
      </div>
    );

  return (
    <div
      className="specialCarousel"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={`specialFlipStage ${animating ? `flipping ${direction}` : ""}`}>
        <img src={active.url} alt={`${title} promotion ${index + 1}`} />
      </div>

      {images.length > 1 && (
        <>
          <button
            className="specialCarouselPrev desktopOnlyCarouselButton"
            onClick={previous}
            aria-label="Previous promotion picture"
          >
            ‹
          </button>
          <button
            className="specialCarouselNext desktopOnlyCarouselButton"
            onClick={next}
            aria-label="Next promotion picture"
          >
            ›
          </button>

          <div className="specialDots">
            {images.map((image, itemIndex) => (
              <button
                key={image.id}
                className={itemIndex === index ? "active" : ""}
                onClick={() =>
                  moveTo(itemIndex, itemIndex > index ? "next" : "prev")
                }
                aria-label={`Show promotion picture ${itemIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <span className="specialSlideCount">
        {index + 1}/{images.length}
      </span>

      {images.length > 1 && (
        <span className="specialSwipeHint">
          Swipe to view next page
        </span>
      )}
    </div>
  );
}

export default function StoreSpecials({ currentUser }: { currentUser: CurrentHubUser }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Current");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<StoreSpecial | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<StoreSpecial | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3600);
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/store-specials", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        flash(result.error || "Store specials could not be loaded.");
        return;
      }
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const current: StoreSpecial[] = [];
    const upcoming: StoreSpecial[] = [];
    const past: StoreSpecial[] = [];
    if (!data) return { current, upcoming, past };
    for (const special of data.specials) {
      const status = specialStatus(special, data.today);
      if (status === "Current") current.push(special);
      else if (status === "Upcoming") upcoming.push(special);
      else past.push(special);
    }
    current.sort((a, b) => a.end_date.localeCompare(b.end_date));
    upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date));
    past.sort((a, b) => b.end_date.localeCompare(a.end_date));
    return { current, upcoming, past };
  }, [data]);

  const visible =
    filter === "Current"
      ? grouped.current
      : filter === "Upcoming"
        ? grouped.upcoming
        : grouped.past;

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      startDate: data?.today || "",
      endDate: data?.today || "",
      allBranches: Boolean(data?.permissions.canSelectAllBranches),
    });
    setFiles([]);
    setComposerOpen(true);
  };

  const openEdit = (special: StoreSpecial) => {
    setEditing(special);
    setForm({
      title: special.title,
      description: special.description || "",
      startDate: special.start_date,
      endDate: special.end_date,
      allBranches: Number(special.all_branches) === 1,
      branches: special.workspaces || [],
    });
    setFiles([]);
    setComposerOpen(true);
  };

  const toggleBranch = (name: string) => {
    setForm((current) => ({
      ...current,
      branches: current.branches.includes(name)
        ? current.branches.filter((item) => item !== name)
        : [...current.branches, name],
    }));
  };

  const handlePromotionFiles = (selected: File[]) => {
    if (!selected.length) {
      setFiles([]);
      return;
    }

    const validation = validatePromotionImages(selected);
    if (!validation.ok) {
      flash(validation.error);
      setFiles([]);
      return;
    }

    setFiles(selected);
    const totalMb = selected.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;
    flash(
      `${selected.length} promotion picture${selected.length === 1 ? "" : "s"} selected · ${totalMb.toFixed(1)} MB total.`,
    );
  };

  const saveSpecial = async () => {
    if (saving) return;
    if (!form.title.trim()) return flash("Enter the special/promotion name.");
    if (!form.startDate || !form.endDate) return flash("Choose the start and end dates.");
    if (form.endDate < form.startDate) return flash("End date cannot be before start date.");
    if (!form.allBranches && !form.branches.length) return flash("Select at least one branch.");
    if (!editing && !files.length) return flash("Upload at least one promotion picture.");

    setSaving(true);
    try {
      if (editing) {
        const response = await fetch("/api/store-specials", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
        if (!response.ok) {
          flash(await responseMessage(response, "Special could not be updated."));
          return;
        }

        if (files.length) {
          let failedUploads = 0;
          for (const file of files) {
            const images = new FormData();
            images.set("action", "addImages");
            images.set("specialId", String(editing.id));
            images.append("images", file);

            const upload = await fetch("/api/store-specials", {
              method: "POST",
              body: images,
            });

            if (!upload.ok) failedUploads += 1;
          }

          if (failedUploads > 0) {
            flash(
              `Special saved, but ${failedUploads} promotion picture${failedUploads === 1 ? "" : "s"} could not be uploaded.`,
            );
            await load();
            return;
          }
        }

        flash("Special updated and affected stores notified.");
      } else {
        // Create the promotion record first with NO image payload.
        const payload = new FormData();
        payload.set("action", "create");
        payload.set("title", form.title.trim());
        payload.set("description", form.description.trim());
        payload.set("startDate", form.startDate);
        payload.set("endDate", form.endDate);
        payload.set("allBranches", String(form.allBranches));
        payload.set("branches", JSON.stringify(form.branches));

        const response = await fetch("/api/store-specials", {
          method: "POST",
          body: payload,
        });
        if (!response.ok) {
          flash(await responseMessage(response, "Special could not be created."));
          return;
        }

        const createdResult = (await response.json()) as { special?: { id?: number }; warning?: string };
        const specialId = Number(createdResult.special?.id || 0);
        if (!specialId) {
          flash("Special was created, but the Hub could not determine its record number.");
          await load();
          return;
        }

        // Upload ONE picture per request. Each picture may be up to 25 MB.
        let failedUploads = 0;
        for (const file of files) {
          const images = new FormData();
          images.set("action", "addImages");
          images.set("specialId", String(specialId));
          images.append("images", file);

          const upload = await fetch("/api/store-specials", {
            method: "POST",
            body: images,
          });

          if (!upload.ok) failedUploads += 1;
        }

        if (failedUploads > 0) {
          flash(
            `Special created, but ${failedUploads} promotion picture${failedUploads === 1 ? "" : "s"} could not be uploaded.`,
          );
        } else {
          flash(
            form.startDate > (data?.today || "")
              ? "Special created. Pictures uploaded and upcoming-special notifications sent."
              : "Special created. Pictures uploaded and start notifications sent.",
          );
        }
      }

      setComposerOpen(false);
      setEditing(null);
      setFiles([]);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (image: SpecialImage) => {
    if (!window.confirm(`Remove ${image.file_name} from this promotion?`)) return;
    const response = await fetch(`/api/store-specials/images/${image.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return flash(result.error || "Picture could not be removed.");
    flash("Promotion picture removed.");
    await load();
    if (editing) {
      const updated = data?.specials.find((item) => item.id === editing.id);
      if (updated) setEditing(updated);
    }
  };

  const deleteSpecial = async () => {
    if (!confirmDelete || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/store-specials", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: confirmDelete.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return flash(result.error || "Special could not be removed.");
      setConfirmDelete(null);
      flash("Special removed.");
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data)
    return <div className="specialLoading">Loading store specials…</div>;

  if (!data)
    return <div className="specialLoading">Store specials are unavailable.</div>;

  return (
    <section className="storeSpecials">
      <style>{`
        .storeSpecials{display:grid;gap:14px;padding-bottom:38px}
        .specialToast{position:fixed;right:22px;top:100px;z-index:80;max-width:390px;background:#fff;border:1px solid #d7e0e9;border-radius:12px;box-shadow:0 18px 48px #1724382b;padding:11px 14px;color:#30465d;font-size:10px;font-weight:800}
        .specialHero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;background:linear-gradient(120deg,#15263d,#223d5d);color:#fff;border-radius:17px;padding:22px 24px;box-shadow:0 14px 36px #1724381c}
        .specialHero small{color:#f5cb2f;font-size:8px;font-weight:900;letter-spacing:.15em}
        .specialHero h2{font-size:24px;margin:6px 0 6px}.specialHero p{margin:0;color:#c8d5e4;font-size:10px;line-height:1.55;max-width:720px}
        .specialHero button{height:42px;border:1px solid #e1b91f;border-radius:10px;background:#f5ca2e;color:#172438;padding:0 16px;font:inherit;font-size:10px;font-weight:900;cursor:pointer}
        .specialKpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
        .specialKpis article{background:#fff;border:1px solid #dde5ed;border-radius:12px;padding:13px 14px}.specialKpis span,.specialKpis b,.specialKpis small{display:block}
        .specialKpis span{font-size:7px;font-weight:900;color:#7b8998;text-transform:uppercase}.specialKpis b{font-size:20px;color:#203850;margin-top:4px}.specialKpis small{font-size:7px;color:#95a0ad;margin-top:4px}
        .specialFilter{display:flex;gap:7px;background:#fff;border:1px solid #dde5ed;border-radius:12px;padding:6px;overflow:auto}
        .specialFilter button{border:0;border-radius:8px;background:transparent;padding:9px 14px;color:#5f7084;font:inherit;font-size:9px;font-weight:850;cursor:pointer;white-space:nowrap}
        .specialFilter button.active{background:#172b43;color:#fff}
        .specialGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .specialCard{overflow:hidden;background:#fff;border:1px solid #dbe4ec;border-radius:15px;box-shadow:0 7px 24px #1724380d}
        .specialCarousel,.specialNoImage{position:relative;background:#e8edf3;overflow:hidden}
        .specialCarousel{display:block;perspective:1400px;touch-action:pan-y;background:#fff}
        .specialFlipStage{width:100%;height:auto;min-height:0;display:block;transform-style:preserve-3d;transform-origin:center;transition:transform .34s ease,opacity .2s ease;background:#fff}
        .specialFlipStage img{width:100%;height:auto;max-height:none;object-fit:contain;display:block;background:#fff}
        .specialFlipStage.flipping.next{transform:rotateY(-12deg) translateX(-2%);opacity:.45}
        .specialFlipStage.flipping.prev{transform:rotateY(12deg) translateX(2%);opacity:.45}
        .specialNoImage{display:grid;place-items:center;text-align:center;color:#6f8092}.specialNoImage span,.specialNoImage small{display:block}
        .specialCarouselPrev,.specialCarouselNext{position:absolute;top:min(50%,320px);transform:translateY(-50%);width:44px;height:58px;border:1px solid #ffffff55;border-radius:12px;background:#172438dd;color:#fff;font-size:29px;cursor:pointer;box-shadow:0 8px 22px #17243833;z-index:4}.specialCarouselPrev{left:14px}.specialCarouselNext{right:14px}.specialCarouselPrev:hover,.specialCarouselNext:hover{background:#203a58}
        .specialDots{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:4;background:#17243899;border-radius:999px;padding:5px 8px}.specialDots button{width:7px;height:7px;padding:0;border:0;border-radius:999px;background:#ffffff99}.specialDots button.active{width:20px;background:#f5ca2e}
        .specialSlideCount{position:absolute;right:12px;top:10px;background:#172438d8;color:#fff;border-radius:999px;padding:5px 8px;font-size:7px;font-weight:800;z-index:4}
        .specialSwipeHint{display:none;position:absolute;left:12px;top:10px;background:#172438c7;color:#fff;border-radius:999px;padding:5px 8px;font-size:7px;font-weight:750;z-index:4}
        .specialCardBody{padding:14px}.specialCardTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
        .specialStatus{display:inline-flex;border-radius:999px;padding:5px 8px;font-size:7px;font-weight:900}.specialStatus.Current{background:#def4e8;color:#18734d}.specialStatus.Upcoming{background:#fff1cf;color:#9a6500}.specialStatus.Past{background:#edf1f5;color:#69798a}
        .specialCard h3{margin:7px 0 4px;color:#1d344c;font-size:15px}.specialCard p{margin:0;color:#6c7b8b;font-size:8px;line-height:1.55}
        .specialMeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.specialMeta span{border-radius:999px;background:#f0f4f8;color:#52677e;padding:5px 8px;font-size:7px;font-weight:750}
        .specialBranches{margin-top:10px;padding-top:10px;border-top:1px solid #edf1f5;color:#5d7084;font-size:8px;font-weight:750}
        .specialManage{display:flex;gap:6px;margin-top:11px}.specialManage button{border:1px solid #d5dfe8;border-radius:8px;background:#fff;padding:7px 10px;color:#405970;font:inherit;font-size:7px;font-weight:850;cursor:pointer}.specialManage button.danger{color:#b23d49;border-color:#e8c5ca}
        .specialEmpty{grid-column:1/-1;background:#fff;border:1px dashed #ccd8e4;border-radius:14px;padding:36px;text-align:center;color:#7d8b9a}.specialEmpty b{display:block;color:#40566d;margin-bottom:5px}
        .specialLoading{background:#fff;border:1px solid #dce4ec;border-radius:12px;padding:24px;color:#40566d}
        .specialOverlay{position:fixed;inset:0;z-index:70;background:#0d1a2b99;display:grid;place-items:center;padding:16px}
        .specialModal{width:min(930px,calc(100vw - 28px));height:min(900px,calc(100dvh - 28px));max-height:calc(100dvh - 28px);background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 90px #0b16283d}.specialModalBody{flex:1 1 auto;min-height:0}
        .specialModal>header{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:16px 19px;border-bottom:1px solid #e4eaf0;background:#fbfcfd}.specialModal>header small{color:#b38600;font-size:7px;font-weight:900;letter-spacing:.12em}.specialModal>header h2{margin:4px 0 3px;color:#1c334b;font-size:18px}.specialModal>header p{margin:0;color:#7b8999;font-size:8px}.specialModal>header button{width:33px;height:33px;border:0;border-radius:9px;background:#edf2f6;color:#637589;font-size:18px;cursor:pointer}
        .specialModalBody{overflow-y:scroll;overflow-x:hidden;padding:15px 18px;display:grid;gap:12px;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}.specialModalBody::-webkit-scrollbar{width:10px}.specialModalBody::-webkit-scrollbar-track{background:#edf2f6;border-left:1px solid #dfe6ed}.specialModalBody::-webkit-scrollbar-thumb{background:#8797aa;border-radius:999px;border:2px solid #edf2f6}.specialModalBody::-webkit-scrollbar-thumb:hover{background:#65788e}.specialModalBody{scrollbar-width:auto;scrollbar-color:#8797aa #edf2f6}.specialFormGrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
        .specialModal label{display:grid;gap:6px;color:#354b62;font-size:8px;font-weight:850}.specialModal input,.specialModal textarea,.specialModal select{width:100%;border:1px solid #d4dee8;border-radius:9px;background:#fff;padding:9px 10px;font:inherit;color:#20364d;font-size:9px;outline:0}.specialModal textarea{min-height:82px;resize:vertical}
        .specialBranchBox{border:1px solid #dce4ec;border-radius:11px;overflow:visible!important;height:auto!important;max-height:none!important;min-height:0!important}.specialBranchHeader{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;background:#f7f9fb;border-bottom:1px solid #e5ebf0}.specialBranchHeader b{font-size:9px;color:#344b62}.specialAllToggle{display:flex!important;grid-auto-flow:column;align-items:center;gap:7px!important;font-size:8px!important}.specialAllToggle input{width:17px;height:17px}
        .specialBranchGrid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-auto-rows:auto!important;gap:2px 6px!important;padding:8px 10px 12px!important;background:#fff!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important}.specialBranchGrid label{display:flex!important;align-items:center!important;gap:7px!important;padding:7px 6px!important;border-radius:7px!important;font-weight:700!important;cursor:pointer!important;min-height:38px!important;height:auto!important;overflow:visible!important;white-space:normal!important}.specialBranchGrid label:hover{background:#f3f7fa}.specialBranchGrid input{width:16px;height:16px;flex:0 0 16px}.specialBranchGrid.disabled{opacity:.45;pointer-events:none}
        .specialFileBox{border:1px dashed #bac9d8;border-radius:11px;padding:13px;background:#f8fafc}.specialFileBox input{border:0;padding:0;background:transparent}.specialFileBox small{display:block;margin-top:6px;color:#7e8c9b;font-size:7px;font-weight:500}
        .specialExistingImages{display:flex;gap:8px;overflow:auto;padding-bottom:4px}.specialExistingImages figure{position:relative;flex:0 0 130px;margin:0;border:1px solid #dbe3eb;border-radius:9px;overflow:hidden;background:#fff}.specialExistingImages img{width:130px;height:78px;object-fit:cover;display:block}.specialExistingImages button{position:absolute;right:4px;top:4px;width:24px;height:24px;border:0;border-radius:7px;background:#172438d9;color:#fff;cursor:pointer}.specialExistingImages figcaption{padding:5px 6px;color:#6f8091;font-size:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .specialModal>footer{display:flex;justify-content:flex-end;gap:8px;padding:11px 17px;border-top:1px solid #e5ebf0;background:#fbfcfd}.specialModal>footer button{height:38px;border:1px solid #d3dde6;border-radius:9px;background:#fff;padding:0 14px;font:inherit;font-size:8px;font-weight:850;color:#4a5f75;cursor:pointer}.specialModal>footer button.primary{background:#f5ca2e;border-color:#dfb81c;color:#172438}
        .specialConfirm{width:min(460px,calc(100vw - 28px));background:#fff;border-radius:15px;padding:20px;box-shadow:0 25px 70px #0b16283d}.specialConfirm h3{margin:0 0 6px;color:#213950}.specialConfirm p{color:#697a8c;font-size:9px;line-height:1.5}.specialConfirm div{display:flex;justify-content:flex-end;gap:7px}.specialConfirm button{border:1px solid #d4dee8;border-radius:8px;background:#fff;padding:8px 11px;font:inherit;font-size:8px;font-weight:850}.specialConfirm button.danger{background:#bd3f4c;border-color:#bd3f4c;color:#fff}
        @media(max-width:1200px){.specialBranchGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}@media(max-width:900px){.specialGrid{grid-template-columns:1fr}.specialKpis{grid-template-columns:1fr 1fr}.specialBranchGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
        @media(max-width:720px){
          .specialHero{grid-template-columns:1fr;padding:17px}
          .specialHero button{width:100%}
          .specialKpis{grid-template-columns:1fr 1fr}
          .specialFormGrid{grid-template-columns:1fr}
          .specialBranchGrid{grid-template-columns:1fr!important;padding:6px 7px 14px!important;height:auto!important;max-height:none!important;overflow:visible!important}
          .specialModal{width:calc(100vw - 12px);height:calc(100dvh - 12px);max-height:calc(100dvh - 12px)}
          .specialModalBody::-webkit-scrollbar{width:7px}
          .specialModalBody::-webkit-scrollbar-thumb{background:#7f91a6;border:1px solid #edf2f6}
          .specialOverlay{padding:6px}
          .specialToast{left:12px;right:12px;top:82px;max-width:none}
          .specialCarousel,.specialNoImage{min-height:0;height:auto}
          .specialFlipStage{min-height:0;width:100%;height:auto}
          .specialFlipStage img{width:100%;height:auto;max-height:none;object-fit:contain}
          .desktopOnlyCarouselButton{display:none!important}
          .specialSwipeHint{display:inline-flex}
          .specialDots{top:11px}
        }
      `}</style>

      {message && <div className="specialToast">{message}</div>}

      <div className="specialHero">
        <div>
          <small>POWERBUILD PROMOTION CONTROL</small>
          <h2>Store Specials & Promotions</h2>
          <p>
            Schedule promotions by branch, upload the promotion artwork and automatically notify the correct stores before the special and when it starts.
          </p>
        </div>
        {data.permissions.canManage && <button onClick={openCreate}>＋ Create store special</button>}
      </div>

      <div className="specialKpis">
        <article><span>Current specials</span><b>{grouped.current.length}</b><small>Running today</small></article>
        <article><span>Upcoming</span><b>{grouped.upcoming.length}</b><small>Scheduled promotions</small></article>
        <article><span>Past</span><b>{grouped.past.length}</b><small>Promotion history</small></article>
        <article><span>Visible branches</span><b>{data.branches.length}</b><small>{currentUser.role || "Hub user"}</small></article>
      </div>

      <div className="specialFilter">
        {(["Current", "Upcoming", "Past"] as Filter[]).map((item) => (
          <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            {item} {item === "Current" ? grouped.current.length : item === "Upcoming" ? grouped.upcoming.length : grouped.past.length}
          </button>
        ))}
      </div>

      <div className="specialGrid">
        {visible.map((special) => {
          const status = specialStatus(special, data.today);
          return (
            <article className="specialCard" key={special.id}>
              <PromotionCarousel images={special.images} title={special.title} />
              <div className="specialCardBody">
                <div className="specialCardTop">
                  <div>
                    <span className={`specialStatus ${status}`}>{status === "Current" ? "LIVE NOW" : status.toUpperCase()}</span>
                    <h3>{special.title}</h3>
                  </div>
                </div>
                {special.description && <p>{special.description}</p>}
                <div className="specialMeta">
                  <span>Starts {formatDate(special.start_date)}</span>
                  <span>Ends {formatDate(special.end_date)}</span>
                  <span>{special.images.length} picture{special.images.length === 1 ? "" : "s"}</span>
                </div>
                <div className="specialBranches">📍 {branchLabel(special)}</div>
                {data.permissions.canManage && (
                  <div className="specialManage">
                    <button onClick={() => openEdit(special)}>Edit / pictures</button>
                    <button className="danger" onClick={() => setConfirmDelete(special)}>Remove</button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
        {!visible.length && (
          <div className="specialEmpty">
            <b>No {filter.toLowerCase()} store specials</b>
            <span>{filter === "Current" ? "Current promotions will appear here as soon as their start date arrives." : "Nothing is recorded in this section yet."}</span>
          </div>
        )}
      </div>

      {composerOpen && (
        <div className="specialOverlay" onMouseDown={() => setComposerOpen(false)}>
          <section className="specialModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>STORE SPECIAL / PROMOTION</small>
                <h2>{editing ? "Edit special" : "Create store special"}</h2>
                <p>Choose the dates, branches and promotion pictures.</p>
              </div>
              <button onClick={() => setComposerOpen(false)}>×</button>
            </header>

            <div className="specialModalBody">
              <div className="specialFormGrid">
                <label>
                  Special / promotion name *
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. September Big Deals" />
                </label>
                <label>
                  Promotion period
                  <span style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                    <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                    <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                  </span>
                </label>
              </div>

              <label>
                Description / instruction to stores
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What the special covers, display instructions or any important notes…" />
              </label>

              <div className="specialBranchBox">
                <div className="specialBranchHeader">
                  <b>Branches running this special <span style={{color:"#8291a2",fontWeight:700}}>({data.branches.length} stores)</span></b>
                  {data.permissions.canSelectAllBranches && (
                    <label className="specialAllToggle">
                      <input
                        type="checkbox"
                        checked={form.allBranches}
                        onChange={(event) => setForm({ ...form, allBranches: event.target.checked })}
                      />
                      All branches
                    </label>
                  )}
                </div>
                <div
                  className={`specialBranchGrid ${form.allBranches ? "disabled" : ""}`}
                  style={{ height: "auto", maxHeight: "none", overflow: "visible" }}
                >
                  {data.branches.map((branch) => (
                    <label key={branch.id}>
                      <input
                        type="checkbox"
                        checked={form.branches.includes(branch.name)}
                        onChange={() => toggleBranch(branch.name)}
                      />
                      {branch.name}
                    </label>
                  ))}
                </div>
              </div>

              {editing && editing.images.length > 0 && (
                <div>
                  <label style={{marginBottom:"7px"}}>Current promotion pictures</label>
                  <div className="specialExistingImages">
                    {editing.images.map((image) => (
                      <figure key={image.id}>
                        <img src={image.url} alt={image.file_name} />
                        <button onClick={() => void removeImage(image)} title="Remove picture">×</button>
                        <figcaption>{image.file_name}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <div style={{border:"1px solid #d9e6d9",background:"#f3fbf4",borderRadius:"9px",padding:"9px 11px",color:"#3f6750",fontSize:"7px",fontWeight:750}}>
                  ✓ Pictures ready · {(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB total · max 25 MB per image
                </div>
              )}

              <label className="specialFileBox">
                {editing ? "Add more promotion pictures" : "Promotion pictures *"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => handlePromotionFiles(Array.from(event.target.files || []))}
                  disabled={saving}
                />
                <small>
                  Upload multiple pictures/pages. Each image may be up to 25 MB. The Hub uploads pictures one at a time. The slideshow changes only when the user clicks Previous/Next on desktop or swipes on a phone.
                  {files.length
                    ? ` ${files.length} picture${files.length === 1 ? "" : "s"} selected.`
                    : ""}
                </small>
              </label>
            </div>

            <footer>
              <button onClick={() => setComposerOpen(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={() => void saveSpecial()}>
                {saving ? "Saving / uploading…" : editing ? "Save changes" : "Create & notify stores"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {confirmDelete && (
        <div className="specialOverlay" onMouseDown={() => setConfirmDelete(null)}>
          <div className="specialConfirm" onMouseDown={(event) => event.stopPropagation()}>
            <h3>Remove this special?</h3>
            <p>
              “{confirmDelete.title}” will be removed from Store Specials. Existing Inbox notifications already sent to users will remain in their notification history.
            </p>
            <div>
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="danger" disabled={saving} onClick={() => void deleteSpecial()}>
                {saving ? "Removing…" : "Remove special"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
