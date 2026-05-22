import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLeadPipeline } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const csvFile = process.env.LEAD_PIPELINE_CSV
  ? path.resolve(process.env.LEAD_PIPELINE_CSV)
  : path.resolve(salesKitDir, 'lead_pipeline.csv');
const outreachQueueFile = process.env.OUTREACH_QUEUE_FILE
  ? path.resolve(process.env.OUTREACH_QUEUE_FILE)
  : path.resolve(salesKitDir, 'queue/outreach_queue.json');
const followupQueueFile = process.env.FOLLOWUP_QUEUE_FILE
  ? path.resolve(process.env.FOLLOWUP_QUEUE_FILE)
  : path.resolve(salesKitDir, 'queue/followup_d3_queue.json');
const stateFile = process.env.WORKER_STATE_FILE
  ? path.resolve(process.env.WORKER_STATE_FILE)
  : path.resolve(salesKitDir, 'queue/background_worker_state.json');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || 'EMPTY';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

async function run() {
  const rows = await readLeadPipeline(csvFile);
  const outreachQueue = await readJson(outreachQueueFile, []);
  const followupQueue = await readJson(followupQueueFile, []);
  const workerState = await readJson(stateFile, {});

  const contacted = rows.filter((row) => row.status === 'CONTACTED');
  const replied = rows.filter((row) => row.status === 'REPLIED');
  const quoteInProgress = rows.filter((row) => row.status === 'QUOTE_IN_PROGRESS');
  const quoteSent = rows.filter((row) => row.status === 'QUOTE_SENT');
  const followupD3 = rows.filter((row) => row.status === 'FOLLOWUP_D3');

  const nextFollowupDate = contacted
    .map((row) => row.next_action_date)
    .filter(Boolean)
    .sort()[0] || '';

  console.log(JSON.stringify({
    ok: true,
    files: {
      pipeline: csvFile,
      outreach_queue: outreachQueueFile,
      followup_d3_queue: followupQueueFile,
      worker_state: stateFile
    },
    totals: {
      pipeline_rows: rows.length,
      by_status: countBy(rows, 'status'),
      outreach_queue_by_status: countBy(outreachQueue, 'status'),
      followup_d3_queue_by_status: countBy(followupQueue, 'status')
    },
    operational_snapshot: {
      contacted: contacted.length,
      replied: replied.length,
      quote_in_progress: quoteInProgress.length,
      quote_sent: quoteSent.length,
      followup_d3: followupD3.length,
      next_followup_date: nextFollowupDate,
      worker_state: workerState
    }
  }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
