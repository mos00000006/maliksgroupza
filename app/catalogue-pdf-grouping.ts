export type CataloguePdfGroupingProduct = {
  category?: string | null;
  name?: string | null;
  description?: string | null;
};

export const FITTINGS_PDF_CATEGORY = "Fittings";

const cleanCategory = (value: string | null | undefined) =>
  (value || "General")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "General";

const explicitFittingsCategory = /^(?:FITTINGS|PLUMBING FITTINGS|PIPE FITTINGS|BATHROOM FITTINGS|SANWARE FITTINGS)$/i;
const plumbingFamilyCategory = /(?:PLUMB|BATHROOM|SANWARE|SANITARY|DRAINAGE|PIPE)/i;
const explicitFittingName = /\bFITTINGS?\b/i;
const plumbingFittingName = /\b(?:ADAPTORS?|ADAPTERS?|BENDS?|BUSHES?|BUSHINGS?|CAPS?|CONNECTORS?|COUPLERS?|COUPLINGS?|ELBOWS?|FERRULES?|FLANGES?|GULL(?:Y|EY)(?:S)?|JUNCTIONS?|NIPPLES?|PLUGS?|REDUCERS?|RODDING\s+EYES?|SADDLES?|SOCKETS?|STOPCOCKS?|TEES?|TRAPS?|UNIONS?|VALVES?)\b|\bEND\s+CAPS?\b|\bPAN\s+SEALS?\b|\b(?:BASIN|BATH|SINK)\s+WASTES?\b/i;

/**
 * Returns the section used by the generated catalogue PDF and leaflet.
 * This is deliberately presentation-only: the saved catalogue category is
 * never changed. Generic fitting words such as "socket" are only used inside
 * plumbing, bathroom and drainage families so tool sockets and electrical
 * sockets stay in their correct sections.
 */
export function cataloguePdfCategory(product: CataloguePdfGroupingProduct) {
  const category = cleanCategory(product.category);
  const categoryForMatching = category.replace(/[·&/\\-]+/g, " ");
  const productText = `${product.name || ""} ${product.description || ""}`.replace(/\s+/g, " ").trim();

  if (explicitFittingsCategory.test(categoryForMatching)) return FITTINGS_PDF_CATEGORY;
  if (explicitFittingName.test(productText)) return FITTINGS_PDF_CATEGORY;
  if (plumbingFamilyCategory.test(categoryForMatching) && plumbingFittingName.test(productText)) {
    return FITTINGS_PDF_CATEGORY;
  }

  return category;
}
