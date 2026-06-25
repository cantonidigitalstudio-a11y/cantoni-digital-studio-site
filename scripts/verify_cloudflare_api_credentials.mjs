const allowMissing = process.argv.includes('--allow-missing');
const pagesOnly = process.argv.includes('--pages-only');
const dnsOnly = process.argv.includes('--dns-only');
const scope = pagesOnly ? 'pages_only' : dnsOnly ? 'dns_only' : 'pages_and_dns';

const apiBaseUrl = (process.env.CLOUDFLARE_API_BASE_URL || 'https://api.cloudflare.com/client/v4').replace(/\/+$/u, '');
const token = process.env.CLOUDFLARE_API_TOKEN || '';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const zoneId = process.env.CLOUDFLARE_ZONE_ID || '';
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME || 'cantonidigitalstudio';
const domain = process.env.CLOUDFLARE_CUSTOM_DOMAIN || process.env.CANTONI_EMAIL_DOMAIN || 'cantonidigitalstudio.com';

function redact(value) {
  return String(value || '')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer ************************************')
    .replace(/(Authorization:\s*Bearer\s+)[^\s]+/gi, '$1************************************')
    .replace(/(token(?:\s+value)?\s*[:=]\s*)[A-Za-z0-9._~+/-]{16,}/gi, '$1************************************')
    .replace(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}/g, '************************************');
}

function summarizeErrors(parsed, status) {
  if (Array.isArray(parsed?.errors) && parsed.errors.length) {
    return parsed.errors.map((error) => ({
      code: error.code || null,
      message: redact(error.message || 'Cloudflare API error')
    }));
  }
  if (status) {
    return [{ code: status, message: `HTTP ${status}` }];
  }
  return [];
}

async function cloudflareGet(pathname, query = {}) {
  const url = new URL(`${apiBaseUrl}${pathname}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    }
  });
  const parsed = await response.json().catch(() => null);

  return {
    ok: response.ok && parsed?.success === true,
    status: response.status,
    success: parsed?.success === true,
    errors: summarizeErrors(parsed, response.status),
    result_summary: summarizeResult(parsed?.result)
  };
}

function summarizeResult(result) {
  if (!result) return null;
  if (Array.isArray(result)) {
    return {
      kind: 'array',
      count: result.length
    };
  }
  if (typeof result === 'object') {
    const summary = { kind: 'object' };
    for (const key of ['id', 'status', 'name', 'project_name', 'zone_name']) {
      if (result[key]) summary[key] = key === 'id' ? redactIdentifier(result[key]) : result[key];
    }
    return summary;
  }
  return { kind: typeof result };
}

function redactIdentifier(value) {
  const text = String(value || '');
  if (text.length <= 8) return text;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function skipped(reason, ok = false) {
  return {
    ok,
    skipped: true,
    reason
  };
}

function nextActionsFor({ tokenVerify, pagesAccess, dnsAccess }) {
  const actions = [];
  if (!token) {
    actions.push('Create or provide a Cloudflare API token for the Cantoni account; keep it in environment only, never in the repo.');
    actions.push(pagesOnly
      ? 'Use Account > Cloudflare Pages > Edit for direct Pages deploy access.'
      : dnsOnly
      ? 'Use Zone > DNS > Edit for the cantonidigitalstudio.com zone before applying email DNS records.'
      : 'Use Account > Cloudflare Pages > Edit for deploy access and Zone > DNS > Edit for DNS apply.');
    actions.push(pagesOnly
      ? 'Set CLOUDFLARE_ACCOUNT_ID for the Cantoni account before re-running this Pages-only audit.'
      : dnsOnly
      ? 'Set CLOUDFLARE_ZONE_ID for cantonidigitalstudio.com before re-running this DNS-only audit.'
      : 'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ZONE_ID for the Cantoni account before re-running this audit.');
    return actions;
  }
  if (!tokenVerify.ok) {
    actions.push('Replace CLOUDFLARE_API_TOKEN; /user/tokens/verify did not report an active token.');
  }
  if (!dnsOnly && !accountId) {
    actions.push('Set CLOUDFLARE_ACCOUNT_ID for the Cantoni Cloudflare account to verify Pages access.');
  } else if (!dnsOnly && !pagesAccess.ok) {
    actions.push('Grant the token Cloudflare Pages access on the Cantoni account, then verify the Pages project can be read.');
  }
  if (!pagesOnly) {
    if (!zoneId) {
      actions.push('Set CLOUDFLARE_ZONE_ID for cantonidigitalstudio.com to verify DNS access.');
    } else if (!dnsAccess.ok) {
      actions.push('Grant the token DNS access on the cantonidigitalstudio.com zone before planning or applying email DNS records.');
    }
  }
  if (!actions.length) {
    actions.push(pagesOnly
      ? 'Cloudflare Pages direct API read checks passed; run full tests and the approved direct deploy script before any Pages mutation.'
      : dnsOnly
      ? 'Cloudflare DNS API read checks passed; run the DNS plan and apply only with explicit DNS approval.'
      : 'Direct Cloudflare API read checks passed; run the Wrangler auth audit and deploy/DNS dry-runs before any mutation.');
  }
  return actions;
}

async function main() {
  if (pagesOnly && dnsOnly) {
    console.log(JSON.stringify({
      ok: false,
      allow_missing: allowMissing,
      scope: 'invalid',
      failures: [{
        id: 'invalid_scope_flags',
        reason: 'Use only one of --pages-only or --dns-only.'
      }]
    }, null, 2));
    process.exit(1);
  }

  const tokenVerify = token
    ? await cloudflareGet('/user/tokens/verify')
    : skipped('CLOUDFLARE_API_TOKEN is not set');

  const pagesAccess = dnsOnly
    ? skipped('Pages check skipped by --dns-only', true)
    : token && accountId
    ? await cloudflareGet(`/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}/deployments`, { per_page: 1 })
    : skipped(token ? 'CLOUDFLARE_ACCOUNT_ID is not set' : 'CLOUDFLARE_API_TOKEN is not set');

  const dnsAccess = pagesOnly
    ? skipped('DNS check skipped by --pages-only', true)
    : token && zoneId
    ? await cloudflareGet(`/zones/${encodeURIComponent(zoneId)}/dns_records`, { name: domain, per_page: 1 })
    : skipped(token ? 'CLOUDFLARE_ZONE_ID is not set' : 'CLOUDFLARE_API_TOKEN is not set');

  const failures = [];
  if (!tokenVerify.ok) {
    failures.push({
      id: 'cloudflare_api_token',
      reason: tokenVerify.reason || 'Cloudflare API token is missing or not active.'
    });
  }
  if (!dnsOnly && !pagesAccess.ok) {
    failures.push({
      id: 'cloudflare_pages_api_read',
      reason: pagesAccess.reason || 'Cloudflare API token cannot read the Cantoni Pages project deployments endpoint.'
    });
  }
  if (!pagesOnly && !dnsAccess.ok) {
    failures.push({
      id: 'cloudflare_dns_api_read',
      reason: dnsAccess.reason || 'Cloudflare API token cannot read DNS records for the Cantoni zone.'
    });
  }

  const result = {
    ok: failures.length === 0,
    allow_missing: allowMissing,
    scope,
    checked_at: new Date().toISOString(),
    api_base_url: apiBaseUrl,
    project_name: projectName,
    domain,
    has_cloudflare_api_token: Boolean(token),
    has_cloudflare_account_id: Boolean(accountId),
    has_cloudflare_zone_id: Boolean(zoneId),
    account_id_suffix: accountId ? accountId.slice(-6) : null,
    zone_id_suffix: zoneId ? zoneId.slice(-6) : null,
    checks: {
      token_verify: tokenVerify,
      pages_project_deployments_read: pagesAccess,
      dns_records_read: dnsAccess
    },
    next_actions: nextActionsFor({ tokenVerify, pagesAccess, dnsAccess }),
    references: [
      {
        label: 'Cloudflare Pages REST API',
        url: 'https://developers.cloudflare.com/pages/configuration/api/'
      },
      {
        label: 'Cloudflare API token verification',
        url: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/'
      },
      {
        label: 'Cloudflare DNS records API',
        url: 'https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/create/'
      }
    ],
    failures
  };

  console.log(JSON.stringify(result, null, 2));

  if (failures.length > 0 && !allowMissing) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: redact(error.message || String(error))
  }, null, 2));
  process.exit(1);
});
