export type CataloguePdfGroupingProduct = {
  code?: string | null;
  category?: string | null;
  name?: string | null;
  description?: string | null;
};

const clean = (value?: string | null) => (value || "").replace(/\s+/g, " ").trim();
const has = (text: string, pattern: RegExp) => pattern.test(text);

/**
 * Single catalogue presentation taxonomy. Name/code is tested before a legacy
 * generic category. Explicitly named categories remain the fallback.
 * This never changes the stock code, photos, price, or stored product record.
 */
export function cataloguePdfCategory(p: CataloguePdfGroupingProduct): string {
  const name = clean(p.name).toUpperCase();
  const code = clean(p.code).toUpperCase();
  const category = clean(p.category) || "General";
  const cat = category.toUpperCase();
  const text = `${name} ${clean(p.description).toUpperCase()}`;

  // Avoid treating blind rivets, blind flanges and blanking caps as window blinds.
  if (has(name, /\b(?:BLINDS?|VENETIAN BLINDS?|ROLLER BLINDS?)\b/) &&
      !has(name, /\bBLIND\s+(?:RIVETS?|FLANGES?|CAPS?|PLUGS?|NUTS?)\b/)) return "Window Blinds & Treatments";
  if (cat === "WINDOW BLINDS & TREATMENTS") return "Window Blinds & Treatments";

  // Adhesives containing words such as "cornice" must not become boards.
  if (has(name, /\b(?:ADHESIVES?|GLUES?|SEALANTS?|SILICONES?|EPOXY|GROUT)\b/)) return "Adhesives & Chemicals";

  // Distinguish tools and electrical sockets from plumbing fittings.
  if (has(name, /\b(?:BLIND RIVET|POP RIVET|SCREWS?|BOLTS?|NUTS?|WASHERS?|NAILS?|ANCHORS?|RAWL\s*PLUGS?|WALL\s*PLUGS?)\b/)) return "Fasteners";
  if (has(name, /\b(?:DRILL BITS?|SCREWDRIVERS?|SOCKET SET|SOCKET WRENCH|SPANNERS?|PLIERS?|HAMMERS?|SAWS?|GRINDERS?|WRENCHES?|CHISELS?)\b/)) return "Tools";
  if (has(name, /\b(?:ELECTRICAL SOCKETS?|PLUG SOCKET|WALL SOCKET|LIGHT SWITCH|CONDUIT|CABLE|CIRCUIT BREAKER|LED LAMP|DOWNLIGHT)\b/)) return "Electrical & Lighting";

  // Named building families: do not swallow these into generic hardware.
  if (cat === "LOCKS" || has(name, /\bPADLOCKS?\b/)) return "Locks";
  if (has(name, /\b(?:LOCKSETS?|MORTICE LOCK|CYLINDER LOCK)\b/)) return "Locksets";
  if (has(name, /\b(?:HINGES?|DOOR HANDLES?|CABINET HANDLES?|PULL HANDLES?|BRACKETS?|DOOR STOPS?)\b/) &&
      !has(name, /\bPIPE\s+BRACKET\b/)) return "Ironmongery";
  if (has(name, /\b(?:GYPSUM BOARD|CEILING BOARD|BOARD CEILING GYPSUM|FASCIA BOARD|RHINOBOARD|CORNICE|PLASTERBOARD)\b/)) return "Boards & Ceilings";
  if (has(name, /\b(?:TIMBER|BRANDERING|PURLIN|RAFTERS?|PINE PLANK)\b/) &&
      !has(name, /\bTIMBER\s+SCREWS?\b/)) return "Timber";
  if (has(name, /\b(?:WATERPROOFING MEMBRANE|WATERPROOF FIX|FIX A LEAK|ACRYLIC WATERPROOF|LIQUID RUBBER|FIBRE FLEX)\b/)) return "Waterproofing";
  if (has(name, /\b(?:GUTTER|DOWN\s*PIPE\s*GUTTER|ROOF\s*TILE|ROOF\s*SHEETING|ROOFING SHEET|ROOF UNDERLAY)\b/)) return "Roofing & Gutters";

  // UG is a dedicated DEPARTMENT, including UG pipes. Always classify UG
  // before generic Plumbing Pipes and before other fitting subcategories.
  // Use word boundaries: PLUG, MUG and BLIND PLUG must NOT be treated as UG.
  if (has(name, /\bUG\b|\bUNDERGROUND\b/) ||
      has(cat, /^(?:UG|UNDERGROUND(?:\s*\(UG\))?)$/)) return "Underground (UG)";

  // Pipes other than UG stay in their own relevant pipe department.
  if (has(name, /\b(?:PIPE|PIPING|POLYCOP|POLYCORP|POLYCOP2000)\b/) &&
      !has(name, /\b(?:PIPE FITTING|PIPE CONNECTOR|PIPE COUPLING)\b/)) return "Plumbing Pipes";
  if (has(name, /\bMASTERBATTS?\b/) || /^M50[1256]$/.test(code)) return "Plumbing Accessories";

  const plumbingContext = has(cat, /\b(?:PLUMBING|FITTINGS?|DRAINAGE|SOIL|VENT|UNDERGROUND|UG|SV|WASTE)\b/) ||
    has(name, /^(?:\d+(?:\.\d+)?\s*MM\s*)?(?:UG|SV|W)\b|\b(?:HDPE|POLYCOP|POLYCORP|UPVC|SOIL\s*&?\s*VENT)\b/) ||
    /^E\d{3}$/.test(code);
  if (plumbingContext && (has(name, /^(?:\d+(?:\.\d+)?\s*MM\s*)?SV\b|\bSOIL\s*(?:AND|&)\s*VENT\b/) || has(cat, /\b(?:SOIL|VENT|SV)\b/))) return "Soil & Vent (SV)";
  if (plumbingContext && has(name, /^W\s*\d+\s*MM/)) return "Waste & Trap Fittings";
  if (plumbingContext && has(name, /\b(?:HDPE|COMPRESSION|COMP\s+HDPE)\b/)) return "HDPE & Compression Fittings";
  if (plumbingContext && has(name, /\b(?:COPPER|BRASS|C\s*X\s*C)\b/)) return "Copper & Brass Fittings";
  if (plumbingContext && has(name, /\b(?:GALVANISED|GALVANIZED|GALV\b|MALLEABLE)\b/)) return "Galvanised Fittings";
  if (plumbingContext && has(name, /\b(?:UPVC|PVC|PRESSURE|SOLVENT WELD)\b/)) return "PVC & Pressure Fittings";
  if (plumbingContext && has(name, /\b(?:WASTE|TRAP|GULLY|BASIN WASTE|BATH WASTE|SINK WASTE)\b/)) return "Waste & Trap Fittings";

  // Never render the legacy mixed Fittings page.
  if (/^(?:FITTINGS|PLUMBING FITTINGS|PIPE FITTINGS|BATHROOM FITTINGS|SANWARE FITTINGS)$/i.test(category)) return "Plumbing Accessories";
  if (category === "Fasteners & Ironmongery") return "General Hardware";
  if (category === "Roofing") return "Roofing & Gutters";
  return category;
}
