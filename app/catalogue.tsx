"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { buildWholesaleLeafletPages, downloadWholesaleCatalogue } from "./catalogue-pdf";

type CatalogueProduct = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  image_name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type CatalogueDraft = {
  code: string;
  name: string;
  description: string;
  category: string;
};

type PulseSyncCategory = {
  key: string;
  label: string;
  category: string;
  pages: number;
  available: boolean;
};

type LeafletTurnState = {
  direction: -1 | 1;
  target: number;
  front: number;
  back: number;
};

type LeafletDragState = LeafletTurnState & {
  progress: number;
  settling?: "commit" | "cancel";
};


const emptyDraft: CatalogueDraft = {
  code: "",
  name: "",
  description: "",
  category: "General",
};


const MAX_SOURCE_IMAGE_BYTES = 30 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 700 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const apiResult = async (response: Response) => {
  const text = await response.text();
  let result: Record<string, unknown> = {};
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      if (response.status === 413 || /payload too large/i.test(text)) {
        throw new Error("The product picture is too large. The Hub will optimise catalogue pictures automatically; please select the picture again and retry.");
      }
      throw new Error(response.ok ? "The server returned an invalid response." : text.slice(0, 180));
    }
  }
  if (!response.ok) {
    throw new Error(String(result.error || `Request failed (${response.status}).`));
  }
  return result as {
    error?: string;
    products?: CatalogueProduct[];
    page?: number;
    pages?: number;
    total?: number;
    can_manage?: boolean;
    product?: CatalogueProduct | null;
    ok?: boolean;
  };
};


const canvasBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not optimise the product picture."))),
      "image/webp",
      quality,
    );
  });

const loadBrowserImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This picture format could not be read. Please use PNG, JPG or WebP."));
    };
    img.src = url;
  });

async function optimiseCatalogueImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Catalogue pictures must be image files.");
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("This picture is too large to process. Please use an image smaller than 30MB.");
  }

  // Already comfortably below the upload target: keep the original file unchanged.
  if (file.size <= TARGET_UPLOAD_BYTES) return file;

  const img = await loadBrowserImage(file);
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  if (!originalWidth || !originalHeight) throw new Error("Could not read the product picture dimensions.");

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(originalWidth, originalHeight));
  let width = Math.max(1, Math.round(originalWidth * scale));
  let height = Math.max(1, Math.round(originalHeight * scale));
  let quality = 0.88;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not optimise the product picture.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(img, 0, 0, width, height);
    blob = await canvasBlob(canvas, quality);
    if (blob.size <= TARGET_UPLOAD_BYTES) break;
    quality = Math.max(0.62, quality - 0.07);
    width = Math.max(1, Math.round(width * 0.86));
    height = Math.max(1, Math.round(height * 0.86));
  }

  if (!blob || blob.size > 900 * 1024) {
    throw new Error("The picture is still too large after optimisation. Please use a smaller image.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-") || "catalogue-product";
  return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}


const isAssortedProduct = (product: CatalogueProduct) => {
  const text = `${product.name || ""} ${product.description || ""}`.toUpperCase();
  return text.includes("5L / 20L") || text.includes("5L/20L") || text.includes("ASSORTED");
};



const getCatalogueDisplayDescription = (product: CatalogueProduct, assorted: boolean, tommyFixVariant: { size: string; pack: string } | null) => {
  if (tommyFixVariant) return "";
  const raw = (product.description || "").trim();
  if (!assorted) return raw || "No product description added yet.";
  const text = raw.toUpperCase();
  if (text.includes("5L / 20L") || text.includes("5L/20L")) return "Available in assorted 5L & 20L sizes.";
  if (text.includes("5L") && !text.includes("20L")) return "Available in assorted 5L sizes.";
  if (text.includes("20L") && !text.includes("5L")) return "Available in assorted 20L sizes.";
  return "Available in assorted options.";
};

const getTommyFixVariant = (product: CatalogueProduct) => {
  if (!product.name.toUpperCase().startsWith("TOMMY FIX")) return null;
  const match = (product.description || "").trim().match(/^(.+?)\s*-\s*(\d+\s*PCS)$/i);
  if (!match) return null;
  return { size: match[1].trim(), pack: match[2].trim().toUpperCase() };
};

const isLeafletMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

const leafletTurnTransform = (direction: -1 | 1, progress: number, cover: boolean) => {
  const bounded = Math.max(0, Math.min(progress, 1));
  const rotation = bounded * 180 * (direction > 0 ? -1 : 1);
  return cover
    ? `translate(-50%, -50%) rotateY(${rotation}deg)`
    : `translateY(-50%) rotateY(${rotation}deg)`;
};

const CATALOGUE_PAGE_SIZE = 12;

export default function Catalogue({ currentUserEmail = "" }: { currentUserEmail?: string }) {
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogueProduct | null>(null);
  const [draft, setDraft] = useState<CatalogueDraft>(emptyDraft);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteProduct, setDeleteProduct] = useState<CatalogueProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pulseSyncBusy, setPulseSyncBusy] = useState(false);
  const [pulseSyncStatus, setPulseSyncStatus] = useState("");
  const [pulseSyncProgress, setPulseSyncProgress] = useState(0);
  const [leafletOpen, setLeafletOpen] = useState(false);
  const [leafletPages, setLeafletPages] = useState<string[]>([]);
  const [leafletPage, setLeafletPage] = useState(0);
  const [leafletFlip, setLeafletFlip] = useState<LeafletTurnState | null>(null);
  const [leafletDrag, setLeafletDrag] = useState<LeafletDragState | null>(null);
  const leafletSwipeRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const leafletDragRef = useRef<LeafletDragState | null>(null);
  const leafletFlipTimerRef = useRef<number | null>(null);
  const leafletDragTimerRef = useRef<number | null>(null);
  const requestId = useRef(0);

  const expectedManager = useMemo(
    () => ["moyanamoses006@icloud.com", "moyanamoses006@icloud", "msallikutti@gmail.com"].includes(currentUserEmail.toLowerCase()),
    [currentUserEmail],
  );

  const visiblePageItems = useMemo<(number | string)[]>(() => {
    if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

    if (page <= 4) return [1, 2, 3, 4, 5, "right-gap", pages];
    if (page >= pages - 3) return [1, "left-gap", pages - 4, pages - 3, pages - 2, pages - 1, pages];

    return [1, "left-gap", page - 1, page, page + 1, "right-gap", pages];
  }, [page, pages]);

  const load = useCallback(async (targetPage: number, search: string, quiet = false) => {
    const id = ++requestId.current;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(CATALOGUE_PAGE_SIZE),
      });
      if (search.trim()) params.set("q", search.trim());
      const response = await fetch(`/api/catalogue?${params.toString()}`);
      const result = await apiResult(response);
      if (id !== requestId.current) return;
      setProducts(result.products || []);
      setPage(result.page || 1);
      setPages(result.pages || 1);
      setTotal(result.total || 0);
      setCanManage(Boolean(result.can_manage));
    } catch (caught) {
      if (id !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : "Could not load the catalogue.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const getLeafletTurn = useCallback((direction: -1 | 1): LeafletTurnState | null => {
    if (!leafletPages.length) return null;

    const mobile = isLeafletMobileViewport();
    const current = leafletPage;
    let target = current;

    if (mobile) {
      target = Math.max(0, Math.min(current + direction, leafletPages.length - 1));
    } else if (direction > 0) {
      target = current === 0
        ? Math.min(1, leafletPages.length - 1)
        : Math.min(current + 2, leafletPages.length - 1);
    } else {
      target = current <= 1 ? 0 : Math.max(1, current - 2);
    }

    if (target === current) return null;

    const front = mobile
      ? current
      : direction > 0
        ? (current === 0 ? 0 : Math.min(current + 1, leafletPages.length - 1))
        : current;
    const back = mobile
      ? target
      : direction > 0
        ? target
        : (target === 0 ? 0 : Math.min(target + 1, leafletPages.length - 1));

    return { direction, target, front, back };
  }, [leafletPage, leafletPages.length]);

  const moveLeaflet = useCallback((direction: -1 | 1) => {
    if (leafletFlip || leafletDrag) return;
    const turn = getLeafletTurn(direction);
    if (!turn) return;

    if (leafletFlipTimerRef.current) window.clearTimeout(leafletFlipTimerRef.current);
    setLeafletFlip(turn);
    leafletFlipTimerRef.current = window.setTimeout(() => {
      setLeafletPage(turn.target);
      setLeafletFlip(null);
      leafletFlipTimerRef.current = null;
    }, 520);
  }, [getLeafletTurn, leafletDrag, leafletFlip]);

  const clearLeafletDragTimer = useCallback(() => {
    if (!leafletDragTimerRef.current) return;
    window.clearTimeout(leafletDragTimerRef.current);
    leafletDragTimerRef.current = null;
  }, []);

  const closeWholesaleLeaflet = useCallback(() => {
    if (leafletFlipTimerRef.current) {
      window.clearTimeout(leafletFlipTimerRef.current);
      leafletFlipTimerRef.current = null;
    }
    clearLeafletDragTimer();
    leafletSwipeRef.current = null;
    leafletDragRef.current = null;
    setLeafletDrag(null);
    setLeafletFlip(null);
    setLeafletOpen(false);
    setLeafletPage(0);
    window.setTimeout(() => setLeafletPages([]), 120);
  }, [clearLeafletDragTimer]);

  const startLeafletSwipe = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea")) return;
    if (leafletFlip || leafletDrag || event.button !== 0) return;
    clearLeafletDragTimer();
    leafletSwipeRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    leafletDragRef.current = null;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional; controlled drag still works without it.
    }
  }, [clearLeafletDragTimer, leafletDrag, leafletFlip]);

  const updateLeafletSwipe = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const start = leafletSwipeRef.current;
    if (!start || start.pointerId !== event.pointerId || leafletFlip) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const horizontalIntent = Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy) * 1.05;
    if (!horizontalIntent) return;

    const direction: -1 | 1 = dx < 0 ? 1 : -1;
    const turn = getLeafletTurn(direction);
    if (!turn) {
      leafletDragRef.current = null;
      setLeafletDrag(null);
      return;
    }

    event.preventDefault();
    const stageWidth = Math.max(1, event.currentTarget.getBoundingClientRect().width);
    const travel = stageWidth * (isLeafletMobileViewport() ? 0.72 : 0.42);
    const progress = Math.max(0, Math.min(Math.abs(dx) / Math.max(120, travel), 1));
    const nextDrag: LeafletDragState = { ...turn, progress };
    leafletDragRef.current = nextDrag;
    setLeafletDrag(nextDrag);
  }, [getLeafletTurn, leafletFlip]);

  const finishLeafletSwipe = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const start = leafletSwipeRef.current;
    leafletSwipeRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may already have been released by the browser.
    }

    const drag = leafletDragRef.current;
    if (!start || start.pointerId !== event.pointerId || !drag || leafletFlip) {
      leafletDragRef.current = null;
      setLeafletDrag(null);
      return;
    }

    event.preventDefault();
    clearLeafletDragTimer();

    // The page follows the hand. It only turns after the user deliberately
    // drags roughly halfway across the page; a short swipe snaps back.
    if (drag.progress >= 0.45) {
      const settled: LeafletDragState = { ...drag, progress: 1, settling: "commit" };
      leafletDragRef.current = settled;
      setLeafletDrag(settled);
      leafletDragTimerRef.current = window.setTimeout(() => {
        setLeafletPage(drag.target);
        leafletDragRef.current = null;
        setLeafletDrag(null);
        leafletDragTimerRef.current = null;
      }, 260);
    } else {
      const settled: LeafletDragState = { ...drag, progress: 0, settling: "cancel" };
      leafletDragRef.current = settled;
      setLeafletDrag(settled);
      leafletDragTimerRef.current = window.setTimeout(() => {
        leafletDragRef.current = null;
        setLeafletDrag(null);
        leafletDragTimerRef.current = null;
      }, 210);
    }
  }, [clearLeafletDragTimer, leafletFlip]);

  const cancelLeafletSwipe = useCallback(() => {
    leafletSwipeRef.current = null;
    const drag = leafletDragRef.current;
    if (!drag) return;
    clearLeafletDragTimer();
    const settled: LeafletDragState = { ...drag, progress: 0, settling: "cancel" };
    leafletDragRef.current = settled;
    setLeafletDrag(settled);
    leafletDragTimerRef.current = window.setTimeout(() => {
      leafletDragRef.current = null;
      setLeafletDrag(null);
      leafletDragTimerRef.current = null;
    }, 210);
  }, [clearLeafletDragTimer]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(1, query), 220);
    return () => window.clearTimeout(timer);
  }, [query, load]);

  useEffect(() => () => {
    leafletPages.forEach((url) => URL.revokeObjectURL(url));
  }, [leafletPages]);

  useEffect(() => () => {
    if (leafletFlipTimerRef.current) window.clearTimeout(leafletFlipTimerRef.current);
    if (leafletDragTimerRef.current) window.clearTimeout(leafletDragTimerRef.current);
  }, []);

  useEffect(() => {
    if (!leafletOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeWholesaleLeaflet();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveLeaflet(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveLeaflet(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leafletOpen, closeWholesaleLeaflet, moveLeaflet]);

  const openAdd = () => {
    if (!canManage) return;
    setEditing(null);
    setDraft(emptyDraft);
    setImage(null);
    setError("");
    setSuccess("");
    setEditorOpen(true);
  };

  const openEdit = (product: CatalogueProduct) => {
    if (!canManage) return;
    setEditing(product);
    setDraft({
      code: product.code,
      name: product.name,
      description: product.description || "",
      category: product.category || "General",
    });
    setImage(null);
    setError("");
    setSuccess("");
    setEditorOpen(true);
  };

  const save = async () => {
    if (saving || !canManage) return;
    if (!draft.code.trim() || !draft.name.trim()) {
      setError("Enter the product code and product name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const uploadImage = image ? await optimiseCatalogueImage(image) : null;
      const form = new FormData();
      form.append("code", draft.code.trim());
      form.append("name", draft.name.trim());
      form.append("description", draft.description.trim());
      form.append("category", draft.category.trim() || "General");
      if (uploadImage) form.append("image", uploadImage);
      const response = await fetch(editing ? `/api/catalogue/${editing.id}` : "/api/catalogue", {
        method: editing ? "PATCH" : "POST",
        body: form,
      });
      await apiResult(response);
      setEditorOpen(false);
      setEditing(null);
      setDraft(emptyDraft);
      setImage(null);
      setSuccess(editing ? "Catalogue product updated." : "Catalogue product added.");
      window.setTimeout(() => setSuccess(""), 2600);
      await load(editing ? page : 1, query, false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  };


  const loadAllCatalogueProducts = async () => {
    const collected: CatalogueProduct[] = [];
    let exportPage = 1;
    let exportPages = 1;
    do {
      const params = new URLSearchParams({ page: String(exportPage), pageSize: "48" });
      const response = await fetch(`/api/catalogue?${params.toString()}`);
      const result = await apiResult(response);
      collected.push(...(result.products || []));
      exportPages = Math.max(1, Number(result.pages || 1));
      setPdfStatus(`Loading catalogue products ${Math.min(exportPage, exportPages)}/${exportPages}...`);
      setPdfProgress(Math.min(18, Math.round((exportPage / exportPages) * 18)));
      exportPage += 1;
    } while (exportPage <= exportPages);
    return collected;
  };

  const downloadWholesalePdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    setError("");
    setPdfStatus("Loading all catalogue products...");
    setPdfProgress(2);
    try {
      const allProducts = await loadAllCatalogueProducts();
      if (!allProducts.length) throw new Error("There are no catalogue products to include in the wholesale PDF.");
      await downloadWholesaleCatalogue(allProducts, (message, percent) => {
        setPdfStatus(message);
        setPdfProgress(percent);
      });
      window.setTimeout(() => {
        setPdfStatus("");
        setPdfProgress(0);
      }, 2600);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The wholesale catalogue PDF could not be created.");
      setPdfStatus("");
      setPdfProgress(0);
    } finally {
      setPdfBusy(false);
    }
  };

  const normaliseLeafletPage = (target: number) => {
    const max = Math.max(0, leafletPages.length - 1);
    const bounded = Math.max(0, Math.min(target, max));
    if (isLeafletMobileViewport() || bounded === 0) return bounded;
    return bounded % 2 === 1 ? bounded : Math.max(1, bounded - 1);
  };

  const viewWholesaleLeaflet = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    setError("");
    setPdfStatus("Loading all catalogue products...");
    setPdfProgress(2);
    try {
      const allProducts = await loadAllCatalogueProducts();
      if (!allProducts.length) throw new Error("There are no catalogue products to include in the wholesale leaflet.");
      const pageBlobs = await buildWholesaleLeafletPages(allProducts, (message, percent) => {
        setPdfStatus(message);
        setPdfProgress(percent);
      });
      const nextUrls = pageBlobs.map((blob) => URL.createObjectURL(blob));
      setLeafletPages(nextUrls);
      setLeafletPage(0);
      setLeafletFlip(null);
      setLeafletOpen(true);
      setPdfStatus("");
      setPdfProgress(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The wholesale leaflet could not be opened.");
      setPdfStatus("");
      setPdfProgress(0);
    } finally {
      setPdfBusy(false);
    }
  };

  const toggleLeafletFullscreen = async () => {
    const viewer = document.getElementById("catalogue-leaflet-viewer");
    if (!viewer) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewer.requestFullscreen();
    } catch {
      // Full screen is optional; the in-Hub viewer still remains usable.
    }
  };

  const remove = async () => {
    if (!deleteProduct || deleting || !canManage) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/catalogue/${deleteProduct.id}`, { method: "DELETE" });
      await apiResult(response);
      setDeleteProduct(null);
      setSuccess("Catalogue product removed.");
      window.setTimeout(() => setSuccess(""), 2600);
      const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
      await load(nextPage, query, false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be removed.");
    } finally {
      setDeleting(false);
    }
  };

  const syncPulseTiles = async () => {
    if (!canManage || pulseSyncBusy) return;
    setPulseSyncBusy(true);
    setPulseSyncStatus("Checking the Pulse Tiles ranges…");
    setPulseSyncProgress(1);
    setError("");
    setSuccess("");

    try {
      const planResponse = await fetch("/api/catalogue/pulse-sync", { cache: "no-store" });
      const plan = (await planResponse.json().catch(() => ({}))) as { error?: string; categories?: PulseSyncCategory[] };
      if (!planResponse.ok) throw new Error(plan.error || "Pulse Tiles could not be checked.");

      const categories = (plan.categories || []).filter((item) => item.available && item.pages > 0);
      const totalJobs = categories.reduce((sum, item) => sum + item.pages, 0);
      if (!totalJobs) throw new Error("No Pulse Tiles catalogue pages were available to sync.");

      let completed = 0;
      let imported = 0;
      let updated = 0;
      let failed = 0;

      for (const category of categories) {
        for (let sourcePage = 1; sourcePage <= category.pages; sourcePage += 1) {
          setPulseSyncStatus(`Syncing ${category.label} · page ${sourcePage} of ${category.pages}…`);
          const response = await fetch("/api/catalogue/pulse-sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ category: category.key, page: sourcePage }),
          });
          const result = (await response.json().catch(() => ({}))) as {
            error?: string;
            imported?: number;
            updated?: number;
            failed?: number;
          };
          if (!response.ok) throw new Error(result.error || `Pulse Tiles ${category.label} page ${sourcePage} could not be synced.`);
          imported += Number(result.imported || 0);
          updated += Number(result.updated || 0);
          failed += Number(result.failed || 0);
          completed += 1;
          setPulseSyncProgress(Math.max(2, Math.round((completed / totalJobs) * 100)));
        }
      }

      setSuccess(`Pulse Tiles sync complete: ${imported} added, ${updated} refreshed${failed ? `, ${failed} could not be read` : ""}.`);
      setPulseSyncStatus("");
      setPulseSyncProgress(0);
      await load(1, query, false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pulse Tiles could not be synced.");
      setPulseSyncStatus("");
      setPulseSyncProgress(0);
    } finally {
      setPulseSyncBusy(false);
    }
  };

  return (
    <div className="catalogueModule">
      <section className="catalogueHero">
        <div className="catalogueHeroIntro">
          <small>POWERBUILD PRODUCT LIBRARY</small>
          <h2>Our Catalogue</h2>
          <p>Browse the group product catalogue by product name, code, category or description.</p>
        </div>
        <div className="catalogueHeroActions">
          <label>
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product or code…"
            />
          </label>
          <div className="cataloguePdfActions">
            <button
              type="button"
              className="cataloguePdfButton leaflet"
              disabled={pdfBusy}
              onClick={() => void viewWholesaleLeaflet()}
            >
              <span>VIEW</span> {pdfBusy ? "Preparing leaflet..." : "View leaflet"}
            </button>
            <button
              type="button"
              className="cataloguePdfButton wholesale"
              disabled={pdfBusy}
              onClick={() => void downloadWholesalePdf()}
            >
              <span>PDF</span> {pdfBusy ? "Building wholesale PDF..." : "Download wholesale division PDF"}
            </button>
          </div>
          {canManage && (
            <div className="catalogueManagerActions">
              <button className="primary" onClick={openAdd}>＋ Add catalogue product</button>
              <button className="cataloguePulseSyncButton" disabled={pulseSyncBusy} onClick={() => void syncPulseTiles()}>
                {pulseSyncBusy ? "Syncing Pulse Tiles…" : "↻ Sync Pulse Tiles"}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="catalogueSummary">
        <span><b>{total}</b><small>Products in catalogue</small></span>
        <span><b>{page}</b><small>Page of {pages}</small></span>
        {expectedManager && canManage && <em>Catalogue administrator</em>}
      </div>

      {success && <div className="catalogueSuccess">✓ {success}</div>}
      {pulseSyncStatus && (
        <div className="cataloguePulseProgress" aria-live="polite">
          <div><b>{pulseSyncStatus}</b><span>{pulseSyncProgress}%</span></div>
          <i><span style={{ width: `${Math.max(2, pulseSyncProgress)}%` }} /></i>
          <small>PowerBuild is importing the live Pulse Tiles tile ranges, product codes, descriptions and source images into Our Catalogue.</small>
        </div>
      )}
      {pdfStatus && (
        <div className="cataloguePdfProgress" aria-live="polite">
          <div><b>{pdfStatus}</b><span>{pdfProgress}%</span></div>
          <i><span style={{ width: `${Math.max(2, pdfProgress)}%` }} /></i>
          <small>The wholesale PDF is built on this device so the Cloudflare Worker is not overloaded.</small>
        </div>
      )}
      {error && !editorOpen && <div className="catalogueError">{error}</div>}

      {loading ? (
        <div className="catalogueLoading">Loading catalogue products…</div>
      ) : products.length === 0 ? (
        <div className="catalogueEmpty">
          <i>▧</i>
          <h3>{query ? "No products match your search" : "The catalogue is ready for products"}</h3>
          <p>{query ? "Try another product name, code or category." : canManage ? "Add the first product, code, description and picture." : "Catalogue products will appear here once they are added."}</p>
          {!query && canManage && <button className="primary" onClick={openAdd}>Add first product</button>}
        </div>
      ) : (
        <>
          <div className="catalogueGrid">
            {products.map((product) => {
              const assorted = isAssortedProduct(product);
              const tommyFixVariant = getTommyFixVariant(product);
              const displayDescription = getCatalogueDisplayDescription(product, assorted, tommyFixVariant);
              return (
              <article className={`catalogueCard${assorted ? " catalogueCard--assorted" : ""}${tommyFixVariant ? " catalogueCard--tommy" : ""}`} key={product.id}>
                <div className="catalogueImage">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} loading="lazy" />
                  ) : (
                    <div><i>▧</i><small>Product image</small></div>
                  )}
                  {!assorted && <b>{product.code}</b>}
                </div>
                <div className="catalogueCardBody">
                  <small>{product.category || "General"}</small>
                  <h3>{product.name}</h3>
                  {tommyFixVariant ? (
                    <div className="catalogueTommyVariant" aria-label={`Variant ${tommyFixVariant.size}, pack ${tommyFixVariant.pack}`}>
                      <span><em>SIZE</em><strong>{tommyFixVariant.size}</strong></span>
                      <span><em>PACK</em><strong>{tommyFixVariant.pack}</strong></span>
                    </div>
                  ) : (
                    <p>{displayDescription}</p>
                  )}
                  {assorted && <div className="catalogueAssortedBadge">ASSORTED</div>}
                  {canManage && (
                    <div className="catalogueManageActions">
                      <button onClick={() => openEdit(product)}>Edit</button>
                      <button className="dangerText" onClick={() => setDeleteProduct(product)}>Remove</button>
                    </div>
                  )}
                </div>
              </article>
              );
            })}
          </div>

          {pages > 1 && (
            <nav className="cataloguePager" aria-label="Catalogue pages">
              <button
                type="button"
                className="cataloguePagerArrow"
                aria-label="Go to previous catalogue page"
                disabled={loading || page <= 1}
                onClick={() => void load(page - 1, query)}
              >
                <span aria-hidden="true">←</span>
              </button>

              <div className="cataloguePagerNumbers" aria-label={`Page ${page} of ${pages}`}>
                {visiblePageItems.map((item) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      className={item === page ? "active" : ""}
                      aria-current={item === page ? "page" : undefined}
                      aria-label={`Go to catalogue page ${item}`}
                      disabled={loading || item === page}
                      onClick={() => void load(item, query)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="cataloguePagerGap" aria-hidden="true">…</span>
                  ),
                )}
              </div>

              <button
                type="button"
                className="cataloguePagerArrow"
                aria-label="Go to next catalogue page"
                disabled={loading || page >= pages}
                onClick={() => void load(page + 1, query)}
              >
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          )}
        </>
      )}

      {leafletOpen && leafletPages.length > 0 && (
        <div className="catalogueLeafletOverlay" role="presentation" onMouseDown={closeWholesaleLeaflet}>
          <section
            id="catalogue-leaflet-viewer"
            className="catalogueLeafletViewer catalogueLeafletFlipbook"
            role="dialog"
            aria-modal="true"
            aria-label="PowerBuild Wholesale Division leaflet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <small>POWERBUILD WHOLESALE DIVISION</small>
                <h3>View Leaflet</h3>
              </div>
              <div className="catalogueLeafletViewerActions">
                <button type="button" className="catalogueLeafletFullscreen" onClick={() => void toggleLeafletFullscreen()}>
                  Full screen
                </button>
                <button type="button" className="catalogueLeafletClose" onClick={closeWholesaleLeaflet} aria-label="Close leaflet">×</button>
              </div>
            </header>

            <div
              className={`catalogueLeafletStage${leafletFlip ? " is-flipping" : ""}${leafletDrag ? " is-dragging" : ""}`}
              onPointerDown={startLeafletSwipe}
              onPointerMove={updateLeafletSwipe}
              onPointerUp={finishLeafletSwipe}
              onPointerCancel={cancelLeafletSwipe}
            >
              <button
                type="button"
                className="catalogueLeafletNav catalogueLeafletPrev"
                aria-label="Previous leaflet page"
                disabled={leafletPage <= 0 || Boolean(leafletFlip) || Boolean(leafletDrag)}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  moveLeaflet(-1);
                }}
              >
                ‹
              </button>

              <div className={`catalogueLeafletSpread${leafletPage === 0 ? " catalogueLeafletSpread--cover" : ""}`}>
                <figure className="catalogueLeafletPage">
                  <img src={leafletPages[leafletPage]} alt={`Leaflet page ${leafletPage + 1}`} draggable={false} />
                </figure>
                {leafletPage > 0 && leafletPage + 1 < leafletPages.length && (
                  <figure className="catalogueLeafletPage catalogueLeafletPageSecondary">
                    <img src={leafletPages[leafletPage + 1]} alt={`Leaflet page ${leafletPage + 2}`} draggable={false} />
                  </figure>
                )}
                {leafletFlip && (
                  <figure
                    className={`catalogueLeafletTurnPage ${leafletFlip.direction > 0 ? "catalogueLeafletTurnPage--next" : "catalogueLeafletTurnPage--prev"}${leafletPage === 0 ? " catalogueLeafletTurnPage--cover" : ""}`}
                    aria-hidden="true"
                  >
                    <span className="catalogueLeafletTurnFace catalogueLeafletTurnFront">
                      <img src={leafletPages[leafletFlip.front]} alt="" draggable={false} />
                    </span>
                    <span className="catalogueLeafletTurnFace catalogueLeafletTurnBack">
                      <img src={leafletPages[leafletFlip.back]} alt="" draggable={false} />
                    </span>
                  </figure>
                )}
                {leafletDrag && !leafletFlip && (
                  <figure
                    className={`catalogueLeafletTurnPage catalogueLeafletTurnPage--controlled ${leafletDrag.direction > 0 ? "catalogueLeafletTurnPage--controlled-next" : "catalogueLeafletTurnPage--controlled-prev"}${leafletPage === 0 ? " catalogueLeafletTurnPage--cover" : ""}${leafletDrag.settling ? " is-settling" : ""}`}
                    style={{ transform: leafletTurnTransform(leafletDrag.direction, leafletDrag.progress, leafletPage === 0) }}
                    aria-hidden="true"
                  >
                    <span className="catalogueLeafletTurnFace catalogueLeafletTurnFront">
                      <img src={leafletPages[leafletDrag.front]} alt="" draggable={false} />
                    </span>
                    <span className="catalogueLeafletTurnFace catalogueLeafletTurnBack">
                      <img src={leafletPages[leafletDrag.back]} alt="" draggable={false} />
                    </span>
                  </figure>
                )}
              </div>

              <button
                type="button"
                className="catalogueLeafletNav catalogueLeafletNext"
                aria-label="Next leaflet page"
                disabled={leafletPage >= leafletPages.length - 1 || Boolean(leafletFlip) || Boolean(leafletDrag)}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  moveLeaflet(1);
                }}
              >
                ›
              </button>
            </div>

            <footer className="catalogueLeafletFooter">
              <div className="catalogueLeafletPageReadout">
                <strong>Page {leafletPage + 1} of {leafletPages.length}</strong>
                <span>Hold and drag — release past halfway to turn</span>
              </div>
              <div className="catalogueLeafletThumbnails" aria-label="Leaflet pages">
                {leafletPages.map((pageUrl, index) => {
                  const active = index === leafletPage;
                  return (
                    <button
                      type="button"
                      key={`${pageUrl}-${index}`}
                      className={active ? "active" : ""}
                      onClick={() => setLeafletPage(normaliseLeafletPage(index))}
                      aria-label={`Go to leaflet page ${index + 1}`}
                    >
                      <img src={pageUrl} alt="" draggable={false} />
                      <span>{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </footer>
          </section>
        </div>
      )}

      {editorOpen && canManage && (
        <div className="overlay catalogueEditorOverlay" onMouseDown={() => !saving && setEditorOpen(false)}>
          <div className="catalogueEditor" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <span>
                <h2>{editing ? "Edit catalogue product" : "Add catalogue product"}</h2>
                <p>Product information is visible to all authorised Hub users.</p>
              </span>
              <button disabled={saving} onClick={() => setEditorOpen(false)}>×</button>
            </header>
            {error && <div className="catalogueError">{error}</div>}
            <div className="catalogueFormGrid">
              <label>
                Product code / catalogue reference
                <input
                  autoFocus
                  value={draft.code}
                  onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                  placeholder="e.g. PVC110RR"
                />
                <small>Internal catalogue reference. For assorted 5L / 20L ranges, this code is kept for administration but is not shown on the product card.</small>
              </label>
              <label>
                Product name
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Product name"
                />
              </label>
              <label>
                Category
                <input
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  placeholder="e.g. Plumbing"
                />
              </label>
              <label>
                Product picture
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/*"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] || null;
                    if (selected && selected.size > MAX_SOURCE_IMAGE_BYTES) {
                      setImage(null);
                      setError("Please choose a product picture smaller than 30MB. Larger images cannot be processed safely on the device.");
                      event.currentTarget.value = "";
                      return;
                    }
                    setImage(selected);
                    setError("");
                  }}
                />
                <small>{image ? `${image.name} · ${(image.size / 1024 / 1024).toFixed(1)}MB · optimised automatically on upload` : editing?.image_name || "PNG/JPG/WebP · large pictures are optimised automatically"}</small>
              </label>
              <label className="wide">
                Description
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder="Product description, size, application or other catalogue details"
                />
              </label>
            </div>
            <footer>
              <button disabled={saving} onClick={() => setEditorOpen(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {deleteProduct && canManage && (
        <div className="overlay catalogueDeleteOverlay" onMouseDown={() => !deleting && setDeleteProduct(null)}>
          <div className="deleteConfirmModal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="deleteConfirmIcon">!</div>
            <h2>Remove product?</h2>
            <p>Are you sure you want to remove <strong>“{deleteProduct.name}”</strong> from the catalogue?</p>
            <small>Its product code is {deleteProduct.code}. This will remove it from users’ catalogue view.</small>
            <div className="deleteConfirmActions">
              <button disabled={deleting} className="deleteConfirmCancel" onClick={() => setDeleteProduct(null)}>Cancel</button>
              <button disabled={deleting} className="deleteConfirmButton" onClick={() => void remove()}>{deleting ? "Removing…" : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
