"use client";
import { useMemo, useRef, useState } from "react";
import type { TagBrand, TagUnit } from "../lib/price-tags";
import { bulkPriceCents, parseBulkPriceRows, type BulkPriceRow } from "../lib/bulk-price-import";
import styles from "./bulk-price-tag-studio.module.css";

type XlsxSheet = Record<string, unknown> & { "!ref"?: string; "!cols"?: Array<{ wch: number }> };
type XlsxBook = { SheetNames: string[]; Sheets: Record<string, XlsxSheet> };
type XlsxModule = {
  read(data: Uint8Array, options: Record<string, unknown>): XlsxBook;
  write(book: XlsxBook, options: Record<string, unknown>): ArrayBuffer;
  utils: {
    sheet_to_json<T>(sheet: XlsxSheet, options: Record<string, unknown>): T[];
    aoa_to_sheet(data: unknown[][]): XlsxSheet;
    book_new(): XlsxBook;
    book_append_sheet(book: XlsxBook, sheet: XlsxSheet, name: string): void;
  };
};
const loadExcel = () => {
  const moduleUrl = "/price-tag-assets/xlsx.mjs";
  return import(/* @vite-ignore */ moduleUrl) as Promise<XlsxModule>;
};

function unitLabel(unit: TagUnit) { return unit === "BOX" ? "per box" : unit === "M2" ? "per m²" : "each"; }
function BulkTag({ row, brand, branch }: { row: BulkPriceRow; brand: TagBrand; branch: string }) {
  const cents = bulkPriceCents(row.price) || 0;
  const [whole, decimal] = (cents / 100).toFixed(2).split(".");
  const buster = brand === "busterbuild";
  return <article className={`${styles.tag} ${buster ? styles.buster : styles.powerbuild}`}>
    <header><img src={buster ? "/price-tag-assets/busterbuild-logo.png" : "/powerbuild-logo-transparent.png"} alt={buster ? "BusterBuild" : "PowerBuild"}/>{branch && <span>{branch}</span>}</header>
    <div className={styles.tagBody}>
      {row.code && <small>CODE: {row.code}</small>}
      <h2>{row.name}</h2>
      {row.colour && <p>Colour: {row.colour}</p>}
      <div className={styles.price}><span>R</span><strong>{whole}</strong><sup>{decimal}</sup></div>
      <footer>{unitLabel(row.unit)} · VAT included</footer>
    </div>
  </article>;
}

export default function BulkPriceTagStudio({ brand, onBack }: { brand: TagBrand; onBack: () => void }) {
  const [rows, setRows] = useState<BulkPriceRow[]>([]);
  const [perPage, setPerPage] = useState<6 | 8>(8);
  const [branch, setBranch] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const invalid = rows.filter(row => !row.name.trim() || bulkPriceCents(row.price) === null);
  const pages = useMemo(() => {
    const output: BulkPriceRow[][] = [];
    for (let index = 0; index < rows.length; index += perPage) output.push(rows.slice(index, index + perPage));
    return output;
  }, [rows, perPage]);
  const update = (id: string, patch: Partial<BulkPriceRow>) => setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row));

  async function importWorkbook(file?: File) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setMessage("Choose an Excel file smaller than 15 MB."); return; }
    setBusy(true); setMessage("Reading the Excel price list…");
    try {
      const XLSX = await loadExcel();
      const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array", cellText: true, cellDates: false });
      const sheetName = workbook.SheetNames.find(name => workbook.Sheets[name]?.["!ref"]);
      if (!sheetName) throw new Error("The workbook does not contain a readable worksheet.");
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: false, defval: "", blankrows: false });
      const result = parseBulkPriceRows(matrix);
      if (!result.rows.length) throw new Error("No valid products were found. Include Product Name and Price columns.");
      setRows(result.rows); setFileName(file.name);
      const notes = [`${result.rows.length} price tag${result.rows.length === 1 ? "" : "s"} loaded from ${sheetName}.`];
      if (result.rejected.length) notes.push(`${result.rejected.length} row${result.rejected.length === 1 ? " was" : "s were"} skipped because the product name or price was missing.`);
      if (result.truncated) notes.push("Only the first 500 valid rows were loaded.");
      setMessage(notes.join(" "));
    } catch (error) { setRows([]); setFileName(""); setMessage(error instanceof Error ? error.message : "The Excel file could not be read."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function downloadTemplate() {
    setBusy(true); setMessage("Preparing the Excel template…");
    try {
      const XLSX = await loadExcel();
      const sheet = XLSX.utils.aoa_to_sheet([
        ["Product Code", "Product Name", "Price", "Unit", "Colour", "Branch"],
        ["TC0047", "HOLE SAW TCT 16MM FOR METAL", 135, "Each", "", "PowerBuild Sungate"],
        ["TILE600", "600X600 PORCELAIN TILE", 399.99, "Box", "Ivory", "PowerBuild Sungate"],
      ]);
      sheet["!cols"] = [{ wch: 18 }, { wch: 42 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 28 }];
      const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Price Tags");
      const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a"); link.href = url; link.download = "Bulk_A4_Price_Tag_Template.xlsx"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage("Excel template downloaded. Replace the sample rows with the manager’s products and prices.");
    } catch { setMessage("The Excel template could not download. Try again."); }
    finally { setBusy(false); }
  }
  function addRow() {
    setRows(current => [...current, { id: `manual-${Date.now()}`, sourceRow: 0, code: "", name: "", price: "", unit: "EA", colour: "", branch: "" }]);
  }
  function print() {
    if (!rows.length) { setMessage("Upload an Excel file or add a product first."); return; }
    if (invalid.length) { setMessage(`Correct or remove the ${invalid.length} incomplete row${invalid.length === 1 ? "" : "s"} before printing.`); return; }
    setMessage(""); window.print();
  }
  return <main className={styles.studio}>
    <header className={styles.top}><div><small>{brand === "busterbuild" ? "BUSTERBUILD" : "POWERBUILD"} · PRICE TAG STUDIO</small><h1>Bulk A4 price tags</h1><p>Upload the manager’s Excel price list and print six or eight cut-ready tags per A4 page.</p></div><button type="button" onClick={onBack}>Back to Price Tag Studio</button></header>
    <section className={styles.controls}>
      <div className={styles.upload}>
        <h2>1. Upload the manager’s price list</h2>
        <p>Excel columns can be Product Name and Price. Product Code, Unit, Colour and Branch are optional. The first populated worksheet is used.</p>
        <div><button type="button" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Reading…" : "Upload XLS / XLSX"}</button><button type="button" className={styles.secondary} disabled={busy} onClick={() => void downloadTemplate()}>Download Excel template</button></div>
        <input ref={input} hidden type="file" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={event => void importWorkbook(event.target.files?.[0])}/>
        {fileName && <strong>{fileName}</strong>}
      </div>
      <div className={styles.options}>
        <h2>2. Choose the A4 layout</h2>
        <div className={styles.layoutButtons}><button type="button" aria-pressed={perPage === 6} onClick={() => setPerPage(6)}>6 larger tags</button><button type="button" aria-pressed={perPage === 8} onClick={() => setPerPage(8)}>8 compact tags</button></div>
        <label>Branch name applied where the Excel Branch cell is blank<input value={branch} maxLength={70} placeholder="e.g. PowerBuild Sungate" onChange={event => setBranch(event.target.value)}/></label>
        <div className={styles.actions}><button type="button" onClick={addRow}>Add product manually</button><button type="button" className={styles.printButton} disabled={!rows.length || Boolean(invalid.length)} onClick={print}>Print / Save A4 PDF ({pages.length} page{pages.length === 1 ? "" : "s"})</button><button type="button" className={styles.secondary} disabled={!rows.length} onClick={() => { setRows([]); setFileName(""); setMessage(""); }}>Clear</button></div>
        <p className={styles.private}>The workbook is read inside this browser. It is used to prepare printable tags and is not uploaded or saved in the Hub.</p>
      </div>
    </section>
    {message && <p className={styles.message} role="status">{message}</p>}
    {rows.length > 0 && <section className={styles.review}>
      <header><div><h2>3. Review before printing</h2><p>{rows.length} tag{rows.length === 1 ? "" : "s"} · {perPage} per A4 page</p></div></header>
      <div className={styles.tableWrap}><table><thead><tr><th>Code</th><th>Product name</th><th>Price incl. VAT</th><th>Unit</th><th>Colour</th><th>Branch</th><th/></tr></thead><tbody>{rows.map(row => <tr key={row.id} className={!row.name.trim() || bulkPriceCents(row.price) === null ? styles.invalid : ""}>
        <td><input value={row.code} onChange={event => update(row.id, { code: event.target.value })}/></td>
        <td><input value={row.name} onChange={event => update(row.id, { name: event.target.value })}/></td>
        <td><input inputMode="decimal" value={row.price} onChange={event => update(row.id, { price: event.target.value })}/></td>
        <td><select value={row.unit} onChange={event => update(row.id, { unit: event.target.value as TagUnit })}><option value="EA">Each</option><option value="BOX">Per box</option><option value="M2">Per m²</option></select></td>
        <td><input value={row.colour} onChange={event => update(row.id, { colour: event.target.value })}/></td>
        <td><input value={row.branch} placeholder={branch || "Optional"} onChange={event => update(row.id, { branch: event.target.value })}/></td>
        <td><button type="button" onClick={() => setRows(current => current.filter(item => item.id !== row.id))}>Remove</button></td>
      </tr>)}</tbody></table></div>
    </section>}
    <section className={styles.pages} aria-label="A4 bulk price tag preview">{pages.map((page, pageIndex) => <div key={pageIndex} className={`${styles.sheet} ${perPage === 6 ? styles.six : styles.eight}`}><span className={styles.pageNumber}>Page {pageIndex + 1}</span>{page.map(row => <div className={styles.cutCell} key={row.id}><BulkTag row={row} brand={brand} branch={row.branch || branch}/></div>)}</div>)}</section>
    {!rows.length && <div className={styles.empty}>Upload an Excel price list to create the A4 print sheets.</div>}
  </main>;
}
