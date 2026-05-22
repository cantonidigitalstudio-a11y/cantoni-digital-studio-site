import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readLeadPipeline,
  resolveCurrency,
  resolveLanguage,
  splitAuditField
} from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = process.env.LEAD_PIPELINE_CSV
  ? path.resolve(process.env.LEAD_PIPELINE_CSV)
  : path.resolve(__dirname, '../lead_pipeline.csv');
const outFile = process.env.FOLLOWUP_QUEUE_FILE
  ? path.resolve(process.env.FOLLOWUP_QUEUE_FILE)
  : path.resolve(__dirname, '../queue/followup_d3_queue.json');
const targetDate = process.env.FOLLOWUP_TARGET_DATE || new Date().toISOString().slice(0, 10);

function followupTemplate(language, row) {
  const contact = row.contact_name || row.business_name || '';
  const website = row.website || row.business_name || '';
  const firstImprovement = normalizeLocalizedDynamicText(
    language,
    splitAuditField(row.top_3_improvements_proposed)[0] || ''
  );
  const impact = normalizeLocalizedDynamicText(
    language,
    splitAuditField(row.expected_business_impact_range)[0] || ''
  );
  const impactFragment = lowercaseSentenceFragment(language, impact);
  const templates = {
    it: {
      subject: `${row.business_name}: follow-up sulla proposta inviata`,
      lines: [
        `Buongiorno,`,
        '',
        `Vi scrivo per riprendere la proposta che avevo condiviso dopo aver analizzato ${website}.`,
        firstImprovement ? `Il primo intervento che considero ancora prioritario è questo: ${firstImprovement}.` : '',
        impactFragment ? `Il motivo è concreto: può tradursi in ${impactFragment}.` : '',
        'Se vi è utile, posso inviarvi una mini roadmap con priorità, tempi e prossimo passo operativo.',
        '',
        'Se volete riceverla, vi basta rispondere: OK.',
        '',
        'Cordiali saluti,',
        'Cantoni Digital Studio'
      ].filter(Boolean)
    },
    en: {
      subject: `${row.business_name}: follow-up on the proposal I sent`,
      lines: [
        `Good morning,`,
        '',
        `I am following up on the proposal I shared after reviewing ${website}.`,
        firstImprovement ? `The first improvement I would still prioritize is: ${firstImprovement}.` : '',
        impactFragment ? `The reason is concrete: it can translate into ${impactFragment}.` : '',
        'If useful, I can send a short roadmap with priorities, timing and the practical next step.',
        '',
        'If you would like to receive it, simply reply: OK.',
        '',
        'Kind regards,',
        'Cantoni Digital Studio'
      ].filter(Boolean)
    },
    es: {
      subject: `${row.business_name}: ¿te envío una mini hoja de ruta?`,
      lines: [
        `Hola ${contact || row.business_name},`,
        '',
        `te escribí hace unos días después de revisar ${website}.`,
        firstImprovement ? `La primera mejora que seguiría priorizando es esta: ${firstImprovement}.` : '',
        impactFragment ? `La razón es simple: esto puede traducirse en ${impactFragment}.` : '',
        'Si te sirve, te envío una mini hoja de ruta con prioridades, tiempos y siguiente paso práctico.',
        '',
        'Si la quieres, solo responde: OK'
      ].filter(Boolean)
    },
    fr: {
      subject: `${row.business_name} : je vous envoie la mini feuille de route ?`,
      lines: [
        `Bonjour ${contact || row.business_name},`,
        '',
        `je vous ai écrit il y a quelques jours après analyse de ${website}.`,
        firstImprovement ? `La priorité numéro un reste selon moi : ${firstImprovement}.` : '',
        impactFragment ? `Pourquoi ? Parce que cela peut se traduire par ${impactFragment}.` : '',
        'Si utile, je peux envoyer une mini feuille de route avec priorités, délais et prochaine étape concrète.',
        '',
        'Si vous la voulez, répondez simplement : OK'
      ].filter(Boolean)
    },
    pt: {
      subject: `${row.business_name}: posso enviar uma mini rota de ação?`,
      lines: [
        `Olá ${contact || row.business_name},`,
        '',
        `escrevi há alguns dias depois de analisar ${website}.`,
        firstImprovement ? `A primeira melhoria que eu ainda priorizaria é esta: ${firstImprovement}.` : '',
        impactFragment ? `O motivo é concreto: isso pode se traduzir em ${impactFragment}.` : '',
        'Se for útil, posso enviar uma mini rota de ação com prioridades, prazos e o próximo passo prático.',
        '',
        'Se quiser recebê-la, basta responder: OK'
      ].filter(Boolean)
    },
    de: {
      subject: `${row.business_name}: soll ich die Mini-Roadmap senden?`,
      lines: [
        `Hallo ${contact || row.business_name},`,
        '',
        `ich hatte vor ein paar Tagen wegen ${website} geschrieben.`,
        firstImprovement ? `Die erste Priorität wäre aus meiner Sicht weiterhin: ${firstImprovement}.` : '',
        impactFragment ? `Der Grund ist einfach: das kann direkt zu ${impactFragment} führen.` : '',
        'Wenn sinnvoll, sende ich eine kurze Roadmap mit Prioritäten, Timing und dem konkreten nächsten Schritt.',
        '',
        'Wenn Sie das wollen, antworten Sie einfach mit: OK'
      ].filter(Boolean)
    },
    ar: {
      subject: `${row.business_name}: هل ارسل لك خارطة طريق قصيرة؟`,
      lines: [
        `مرحبا ${contact || row.business_name}،`,
        '',
        `كتبت لك قبل عدة ايام بعد مراجعة ${website}.`,
        firstImprovement ? `اول تحسين ما زلت اراه اولوية هو: ${firstImprovement}.` : '',
        impact ? `والسبب بسيط: هذا قد ينعكس مباشرة على ${impact}.` : '',
        'اذا رغبت، ارسل لك خارطة طريق قصيرة مع الاولويات والمدة والخطوة العملية التالية.',
        '',
        'اذا تريدها فقط رد بكلمة: OK'
      ].filter(Boolean)
    },
    ja: {
      subject: `${row.business_name} 向けミニロードマップを送りますか`,
      lines: [
        `${contact || row.business_name} 様`,
        '',
        `${website} を確認してご連絡してから数日たちました。`,
        firstImprovement ? `今でも最優先で改善すべき点は ${firstImprovement} です。` : '',
        impact ? `理由は明確で、これは ${impact} につながる可能性があるからです。` : '',
        'ご希望であれば、優先順位・期間・次の実務ステップをまとめた短いロードマップを送れます。',
        '',
        '必要でしたら「OK」とだけ返信してください。'
      ].filter(Boolean)
    },
    hi: {
      subject: `${row.business_name}: kya main mini roadmap bheju?`,
      lines: [
        `Namaste ${contact || row.business_name},`,
        '',
        `maine kuch din pehle ${website} dekhkar likha tha.`,
        firstImprovement ? `Jo pehla improvement abhi bhi sabse important lagta hai woh hai: ${firstImprovement}.` : '',
        impact ? `Seedha reason yeh hai ki isse ${impact} mil sakta hai.` : '',
        'Agar useful ho, main short roadmap bhej sakta hoon with priorities, timeline aur practical next step.',
        '',
        'Agar chahiye to bas reply kijiye: OK'
      ].filter(Boolean)
    },
    zh: {
      subject: `${row.business_name}：要不要我发一份简短路线图`,
      lines: [
        `${contact || row.business_name} 您好，`,
        '',
        `几天前我在看完 ${website} 后给您发过邮件。`,
        firstImprovement ? `我现在仍然最优先建议处理的是：${firstImprovement}。` : '',
        impact ? `原因很直接，这有机会带来 ${impact}。` : '',
        '如果您愿意，我可以发一份简短路线图，写清优先级、周期和下一步执行建议。',
        '',
        '如果需要，直接回复：OK'
      ].filter(Boolean)
    }
  };

  return templates[language] || templates.en;
}

function normalizeLocalizedDynamicText(language, value) {
  let text = String(value || '').trim();

  if (language === 'es') {
    text = text
      .replace(/\bintencion\b/gi, 'intención')
      .replace(/\bmovil\b/gi, 'móvil')
      .replace(/\butiles\b/gi, 'útiles')
      .replace(/\baccion\b/gi, 'acción')
      .replace(/\bpeticion\b/gi, 'petición')
      .replace(/\bproximo\b/gi, 'próximo')
      .replace(/\bpractico\b/gi, 'práctico')
      .replace(/\bresenas\b/gi, 'reseñas')
      .replace(/\bMas\b/g, 'Más');
  }

  if (language === 'pt') {
    text = text
      .replace(/\bintencao\b/gi, 'intenção')
      .replace(/\bacao\b/gi, 'ação')
      .replace(/\butil\b/gi, 'útil')
      .replace(/\buteis\b/gi, 'úteis')
      .replace(/\bproximo\b/gi, 'próximo')
      .replace(/\bpratico\b/gi, 'prático')
      .replace(/\bdesde mobile\b/gi, 'pelo celular');
  }

  if (language === 'fr') {
    text = text
      .replace(/\bpriorite\b/gi, 'priorité')
      .replace(/\bevenement\b/gi, 'événement')
      .replace(/\bdelais\b/gi, 'délais')
      .replace(/\betape\b/gi, 'étape')
      .replace(/\bqualifiees\b/gi, 'qualifiées');
  }

  if (language === 'it') {
    text = text
      .replace(/\bpriorita\b/gi, 'priorità')
      .replace(/\bqualita\b/gi, 'qualità')
      .replace(/\bvisibilita\b/gi, 'visibilità')
      .replace(/\bL Essenziale\b/g, "L'Essenziale");
  }

  return text;
}

function lowercaseSentenceFragment(language, value) {
  const text = String(value || '').trim();
  if (!text) return '';

  return text.replace(/^([A-ZÀ-ÖØ-Þ])(?=[a-zà-öø-ÿ])/, (match) =>
    match.toLocaleLowerCase(language || undefined)
  );
}

function buildQueueItem(row) {
  const language = resolveLanguage(row);
  const currency = resolveCurrency(row);
  const copy = followupTemplate(language, row);

  return {
    id: `${row.lead_id}-D3`,
    lead_id: row.lead_id,
    business_name: row.business_name || '',
    website: row.website || '',
    first_improvement: normalizeLocalizedDynamicText(
      language,
      splitAuditField(row.top_3_improvements_proposed)[0] || ''
    ),
    expected_impact: normalizeLocalizedDynamicText(
      language,
      splitAuditField(row.expected_business_impact_range)[0] || ''
    ),
    evidence_refs: row.evidence_refs || '',
    email_kind: 'followup_d3',
    campaign_type: 'followup_d3',
    crm_status_on_send: 'FOLLOWUP_D3',
    next_action_days: 4,
    to: row.email,
    reply_to: 'cantonidigitalstudio@gmail.com',
    language,
    currency,
    country: row.country || '',
    city: row.city || '',
    recommended_package: row.recommended_package || 'Growth',
    recommended_package_price: row.recommended_package_price || '',
    subject: copy.subject,
    body: copy.lines.join('\n'),
    status: 'pending'
  };
}

async function run() {
  const rows = await readLeadPipeline(csvFile);
  const queue = [];

  rows.forEach((row) => {
    if (
      row.status === 'CONTACTED' &&
      row.email &&
      row.next_action_date &&
      row.next_action_date <= targetDate
    ) {
      queue.push(buildQueueItem(row));
    }
  });

  await fs.writeFile(outFile, JSON.stringify(queue, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        target_date: targetDate,
        queue_count: queue.length,
        output: outFile
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
