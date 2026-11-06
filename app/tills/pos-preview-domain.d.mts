export const VAT_RATE: number;
export function safeQty(value: unknown): number | null;
export function parseZarCents(value: unknown): number | null;
export function basketTotals(lines: Array<{product:{price_cents:number};quantity:number}>): {gross:number;vat:number;net:number;items:number;units:number};
export function tenderPreview(gross:number, amounts:{cash:string;card:string;eft:string}): {cash:number;card:number;eft:number;paid:number;change:number;due:number};
export function quoteDeposit(gross:number, percent: number): {deposit:number;balance:number} | null;
