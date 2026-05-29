import { readLeadPipeline } from './lib/lead_pipeline_utils.mjs';

const csvFile = process.env.LEAD_PIPELINE_CSV || 'sales-kit/lead-batches/2026-05-15-global-50/leads.csv';
const targetDate = process.env.FOLLOWUP_TARGET_DATE || new Date().toISOString().slice(0, 10);
const expectedFollowupSent = Number(process.env.EXPECTED_FOLLOWUP_D3 || 50);

const rows = await readLeadPipeline(csvFile);
const dueContacted = rows.filter((row) =>
  row.status === 'CONTACTED' &&
  row.email &&
  row.next_action_date &&
  row.next_action_date <= targetDate
);
const followupSent = rows.filter((row) => row.status === 'FOLLOWUP_D3');

const failures = [];
if (dueContacted.length > 0) {
  failures.push(`${dueContacted.length} CONTACTED rows are still due for D3 follow-up`);
}
if (followupSent.length < expectedFollowupSent) {
  failures.push(`expected at least ${expectedFollowupSent} FOLLOWUP_D3 rows, found ${followupSent.length}`);
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      csv_file: csvFile,
      target_date: targetDate,
      rows: rows.length,
      followup_d3_rows: followupSent.length,
      due_contacted_rows: dueContacted.length,
      failures
    },
    null,
    2
  )
);

if (failures.length) process.exit(1);
