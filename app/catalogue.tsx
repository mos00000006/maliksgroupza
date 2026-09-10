"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const requestId = useRef(0);
  const pageSize = 12;

  const expectedManager = useMemo(
    () => ["moyanamoses006@icloud.com", "moyanamoses006@icloud", "msallikutti@gmail.com"].includes(currentUserEmail.toLowerCase()),
    [currentUserEmail],
  );

  const load = async (targetPage = page, search = query, quiet = false) => {
    const id = ++requestId.current;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
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
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(1, query), 220);
    return () => window.clearTimeout(timer);
  }, [query]);


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

  return (
    <div className="catalogueModule">
      <section className="catalogueHero">
        <span>
          <small>POWERBUILD PRODUCT LIBRARY</small>
          <h2>Our Catalogue</h2>
          <p>Browse the group product catalogue by product name, code, category or description.</p>
        </span>
        <div className="catalogueHeroActions">
          <label>
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product or code…"
            />
          </label>
          {canManage && (
            <button className="primary" onClick={openAdd}>＋ Add catalogue product</button>
          )}
        </div>
      </section>

      <div className="catalogueSummary">
        <span><b>{total}</b><small>Products in catalogue</small></span>
        <span><b>{page}</b><small>Page of {pages}</small></span>
        {expectedManager && canManage && <em>Catalogue administrator</em>}
      </div>

      {success && <div className="catalogueSuccess">✓ {success}</div>}
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
            {products.map((product) => (
              <article className="catalogueCard" key={product.id}>
                <div className="catalogueImage">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} loading="lazy" />
                  ) : (
                    <div><i>▧</i><small>Product image</small></div>
                  )}
                  <b>{product.code}</b>
                </div>
                <div className="catalogueCardBody">
                  <small>{product.category || "General"}</small>
                  <h3>{product.name}</h3>
                  <p>{product.description || "No product description added yet."}</p>
                  {canManage && (
                    <div className="catalogueManageActions">
                      <button onClick={() => openEdit(product)}>Edit</button>
                      <button className="dangerText" onClick={() => setDeleteProduct(product)}>Remove</button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {pages > 1 && (
            <nav className="cataloguePager" aria-label="Catalogue pages">
              <button
                disabled={page <= 1 || loading}
                onClick={() => void load(page - 1, query)}
              >
                ← Previous
              </button>
              <span>Page <b>{page}</b> of <b>{pages}</b></span>
              <button
                disabled={page >= pages || loading}
                onClick={() => void load(page + 1, query)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
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
                Product code
                <input
                  autoFocus
                  value={draft.code}
                  onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                  placeholder="e.g. PVC110RR"
                />
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
