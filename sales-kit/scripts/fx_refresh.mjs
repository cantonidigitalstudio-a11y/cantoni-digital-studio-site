import fs from 'node:fs/promises';

const API = 'https://api.frankfurter.app/latest?from=EUR';

async function run() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`FX API error ${res.status}`);
  const data = await res.json();

  const payload = {
    base: data.base,
    date: data.date,
    fetched_at_utc: new Date().toISOString(),
    rates: data.rates
  };

  const out = new URL('../fx_rates.json', import.meta.url);
  await fs.writeFile(out, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Saved FX rates to ${out.pathname}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
