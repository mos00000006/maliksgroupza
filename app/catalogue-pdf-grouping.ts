export type CataloguePdfGroupingProduct = {
  category?: string | null;
  name?: string | null;
  description?: string | null;
};

export const UNCLASSIFIED_PLUMBING_CATEGORY = "Plumbing Accessories";

const cleanCategory = (value: string | null | undefined) =>
  (value || "General")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "General";

const explicitFittingsCategory = /^(?:FITTINGS|PLUMBING FITTINGS|PIPE FITTINGS|BATHROOM FITTINGS|SANWARE FITTINGS)$/i;
const plumbingFamilyCategory = /(?:PLUMB|BATHROOM|SANWARE|SANITARY|DRAINAGE|PIPE|FITTING)/i;
const explicitFittingName = /\bFITTINGS?\b/i;
const plumbingFittingName = /\b(?:ADAPTORS?|ADAPTERS?|BENDS?|BUSHES?|BUSHINGS?|CAPS?|CONNECTORS?|COUPLERS?|COUPLINGS?|ELBOWS?|FERRULES?|FLANGES?|GULL(?:Y|EY)(?:S)?|JUNCTIONS?|NIPPLES?|PLUGS?|REDUCERS?|RODDING\s+EYES?|SADDLES?|SOCKETS?|STOPCOCKS?|TEES?|TRAPS?|UNIONS?|VALVES?)\b|\bEND\s+CAPS?\b|\bPAN\s+SEALS?\b|\b(?:BASIN|BATH|SINK)\s+WASTES?\b/i;

/**
 * Catalogue PDF / interactive leaflet sections are display-only. Database categories,
 * stock codes, product images and product records remain unchanged.
 * Put the named plumbing family first so UG and SV can never mix with generic fittings.
 */
export function cataloguePdfCategory(product: CataloguePdfGroupingProduct) {
  const category = cleanCategory(product.category);
  const categoryForMatching = category.replace(/[·&/\\-]+/g, " ");
  const name = (product.name || "").replace(/\s+/g, " ").trim();
  const productText = `${name} ${product.description || ""}`.replace(/\s+/g, " ").trim();
  // Window blinds are home/window treatments, even when imported with a plumbing category.
  // Exclude blind flanges, caps and rivets, which are not window coverings.
  const windowBlindCategory = /\b(?:WINDOW\s*(?:BLINDS?|COVERINGS?|TREATMENTS?)|BLINDS?|CURTAINS?|SHADES?)\b/i.test(categoryForMatching);
  const windowBlindProduct = /\bBLINDS?\b/i.test(productText) &&
    !/\bBLIND\s+(?:FLANGES?|CAPS?|RIVETS?|PLUGS?|NUTS?)\b/i.test(productText);
  if (windowBlindCategory || windowBlindProduct) return "Window Blinds & Treatments";

  const isPlumbing = plumbingFamilyCategory.test(categoryForMatching) || explicitFittingsCategory.test(categoryForMatching);
  const isFitting = explicitFittingsCategory.test(categoryForMatching) ||
    explicitFittingName.test(productText) ||
    (isPlumbing && plumbingFittingName.test(productText));

  // The original wholesale range uses UG (underground) and SV (soil & vent).
  // Require a plumbing context or the unmistakable prefix, not an incidental substring.
  if (/^(?:(?:\d+(?:\.\d+)?\s*(?:MM)?\s*)?UG\b|UNDERGROUND\b)/i.test(name) ||
      (isPlumbing && /\b(?:UG|UNDERGROUND)\b/i.test(productText))) {
    return "Underground (UG)";
  }
  if (/^(?:\d+(?:\.\d+)?\s*(?:MM)?\s*)?SV\b/i.test(name) ||
      (isPlumbing && /\b(?:SOIL\s*(?:AND|&)\s*VENT|SOIL\s*VENT)\b/i.test(productText))) {
    return "Soil & Vent (SV)";
  }
  // Never recreate the erroneous broad Fittings catalogue page. Even legacy
  // records saved with that category must be reassigned on export.
  if (!isFitting) return explicitFittingsCategory.test(categoryForMatching) ? UNCLASSIFIED_PLUMBING_CATEGORY : category;

  // Related non-plumbing fittings should go to their proper department.
  if (/\b(?:CONDUIT|ELECTRICAL|CABLE|SWITCH|LIGHTING)\b/i.test(productText)) return "Electrical & Lighting";
  if (/\b(?:GUTTER|DOWNPIPE|ROOFING)\b/i.test(productText)) return "Roofing & Gutters";

  if (/\b(?:HDPE|COMPRESSION|POLY\s*COMPRESSION)\b/i.test(productText)) return "HDPE & Compression Fittings";
  if (/\b(?:COPPER|BRASS|CXC|C\s*X\s*C)\b/i.test(productText)) return "Copper & Brass Fittings";
  if (/\b(?:GALVANISED|GALVANIZED|GALV\b|GI\b|MALLEABLE)\b/i.test(productText)) return "Galvanised Fittings";
  if (/\b(?:PVC|UPVC|PRESSURE|SOLVENT\s*WELD)\b/i.test(productText)) return "PVC & Pressure Fittings";
  if (/\b(?:WASTE|TRAP|BASIN|BATH|SINK)\b/i.test(productText)) return "Waste & Trap Fittings";
  return UNCLASSIFIED_PLUMBING_CATEGORY;
}
