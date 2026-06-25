const LEAK_RULES = [
  { id: 'absolute_volumes_path', pattern: /\/Volumes\// },
  { id: 'absolute_users_path', pattern: /\/Users\// },
  { id: 'bearer_token', pattern: /Bearer\s+[A-Za-z0-9._~+/-]+=*/i },
  { id: 'api_key_assignment', pattern: /api[-_ ]?key\s*[:=]\s*[A-Za-z0-9._~+/-]{16,}/i },
  { id: 'password_assignment', pattern: /password\s*[:=]\s*[^,\n}]{8,}/i },
  { id: 'otp_assignment', pattern: /\botp\s*[:=]\s*[^,\n}]{4,}/i },
  { id: 'passkey_assignment', pattern: /passkey\s*[:=]\s*[^,\n}]{8,}/i }
];

function leakFailuresForSource(source, label) {
  return LEAK_RULES
    .filter((rule) => rule.pattern.test(source))
    .map((rule) => `${label}: ${rule.id}`);
}

function pushLeakFailures(source, label, failures) {
  failures.push(...leakFailuresForSource(source, label));
}

module.exports = {
  LEAK_RULES,
  leakFailuresForSource,
  pushLeakFailures
};
