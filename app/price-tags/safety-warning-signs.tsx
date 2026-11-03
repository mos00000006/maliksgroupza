"use client";
import { useRef, useState } from "react";
import { toJpeg } from "../lib/vendor/html-to-image.mjs";
import { signagePdf, signageSize, type Orientation, type Paper } from "../lib/signage-export";
import type { TagBrand } from "../lib/price-tags";
import styles from "./safety-warning-signs.module.css";

type SignFamily = "warning" | "mandatory" | "prohibition" | "emergency" | "fire" | "notice";
type Preset = { label: string; family: SignFamily; heading: string; detail: string; pictogram: string };
const presets = {
  forklift: { label: "Forklift operating area", family: "warning", heading: "WARNING: FORKLIFTS", detail: "Keep clear of moving forklifts and loading areas.", pictogram: "forklift" },
  vehicles: { label: "Moving vehicles", family: "warning", heading: "MOVING VEHICLES", detail: "Look both ways before crossing the yard.", pictogram: "truck" },
  wet: { label: "Slippery floor", family: "warning", heading: "CAUTION: WET FLOOR", detail: "Take care. Slippery surface.", pictogram: "slip" },
  hardhat: { label: "Hard hats required", family: "mandatory", heading: "HARD HATS REQUIRED", detail: "Wear head protection beyond this point.", pictogram: "helmet" },
  footwear: { label: "Safety footwear required", family: "mandatory", heading: "SAFETY FOOTWEAR REQUIRED", detail: "Wear approved protective footwear.", pictogram: "boot" },
  eye: { label: "Eye protection required", family: "mandatory", heading: "EYE PROTECTION REQUIRED", detail: "Wear suitable eye protection.", pictogram: "glasses" },
  noentry: { label: "No unauthorised entry", family: "prohibition", heading: "NO UNAUTHORISED ENTRY", detail: "Authorised staff only.", pictogram: "person" },
  smoking: { label: "No smoking", family: "prohibition", heading: "NO SMOKING", detail: "Smoking is not permitted in this area.", pictogram: "cigarette" },
  exit: { label: "Emergency exit", family: "emergency", heading: "EMERGENCY EXIT", detail: "Keep this route clear at all times.", pictogram: "exit" },
  firstaid: { label: "First aid", family: "emergency", heading: "FIRST AID", detail: "First aid equipment located here.", pictogram: "cross" },
  extinguisher: { label: "Fire extinguisher", family: "fire", heading: "FIRE EXTINGUISHER", detail: "Keep equipment accessible.", pictogram: "extinguisher" },
  assembly: { label: "Assembly point", family: "emergency", heading: "ASSEMBLY POINT", detail: "Report here during an evacuation.", pictogram: "assembly" },
  custom: { label: "Custom safety notice", family: "notice", heading: "SAFETY NOTICE", detail: "Enter site-specific instructions.", pictogram: "info" },
} as const satisfies Record<string, Preset>;
type PresetKey = keyof typeof presets;
const color: Record<SignFamily, string> = { warning: "#edb92f", mandatory: "#1156a2", prohibition: "#d72c29", emergency: "#15834e", fire: "#c82726", notice: "#164b7a" };

function Symbol({ family, pictogram }: { family: SignFamily; pictogram: string }) {
  const ink = family === "warning" ? "#111" : "#fff";
  const shared = { fill: "none", stroke: ink, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 180 180" role="img" aria-label={`${family} symbol: ${pictogram}`}>
    {family === "warning" ? <path d="M90 14 171 158H9Z" fill="#edb92f" stroke="#171717" strokeWidth="11" strokeLinejoin="round"/> :
      family === "prohibition" ? <circle cx="90" cy="90" r="77" fill="#fff" stroke="#d72c29" strokeWidth="15"/> :
      family === "mandatory" ? <circle cx="90" cy="90" r="77" fill="#1156a2"/> :
      <rect x="12" y="12" width="156" height="156" rx="12" fill={color[family]}/>}
    <g {...shared} stroke={family === "warning" || family === "prohibition" ? "#101010" : "#fff"}>
      {pictogram === "forklift" && <><path d="M45 119V77h53v42H45Zm53-42h22l12 27v15h-12M45 119h-8M126 48v70M140 48v70M126 118h19"/><circle cx="62" cy="131" r="12"/><circle cx="116" cy="131" r="12"/></>}
      {pictogram === "truck" && <><path d="M35 78h73v47H35zM108 92h21l17 23v10h-38"/><circle cx="60" cy="134" r="11"/><circle cx="127" cy="134" r="11"/></>}
      {pictogram === "slip" && <><circle cx="80" cy="53" r="10"/><path d="m85 69-18 30 29 12 16 27M69 98 46 112M96 111l30-7M40 145h99"/></>}
      {pictogram === "helmet" && <><path d="M42 108h96M51 107c0-57 78-57 78 0M90 57v24M62 111q28 19 57 0"/></>}
      {pictogram === "boot" && <><path d="M42 64v62h100v-24H95L79 64zM43 114h99"/></>}
      {pictogram === "glasses" && <><path d="M27 78h20l7 38h30l7-33 7 33h30l7-38h18M84 86h10"/></>}
      {pictogram === "person" && <><circle cx="90" cy="60" r="16"/><path d="M90 80v46m-24-24 24-22 24 22m-24 24-22 24m22-24 22 24"/></>}
      {pictogram === "cigarette" && <><path d="M41 106h91v15H41zM118 106v15M59 90q-10-10 0-18t0-18m22 36q-10-10 0-18t0-18"/></>}
      {pictogram === "exit" && <><path d="M40 42h62v96H40zM106 92h40m-15-15 15 15-15 15"/><circle cx="66" cy="66" r="9"/><path d="m66 77-10 24 20 12 8 21M61 96l-14 15"/></>}
      {pictogram === "cross" && <path d="M73 37h34v36h36v34h-36v36H73v-36H37V73h36Z" fill="#fff" stroke="none"/>}
      {pictogram === "extinguisher" && <><rect x="67" y="63" width="48" height="81" rx="9"/><path d="M77 63V47h31v16m-31-16 8-14h24M111 65q27-9 30 25"/></>}
      {pictogram === "assembly" && <><circle cx="90" cy="90" r="16"/><path d="M90 26v36m-12-12 12 12 12-12M90 154v-36m-12 12 12-12 12 12M26 90h36m-12-12 12 12-12 12m104-12h-36m12-12-12 12 12 12"/></>}
      {pictogram === "info" && <><circle cx="90" cy="90" r="54"/><path d="M90 81v39M90 58v3"/></>}
    </g>
    {family === "prohibition" && <path d="M36 36 144 144" stroke="#d72c29" strokeWidth="15"/>}
  </svg>;
}
function Artwork({ brand, preset, heading, detail, branch, orientation }: { brand: TagBrand; preset: Preset; heading: string; detail: string; branch: string; orientation: Orientation }) {
  const theme = color[preset.family];
  const buster = brand === "busterbuild";
  return <article className={`${styles.artwork} ${orientation === "landscape" ? styles.landscape : ""}`} style={{ borderColor: theme }}>
    <div className={styles.symbolArea} style={{ background: preset.family === "warning" ? "#fff8da" : "#f3f6f9" }}><Symbol family={preset.family} pictogram={preset.pictogram}/></div>
    <div className={styles.wording}>
      <div className={styles.family} style={{ background: theme, color: preset.family === "warning" ? "#111" : "#fff" }}>{preset.family.toUpperCase()}</div>
      <h2 style={{ fontSize: `${Math.min(7.3, Math.max(3.2, 165 / Math.max(heading.length, 8)))}cqw` }}>{heading}</h2>
      <p style={{ fontSize: `${Math.min(3.1, Math.max(1.7, 160 / Math.max(detail.length, 10)))}cqw` }}>{detail}</p>
      <footer><span>{buster ? "BUSTER BUILD" : "POWERBUILD"}</span><small>{branch || "STORE SAFETY"}</small></footer>
    </div>
  </article>;
}
export default function SafetyWarningSigns({ brand, onBack }: { brand: TagBrand; onBack: () => void }) {
  const [key, setKey] = useState<PresetKey>("forklift");
  const [heading, setHeading] = useState<string>(presets.forklift.heading);
  const [detail, setDetail] = useState<string>(presets.forklift.detail);
  const [branch, setBranch] = useState("");
  const [paper, setPaper] = useState<Paper>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const chosen: Preset = presets[key];
  const size = signageSize(paper, orientation);
  const choose = (next: PresetKey) => { setKey(next); setHeading(presets[next].heading); setDetail(presets[next].detail); setMessage(""); };
  async function exportSign(format: "pdf" | "jpg") {
    if (!heading.trim()) { setMessage("Enter the required sign heading."); return; }
    setBusy(true); setMessage("Preparing print file…");
    try {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const node = stage.current?.firstElementChild as HTMLElement | null;
      if (!node) throw new Error("Sign preview not available.");
      const width = size.pixelsWide / 2, height = size.pixelsHigh / 2;
      const jpeg = await toJpeg(node, { width, height, pixelRatio: 2, quality: .97, skipFonts: true, backgroundColor: "#fff", style: { width: `${width}px`, height: `${height}px`, boxShadow: "none" } });
      const url = format === "pdf" ? URL.createObjectURL(signagePdf(jpeg, size)) : jpeg;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${brand === "busterbuild" ? "BusterBuild" : "PowerBuild"}-Safety-${key}-${paper}-${orientation}.${format}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      if (format === "pdf") window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(`${format.toUpperCase()} ready. For PDF, print at Actual size (100%).`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to prepare the sign."); }
    finally { setBusy(false); }
  }
  return <main className={styles.studio}>
    <header className={styles.top}><div><small>{brand === "busterbuild" ? "BUSTER BUILD" : "POWERBUILD"} · PRICE TAG STUDIO</small><h1>Safety &amp; Warning Signs</h1><p>Editable in-store notices for yards, warehouses, retail floors and staff areas.</p></div><button onClick={onBack} disabled={busy}>Back to Price Tag Studio</button></header>
    <div className={styles.workspace}>
      <section className={styles.panel} aria-label="Safety sign editor">
        <label>Sign template<select value={key} onChange={event => choose(event.target.value as PresetKey)}>{Object.entries(presets).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label>
        <label>Heading<input value={heading} maxLength={65} onChange={event => setHeading(event.target.value)} /></label>
        <label>Safety instruction<textarea rows={3} value={detail} maxLength={170} onChange={event => setDetail(event.target.value)} /></label>
        <label>Branch / location<input value={branch} maxLength={65} placeholder="e.g. Receiving yard" onChange={event => setBranch(event.target.value)} /></label>
        <div className={styles.two}><label>Paper size<select value={paper} onChange={event => setPaper(event.target.value as Paper)}><option>A4</option><option>A3</option></select></label><label>Orientation<select value={orientation} onChange={event => setOrientation(event.target.value as Orientation)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div>
        <div className={styles.actions}><button type="button" onClick={() => void exportSign("pdf")} disabled={busy}>Download PDF</button><button type="button" onClick={() => void exportSign("jpg")} disabled={busy}>Download JPG</button></div>
        {message && <p role="status" className={styles.message}>{message}</p>}
        <p className={styles.note}>These are editable artwork templates, not certified regulatory signs. Before printing for legal compliance, verify the correct symbol, dimensions, language, colours and placement with your safety officer and applicable South African requirements. Do not replace statutory signs with unverified artwork.</p>
      </section>
      <section className={styles.panel}><h2>Live sign preview</h2><p className={styles.note}>{paper} · {size.width} × {size.height} mm</p><div className={styles.preview}><Artwork brand={brand} preset={chosen} heading={heading} detail={detail} branch={branch} orientation={orientation}/></div></section>
    </div>
    <div aria-hidden="true" className={styles.exportStage} ref={stage}><Artwork brand={brand} preset={chosen} heading={heading} detail={detail} branch={branch} orientation={orientation}/></div>
  </main>;
}
