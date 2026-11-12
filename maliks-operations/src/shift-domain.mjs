/**
 * Phase 4 till shift register. Recordkeeping only: these fields must not be
 * interpreted as a till cash-up, payment, financial posting or deposit.
 */
export const shiftIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export function validateRequestId(input){
  if(typeof input!=='string'||!shiftIdPattern.test(input))throw Error('Invalid request identifier.');
  return input.toLowerCase();
}
export function validateTillCode(input){
  if(typeof input!=='string'||!/^[A-Z0-9][A-Z0-9_-]{0,19}$/i.test(input.trim()))throw Error('Till code must be 1–20 letters, numbers, hyphens or underscores.');
  return input.trim().toUpperCase();
}
export function validateMoneyCents(input,maximum=100_000_000){
  if(typeof input!=='number'||!Number.isSafeInteger(input)||input<0||input>maximum)throw Error('Invalid cash amount. Use a valid rand amount with two decimals.');
  return input;
}
export function validateCloseNote(input){
  if(typeof input!=='string'||input.trim().length>400)throw Error('Closing notes must be 400 characters or less.');
  return input.trim();
}
export function validateShiftId(input){
  if(typeof input!=='number'||!Number.isSafeInteger(input)||input<1)throw Error('Invalid shift number.');
  return input;
}
export function shiftForClient(row){
  return {id:row.id,branch:row.branch,till_code:row.till_code,status:row.status,
    opened_by_name:row.opened_by_name,opened_by_email:row.opened_by_email,
    opening_float_cents:row.opening_float_cents,opened_at:row.opened_at,
    counted_cash_cents:row.counted_cash_cents,close_notes:row.close_notes,
    closed_by_email:row.closed_by_email,closed_at:row.closed_at};
}
export function shiftListStatement(app,branch,email){
  if(!['tills','cashoffice'].includes(app)||typeof branch!=='string'||!branch.trim())throw Error('Shift access not authorised.');
  if(app==='tills'){
    if(!email)throw Error('Signed-in cashier is required.');
    return {sql:'SELECT * FROM maliks_till_shift_register WHERE lower(branch)=lower(?) AND lower(opened_by_email)=lower(?) ORDER BY id DESC LIMIT 30',params:[branch,email]};
  }
  return {sql:'SELECT * FROM maliks_till_shift_register WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 75',params:[branch]};
}
