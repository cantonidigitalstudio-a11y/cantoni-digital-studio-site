import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const queueFile = path.resolve(__dirname, '../queue/outreach_queue.json');
const outFile = path.resolve(__dirname, '../queue/internal_test_queue.json');
const targetEmail = 'cantonidigitalstudio@gmail.com';

async function run() {
  const queue = JSON.parse(await fs.readFile(queueFile, 'utf8'));
  const first = queue.find((item) => item.status === 'pending');

  if (!first) {
    throw new Error('No pending queue item found.');
  }

  const internalTest = [
    {
      ...first,
      id: `${first.id}-INTERNAL-TEST`,
      lead_id: '',
      to: targetEmail,
      subject: `[INTERNAL TEST] ${first.subject}`,
      status: 'pending'
    }
  ];

  await fs.writeFile(outFile, JSON.stringify(internalTest, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        output: outFile,
        source_lead_id: first.id,
        to: targetEmail
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
