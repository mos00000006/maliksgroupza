/** Maliks POS — arithmetic for a READ-ONLY preview. No payment or accounting posting. */
export const VAT_RATE = 15;
export function safeQty(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 9999 ? Math.round(n * 1000) / 1000 : null;
}
export function parseZarCents(value) {
  const s = String(value ?? '').trim();
  if (!/^(?:\d{1,8})(?:\.\d{1,2})?$/.test(s)) return null;
  const [whole, decimals = ''] = s.split('.');
  const n = Number(whole) * 100 + Number((decimals + '00').slice(0, 2));
  return Number.isSafeInteger(n) ? n : null;
}
export function basketTotals(lines) {
  const rows = lines.map(line => {
    const cents = Number(line?.product?.price_cents);
    const quantity = safeQty(line?.quantity);
    if (!Number.isSafeInteger(cents) || cents < 0 || !quantity) throw new Error('Invalid published price or quantity');
    return Math.round(cents * quantity);
  });
  const gross = rows.reduce((acc, cents) => acc + cents, 0);
  if (!Number.isSafeInteger(gross)) throw new Error('Basket exceeds safe range');
  const vat = Math.round((gross * VAT_RATE) / (100 + VAT_RATE));
  return { gross, vat, net: gross - vat, items: lines.length, units: lines.reduce((n, x) => n + x.quantity, 0) };
}
export function tenderPreview(gross, amounts) {
  const cash = parseZarCents(amounts.cash) ?? 0;
  const card = parseZarCents(amounts.card) ?? 0;
  const eft = parseZarCents(amounts.eft) ?? 0;
  const paid = cash + card + eft;
  return { cash, card, eft, paid, change: Math.max(0, paid - gross), due: Math.max(0, gross - paid) };
}
export function quoteDeposit(gross, percent) {
  const n = Number(percent);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  const deposit = Math.round(gross * n / 100);
  return { deposit, balance: gross - deposit };
}
