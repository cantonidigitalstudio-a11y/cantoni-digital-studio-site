import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolveMarketSummary } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const logoPath = path.resolve(salesKitDir, '../assets/logo/cantoni_icona_quadrata.png');
const localeRulesPath = path.resolve(salesKitDir, 'market_locale_rules.json');
const fxRatesPath = path.resolve(salesKitDir, 'fx_rates.json');
const CANTONI_SITE_URL = 'https://cantonidigitalstudio.com';
const CANTONI_STUDIO_URL = `${CANTONI_SITE_URL}/studio.html`;
const CANTONI_CASE_STUDIES_URL = `${CANTONI_SITE_URL}/case-studies.html`;
const CANTONI_INSTAGRAM_URL = 'https://www.instagram.com/cantonidigitalstudio/';
const CANTONI_TIKTOK_URL = 'https://www.tiktok.com/@cantonidigitalstudio';
const CANTONI_YOUTUBE_URL = 'https://www.youtube.com/@cantonidigitalstudio';
const CANTONI_TERMS_URL = `${CANTONI_SITE_URL}/termini-commerciali.html`;

const packageBaselineEUR = {
  base: 1200,
  growth: 2200,
  premium: 4000,
  familyEntry: 250,
  familyUpdates: 400,
  familyPromotion: 700
};

const fallbackFxRates = {
  DOP: 65,
  AED: 3.97,
  SAR: 4.36
};

const languageCopy = {
  it: {
    quoteTitle: 'Preventivo personalizzato',
    summaryTitle: 'Sintesi progetto',
    issuesTitle: 'Criticità osservate',
    proposalTitle: 'Intervento proposto',
    impactTitle: 'Impatto economico atteso',
    packagesTitle: 'Pacchetti e layer ecosistema',
    termsTitle: 'Condizioni commerciali',
    baseLabel: 'Pacchetto Base',
    growthLabel: 'Pacchetto Standard (consigliato)',
    premiumLabel: 'Pacchetto Premium',
    monthlyLabel: 'Layer ecosistema mensili',
    familyEntryLabel: 'Ingresso famiglia',
    familyUpdatesLabel: 'Famiglia + aggiornamenti continui',
    familyPromotionLabel: 'Famiglia + aggiornamenti + promozione',
    included: 'Incluso',
    excluded: 'Escluso',
    revisions: 'Revisioni',
    timeline: 'Tempistiche',
    payment: 'Pagamenti',
    footerCta: 'Resto in attesa di un vostro riscontro. Se desiderate procedere, vi basta rispondere indicando il pacchetto o il layer ecosistema scelto e vi invio subito conferma operativa, prossimi step e dati per l’avvio.',
    impactLead: 'Range realistico su 60-90 giorni, in base a traffico, offerta e execution:',
    paymentValue: 'Pacchetti 50% avvio / 50% consegna · layer mensili anticipati e non rimborsabili una volta attivi',
    revisionsValue: '2 round Base, 3 round Standard, 4 round Premium',
    documentMeta: 'Documento proposta riservato',
    studioCardLabel: 'Studio',
    recipientCardLabel: 'Destinatario',
    referenceCardLabel: 'Riferimenti',
    issuedOn: 'Data emissione',
    currencyLabel: 'Divisa',
    serviceTableTitle: 'Servizi consigliati',
    serviceColumnLabel: 'Servizio',
    quantityLabel: 'QTA',
    amountLabel: 'Importo',
    recommendedSummaryLabel: 'Riepilogo economico',
    recommendedAmountLabel: 'Totale investimento consigliato',
    proposalReferenceLabel: 'Documento',
    selectedPackageLabel: 'Pacchetto consigliato',
    monthlyOptionLabel: 'Layer ecosistema',
    commercialModelLabel: 'Modello pagamento',
    operatingBaseLabel: 'Sede operativa',
    nextStepLabel: 'Prossimo passo',
    nextStepValue: 'Rispondete indicando il pacchetto o il layer ecosistema scelto, oppure chiedete un allineamento finale prima dell’avvio.',
    recommendedBadge: 'Consigliato',
    exclusions: [
      'ADV media buying',
      'shooting foto/video on-site',
      'traduzioni professionali extra-volume'
    ]
  },
  en: {
    quoteTitle: 'Tailored proposal',
    summaryTitle: 'Project summary',
    issuesTitle: 'Observed issues',
    proposalTitle: 'Recommended intervention',
    impactTitle: 'Expected commercial impact',
    packagesTitle: 'Packages and ecosystem layers',
    termsTitle: 'Commercial terms',
    baseLabel: 'Base Package',
    growthLabel: 'Standard Package (recommended)',
    premiumLabel: 'Premium Package',
    monthlyLabel: 'Ecosystem monthly layers',
    familyEntryLabel: 'Family entry',
    familyUpdatesLabel: 'Family + continuous updates',
    familyPromotionLabel: 'Family + updates + promotion',
    included: 'Included',
    excluded: 'Excluded',
    revisions: 'Revisions',
    timeline: 'Timeline',
    payment: 'Payments',
    footerCta: 'If the proposal works for you, reply to this email with the package or ecosystem layer you want and I will send the start confirmation, next steps and payment details immediately.',
    impactLead: 'Realistic 60-90 day range depending on traffic, offer and execution:',
    paymentValue: 'Packages 50% upfront / 50% on final delivery · monthly layers are prepaid and non-refundable once active',
    revisionsValue: '2 rounds Base, 3 rounds Standard, 4 rounds Premium',
    documentMeta: 'Private proposal document',
    studioCardLabel: 'Studio',
    recipientCardLabel: 'Recipient',
    referenceCardLabel: 'References',
    issuedOn: 'Issue date',
    currencyLabel: 'Currency',
    serviceTableTitle: 'Recommended services',
    serviceColumnLabel: 'Service',
    quantityLabel: 'QTY',
    amountLabel: 'Amount',
    recommendedSummaryLabel: 'Commercial summary',
    recommendedAmountLabel: 'Recommended investment',
    proposalReferenceLabel: 'Document',
    selectedPackageLabel: 'Recommended package',
    monthlyOptionLabel: 'Ecosystem layer',
    commercialModelLabel: 'Payment model',
    operatingBaseLabel: 'Operating base',
    nextStepLabel: 'Next step',
    nextStepValue: 'Reply with the package or ecosystem layer you want, or ask for one final alignment before kickoff.',
    recommendedBadge: 'Recommended',
    exclusions: [
      'paid ads media buying',
      'on-site photo/video production',
      'large-volume professional translations'
    ]
  },
  es: {
    quoteTitle: 'Propuesta personalizada',
    summaryTitle: 'Resumen del proyecto',
    issuesTitle: 'Problemas observados',
    proposalTitle: 'Intervencion propuesta',
    impactTitle: 'Impacto comercial esperado',
    packagesTitle: 'Paquetes recomendados',
    termsTitle: 'Condiciones comerciales',
    baseLabel: 'Paquete Base',
    growthLabel: 'Paquete Growth (recomendado)',
    monthlyLabel: 'Gestion mensual opcional',
    included: 'Incluye',
    excluded: 'Excluye',
    revisions: 'Revisiones',
    timeline: 'Plazos',
    payment: 'Pagos',
    footerCta: 'Si la propuesta te encaja, responde a este correo con el paquete elegido y te envio de inmediato la confirmacion operativa y los datos para iniciar.',
    impactLead: 'Rango realista a 60-90 dias segun trafico, oferta y ejecucion:',
    paymentValue: '50% inicio / 50% entrega final',
    revisionsValue: '2 rondas Base, 3 rondas Growth',
    exclusions: [
      'gestion de campañas de pago',
      'foto/video presencial',
      'traducciones profesionales de gran volumen'
    ]
  },
  fr: {
    quoteTitle: 'Proposition personnalisee',
    summaryTitle: 'Synthese du projet',
    issuesTitle: 'Points critiques observes',
    proposalTitle: 'Intervention proposee',
    impactTitle: 'Impact commercial attendu',
    packagesTitle: 'Packs recommandes',
    termsTitle: 'Conditions commerciales',
    baseLabel: 'Pack Base',
    growthLabel: 'Pack Growth (recommande)',
    monthlyLabel: 'Gestion mensuelle optionnelle',
    included: 'Inclus',
    excluded: 'Exclus',
    revisions: 'Revisions',
    timeline: 'Delais',
    payment: 'Paiements',
    footerCta: 'Si la proposition vous convient, repondez a cet email avec le pack choisi et j envoie tout de suite la confirmation de demarrage et les modalites de paiement.',
    impactLead: 'Projection realiste sur 60-90 jours selon trafic, offre et execution :',
    paymentValue: '50% lancement / 50% livraison finale',
    revisionsValue: '2 tours Base, 3 tours Growth',
    exclusions: [
      'achat media publicitaire',
      'production photo/video sur site',
      'traductions professionnelles grand volume'
    ]
  },
  de: {
    quoteTitle: 'Massgeschneidertes Angebot',
    summaryTitle: 'Projektuebersicht',
    issuesTitle: 'Beobachtete Schwachstellen',
    proposalTitle: 'Empfohlene Umsetzung',
    impactTitle: 'Erwarteter geschaeftlicher Effekt',
    packagesTitle: 'Empfohlene Pakete',
    termsTitle: 'Kommerzielle Bedingungen',
    baseLabel: 'Base Paket',
    growthLabel: 'Growth Paket (empfohlen)',
    monthlyLabel: 'Optionale laufende Betreuung',
    included: 'Enthaelt',
    excluded: 'Nicht enthalten',
    revisions: 'Revisionen',
    timeline: 'Zeitplan',
    payment: 'Zahlungen',
    footerCta: 'Wenn das Angebot fuer Sie passt, antworten Sie einfach mit dem gewaehlten Paket und ich sende sofort die Startbestaetigung und Zahlungsdetails.',
    impactLead: 'Realistische 60-90 Tage Spanne je nach Traffic, Angebot und Umsetzung:',
    paymentValue: '50% Start / 50% finale Lieferung',
    revisionsValue: '2 Runden Base, 3 Runden Growth',
    exclusions: [
      'bezahltes Media Buying',
      'Foto/Video Produktion vor Ort',
      'umfangreiche professionelle Uebersetzungen'
    ]
  },
  pt: {
    quoteTitle: 'Proposta personalizada',
    summaryTitle: 'Resumo do projeto',
    issuesTitle: 'Pontos observados',
    proposalTitle: 'Intervencao proposta',
    impactTitle: 'Impacto comercial esperado',
    packagesTitle: 'Pacotes recomendados',
    termsTitle: 'Condicoes comerciais',
    baseLabel: 'Pacote Base',
    growthLabel: 'Pacote Growth (recomendado)',
    monthlyLabel: 'Gestao mensal opcional',
    included: 'Inclui',
    excluded: 'Exclui',
    revisions: 'Revisoes',
    timeline: 'Prazos',
    payment: 'Pagamentos',
    footerCta: 'Se a proposta fizer sentido, responda a este email com o pacote escolhido e envio imediatamente a confirmacao de arranque e os dados de pagamento.',
    impactLead: 'Faixa realista em 60-90 dias conforme trafego, oferta e execucao:',
    paymentValue: '50% inicio / 50% entrega final',
    revisionsValue: '2 rodadas Base, 3 rodadas Growth',
    exclusions: [
      'gestao de anuncios pagos',
      'producao foto/video presencial',
      'traducoes profissionais em grande volume'
    ]
  },
  ja: {
    quoteTitle: '個別提案書',
    summaryTitle: 'プロジェクト概要',
    issuesTitle: '確認した課題',
    proposalTitle: 'ご提案内容',
    impactTitle: '想定される事業効果',
    packagesTitle: '推奨プラン',
    termsTitle: '条件',
    baseLabel: 'Baseプラン',
    growthLabel: 'Growthプラン（推奨）',
    monthlyLabel: '月次運用オプション',
    included: '含まれる内容',
    excluded: '含まれない内容',
    revisions: '修正回数',
    timeline: '納期',
    payment: 'お支払い',
    footerCta: 'この提案で進める場合は、ご希望のプラン名を返信してください。すぐに開始確認とお支払い情報をお送りします。',
    impactLead: '60〜90日で想定できる現実的な改善幅:',
    paymentValue: '着手50% / 最終納品50%',
    revisionsValue: 'Base 2回、Growth 3回',
    exclusions: [
      '広告運用費の管理',
      '現地での写真・動画制作',
      '大量の専門翻訳'
    ]
  },
  ar: {
    quoteTitle: 'عرض مخصص',
    summaryTitle: 'ملخص المشروع',
    issuesTitle: 'المشكلات المرصودة',
    proposalTitle: 'التدخل المقترح',
    impactTitle: 'الاثر التجاري المتوقع',
    packagesTitle: 'الباقات المقترحة',
    termsTitle: 'الشروط التجارية',
    baseLabel: 'الباقة الاساسية',
    growthLabel: 'باقة النمو (الموصى بها)',
    monthlyLabel: 'ادارة شهرية اختيارية',
    included: 'يشمل',
    excluded: 'لا يشمل',
    revisions: 'المراجعات',
    timeline: 'المدة',
    payment: 'المدفوعات',
    footerCta: 'اذا كانت هذه الخطة مناسبة لك، فقط رد على هذه الرسالة مع الباقة المختارة وسارسل لك فورا تاكيد البدء وبيانات الدفع.',
    impactLead: 'نطاق واقعي خلال 60-90 يوما حسب الترافيك والعرض والتنفيذ:',
    paymentValue: '50% بداية / 50% عند التسليم النهائي',
    revisionsValue: 'جولتان Base و3 جولات Growth',
    exclusions: [
      'ادارة ميزانيات الاعلانات',
      'تصوير ميداني',
      'ترجمات احترافية كبيرة الحجم'
    ]
  },
  zh: {
    quoteTitle: '定制方案',
    summaryTitle: '项目摘要',
    issuesTitle: '发现的问题',
    proposalTitle: '建议执行内容',
    impactTitle: '预期商业效果',
    packagesTitle: '推荐方案',
    termsTitle: '商务条款',
    baseLabel: '基础方案',
    growthLabel: 'Growth方案（推荐）',
    monthlyLabel: '月度维护可选',
    included: '包含',
    excluded: '不包含',
    revisions: '修改轮次',
    timeline: '周期',
    payment: '付款方式',
    footerCta: '如果这份方案适合你，直接回复这封邮件并写明你选择的套餐，我会立即发送启动确认和付款信息。',
    impactLead: '基于流量、报价与执行，60-90天的合理改善区间：',
    paymentValue: '50% 启动 / 50% 最终交付',
    revisionsValue: 'Base 2轮，Growth 3轮',
    exclusions: [
      '付费广告投放管理',
      '线下照片视频拍摄',
      '大批量专业翻译'
    ]
  },
  hi: {
    quoteTitle: 'कस्टम प्रस्ताव',
    summaryTitle: 'प्रोजेक्ट सारांश',
    issuesTitle: 'देखी गई समस्याएं',
    proposalTitle: 'प्रस्तावित हस्तक्षेप',
    impactTitle: 'अपेक्षित व्यावसायिक प्रभाव',
    packagesTitle: 'सुझाए गए पैकेज',
    termsTitle: 'वाणिज्यिक शर्तें',
    baseLabel: 'Base पैकेज',
    growthLabel: 'Growth पैकेज (recommended)',
    monthlyLabel: 'वैकल्पिक मासिक मैनेजमेंट',
    included: 'शामिल',
    excluded: 'शामिल नहीं',
    revisions: 'रिविज़न',
    timeline: 'टाइमलाइन',
    payment: 'पेमेंट',
    footerCta: 'अगर यह प्रस्ताव आपको ठीक लगता है, चुना हुआ पैकेज लिखकर इसी ईमेल का जवाब दें और मैं तुरंत शुरुआत की पुष्टि और payment details भेज दूंगा।',
    impactLead: 'ट्रैफिक, ऑफर और execution के आधार पर 60-90 दिनों की यथार्थवादी रेंज:',
    paymentValue: '50% शुरुआत / 50% final delivery',
    revisionsValue: 'Base 2 rounds, Growth 3 rounds',
    exclusions: [
      'paid ads media buying',
      'on-site photo/video production',
      'high-volume professional translation'
    ]
  }
};

const defaultDeliverables = {
  it: {
    base: [
      'Restyling pagine core e pulizia percorso conversione',
      'Ottimizzazione CTA primaria',
      'Migliorie mobile UX e performance'
    ],
    growth: [
      'Funnel completo e architettura pagine commerciali',
      'Potenziamento trust e prove risultato',
      'SEO commerciale sulle pagine chiave'
    ],
    premium: [
      'Architettura premium completa per sito, funnel ed ecosistema cliente',
      'Piano crescita, trust layer e posizionamento avanzato',
      'Priorita alta su execution, espansioni e coordinamento commerciale'
    ],
    monthly: [
      'Ingresso famiglia: accesso strategico e allineamento ecosistema',
      'Famiglia + aggiornamenti: modifiche continue a sito, ecommerce e pagine chiave',
      'Famiglia + promozione: aggiornamenti continui con supporto promozionale coordinato'
    ]
  },
  en: {
    base: [
      'Core page redesign and conversion cleanup',
      'Primary CTA path optimization',
      'Mobile UX and performance improvements'
    ],
    growth: [
      'Full conversion funnel and commercial page architecture',
      'Trust / proof layer reinforcement',
      'Commercial SEO structure on key pages'
    ],
    premium: [
      'Full premium architecture for site, funnel and client ecosystem positioning',
      'Advanced growth plan, trust layer and commercial positioning',
      'High-priority execution for expansions, refinements and strategic coordination'
    ],
    monthly: [
      'Family entry: strategic access and ecosystem alignment',
      'Family + updates: continuous site, ecommerce and key-page improvements',
      'Family + promotion: updates plus managed monthly promotion support'
    ]
  },
  es: {
    base: [
      'Rediseno de paginas principales y limpieza del recorrido de conversion',
      'Optimizacion de CTA principal',
      'Mejoras de UX mobile y rendimiento'
    ],
    growth: [
      'Funnel completo y arquitectura de paginas comerciales',
      'Refuerzo de confianza y pruebas de resultado',
      'SEO comercial en paginas clave'
    ],
    monthly: [
      'Optimizaciones CRO mensuales',
      'Actualizaciones de contenido y landings',
      'Soporte prioritario'
    ]
  },
  fr: {
    base: [
      'Refonte des pages principales et nettoyage du parcours de conversion',
      'Optimisation du CTA principal',
      'Ameliorations mobile UX et performance'
    ],
    growth: [
      'Tunnel complet et architecture de pages commerciales',
      'Renforcement de la confiance et des preuves',
      'SEO commercial sur les pages cles'
    ],
    monthly: [
      'Optimisations CRO mensuelles',
      'Mises a jour contenus et landing pages',
      'Support prioritaire'
    ]
  },
  de: {
    base: [
      'Redesign der Kernseiten und Bereinigung des Conversion-Pfads',
      'Optimierung des primaeren CTA',
      'Mobile UX und Performance Verbesserungen'
    ],
    growth: [
      'Vollstaendiger Funnel und kommerzielle Seitenarchitektur',
      'Staerkere Vertrauenselemente und Nachweise',
      'Kommerzielle SEO fuer Schluesselseiten'
    ],
    monthly: [
      'Monatliche CRO Optimierungen',
      'Content und Landingpage Updates',
      'Priorisierter Support'
    ]
  },
  pt: {
    base: [
      'Redesign das paginas principais e limpeza do caminho de conversao',
      'Otimizacao da CTA principal',
      'Melhorias de UX mobile e performance'
    ],
    growth: [
      'Funil completo e arquitetura de paginas comerciais',
      'Reforco de confianca e prova social',
      'SEO comercial nas paginas-chave'
    ],
    monthly: [
      'Otimizacoes CRO mensais',
      'Atualizacoes de conteudo e landing pages',
      'Suporte prioritario'
    ]
  },
  ja: {
    base: [
      '主要ページの再設計とコンバージョン導線の整理',
      '主要CTAの最適化',
      'モバイルUXと表示速度の改善'
    ],
    growth: [
      '完全な導線設計と商用ページ構成',
      '信頼要素と実績訴求の強化',
      '主要ページの商用SEO最適化'
    ],
    monthly: [
      '月次CRO改善',
      'コンテンツとランディング更新',
      '優先サポート'
    ]
  },
  ar: {
    base: [
      'اعادة تصميم الصفحات الرئيسية وتنظيف مسار التحويل',
      'تحسين الدعوة الرئيسية للاجراء',
      'تحسين تجربة الجوال والسرعة'
    ],
    growth: [
      'بناء funnel كامل وهيكل صفحات تجارية',
      'تعزيز الثقة واثبات النتائج',
      'SEO تجاري للصفحات الرئيسية'
    ],
    monthly: [
      'تحسينات CRO شهرية',
      'تحديثات المحتوى والصفحات',
      'دعم باولوية'
    ]
  },
  zh: {
    base: [
      '核心页面重构与转化路径梳理',
      '主要CTA优化',
      '移动端体验与性能提升'
    ],
    growth: [
      '完整转化漏斗与商业页面架构',
      '强化信任与成果证明模块',
      '重点页面商业SEO优化'
    ],
    monthly: [
      '月度CRO优化',
      '内容与落地页更新',
      '优先支持'
    ]
  },
  hi: {
    base: [
      'Core pages redesign aur conversion path cleanup',
      'Primary CTA optimization',
      'Mobile UX aur performance improvements'
    ],
    growth: [
      'Full funnel aur commercial page architecture',
      'Trust aur proof layer strengthening',
      'Key pages par commercial SEO'
    ],
    monthly: [
      'Monthly CRO improvements',
      'Content aur landing page updates',
      'Priority support'
    ]
  }
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureList(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split('|')
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }
  return [];
}

function resolveDeliverableList(value, fallback) {
  const list = ensureList(value);
  return list.length ? list : fallback;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function inferLocale(input, localeRules) {
  const countryRule = localeRules.countries[normalize(input.country)] || {};
  return {
    language: input.language || input.preferred_language || input.current_quote_language || countryRule.language || localeRules.default_language,
    currency: input.currency || countryRule.currency || localeRules.default_currency
  };
}

function formatMoney(amount, currency, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function getLocaleTag(language) {
  const map = {
    it: 'it-IT',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-PT',
    ja: 'ja-JP',
    ar: 'ar-SA',
    zh: 'zh-CN',
    hi: 'hi-IN'
  };
  return map[language] || 'en-US';
}

function convertFromEUR(value, currency, fxRates) {
  if (currency === 'EUR') return value;
  const rate = fxRates.rates?.[currency] || fallbackFxRates[currency];
  if (!rate) return value;
  return value * rate;
}

function resolveGrowthPriceLabel(input, currency, fxRates, localeTag) {
  if (input.recommended_package_price) return input.recommended_package_price;
  return formatMoney(convertFromEUR(packageBaselineEUR.growth, currency, fxRates), currency, localeTag);
}

function bulletList(items) {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n');
}

function numberedList(items) {
  return items.filter(Boolean).map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function resolveCopy(language) {
  const copy = { ...languageCopy.en, ...(languageCopy[language] || {}) };
  if (/growth/i.test(copy.growthLabel || '')) {
    copy.growthLabel = language === 'it' ? 'Pacchetto Standard (consigliato)' : language === 'en' ? 'Standard Package (recommended)' : languageCopy.en.growthLabel;
  }
  if (
    /monthly|mensile|mensual|monat|ongoing|gestion/i.test(copy.monthlyLabel || '') &&
    !/ecosystem|ecosistema/i.test(copy.monthlyLabel || '')
  ) {
    copy.monthlyLabel = language === 'it' ? 'Layer ecosistema mensili' : languageCopy.en.monthlyLabel;
  }
  copy.premiumLabel = copy.premiumLabel || (language === 'it' ? 'Pacchetto Premium' : languageCopy.en.premiumLabel);
  copy.familyEntryLabel = copy.familyEntryLabel || (language === 'it' ? 'Ingresso famiglia' : languageCopy.en.familyEntryLabel);
  copy.familyUpdatesLabel = copy.familyUpdatesLabel || (language === 'it' ? 'Famiglia + aggiornamenti continui' : languageCopy.en.familyUpdatesLabel);
  copy.familyPromotionLabel = copy.familyPromotionLabel || (language === 'it' ? 'Famiglia + aggiornamenti + promozione' : languageCopy.en.familyPromotionLabel);
  copy.recommendedBadge = copy.recommendedBadge || (language === 'it' ? 'Consigliato' : languageCopy.en.recommendedBadge);
  return copy;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlList(items, { ordered = false, textColor = '#2d3748' } = {}) {
  const tag = ordered ? 'ol' : 'ul';
  const rendered = items
    .filter(Boolean)
    .map((item) => `<li style="margin:0 0 10px 0;">${escapeHtml(item)}</li>`)
    .join('');
  return `<${tag} style="margin:0;padding-left:20px;font-size:16px;line-height:1.75;color:${textColor};">${rendered}</${tag}>`;
}

function buildPublicReferencesHtml(language) {
  const labels = {
    it: ['Riferimenti verificabili', 'Profilo studio', 'Case studies', 'Instagram', 'TikTok', 'YouTube', 'Condizioni commerciali', 'Identità pubblica, lavori, presenza social e termini commerciali accessibili prima di qualsiasi conferma.'],
    en: ['Verifiable references', 'Studio profile', 'Case studies', 'Instagram', 'TikTok', 'YouTube', 'Commercial terms', 'Public identity, delivery proof, social presence and commercial terms available before any commitment.'],
    es: ['Referencias verificables', 'Perfil del estudio', 'Case studies', 'Instagram', 'TikTok', 'YouTube', 'Condiciones comerciales', 'Identidad pública, trabajos, presencia social y condiciones comerciales visibles antes de cualquier confirmación.'],
    fr: ['Références vérifiables', 'Profil du studio', 'Case studies', 'Instagram', 'TikTok', 'YouTube', 'Conditions commerciales', 'Identité publique, preuves de livraison, présence sociale et conditions commerciales visibles avant tout engagement.'],
    de: ['Verifizierbare Referenzen', 'Studio-Profil', 'Case studies', 'Instagram', 'TikTok', 'YouTube', 'Geschäftsbedingungen', 'Öffentliche Identität, Arbeitsnachweise, Social-Präsenz und Geschäftsbedingungen vor jeder Zusage sichtbar.'],
    pt: ['Referências verificáveis', 'Perfil do estúdio', 'Case studies', 'Instagram', 'TikTok', 'YouTube', 'Condições comerciais', 'Identidade pública, provas de execução, presença social e condições comerciais visíveis antes de qualquer confirmação.']
  };
  const [title, studioLabel, casesLabel, instagramLabel, tiktokLabel, youtubeLabel, termsLabel, note] = labels[language] || labels.en;
  return `
    <div style="padding:22px 24px;background:#f8f5ef;border:1px solid #ece3d8;border-radius:20px;">
      <div style="font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#b4742f;padding-bottom:10px;">${escapeHtml(title)}</div>
      <p style="margin:0 0 14px 0;font:15px/1.7 Arial,sans-serif;color:#334155;">${escapeHtml(note)}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${escapeHtml(CANTONI_STUDIO_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e8dfd2;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">${escapeHtml(studioLabel)}</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${escapeHtml(CANTONI_CASE_STUDIES_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e8dfd2;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">${escapeHtml(casesLabel)}</a></td>
        </tr>
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${escapeHtml(CANTONI_INSTAGRAM_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e8dfd2;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">${escapeHtml(instagramLabel)}</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${escapeHtml(CANTONI_TIKTOK_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e8dfd2;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">${escapeHtml(tiktokLabel)}</a></td>
        </tr>
        <tr>
          <td width="50%" style="padding-right:6px;"><a href="${escapeHtml(CANTONI_YOUTUBE_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e8dfd2;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">${escapeHtml(youtubeLabel)}</a></td>
          <td width="50%" style="padding-left:6px;"><a href="${escapeHtml(CANTONI_TERMS_URL)}" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e8dfd2;border-radius:14px;color:#1c345d;font:14px/1.4 Arial,sans-serif;font-weight:700;text-decoration:none;">${escapeHtml(termsLabel)}</a></td>
        </tr>
      </table>
      <p style="margin:14px 0 0 0;font:14px/1.7 Arial,sans-serif;color:#526074;">Sede operativa in Italia. Struttura pensata per clienti premium che cercano credibilità, conversione, continuità ed ecosistema in crescita.</p>
    </div>`;
}

function buildDocumentCard({ label, title, lines = [], dark = false, titleSize = 22 }) {
  const bg = dark ? '#111c33' : '#ffffff';
  const border = dark ? '#111c33' : '#e2e8f0';
  const labelColor = dark ? '#f7c87e' : '#94a3b8';
  const titleColor = dark ? '#ffffff' : '#0f172a';
  const bodyColor = dark ? '#dbe4f0' : '#526074';
  const renderedLines = lines
    .filter(Boolean)
    .map((line) => `<div style="font-size:14px;line-height:1.65;color:${bodyColor};padding-top:6px;">${escapeHtml(line)}</div>`)
    .join('');

  return `
    <div style="padding:18px 18px;background:${bg};border:1px solid ${border};border-radius:18px;min-height:138px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:${labelColor};font-weight:800;padding-bottom:10px;">${escapeHtml(label)}</div>
      <div style="font-size:${titleSize}px;font-weight:800;line-height:1.2;color:${titleColor};">${escapeHtml(title)}</div>
      ${renderedLines}
    </div>`;
}

function buildOfferTableRows(rows, copy) {
  const items = rows
    .map((row, index) => {
      const border = index === 0 ? '' : 'border-top:1px solid #e2e8f0;';
      const accent = row.accent ? 'color:#c76b2a;font-weight:700;' : 'color:#0f172a;';
      const note = row.note
        ? `<div style="font-size:13px;line-height:1.55;color:#64748b;padding-top:4px;">${escapeHtml(row.note)}</div>`
        : '';
      return `<tr>
        <td style="padding:16px 0;${border}">
          <div style="font-size:16px;line-height:1.45;${accent}">${escapeHtml(row.label)}</div>
          ${note}
        </td>
        <td style="padding:16px 8px 16px 0;text-align:center;font-size:15px;color:#475569;${border}">${escapeHtml(row.qty)}</td>
        <td style="padding:16px 0;text-align:right;font-size:16px;font-weight:800;color:#0f172a;${border}">${escapeHtml(row.amount)}</td>
      </tr>`;
    })
    .join('');

  return `
    <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:18px;">${escapeHtml(copy.serviceTableTitle)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-bottom:14px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(copy.serviceColumnLabel)}</td>
          <td style="padding-bottom:14px;text-align:center;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(copy.quantityLabel)}</td>
          <td style="padding-bottom:14px;text-align:right;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(copy.amountLabel)}</td>
        </tr>
        ${items}
      </table>
    </div>`;
}

function buildEconomicSummary({
  copy,
  selectedPrice,
  selectedLabel,
  basePrice,
  growthPrice,
  premiumPrice,
  familyEntryPrice,
  familyUpdatesPrice,
  familyPromotionPrice,
  timeline
}) {
  return `
    <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:22px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:18px;">${escapeHtml(copy.recommendedSummaryLabel)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td valign="top" width="36%" style="padding-right:14px;">
            <div style="padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;">
              <div style="font-size:38px;line-height:1.05;font-weight:800;color:#0f172a;">${escapeHtml(selectedPrice)}</div>
              <div style="font-size:13px;line-height:1.6;color:#64748b;padding-top:8px;">${escapeHtml(copy.recommendedAmountLabel)}</div>
              <div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0;">
                <div style="font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(copy.proposalReferenceLabel)}</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;padding-top:6px;">${escapeHtml(selectedLabel)}</div>
              </div>
            </div>
          </td>
          <td valign="top" width="64%" style="padding-left:14px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 14px 0;font-size:15px;color:#526074;">${escapeHtml(copy.baseLabel)}</td>
                <td style="padding:0 0 14px 0;text-align:right;font-size:15px;color:#526074;">${escapeHtml(basePrice)}</td>
              </tr>
              <tr>
                <td style="padding:0 0 14px 0;font-size:15px;color:#c76b2a;font-weight:700;">${escapeHtml(copy.growthLabel)}</td>
                <td style="padding:0 0 14px 0;text-align:right;font-size:15px;color:#c76b2a;font-weight:700;">${escapeHtml(growthPrice)}</td>
              </tr>
              <tr>
                <td style="padding:0 0 14px 0;font-size:15px;color:#526074;">${escapeHtml(copy.premiumLabel)}</td>
                <td style="padding:0 0 14px 0;text-align:right;font-size:15px;color:#526074;">${escapeHtml(premiumPrice)}</td>
              </tr>
              <tr>
                <td style="padding:0 0 14px 0;font-size:15px;color:#526074;">${escapeHtml(copy.monthlyOptionLabel)}</td>
                <td style="padding:0 0 14px 0;text-align:right;font-size:15px;color:#526074;">${escapeHtml(`${familyEntryPrice} / ${familyUpdatesPrice} / ${familyPromotionPrice}`)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0 0 0;font-size:15px;color:#0f172a;font-weight:700;border-top:1px solid #d8e1ec;">${escapeHtml(copy.commercialModelLabel)}</td>
                <td style="padding:8px 0 0 0;text-align:right;font-size:15px;color:#0f172a;font-weight:700;border-top:1px solid #d8e1ec;">${escapeHtml(copy.paymentValue)}</td>
              </tr>
              <tr>
                <td style="padding:14px 0 0 0;font-size:14px;color:#64748b;">${escapeHtml(copy.timeline)}</td>
                <td style="padding:14px 0 0 0;text-align:right;font-size:14px;color:#64748b;">${escapeHtml(timeline)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0 0 0;font-size:14px;color:#64748b;">${escapeHtml(copy.nextStepLabel)}</td>
                <td style="padding:6px 0 0 0;text-align:right;font-size:14px;color:#64748b;">${escapeHtml(copy.nextStepValue)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`;
}

function buildEmailSubject(input, language) {
  const company = input.business_name || input.company || 'Client';
  const subjects = {
    it: `${company}: proposta commerciale e preventivo personalizzato`,
    en: `${company}: tailored commercial proposal`,
    es: `${company}: propuesta comercial personalizada`,
    fr: `${company} : proposition commerciale personnalisée`,
    de: `${company}: individuelles kommerzielles Angebot`,
    pt: `${company}: proposta comercial personalizada`
  };
  return subjects[language] || subjects.en;
}

function buildPackageSection(copy, input, language, currency, fxRates, localeTag) {
  const defaults = defaultDeliverables[language] || defaultDeliverables.en;
  const basePrice = formatMoney(convertFromEUR(packageBaselineEUR.base, currency, fxRates), currency, localeTag);
  const growthPrice = resolveGrowthPriceLabel(input, currency, fxRates, localeTag);
  const premiumPrice = formatMoney(convertFromEUR(packageBaselineEUR.premium, currency, fxRates), currency, localeTag);
  const familyEntryPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyEntry, currency, fxRates), currency, localeTag);
  const familyUpdatesPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyUpdates, currency, fxRates), currency, localeTag);
  const familyPromotionPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyPromotion, currency, fxRates), currency, localeTag);
  const baseDeliverables = resolveDeliverableList(input.base_deliverables, [
    input.base_scope || defaults.base?.[0] || defaultDeliverables.en.base[0],
    defaults.base?.[1] || defaultDeliverables.en.base[1],
    defaults.base?.[2] || defaultDeliverables.en.base[2]
  ]);
  const growthDeliverables = resolveDeliverableList(input.growth_deliverables, [
    input.growth_scope || defaults.growth?.[0] || defaultDeliverables.en.growth[0],
    defaults.growth?.[1] || defaultDeliverables.en.growth[1],
    defaults.growth?.[2] || defaultDeliverables.en.growth[2]
  ]);
  const premiumDeliverables = resolveDeliverableList(input.premium_deliverables, defaults.premium || defaultDeliverables.en.premium);
  const monthlyDeliverables = resolveDeliverableList(input.monthly_deliverables, defaults.monthly || defaultDeliverables.en.monthly);

  return [
    `### ${copy.baseLabel} — ${basePrice}`,
    bulletList(baseDeliverables),
    '',
    `### ${copy.growthLabel} — ${growthPrice}`,
    bulletList(growthDeliverables),
    '',
    `### ${copy.premiumLabel} — ${premiumPrice}`,
    bulletList(premiumDeliverables),
    '',
    `### ${copy.monthlyLabel} — ${familyEntryPrice} / ${familyUpdatesPrice} / ${familyPromotionPrice}`,
    bulletList(monthlyDeliverables)
  ].join('\n');
}

function buildQuoteDocument(input, localeRules, fxRates) {
  const locale = inferLocale(input, localeRules);
  const copy = resolveCopy(locale.language);
  const localeTag = getLocaleTag(locale.language);
  const now = new Date().toISOString().slice(0, 10);
  const issues = ensureList(input.issues);
  const solutions = ensureList(input.solutions);
  const impact = ensureList(input.business_impact);

  const company = input.business_name || input.company || 'Client';
  const website = input.website || 'No website detected / online presence analyzed';
  const contact = input.contact_name || input.contact || '';
  const market = resolveMarketSummary(input);
  const references = buildPublicReferences(locale.language);

  return `# Cantoni Digital Studio
## ${copy.quoteTitle}

- Date: ${now}
- Client: ${company}${contact ? ` (${contact})` : ''}
- Website analyzed: ${website}
- Market: ${market || 'N/A'}
- Language: ${locale.language.toUpperCase()}
- Currency: ${locale.currency}

## ${copy.summaryTitle}
${input.project_summary || ''}

## ${copy.issuesTitle}
${numberedList(issues)}

## ${copy.proposalTitle}
${bulletList(solutions)}

## ${copy.impactTitle}
${copy.impactLead}
${bulletList(impact)}

## ${copy.packagesTitle}
${buildPackageSection(copy, input, locale.language, locale.currency, fxRates, localeTag)}

## ${copy.termsTitle}
- ${copy.revisions}: ${copy.revisionsValue}
- ${copy.timeline}: ${input.timeline || '3-5 settimane'}
- ${copy.payment}: ${copy.paymentValue}
- ${copy.excluded}: ${copy.exclusions.join(', ')}

${copy.footerCta}

${references}

Cantoni Digital Studio
cantonidigitalstudio@gmail.com`;
}

function buildEmailBody(input, localeRules, fxRates) {
  const locale = inferLocale(input, localeRules);
  const copy = resolveCopy(locale.language);
  const localeTag = getLocaleTag(locale.language);
  const basePrice = formatMoney(convertFromEUR(packageBaselineEUR.base, locale.currency, fxRates), locale.currency, localeTag);
  const growthPrice = resolveGrowthPriceLabel(input, locale.currency, fxRates, localeTag);
  const premiumPrice = formatMoney(convertFromEUR(packageBaselineEUR.premium, locale.currency, fxRates), locale.currency, localeTag);
  const familyEntryPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyEntry, locale.currency, fxRates), locale.currency, localeTag);
  const familyUpdatesPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyUpdates, locale.currency, fxRates), locale.currency, localeTag);
  const familyPromotionPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyPromotion, locale.currency, fxRates), locale.currency, localeTag);
  const paymentTerms = copy.paymentValue;
  const timeline = input.timeline || '3-5 settimane';

  const openers = {
    it: `Buongiorno ${input.contact_name || input.business_name},`,
    en: `Hello ${input.contact_name || input.business_name},`,
    es: `Hola ${input.contact_name || input.business_name},`,
    fr: `Bonjour ${input.contact_name || input.business_name},`,
    de: `Hallo ${input.contact_name || input.business_name},`,
    pt: `Ola ${input.contact_name || input.business_name},`,
    ja: `${input.contact_name || input.business_name} 様`,
    ar: `مرحبا ${input.contact_name || input.business_name}،`,
    zh: `${input.contact_name || input.business_name} 您好，`,
    hi: `Hi ${input.contact_name || input.business_name},`
  };

  const packageIntro = {
    it: 'Pacchetti proposti:',
    en: 'Proposed packages:',
    es: 'Paquetes propuestos:',
    fr: 'Packs proposes :',
    de: 'Vorgeschlagene Pakete:',
    pt: 'Pacotes propostos:',
    ja: 'ご提案プラン:',
    ar: 'الباقات المقترحة:',
    zh: '建议方案：',
    hi: 'Proposed packages:'
  };

  const decisionClose = {
    it: [
      'Questa email contiene già la proposta completa per permettervi di decidere con chiarezza.',
      `Condizioni: ${paymentTerms}.`,
      `Tempistiche: ${timeline}.`,
      'Resto in attesa di un vostro riscontro. Se desiderate procedere, vi chiedo di rispondere indicando il pacchetto scelto.',
      'Cordiali saluti,',
      'Cantoni Digital Studio'
    ],
    en: [
      'This email already contains the full proposal you need to make a decision clearly.',
      `Terms: ${paymentTerms}.`,
      `Timeline: ${timeline}.`,
      'I remain available for your feedback. If you want to move forward, reply with the package you want.',
      'Best regards,',
      'Cantoni Digital Studio'
    ]
  };

  const closeBlock = decisionClose[locale.language] || decisionClose.en;
  const references = buildPublicReferences(locale.language).split('\n');

  return [
    openers[locale.language] || openers.en,
    '',
    input.email_opening,
    '',
    numberedList(ensureList(input.issues)),
    '',
    bulletList(ensureList(input.solutions)),
    '',
    packageIntro[locale.language] || packageIntro.en,
    `- ${copy.baseLabel}: ${basePrice}`,
    `- ${copy.growthLabel}: ${growthPrice}`,
    `- ${copy.premiumLabel}: ${premiumPrice}`,
    `- ${copy.familyEntryLabel}: ${familyEntryPrice}`,
    `- ${copy.familyUpdatesLabel}: ${familyUpdatesPrice}`,
    `- ${copy.familyPromotionLabel}: ${familyPromotionPrice}`,
    '',
    `${copy.growthLabel}: ${growthPrice}`,
    bulletList(ensureList(input.business_impact)),
    '',
    ...closeBlock,
    '',
    ...references,
    '',
    locale.language === 'it' ? 'cantonidigitalstudio@gmail.com' : 'Cantoni Digital Studio',
    locale.language === 'it' ? '' : 'cantonidigitalstudio@gmail.com'
  ].join('\n');
}

function buildEmailHtmlBody(input, localeRules, fxRates, options = {}) {
  const locale = inferLocale(input, localeRules);
  const copy = resolveCopy(locale.language);
  const localeTag = getLocaleTag(locale.language);
  const company = input.business_name || input.company || 'Client';
  const contact = input.contact_name || input.contact || company;
  const market = resolveMarketSummary(input) || input.service_area_summary || input.market_scope_summary || 'N/A';
  const marketCard = normalizeText([input.city, input.country].filter(Boolean).join(', ')) || market;
  const website = input.website || '';
  const websiteLabel = website ? String(website).replace(/^https?:\/\//, '').replace(/\/$/, '') : company;
  const basePrice = formatMoney(convertFromEUR(packageBaselineEUR.base, locale.currency, fxRates), locale.currency, localeTag);
  const growthPrice = resolveGrowthPriceLabel(input, locale.currency, fxRates, localeTag);
  const premiumPrice = formatMoney(convertFromEUR(packageBaselineEUR.premium, locale.currency, fxRates), locale.currency, localeTag);
  const familyEntryPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyEntry, locale.currency, fxRates), locale.currency, localeTag);
  const familyUpdatesPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyUpdates, locale.currency, fxRates), locale.currency, localeTag);
  const familyPromotionPrice = formatMoney(convertFromEUR(packageBaselineEUR.familyPromotion, locale.currency, fxRates), locale.currency, localeTag);
  const issues = ensureList(input.issues);
  const solutions = ensureList(input.solutions);
  const impact = ensureList(input.business_impact);
  const logoSrc = options.logoSrc || logoPath;
  const issuedLabel = new Date().toLocaleDateString(localeTag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const proposalReference = normalizeText(input.source_lead_id || websiteLabel || company);
  const baseDeliverables = resolveDeliverableList(input.base_deliverables, [
    input.base_scope || (defaultDeliverables[locale.language] || defaultDeliverables.en).base?.[0] || defaultDeliverables.en.base[0],
    (defaultDeliverables[locale.language] || defaultDeliverables.en).base?.[1] || defaultDeliverables.en.base[1],
    (defaultDeliverables[locale.language] || defaultDeliverables.en).base?.[2] || defaultDeliverables.en.base[2]
  ]);
  const growthDeliverables = resolveDeliverableList(input.growth_deliverables, [
    input.growth_scope || (defaultDeliverables[locale.language] || defaultDeliverables.en).growth?.[0] || defaultDeliverables.en.growth[0],
    (defaultDeliverables[locale.language] || defaultDeliverables.en).growth?.[1] || defaultDeliverables.en.growth[1],
    (defaultDeliverables[locale.language] || defaultDeliverables.en).growth?.[2] || defaultDeliverables.en.growth[2]
  ]);
  const premiumDeliverables = resolveDeliverableList(input.premium_deliverables, (defaultDeliverables[locale.language] || defaultDeliverables.en).premium || defaultDeliverables.en.premium);
  const monthlyDeliverables = resolveDeliverableList(input.monthly_deliverables, (defaultDeliverables[locale.language] || defaultDeliverables.en).monthly || defaultDeliverables.en.monthly);
  const summaryRows = [
    {
      label: copy.baseLabel,
      qty: '1',
      amount: basePrice,
      note: baseDeliverables.slice(0, 1).join(' ')
    },
    {
      label: copy.growthLabel,
      qty: '1',
      amount: growthPrice,
      note: growthDeliverables.slice(0, 1).join(' '),
      accent: true
    },
    {
      label: copy.premiumLabel,
      qty: '1',
      amount: premiumPrice,
      note: premiumDeliverables.slice(0, 1).join(' ')
    },
    {
      label: copy.monthlyLabel,
      qty: '1/m',
      amount: `${familyEntryPrice} / ${familyUpdatesPrice} / ${familyPromotionPrice}`,
      note: monthlyDeliverables.slice(0, 1).join(' ')
    }
  ];
  const greeting = {
    it: `Buongiorno ${contact},`,
    en: `Hello ${contact},`,
    es: `Hola ${contact},`,
    fr: `Bonjour ${contact},`,
    de: `Hallo ${contact},`,
    pt: `Ola ${contact},`
  }[locale.language] || `Hello ${contact},`;

  return `<!doctype html>
<html lang="${escapeHtml(locale.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(buildEmailSubject(input, locale.language))}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#1d2433;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:880px;background:#f8fafc;border:1px solid #dbe4ee;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:30px 34px 24px 34px;background:#111c33;border-bottom:1px solid #1f2b45;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" width="110" style="padding-right:18px;">
                    <div style="width:92px;height:92px;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);padding:10px;">
                      <img src="${escapeHtml(logoSrc)}" alt="Cantoni Digital Studio" style="display:block;width:72px;height:72px;border-radius:14px;">
                    </div>
                  </td>
                  <td valign="top" style="padding-left:18px;border-left:2px solid #f5c551;">
                    <div style="font-size:16px;font-weight:800;letter-spacing:.02em;color:#f5c551;">CANTONI DIGITAL STUDIO</div>
                    <div style="font-size:10.5px;font-weight:700;letter-spacing:.04em;color:#d8e1ec;padding-top:8px;">${escapeHtml(copy.documentMeta)} · ${escapeHtml(issuedLabel)} · ${escapeHtml(websiteLabel)}</div>
                    <div style="font-size:34px;line-height:1.12;font-weight:800;color:#ffffff;padding-top:12px;">${escapeHtml(buildEmailSubject(input, locale.language))}</div>
                    <div style="font-size:16px;line-height:1.65;color:#d8e1ec;max-width:600px;padding-top:10px;">${escapeHtml(`Analisi costruita sul sito live ${websiteLabel}. Il focus non è un restyling generico: serve aumentare chiarezza commerciale, qualità del contatto e conversione reale.`)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 34px 6px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 14px;">
                <tr>
                  <td width="33.33%" valign="top" style="padding-right:9px;">${buildDocumentCard({
                    label: copy.studioCardLabel,
                    title: 'Cantoni Digital Studio',
                    lines: [
                      `${copy.operatingBaseLabel}: Italia`,
                      `Website: ${CANTONI_SITE_URL}`,
                      'Premium redesign, funnel e CRO'
                    ],
                    titleSize: 19
                  })}</td>
                  <td width="33.33%" valign="top" style="padding:0 5px;">${buildDocumentCard({
                    label: copy.recipientCardLabel,
                    title: company,
                    lines: [contact, marketCard, websiteLabel],
                    titleSize: 20
                  })}</td>
                  <td width="33.33%" valign="top" style="padding-left:9px;">${buildDocumentCard({
                    label: copy.referenceCardLabel,
                    title: proposalReference,
                    lines: [
                      `${copy.issuedOn}: ${issuedLabel}`,
                      `${copy.currencyLabel}: ${locale.currency.toUpperCase()}`,
                      `${copy.commercialModelLabel}: ${copy.paymentValue}`
                    ],
                    dark: true,
                    titleSize: 18
                  })}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
                <div style="font-size:16px;line-height:1.78;color:#2d3748;white-space:pre-line;">${escapeHtml(greeting + '\n\n' + input.email_opening)}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" width="50%" style="padding-right:10px;">
                    <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;height:100%;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">${escapeHtml(copy.issuesTitle)}</div>
                      ${buildHtmlList(issues, { ordered: true })}
                    </div>
                  </td>
                  <td valign="top" width="50%" style="padding-left:10px;">
                    <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;height:100%;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">${escapeHtml(copy.proposalTitle)}</div>
                      ${buildHtmlList(solutions)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              <div style="padding:24px;background:#111c33;border-radius:20px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#f5c551;padding-bottom:10px;">${escapeHtml(copy.impactTitle)}</div>
                ${buildHtmlList(impact, { textColor: '#d6dde7' })}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              ${buildOfferTableRows(summaryRows, copy)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              ${buildEconomicSummary({
                copy,
                selectedPrice: growthPrice,
                selectedLabel: copy.growthLabel,
                basePrice,
                growthPrice,
                premiumPrice,
                familyEntryPrice,
                familyUpdatesPrice,
                familyPromotionPrice,
                timeline: input.timeline || '3-5 settimane'
              })}
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:16px;">${escapeHtml(copy.packagesTitle)}</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
                  <tr>
                    <td valign="top" style="padding:18px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
                      <div style="font-size:22px;font-weight:800;color:#0f172a;">${escapeHtml(copy.baseLabel)}</div>
                      <div style="font-size:24px;font-weight:800;color:#c76b2a;padding:4px 0 12px 0;">${escapeHtml(basePrice)}</div>
                      <div style="font-size:15px;line-height:1.7;color:#334155;white-space:pre-line;">${escapeHtml(baseDeliverables.join('\n'))}</div>
                    </td>
                    <td width="14"></td>
                    <td valign="top" style="padding:18px;border:2px solid #f5c551;border-radius:18px;background:#fff7ef;box-shadow:0 8px 20px rgba(245,197,81,.12);">
                      <div style="font-size:12px;font-weight:800;color:#b4742f;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(copy.recommendedBadge)}</div>
                      <div style="font-size:22px;font-weight:800;color:#0f172a;padding-top:6px;">${escapeHtml(copy.growthLabel)}</div>
                      <div style="font-size:24px;font-weight:800;color:#c76b2a;padding:4px 0 12px 0;">${escapeHtml(growthPrice)}</div>
                      <div style="font-size:15px;line-height:1.7;color:#334155;white-space:pre-line;">${escapeHtml(growthDeliverables.join('\n'))}</div>
                    </td>
                    <td width="14"></td>
                    <td valign="top" style="padding:18px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;">
                      <div style="font-size:22px;font-weight:800;color:#0f172a;">${escapeHtml(copy.premiumLabel)}</div>
                      <div style="font-size:24px;font-weight:800;color:#c76b2a;padding:4px 0 12px 0;">${escapeHtml(premiumPrice)}</div>
                      <div style="font-size:15px;line-height:1.7;color:#334155;white-space:pre-line;">${escapeHtml(premiumDeliverables.join('\n'))}</div>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:14px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;">
                  <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">${escapeHtml(copy.monthlyLabel)}</div>
                  <div style="font-size:15px;line-height:1.8;color:#334155;">
                    <strong>${escapeHtml(copy.familyEntryLabel)}:</strong> ${escapeHtml(familyEntryPrice)}<br>
                    <strong>${escapeHtml(copy.familyUpdatesLabel)}:</strong> ${escapeHtml(familyUpdatesPrice)}<br>
                    <strong>${escapeHtml(copy.familyPromotionLabel)}:</strong> ${escapeHtml(familyPromotionPrice)}
                  </div>
                  <div style="font-size:14px;line-height:1.7;color:#526074;padding-top:12px;white-space:pre-line;">${escapeHtml(monthlyDeliverables.join('\n'))}</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="top" width="52%" style="padding-right:10px;">
                    <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;height:100%;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:12px;">${escapeHtml(copy.timeline)}</div>
                      <div style="font-size:15px;line-height:1.75;color:#334155;">${escapeHtml(input.timeline || '3-5 settimane')}</div>
                    </div>
                  </td>
                  <td valign="top" width="48%" style="padding-left:10px;">
                    <div style="padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;height:100%;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:12px;">${escapeHtml(copy.termsTitle)}</div>
                      <div style="font-size:15px;line-height:1.75;color:#334155;">
                        <strong>${escapeHtml(copy.payment)}:</strong> ${escapeHtml(copy.paymentValue)}<br>
                        <strong>${escapeHtml(copy.revisions)}:</strong> ${escapeHtml(copy.revisionsValue)}<br>
                        <strong>${escapeHtml(copy.excluded)}:</strong> ${escapeHtml(copy.exclusions.join(', '))}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 18px 34px;">
              ${buildPublicReferencesHtml(locale.language)}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 34px 34px 34px;">
              <div style="padding:22px 24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" width="58%" style="padding-right:10px;">
                      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding-bottom:10px;">Cantoni Digital Studio</div>
                      <div style="font-size:15px;line-height:1.75;color:#334155;">${escapeHtml(copy.footerCta)}</div>
                    </td>
                    <td valign="top" width="42%" style="padding-left:10px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700;padding-bottom:8px;">Identità studio</div>
                      <div style="font-size:14px;line-height:1.7;color:#526074;">${escapeHtml(copy.operatingBaseLabel)}: Italia<br><a href="${escapeHtml(CANTONI_SITE_URL)}" style="color:#1c345d;text-decoration:none;font-weight:700;">${escapeHtml(CANTONI_SITE_URL)}</a><br><a href="mailto:cantonidigitalstudio@gmail.com" style="color:#1c345d;text-decoration:none;font-weight:700;">cantonidigitalstudio@gmail.com</a></div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSingleSendPayload(input, localeRules, fxRates, email, emailHtml) {
  const locale = inferLocale(input, localeRules);
  const recipient = normalizeText(input.recipient_email || input.email || input.contact_email);
  if (!recipient) return null;
  const identifier = normalizeText(input.source_lead_id || input.business_name || 'client').replace(/[^a-zA-Z0-9_-]+/g, '-');
  return [
    {
      id: identifier,
      lead_id: identifier,
      to: recipient,
      subject: buildEmailSubject(input, locale.language),
      body: email,
      html_body: emailHtml,
      sender_name: 'Cantoni Digital Studio',
      reply_to: 'cantonidigitalstudio@gmail.com',
      status: 'pending'
    }
  ];
}

function buildPublicReferences(language) {
  const copy = {
    it: [
      'Riferimenti pubblici:',
      `- Profilo studio: ${CANTONI_STUDIO_URL}`,
      `- Case studies: ${CANTONI_CASE_STUDIES_URL}`,
      `- Instagram: ${CANTONI_INSTAGRAM_URL}`,
      `- TikTok: ${CANTONI_TIKTOK_URL}`,
      `- YouTube: ${CANTONI_YOUTUBE_URL}`,
      `- Condizioni commerciali: ${CANTONI_TERMS_URL}`
    ],
    en: [
      'Public references:',
      `- Studio profile: ${CANTONI_STUDIO_URL}`,
      `- Case studies: ${CANTONI_CASE_STUDIES_URL}`,
      `- Instagram: ${CANTONI_INSTAGRAM_URL}`,
      `- TikTok: ${CANTONI_TIKTOK_URL}`,
      `- YouTube: ${CANTONI_YOUTUBE_URL}`,
      `- Commercial terms: ${CANTONI_TERMS_URL}`
    ],
    es: [
      'Referencias públicas:',
      `- Perfil del estudio: ${CANTONI_STUDIO_URL}`,
      `- Case studies: ${CANTONI_CASE_STUDIES_URL}`,
      `- Instagram: ${CANTONI_INSTAGRAM_URL}`,
      `- TikTok: ${CANTONI_TIKTOK_URL}`,
      `- YouTube: ${CANTONI_YOUTUBE_URL}`,
      `- Condiciones comerciales: ${CANTONI_TERMS_URL}`
    ],
    fr: [
      'Références publiques :',
      `- Profil du studio : ${CANTONI_STUDIO_URL}`,
      `- Case studies : ${CANTONI_CASE_STUDIES_URL}`,
      `- Instagram : ${CANTONI_INSTAGRAM_URL}`,
      `- TikTok : ${CANTONI_TIKTOK_URL}`,
      `- YouTube : ${CANTONI_YOUTUBE_URL}`,
      `- Conditions commerciales : ${CANTONI_TERMS_URL}`
    ],
    de: [
      'Öffentliche Referenzen:',
      `- Studio-Profil: ${CANTONI_STUDIO_URL}`,
      `- Case studies: ${CANTONI_CASE_STUDIES_URL}`,
      `- Instagram: ${CANTONI_INSTAGRAM_URL}`,
      `- TikTok: ${CANTONI_TIKTOK_URL}`,
      `- YouTube: ${CANTONI_YOUTUBE_URL}`,
      `- Geschäftsbedingungen: ${CANTONI_TERMS_URL}`
    ],
    pt: [
      'Referências públicas:',
      `- Perfil do estúdio: ${CANTONI_STUDIO_URL}`,
      `- Case studies: ${CANTONI_CASE_STUDIES_URL}`,
      `- Instagram: ${CANTONI_INSTAGRAM_URL}`,
      `- TikTok: ${CANTONI_TIKTOK_URL}`,
      `- YouTube: ${CANTONI_YOUTUBE_URL}`,
      `- Condições comerciais: ${CANTONI_TERMS_URL}`
    ]
  };

  return (copy[language] || copy.en).join('\n');
}

function validateQuoteInput(input) {
  const issues = ensureList(input.issues);
  const solutions = ensureList(input.solutions);
  const impact = ensureList(input.business_impact);
  const auditEvidence = ensureList(input.audit_evidence);
  const errors = [];

  if (!normalizeText(input.business_name || input.company)) {
    errors.push('Missing business_name.');
  }

  if (!normalizeText(input.website) && !normalizeText(input.no_website_reason)) {
    errors.push('Missing website or no_website_reason.');
  }

  if (normalizeText(input.project_summary).length < 90) {
    errors.push('project_summary is too short. It must explain the business and the commercial objective.');
  }

  if (normalizeText(input.email_opening).length < 90) {
    errors.push('email_opening is too short. The email must feel bespoke and commercially grounded.');
  }

  if (issues.length < 3 || issues.some((item) => item.length < 35)) {
    errors.push('At least 3 specific issues are required, each concrete and detailed.');
  }

  if (solutions.length < 3 || solutions.some((item) => item.length < 25)) {
    errors.push('At least 3 specific solutions are required.');
  }

  if (impact.length < 2) {
    errors.push('At least 2 business impact bullets are required.');
  }

  if (auditEvidence.length < 3 || auditEvidence.some((item) => item.length < 25)) {
    errors.push('At least 3 audit_evidence items are required. Each must reference a real page/section or observed site behavior.');
  }

  if (normalizeText(input.pricing_rationale).length < 70) {
    errors.push('pricing_rationale is too short. Price must be justified by real scope and complexity.');
  }

  if (normalizeText(input.market_scope_summary).length < 15 && normalizeText(input.service_area_summary).length < 15) {
    errors.push('Missing market_scope_summary or service_area_summary.');
  }

  if (errors.length) {
    throw new Error(`Quote rigor gate failed:\\n- ${errors.join('\\n- ')}`);
  }
}

async function run() {
  const inputFile = getArgValue('--input');
  const outputDir = getArgValue('--output-dir') || path.resolve(salesKitDir, 'generated');

  if (!inputFile) {
    throw new Error('Use --input /absolute/or/relative/path/to/lead.json');
  }

  const input = await readJson(path.resolve(process.cwd(), inputFile));
  validateQuoteInput(input);
  const localeRules = await readJson(localeRulesPath);
  const fxRates = await readJson(fxRatesPath);
  const locale = inferLocale(input, localeRules);

  await fs.mkdir(outputDir, { recursive: true });

  const slug = normalize(input.business_name || input.company || 'client').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'client';
  const leadIdSuffix = normalize(input.source_lead_id || '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const marketSlug = normalize(input.country || locale.currency).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || locale.currency.toLowerCase();
  const baseName = [slug, marketSlug, leadIdSuffix].filter(Boolean).join('-');
  const quotePath = path.join(outputDir, `${baseName}-quote-${locale.language}.md`);
  const emailPath = path.join(outputDir, `${baseName}-email-${locale.language}.txt`);
  const emailHtmlPath = path.join(outputDir, `${baseName}-email-${locale.language}.html`);
  const queuePath = path.join(outputDir, `${baseName}-single-send.json`);

  const quote = buildQuoteDocument(input, localeRules, fxRates);
  const email = buildEmailBody(input, localeRules, fxRates);
  let previewLogoSrc = logoPath;
  try {
    const logoBase64 = await fs.readFile(logoPath, 'base64');
    previewLogoSrc = `data:image/png;base64,${logoBase64}`;
  } catch {}
  const emailHtml = buildEmailHtmlBody(input, localeRules, fxRates, { logoSrc: previewLogoSrc });
  const sendEmailHtml = buildEmailHtmlBody(input, localeRules, fxRates, { logoSrc: 'cid:cantoniLogo' });
  const singleSendPayload = buildSingleSendPayload(input, localeRules, fxRates, email, sendEmailHtml);

  await fs.writeFile(quotePath, quote, 'utf8');
  await fs.writeFile(emailPath, email, 'utf8');
  await fs.writeFile(emailHtmlPath, emailHtml, 'utf8');
  if (singleSendPayload) {
    await fs.writeFile(queuePath, JSON.stringify(singleSendPayload, null, 2), 'utf8');
  }

  console.log(JSON.stringify({
    ok: true,
    language: locale.language,
    currency: locale.currency,
    quote_path: quotePath,
    email_path: emailPath,
    email_html_path: emailHtmlPath,
    queue_path: singleSendPayload ? queuePath : null
  }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
