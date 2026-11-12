/**
 * Phase 6: internal TENDER PREPARATIONS only. These do not represent payments.
 * No tender may be approved, captured, settled, receipted or used to release stock.
 */
import { quoteId } from './quote-domain.mjs';
import { validateRequestId, validateShiftId, validateMoneyCents } from './shift-domain.mjs';

export const TENDER_STATE='PREPARATION_ONLY';
export const TENDER_TYPES=Object.freeze(['CASH','CARD','EFT']);
const LIMIT=1_000_000_000;
const amount=input=>validateMoneyCents(input,LIMIT);
const ref=(input,active,label)=>{
  if(typeof input!=='string')throw Error(`${label} reference must be text.`);
  const s=input.trim();
  if(s.length>60 || /[\x00-\x1F\x7F]/.test(s))throw Error(`${label} reference is invalid.`);
  if(active && s.length<4)throw Error(`${label} reference must be at least four characters.`);
  if(!active && s.length)throw Error(`${label} reference must be empty when no ${label.toLowerCase()} is allocated.`);
  // References may be a bank/card terminal approval code only. Never a PAN, CVV or bank password.
  if(/(?:\d[ -]?){13,19}/.test(s))throw Error('Do not enter a payment card number in a reference field.');
  return s;
};
export function validateTenderPreparation(body,expectedTotal){
  if(!body || typeof body!=='object'||Array.isArray(body))throw Error('Invalid preparation.');
  const request_id=validateRequestId(body.request_id);
  const quotation_id=quoteId(body.quotation_number);
  if(!quotation_id)throw Error('Valid quotation number required.');
  const shift_id=validateShiftId(body.shift_id);
  const cash_applied_cents=amount(body.cash_applied_cents);
  const cash_received_cents=amount(body.cash_received_cents);
  const card_cents=amount(body.card_cents);
  const eft_cents=amount(body.eft_cents);
  if(cash_received_cents<cash_applied_cents)throw Error('Cash received is less than the cash portion.');
  if(!cash_applied_cents && cash_received_cents)throw Error('Cash received must be zero when cash allocation is zero.');
  const card_reference=ref(body.card_reference,card_cents>0,'Card');
  const eft_reference=ref(body.eft_reference,eft_cents>0,'EFT');
  if(!Number.isSafeInteger(expectedTotal)||expectedTotal<=0||expectedTotal>LIMIT)throw Error('Invalid quotation total.');
  const total=cash_applied_cents+card_cents+eft_cents;
  if(!Number.isSafeInteger(total)||total!==expectedTotal)throw Error('Cash, card and EFT allocations must equal the quotation total exactly.');
  return {request_id,quotation_id,shift_id,cash_applied_cents,cash_received_cents,
    card_cents,card_reference,eft_cents,eft_reference,change_cents:cash_received_cents-cash_applied_cents,
    quote_total_cents:expectedTotal};
}
export function tenderForClient(row){
  return {id:row.id,number:row.quotation_number,branch:row.branch,shift_id:row.shift_id,
    prepared_by_name:row.prepared_by_name,created_at:row.created_at,status:row.status,
    cash_applied_cents:row.cash_applied_cents,cash_received_cents:row.cash_received_cents,
    card_cents:row.card_cents,card_reference:row.card_reference,eft_cents:row.eft_cents,
    eft_reference:row.eft_reference,change_cents:row.change_cents,quote_total_cents:row.quote_total_cents};
}
export function tenderListStatement(app,branch,email){
  if(!['tills','cashoffice'].includes(app)||typeof branch!=='string'||!branch.trim())throw Error('Tender preparation access denied.');
  if(app==='tills'){
    if(!email)throw Error('Cashier identity required.');
    return {sql:'SELECT * FROM maliks_tender_preparations WHERE lower(branch)=lower(?) AND lower(prepared_by_email)=lower(?) ORDER BY id DESC LIMIT 40',params:[branch,email]};
  }
  return {sql:'SELECT * FROM maliks_tender_preparations WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 75',params:[branch]};
}
