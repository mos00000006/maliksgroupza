/**
 * Phase 8: immutable observations of externally supplied CARD/EFT evidence.
 * MANUAL DOCUMENT REVIEW, NOT PAYMENT VERIFICATION, SETTLEMENT OR LEDGER POSTING.
 * Neither the client nor this module may change quotation paid status.
 */
import {validateRequestId,validateMoneyCents,validateShiftId} from './shift-domain.mjs';

export const EVIDENCE_MODE='MANUAL_EVIDENCE_OBSERVATIONS_ONLY';
export const EVIDENCE_METHODS=Object.freeze(['CARD','EFT']);
export const EVIDENCE_DECISIONS=Object.freeze(['DOCUMENT_CHECKED','FOLLOW_UP_REQUIRED']);
export const EVIDENCE_SOURCES=Object.freeze(['TERMINAL_REPORT','BANK_STATEMENT','NOT_AVAILABLE']);
const MAX=1_000_000_000;
const cardNumberPattern=/(?:\d[ -]?){13,19}/;

export function validateEvidenceInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid evidence observation.');
  const request_id=validateRequestId(body.request_id);
  const preparation_id=validateShiftId(body.preparation_id);
  const method=body.method;
  if(!EVIDENCE_METHODS.includes(method))throw Error('Select CARD or EFT.');
  const decision=body.decision;
  if(!EVIDENCE_DECISIONS.includes(decision))throw Error('Choose Document checked or Follow-up required.');
  const source=body.source;
  if(!EVIDENCE_SOURCES.includes(source))throw Error('Invalid evidence source.');
  if(method==='CARD'&&source==='BANK_STATEMENT'&&decision==='DOCUMENT_CHECKED')
    throw Error('Use a terminal settlement report to check a card tender.');
  if(method==='EFT'&&source==='TERMINAL_REPORT'&&decision==='DOCUMENT_CHECKED')
    throw Error('Use a bank statement to check an EFT tender.');
  if(decision==='DOCUMENT_CHECKED'&&source==='NOT_AVAILABLE')throw Error('Evidence is required to check a document.');
  const observed_amount_cents=validateMoneyCents(body.observed_amount_cents,MAX);
  if(typeof body.source_reference!=='string'||typeof body.note!=='string')throw Error('Evidence reference and note must be text.');
  const source_reference=body.source_reference.trim();
  const note=body.note.trim();
  if(source_reference.length>80 || /[\x00-\x1F\x7F]/.test(source_reference)||cardNumberPattern.test(source_reference))
    throw Error('Invalid evidence reference. Never enter a full payment card number.');
  if(note.length>400||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(note)||cardNumberPattern.test(note))
    throw Error('Invalid evidence note. Do not enter card numbers or sensitive banking details.');
  if(decision==='DOCUMENT_CHECKED' && source_reference.length<4)
    throw Error('Enter the terminal or bank evidence reference (at least 4 characters).');
  if(note.length<10)throw Error('Explain the source checked or follow-up reason in at least 10 characters.');
  return {request_id,preparation_id,method,decision,source,observed_amount_cents,source_reference,note};
}

export function evidenceListStatement(branch){
  if(typeof branch!=='string'||!branch.trim()||branch.length>150)throw Error('Assigned branch required.');
  return {sql:`WITH recent AS (
    SELECT id,branch,quotation_number,prepared_by_name,card_cents,eft_cents,created_at
    FROM maliks_tender_preparations
    WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 75
  ), tender_lines AS (
    SELECT id AS preparation_id,branch,quotation_number,prepared_by_name,created_at,
           'CARD' AS method,card_cents AS expected_amount_cents FROM recent WHERE card_cents>0
    UNION ALL
    SELECT id,branch,quotation_number,prepared_by_name,created_at,
           'EFT',eft_cents FROM recent WHERE eft_cents>0
  )
  SELECT t.*,r.id AS observation_id,r.decision,r.source,r.source_reference,
         r.observed_amount_cents,r.note,r.reviewed_by_name,r.created_at AS observed_at
  FROM tender_lines t
  LEFT JOIN maliks_payment_evidence_observations r ON r.id=(
    SELECT MAX(o.id) FROM maliks_payment_evidence_observations o
    WHERE o.preparation_id=t.preparation_id AND o.method=t.method AND lower(o.branch)=lower(t.branch)
  ) ORDER BY t.preparation_id DESC,t.method`,params:[branch]};
}
export function evidenceHistoryStatement(branch,preparation_id,method){
  if(typeof branch!=='string'||!branch.trim()||branch.length>150)throw Error('Assigned branch required.');
  validateShiftId(preparation_id);
  if(!EVIDENCE_METHODS.includes(method))throw Error('Invalid payment method.');
  return {sql:`SELECT id,preparation_id,method,decision,source,source_reference,
    expected_amount_cents,observed_amount_cents,note,reviewed_by_name,created_at
    FROM maliks_payment_evidence_observations
    WHERE lower(branch)=lower(?) AND preparation_id=? AND method=? ORDER BY id DESC LIMIT 50`,params:[branch,preparation_id,method]};
}
export function evidenceForClient(row){
  return {id:row.observation_id??row.id??null,preparation_id:row.preparation_id,number:row.quotation_number,
    method:row.method,expected_amount_cents:row.expected_amount_cents,observed_amount_cents:row.observed_amount_cents??null,
    decision:row.decision??'NO_OBSERVATION',source:row.source??null,source_reference:row.source_reference??'',
    note:row.note??'',prepared_by_name:row.prepared_by_name??'',reviewed_by_name:row.reviewed_by_name??'',
    created_at:row.created_at??null,observed_at:row.observed_at??row.created_at??null,
    payment_recorded:false,verified_by_bank:false,invoice_created:false,dispatch_released:false};
}
