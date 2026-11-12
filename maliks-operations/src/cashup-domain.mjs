/**
 * Phase 7: READ-ONLY cash-up PROJECTION from unverified tender preparations.
 * These figures are NOT actual receipts, expected cash, accounting entries,
 * payment reconciliation, deposit approval, or an all-clear to dispatch.
 */
import { validateMoneyCents } from './shift-domain.mjs';
export const CASHUP_MODE='PROVISIONAL_PREPARATIONS_ONLY';
const MAX_MONEY=100_000_000_000;
function money(value,label){
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0||value>MAX_MONEY)
    throw Error('Invalid '+label+' data.');
  return value;
}
export function cashupPreviewStatement(branch){
  if(typeof branch!=='string'||!branch.trim()||branch.length>150)
    throw Error('An assigned branch is required.');
  return {sql:`WITH recent_shifts AS (
    SELECT id,branch,till_code,status,opened_by_name,opened_at,opening_float_cents,
           counted_cash_cents,closed_at
    FROM maliks_till_shift_register
    WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 75
  )
  SELECT s.id,s.branch,s.till_code,s.status,s.opened_by_name,s.opened_at,
    s.opening_float_cents,s.counted_cash_cents,s.closed_at,
    COUNT(t.id) AS preparation_count,
    COALESCE(SUM(t.cash_applied_cents),0) AS prepared_cash_cents,
    COALESCE(SUM(t.cash_received_cents),0) AS prepared_cash_received_cents,
    COALESCE(SUM(t.change_cents),0) AS prepared_change_cents,
    COALESCE(SUM(t.card_cents),0) AS prepared_card_cents,
    COALESCE(SUM(t.eft_cents),0) AS prepared_eft_cents
  FROM recent_shifts s
  LEFT JOIN maliks_tender_preparations t
    ON t.shift_id=s.id AND lower(t.branch)=lower(s.branch)
  GROUP BY s.id
  ORDER BY s.id DESC`,params:[branch]};
}
export function cashupForClient(row){
  if(!row||typeof row!=='object')throw Error('Invalid shift preview data.');
  if(!Number.isSafeInteger(row.id)||row.id<1)throw Error('Invalid shift.');
  if(!['OPEN','CLOSED'].includes(row.status))throw Error('Invalid shift status.');
  const count=money(row.preparation_count,'preparation count');
  const opening=validateMoneyCents(row.opening_float_cents,MAX_MONEY);
  const cash=money(row.prepared_cash_cents,'cash preparation');
  const received=money(row.prepared_cash_received_cents,'cash received preparation');
  const change=money(row.prepared_change_cents,'change preparation');
  const card=money(row.prepared_card_cents,'card preparation');
  const eft=money(row.prepared_eft_cents,'EFT preparation');
  if(received-change!==cash)throw Error('Inconsistent tender preparation sums.');
  const closed=row.status==='CLOSED';
  const counted=closed?money(row.counted_cash_cents,'closing cash count'):null;
  const projected=opening+cash;
  if(!Number.isSafeInteger(projected))throw Error('Projected figure overflow.');
  // No preparation => cannot infer any cash movement, even provisionally.
  const variance=closed&&count>0?counted-projected:null;
  const signal=!closed?'SHIFT_OPEN':count===0?'NO_PREPARATIONS':variance===0?'PROVISIONAL_ZERO_DIFFERENCE':'PROVISIONAL_DIFFERENCE';
  return {
    shift_id:row.id,branch:row.branch,till_code:row.till_code,status:row.status,
    opened_by_name:row.opened_by_name,opened_at:row.opened_at,closed_at:row.closed_at,
    opening_float_cents:opening,preparation_count:count,
    prepared_cash_cents:cash,prepared_cash_received_cents:received,prepared_change_cents:change,
    prepared_card_cents:card,prepared_eft_cents:eft,
    projected_cash_cents:count>0?projected:null,
    counted_cash_cents:counted,provisional_variance_cents:variance,
    signal,verified:false,reconciled:false,receipts_confirmed:false,
  };
}
