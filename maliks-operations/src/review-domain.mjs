/**
 * Phase 5: independent review of cashier-declared closing cash counts.
 * A review is NOT a cash-up reconciliation, banking approval or payment posting.
 * Every review is immutable. A later review does not overwrite an earlier one.
 */
export const REVIEW_DECISIONS = Object.freeze(['CHECKED_DECLARATION', 'FLAGGED_FOR_FOLLOWUP']);

export function validateReviewDecision(value) {
  if (!REVIEW_DECISIONS.includes(value)) throw Error('Select Checked declaration or Flag for follow-up.');
  return value;
}

export function validateReviewNote(input, decision) {
  if (typeof input !== 'string') throw Error('Enter a review note.');
  const note = input.trim();
  if (note.length > 400) throw Error('Review note must be 400 characters or less.');
  if (decision === 'FLAGGED_FOR_FOLLOWUP' && note.length < 10)
    throw Error('A follow-up flag requires a reason of at least 10 characters.');
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(note)) throw Error('Review note contains invalid characters.');
  return note;
}

export function latestReviewsStatement(branch, shiftIds) {
  if (typeof branch !== 'string' || !branch.trim() || !Array.isArray(shiftIds) ||
      !shiftIds.length || shiftIds.length > 75 ||
      !shiftIds.every(id => Number.isSafeInteger(id) && id > 0)) throw Error('Invalid branch or shift selection.');
  const placeholders = shiftIds.map(() => '?').join(',');
  return {
    sql: `SELECT r.id,r.shift_id,r.decision,r.note,r.reviewed_by_name,r.created_at
          FROM maliks_till_shift_reviews r
          JOIN (
            SELECT shift_id,MAX(id) AS latest_id
            FROM maliks_till_shift_reviews
            WHERE lower(branch)=lower(?) AND shift_id IN (${placeholders})
            GROUP BY shift_id
          ) latest ON latest.latest_id=r.id`,
    params: [branch,...shiftIds],
  };
}

export function reviewHistoryStatement(branch, shiftId) {
  if(typeof branch !== 'string' || !branch.trim() || !Number.isSafeInteger(shiftId) || shiftId < 1)
    throw Error('Invalid review history request.');
  return {
    sql: `SELECT id,shift_id,decision,note,reviewed_by_name,created_at
          FROM maliks_till_shift_reviews
          WHERE lower(branch)=lower(?) AND shift_id=? ORDER BY id DESC LIMIT 50`,
    params: [branch,shiftId],
  };
}

export function reviewForClient(row){
  return {id:row.id,shift_id:row.shift_id,decision:row.decision,note:row.note,
    reviewed_by_name:row.reviewed_by_name,created_at:row.created_at};
}
