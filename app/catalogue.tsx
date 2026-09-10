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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load the catalogue.");
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
    const form = new FormData();
    form.append("code", draft.code.trim());
    form.append("name", draft.name.trim());
    form.append("description", draft.description.trim());
    form.append("category", draft.category.trim() || "General");
    if (image) form.append("image", image);
    try {
      const response = await fetch(editing ? `/api/catalogue/${editing.id}` : "/api/catalogue", {
        method: editing ? "PATCH" : "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The product could not be saved.");
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
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The product could not be removed.");
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
                  accept="image/*"
                  onChange={(event) => setImage(event.target.files?.[0] || null)}
                />
                <small>{image ? image.name : editing?.image_name || "PNG/JPG/WebP · max 8MB"}</small>
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
