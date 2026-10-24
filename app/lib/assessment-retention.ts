// Called from the existing hourly Worker schedule and the authorised delete action.
export async function deleteAssessment(bindings:{DB:D1Database;BUCKET:R2Bucket},id:string){
 const chunks=await bindings.DB.prepare('SELECT object_key FROM candidate_assessment_chunks WHERE assessment_id=?').bind(id).all<{object_key:string}>();
 const keys=chunks.results.map(c=>c.object_key);if(keys.length)await bindings.BUCKET.delete(keys);
 await bindings.DB.batch([bindings.DB.prepare('DELETE FROM candidate_assessment_chunks WHERE assessment_id=?').bind(id),bindings.DB.prepare('DELETE FROM candidate_assessments WHERE id=?').bind(id)]);
}
export async function purgeExpiredAssessments(bindings:{DB:D1Database;BUCKET:R2Bucket}){
 const now=new Date().toISOString();
 await bindings.DB.prepare("UPDATE candidate_assessments SET status='interrupted',submitted_at=?,events_json=CASE WHEN json_array_length(events_json)<100 THEN json_insert(events_json,'$[#]',json_object('event','session-timed-out','at',?)) ELSE events_json END WHERE status='running' AND started_at<?").bind(now,now,new Date(Date.now()-16*60*1000).toISOString()).run();
 const rows=await bindings.DB.prepare('SELECT id FROM candidate_assessments WHERE retention_until<=? ORDER BY retention_until LIMIT 10').bind(new Date().toISOString()).all<{id:string}>();
 for(const row of rows.results)await deleteAssessment(bindings,row.id);
}
