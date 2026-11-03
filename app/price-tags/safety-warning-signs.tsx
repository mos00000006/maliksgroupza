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
  dispatch: { label: "Dispatch & collections", family: "notice", heading: "DISPATCH & COLLECTIONS", detail: "Customer collections and outgoing deliveries report here.", pictogram: "dispatch" },
  receiving: { label: "Goods receiving", family: "notice", heading: "GOODS RECEIVING", detail: "Supplier deliveries and incoming stock report here.", pictogram: "receiving" },
  toilets: { label: "Toilets", family: "notice", heading: "TOILETS", detail: "Customer and staff facilities.", pictogram: "toilets" },
  mens: { label: "Men's toilet", family: "notice", heading: "MEN'S TOILET", detail: "Male facilities.", pictogram: "male" },
  womens: { label: "Women's toilet", family: "notice", heading: "WOMEN'S TOILET", detail: "Female facilities.", pictogram: "female" },
  accessible: { label: "Accessible toilet", family: "notice", heading: "ACCESSIBLE TOILET", detail: "Accessible customer and staff facilities.", pictogram: "accessible" },
  custom: { label: "Custom safety notice", family: "notice", heading: "SAFETY NOTICE", detail: "Enter site-specific instructions.", pictogram: "info" },
} as const satisfies Record<string, Preset>;
type PresetKey = keyof typeof presets;
const color: Record<SignFamily, string> = { warning: "#edb92f", mandatory: "#1156a2", prohibition: "#d72c29", emergency: "#15834e", fire: "#c82726", notice: "#164b7a" };

function Symbol({ family, pictogram }: { family: SignFamily; pictogram: string }) {
  const ink = family === "warning" || family === "prohibition" ? "#101010" : "#fff";
  const surface = family === "warning" ? "#edb92f" : family === "prohibition" ? "#fff" : color[family];
  return <svg viewBox="0 0 180 180" role="img" aria-label={`${family} safety pictogram: ${pictogram}`}>
    {family === "warning" ? <path d="M90 14 171 158H9Z" fill="#edb92f" stroke="#171717" strokeWidth="11" strokeLinejoin="round"/> :
      family === "prohibition" ? <circle cx="90" cy="90" r="77" fill="#fff" stroke="#d72c29" strokeWidth="15"/> :
      family === "mandatory" ? <circle cx="90" cy="90" r="77" fill="#1156a2"/> :
      <rect x="12" y="12" width="156" height="156" rx="12" fill={color[family]}/>}
    {pictogram === "forklift" && <g fill={ink}>
      <circle cx="52" cy="129" r="15"/><circle cx="116" cy="129" r="15"/>
      <path d="M30 116V79c0-6 5-11 11-11h48l13 32h20v20H72a23 23 0 0 0-40 0H20v-4Z"/>
      <path d="M72 44h31l13 49h-14L91 57H72Z"/><path d="M72 57h-9v41h34l-6-14H76V66h18l-3-9Z" fill={surface}/>
      <path d="M126 42h10v78h-10zM142 42h8v91h-8zM126 127h37v7h-37z"/>
    </g>}
    {pictogram === "truck" && <g fill={ink}>
      <path d="M25 68h80v57H25zM105 86h25l24 26v13h-49z"/>
      <path d="M116 94h12l14 15h-26z" fill={surface}/><rect x="35" y="78" width="60" height="30" rx="3" fill={surface}/>
      <circle cx="53" cy="132" r="15"/><circle cx="130" cy="132" r="15"/><circle cx="53" cy="132" r="6" fill={surface}/><circle cx="130" cy="132" r="6" fill={surface}/>
    </g>}
    {pictogram === "slip" && <g fill={ink}>
      <circle cx="74" cy="47" r="12"/><path d="m68 64 25 8 17 28-13 7-15-22-17 23-17-8 5-12 11 4 13-18-14-4Z"/>
      <path d="m91 104 23 5 21 26-12 10-19-21-28-5 4-15ZM56 101l-18 19-12-9 21-25Z"/>
      <path d="M36 145c19-8 37-8 54 0 17-8 35-8 54 0-18 8-36 8-54 1-17 7-35 7-54-1Z"/>
      <path d="m110 58 12-12 6 6-12 12zm13 18 17-5 3 9-17 4z"/>
    </g>}
    {pictogram === "helmet" && <g fill={ink}>
      <path d="M39 108c1-34 20-57 48-62v43h9V46c28 5 46 28 47 62h8v14H29v-14Z"/>
      <path d="M49 105h82c-5-23-19-38-35-43v30H87V62c-18 5-33 20-38 43Z" fill={surface}/>
      <path d="M46 122c8 13 24 20 44 20s36-7 44-20Z"/>
    </g>}
    {pictogram === "boot" && <g fill={ink}>
      <path d="M38 49h47l8 50 20 16h35v27H33V49Z"/>
      <path d="M47 59h28l6 45 26 21H47Z" fill={surface}/><path d="M29 132h123v17H29z"/>
      <path d="m75 69 17 4-2 9-14-3zm3 18 17 4-2 9-14-3z"/>
    </g>}
    {pictogram === "glasses" && <g fill={ink}>
      <path d="M23 70h28c8 0 15 4 20 10h38c5-6 12-10 20-10h28l-8 50c-2 10-11 18-22 18H105c-11 0-20-8-22-19l-2-16H69l-2 16c-2 11-11 19-22 19H31c-10 0-19-8-21-18Zm18 14-16 2 6 34c1 3 3 5 7 5h8c4 0 7-3 8-7l4-27c-4-5-10-7-17-7Zm98 0c-7 0-13 2-17 7l4 27c1 4 4 7 8 7h8c4 0 6-2 7-5l6-34Z"/>
    </g>}
    {pictogram === "person" && <g fill={ink}>
      <circle cx="90" cy="50" r="17"/><path d="M72 72h36l13 38-13 4-9-25v25l17 30-14 8-12-24-12 24-14-8 17-30V89l-9 25-13-4Z"/>
    </g>}
    {pictogram === "cigarette" && <g fill={ink}>
      <rect x="34" y="104" width="103" height="19" rx="3"/><rect x="113" y="104" width="8" height="19" fill={surface}/>
      <path d="M53 95c-12-10-10-23 1-31 6-5 6-10 1-17l10-7c11 15 8 27-3 36-6 5-7 8 0 13Zm31 0c-12-10-10-23 1-31 6-5 6-10 1-17l10-7c11 15 8 27-3 36-6 5-7 8 0 13Z"/>
    </g>}
    {pictogram === "exit" && <g fill={ink}>
      <path d="M25 32h68v116H25Zm13 14v88h42V46Z"/><circle cx="77" cy="60" r="11"/>
      <path d="m70 74 22 8 17 22-10 8-14-17-13 19 16 8 7 28-13 3-7-21-26-13 9-29-13 16-10-8 21-25Z"/>
      <path d="M107 71h29l-10-10 9-9 27 27-27 27-9-9 10-10h-29Z"/>
    </g>}
    {pictogram === "cross" && <path d="M72 31h36v41h41v36h-41v41H72v-41H31V72h41Z" fill={ink}/>} 
    {pictogram === "extinguisher" && <g fill={ink}>
      <path d="M62 72c0-7 6-13 13-13h40c7 0 13 6 13 13v68c0 7-6 13-13 13H75c-7 0-13-6-13-13Z"/>
      <path d="M76 59V43h12v-9h28v12H91v13Zm16 0v-9h30l17 11-6 10-14-9Z"/>
      <path d="M127 70c23 1 29 20 22 40l-11-4c5-14 2-23-11-24Z"/><circle cx="95" cy="95" r="19" fill={surface}/><path d="m95 95 10-10m-20 21h20" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round"/>
    </g>}
    {pictogram === "assembly" && <g fill={ink}>
      <circle cx="90" cy="85" r="10"/><circle cx="64" cy="103" r="9"/><circle cx="116" cy="103" r="9"/>
      <path d="M77 99h26l8 27H69Zm-25 14h21l6 25H46Zm55 0h21l6 25h-33Z"/>
      <path d="M30 30h34v12H50l18 18-9 9-18-18v14H30Zm120 0v35h-12V51l-18 18-9-9 18-18h-14V30ZM30 150v-35h12v14l18-18 9 9-18 18h14v12Zm120 0h-35v-12h14l-18-18 9-9 18 18v-14h12Z"/>
    </g>}
    {pictogram === "dispatch" && <g fill={ink}>
      <path d="M24 74h73v49H24Zm73 13h25l22 22v14H97Z"/><path d="M107 96h12l13 13h-25Z" fill={surface}/>
      <circle cx="51" cy="130" r="13"/><circle cx="121" cy="130" r="13"/><circle cx="51" cy="130" r="5" fill={surface}/><circle cx="121" cy="130" r="5" fill={surface}/>
      <path d="M102 42h32l-10-10 9-9 27 27-27 27-9-9 10-10h-32Z"/>
    </g>}
    {pictogram === "receiving" && <g fill={ink}>
      <path d="M82 24h16v34h18L90 84 64 58h18Z"/><path d="m44 83 46-18 46 18-46 19Z"/>
      <path d="M43 89 84 106v41L43 130Zm94 0-41 17v41l41-17Z"/><path d="M82 108h16v38H82Z" fill={surface}/>
      <path d="M33 149h114v10H33zM43 138h13v12H43zm80 0h13v12h-13z"/>
    </g>}
    {pictogram === "toilets" && <g fill={ink}>
      <circle cx="56" cy="45" r="12"/><path d="M42 62h28l10 39-11 3-7-25v68H50v-38H39v38H27V79l-7 25-11-3 10-39Z"/>
      <circle cx="126" cy="45" r="12"/><path d="M112 62h28l18 56h-17v29h-12v-29h-6v29h-12v-29H94Z"/>
      <rect x="87" y="34" width="6" height="116" rx="3"/>
    </g>}
    {pictogram === "male" && <g fill={ink}>
      <circle cx="90" cy="43" r="15"/><path d="M71 64h38l14 46-14 4-9-31v65H85v-45H80v45H65V83l-9 31-14-4 14-46Z"/>
    </g>}
    {pictogram === "female" && <g fill={ink}>
      <circle cx="90" cy="43" r="15"/><path d="M72 64h36l24 68h-26v17H92v-17h-4v17H74v-17H48Z"/><path d="m63 76-19 44-13-6 23-50Zm54 0 19 44 13-6-23-50Z"/>
    </g>}
    {pictogram === "accessible" && <g fill={ink}>
      <circle cx="82" cy="38" r="13"/><path d="M69 57h24l5 35h31v14H88l-7-36h-12Z"/>
      <path d="M74 83c-17 4-29 19-29 37 0 22 18 40 40 40 20 0 36-14 39-32h-15c-3 10-12 18-24 18-14 0-26-12-26-26 0-10 6-19 16-23Z"/>
      <path d="m96 109 25 34h23l-30-45Z"/>
    </g>}
    {pictogram === "info" && <g fill={ink}><circle cx="90" cy="90" r="57"/><circle cx="90" cy="61" r="9" fill={surface}/><path d="M81 78h18v61H81z" fill={surface}/></g>}
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
