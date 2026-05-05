function baseUrl(env) {
  return String(env.SUPABASE_URL || '').replace(/\/+$/g, '');
}

function serviceRoleKey(env) {
  return String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

function compactText(value, maxLength = 240) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeEmail(value) {
  const email = compactText(value, 160).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function authRequest(env, path, options = {}) {
  const url = `${baseUrl(env)}${path}`;
  const apikey = serviceRoleKey(env);
  if (!url || !apikey) {
    throw new Error('Supabase auth environment is not configured.');
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      apikey,
      Authorization: options.authorization || `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? compactText(payload.msg || payload.error_description || payload.message || payload.error, 220)
      : compactText(payload, 220) || `Supabase auth request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

export function readBearerToken(request) {
  const header = String(request.headers.get('authorization') || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1]).trim() : '';
}

export function userRole(user) {
  const appMeta = user && typeof user === 'object' ? (user.app_metadata || {}) : {};
  const userMeta = user && typeof user === 'object' ? (user.user_metadata || {}) : {};
  const candidates = [
    appMeta.role,
    appMeta.user_role,
    Array.isArray(appMeta.roles) ? appMeta.roles[0] : '',
    userMeta.role
  ];
  return compactText(candidates.find(Boolean) || '', 48).toLowerCase();
}

export function hasStaffRole(user) {
  return ['admin', 'operator'].includes(userRole(user));
}

export function adminKeyFallbackEnabled(env = process.env) {
  const explicit = compactText(env.VIP_ADMIN_KEY_FALLBACK_ENABLED || env.VIP_ALLOW_ADMIN_KEY || '', 16).toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(explicit)) return true;
  if (['false', '0', 'no', 'off'].includes(explicit)) return false;
  return compactText(env.NODE_ENV || '', 32).toLowerCase() !== 'production';
}

export async function getUserFromAccessToken(env, accessToken) {
  const token = compactText(accessToken, 4000);
  if (!token) return null;
  const payload = await authRequest(env, '/auth/v1/user', {
    method: 'GET',
    authorization: `Bearer ${token}`
  });
  return payload && typeof payload === 'object' ? payload : null;
}

export async function requireAuthenticatedUser(request, env) {
  const token = readBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: 'Authentication is required.' };
  }

  try {
    const user = await getUserFromAccessToken(env, token);
    if (!user || !user.id) {
      return { ok: false, status: 401, error: 'Supabase user session is invalid.' };
    }
    return { ok: true, token, user, role: userRole(user) };
  } catch (error) {
    return {
      ok: false,
      status: 401,
      error: compactText(error && error.message ? error.message : 'Supabase user session is invalid.', 220)
    };
  }
}

export async function requireStaffAccess(request, env, options = {}) {
  const expectedAdminKey = compactText(env.VIP_ADMIN_API_KEY, 240);
  const providedAdminKey = compactText(request.headers.get('x-vip-admin-key'), 240);

  if (adminKeyFallbackEnabled(env) && expectedAdminKey && providedAdminKey && providedAdminKey === expectedAdminKey) {
    return { ok: true, type: 'admin_key', role: 'admin' };
  }

  if (options.allowBearer === false) {
    return { ok: false, status: 401, error: 'Unauthorized.' };
  }

  const auth = await requireAuthenticatedUser(request, env);
  if (!auth.ok) return auth;
  if (!hasStaffRole(auth.user)) {
    return { ok: false, status: 403, error: 'Staff access is required.' };
  }
  return { ...auth, type: 'user' };
}

export async function requestMagicLink(env, email, redirectTo) {
  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) {
    throw new Error('A valid email is required for the magic link.');
  }
  return authRequest(env, '/auth/v1/otp', {
    method: 'POST',
    body: {
      email: cleanEmail,
      create_user: true,
      data: {
        role: 'customer'
      },
      options: redirectTo ? { emailRedirectTo: redirectTo } : {}
    }
  });
}

export function buildAuthRedirect(request, env, path = '/excellentia-vip-account.html') {
  const configured = compactText(env.PUBLIC_SITE_URL || env.SITE_URL || '', 240);
  const origin = configured || new URL(request.url).origin;
  return new URL(path, origin).toString();
}
