const A4_WIDTH_POINTS = 595.28;
const A4_HEIGHT_POINTS = 841.89;
export const A4_SHELF_PAGE_WIDTH = 2480;
export const A4_SHELF_PAGE_HEIGHT = 3508;

const jpegBytes = (dataUrl: string) => {
  if (!dataUrl.startsWith("data:image/jpeg")) throw new Error("Every A4 page must be a JPEG image.");
  const encoded = dataUrl.split(",")[1];
  if (!encoded) throw new Error("An A4 page image is empty.");
  const raw = atob(encoded);
  return Uint8Array.from(raw, value => value.charCodeAt(0));
};

/** Creates one exact A4 PDF page for each rendered JPEG page. */
export function a4ShelfPricePdf(pageJpegs: string[]) {
  if (!pageJpegs.length) throw new Error("Add at least one shelf label before downloading.");
  if (pageJpegs.length > 100) throw new Error("Download a maximum of 100 A4 pages at a time.");

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const put = (value: string | Uint8Array) => {
    const data = typeof value === "string" ? encoder.encode(value) : value;
    chunks.push(data);
    length += data.length;
  };
  const object = (id: number, body: string) => {
    offsets[id] = length;
    put(`${id} 0 obj\n${body}\nendobj\n`);
  };

  const pageObjects = pageJpegs.map((_, index) => 3 + index * 3);
  const objectCount = 2 + pageJpegs.length * 3;
  put("%PDF-1.4\n%PowerBuild-BusterBuild-Shelf-Labels\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Kids [${pageObjects.map(id => `${id} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`);

  pageJpegs.forEach((jpeg, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const picture = jpegBytes(jpeg);
    object(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_POINTS} ${A4_HEIGHT_POINTS}] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    offsets[imageId] = length;
    put(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${A4_SHELF_PAGE_WIDTH} /Height ${A4_SHELF_PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${picture.length} >>\nstream\n`);
    put(picture);
    put("\nendstream\nendobj\n");
    const draw = `q\n${A4_WIDTH_POINTS} 0 0 ${A4_HEIGHT_POINTS} 0 0 cm\n/Im${index} Do\nQ\n`;
    object(contentId, `<< /Length ${encoder.encode(draw).length} >>\nstream\n${draw}endstream`);
  });

  const xref = length;
  put(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= objectCount; id += 1) put(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  put(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const bytes = new Uint8Array(length);
  let cursor = 0;
  chunks.forEach(chunk => {
    bytes.set(chunk, cursor);
    cursor += chunk.length;
  });
  return new Blob([bytes.buffer], { type: "application/pdf" });
}
