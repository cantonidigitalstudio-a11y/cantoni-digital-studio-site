const fs = require('fs');
const path = require('path');

const I18N_PATH = path.resolve(__dirname, '..', 'i18n.json');
const QUOTE_CORE_KEYS = [
  'q_eyebrow',
  'q_form_title',
  'q_form_text',
  'q_project_type',
  'q_pt_1',
  'q_pt_2',
  'q_pt_3',
  'q_pt_4',
  'q_pt_5',
  'q_pt_6',
  'q_timeline',
  'q_timeline_1',
  'q_timeline_2',
  'q_timeline_3',
  'q_timeline_4',
  'q_budget',
  'q_budget_1',
  'q_budget_2',
  'q_budget_3',
  'q_budget_4',
  'q_materials_ready',
  'q_mready_1',
  'q_mready_2',
  'q_mready_3',
  'q_assets',
  'q_assets_placeholder',
  'q_goal',
  'q_privacy_ack',
  'q_terms_cta',
  'footer_privacy'
];

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readI18nFile() {
  let raw;
  try {
    raw = fs.readFileSync(I18N_PATH, 'utf8');
  } catch (error) {
    fail(`Unable to read ${I18N_PATH}: ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in ${I18N_PATH}: ${error.message}`);
  }
}

function validateI18n(data) {
  const errors = [];
  const langs = data && data.langs;
  const translations = data && data.translations;

  if (!Array.isArray(langs) || langs.length === 0) {
    errors.push('Top-level "langs" must be a non-empty array.');
  }

  if (!isPlainObject(translations)) {
    errors.push('Top-level "translations" must be an object keyed by language.');
  }

  if (errors.length > 0) {
    return errors;
  }

  const duplicateLangs = langs.filter((lang, index) => langs.indexOf(lang) !== index);
  if (duplicateLangs.length > 0) {
    errors.push(`"langs" contains duplicates: ${[...new Set(duplicateLangs)].join(', ')}`);
  }

  const invalidLangs = langs.filter((lang) => typeof lang !== 'string' || !lang.trim());
  if (invalidLangs.length > 0) {
    errors.push('"langs" must contain only non-empty language codes.');
  }

  const missingDictionaries = langs.filter((lang) => !Object.prototype.hasOwnProperty.call(translations, lang));
  if (missingDictionaries.length > 0) {
    errors.push(`Missing translation dictionaries for: ${missingDictionaries.join(', ')}`);
  }

  const extraDictionaries = Object.keys(translations).filter((lang) => !langs.includes(lang));
  if (extraDictionaries.length > 0) {
    errors.push(`Translation dictionaries not declared in "langs": ${extraDictionaries.join(', ')}`);
  }

  const referenceLang = langs.includes('en') ? 'en' : langs[0];
  const referenceDict = translations[referenceLang];

  if (!isPlainObject(referenceDict)) {
    errors.push(`Reference language "${referenceLang}" must map to an object.`);
    return errors;
  }

  const referenceKeys = Object.keys(referenceDict);
  if (referenceKeys.length === 0) {
    errors.push(`Reference language "${referenceLang}" cannot be empty.`);
    return errors;
  }

  const requiredKeys = new Set(referenceKeys);

  for (const lang of langs) {
    const dict = translations[lang];
    if (!isPlainObject(dict)) {
      errors.push(`Language "${lang}" must map to an object.`);
      continue;
    }

    const keys = Object.keys(dict);
    const missingKeys = referenceKeys.filter((key) => !Object.prototype.hasOwnProperty.call(dict, key));
    const extraKeys = keys.filter((key) => !requiredKeys.has(key));

    if (missingKeys.length > 0) {
      errors.push(`Language "${lang}" is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 10).join(', ')}`);
    }

    if (extraKeys.length > 0) {
      errors.push(`Language "${lang}" has ${extraKeys.length} unexpected keys: ${extraKeys.slice(0, 10).join(', ')}`);
    }

    for (const key of keys) {
      const value = dict[key];
      if (typeof value !== 'string') {
        errors.push(`Language "${lang}" key "${key}" must be a string, got ${typeof value}.`);
        continue;
      }

      if (!value.trim()) {
        errors.push(`Language "${lang}" key "${key}" cannot be empty.`);
      }
    }
  }

  const english = translations.en || {};
  for (const lang of langs.filter((item) => item !== 'en')) {
    const dict = translations[lang];
    if (!isPlainObject(dict)) continue;

    for (const key of QUOTE_CORE_KEYS) {
      if (dict[key] === english[key]) {
        errors.push(`Language "${lang}" quote core key "${key}" still matches English fallback.`);
      }
    }
  }

  return errors;
}

function main() {
  const data = readI18nFile();
  const errors = validateI18n(data);

  if (errors.length > 0) {
    console.error(`FAIL i18n-integrity (${errors.length} issues)`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const referenceLang = data.langs.includes('en') ? 'en' : data.langs[0];
  const keyCount = Object.keys(data.translations[referenceLang]).length;
  console.log(`PASS i18n-integrity (${data.langs.length} languages, ${keyCount} keys)`);
}

main();
