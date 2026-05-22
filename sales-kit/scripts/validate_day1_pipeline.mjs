import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  readLeadPipeline,
  validateLeadForQueue,
  VALID_STATUSES
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvFile = path.resolve(__dirname, '../lead_pipeline.csv');

async function run() {
  const rows = await readLeadPipeline(csvFile);
  const invalidStatuses = [];
  const readyIssues = [];
  const readyLeads = [];

  rows.forEach((row) => {
    if (!VALID_STATUSES.includes(row.status)) {
      invalidStatuses.push({
        lead_id: row.lead_id,
        business_name: row.business_name,
        status: row.status
      });
    }

    if (row.status === 'READY_TO_CONTACT') {
      const validation = validateLeadForQueue(row);
      if (validation.ok) {
        readyLeads.push({
          lead_id: row.lead_id,
          business_name: row.business_name,
          country: row.country,
          language: validation.language,
          currency: validation.currency
        });
      } else {
        readyIssues.push({
          lead_id: row.lead_id,
          business_name: row.business_name,
          problems: validation.problems
        });
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        ok: invalidStatuses.length === 0 && readyIssues.length === 0,
        total_rows: rows.length,
        ready_to_contact_count: readyLeads.length,
        invalid_statuses: invalidStatuses,
        ready_gate_failures: readyIssues,
        ready_to_contact_preview: readyLeads.slice(0, 20)
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
