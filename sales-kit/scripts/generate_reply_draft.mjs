import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readLeadPipeline, resolveCurrency, resolveLanguage } from './lib/lead_pipeline_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const salesKitDir = path.resolve(__dirname, '..');
const csvFile = path.resolve(salesKitDir, 'lead_pipeline.csv');
const outDir = path.resolve(salesKitDir, 'reply-drafts');

const scenarioConfig = {
  interested: { crm_status: 'REPLIED', temperature: 'HOT' },
  asks_price: { crm_status: 'QUOTE_IN_PROGRESS', temperature: 'HOT' },
  asks_call: { crm_status: 'REPLIED', temperature: 'WARM' },
  not_interested: { crm_status: 'CLOSED_LOST', temperature: 'NOT_RELEVANT' },
  asks_details: { crm_status: 'QUOTE_IN_PROGRESS', temperature: 'WARM' }
};

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'draft';
}

function priceSummary(row) {
  return row.recommended_package_price || row.price_range_hint || row.price_range || '';
}

function buildDraft(language, scenario, row) {
  const business = row.business_name || '';
  const contact = row.contact_name || business;
  const website = row.website || business;
  const packageName = row.recommended_package || 'Growth';
  const packagePrice = priceSummary(row);
  const timeline = row.timeline || '3-5 settimane';

  const map = {
    it: {
      interested: {
        subject: `Re: ${business} - roadmap operativa`,
        body: [
          `Ciao ${contact},`,
          '',
          `perfetto, allora preparo io la roadmap pratica per ${website}.`,
          `Mi concentro su priorita, pagine da sistemare e leva commerciale per far lavorare meglio il sito sul fronte richieste.`,
          '',
          'Entro 24 ore ti mando una proposta essenziale ma completa con:',
          '- problemi prioritari',
          '- interventi consigliati',
          '- impatto economico atteso',
          '- tempi e investimento',
          '',
          'Se nel frattempo vuoi segnalarmi il servizio che per te conta di piu, lo metto come priorita numero uno.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - investimento e proposta`,
        body: [
          `Ciao ${contact},`,
          '',
          `ti do subito il riferimento economico piu corretto per ${business}.`,
          packagePrice ? `La fascia che ha piu senso, in base al sito che ho analizzato, e ${packagePrice} per il pacchetto ${packageName}.` : `Ti preparo una fascia economica precisa in base al pacchetto ${packageName}.`,
          '',
          'Nel preventivo ti dettaglio in modo semplice:',
          '- cosa sistemiamo',
          '- cosa ti porta in termini di richieste / conversione',
          '- tempistiche',
          '- eventuale gestione continuativa',
          '',
          'Se vuoi, oggi stesso ti mando il preventivo completo via email.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - procediamo in modo rapido`,
        body: [
          `Ciao ${contact},`,
          '',
          'possiamo sentirci, ma per velocizzare ti conviene prima ricevere una proposta scritta chiara.',
          `In questo modo hai subito numeri, priorita e struttura del lavoro su ${website}.`,
          '',
          'Io ti mando il piano scritto entro 24 ore e, se dopo ha senso, fissiamo una call breve solo per chiudere i dettagli.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Ciao ${contact},`,
          '',
          'ricevuto, nessun problema.',
          'Chiudo qui il follow-up.',
          '',
          'Se piu avanti vorrai rimettere mano al sito per aumentare richieste o migliorare conversione, ti preparo volentieri una proposta seria e mirata.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - dettagli operativi`,
        body: [
          `Ciao ${contact},`,
          '',
          `ti mando volentieri piu dettaglio su come imposterei il lavoro per ${website}.`,
          '',
          `L'idea e costruire un progetto orientato a richieste e conversione, con priorita chiare e un rilascio stimato in ${timeline}.`,
          packagePrice ? `Come riferimento iniziale, il pacchetto piu adatto oggi e ${packagePrice}.` : '',
          '',
          'Se vuoi, nel prossimo messaggio ti invio direttamente il breakdown completo punto per punto.'
        ].filter(Boolean)
      }
    },
    en: {
      interested: {
        subject: `Re: ${business} - practical roadmap`,
        body: [
          `Hi ${contact},`,
          '',
          `perfect, I will prepare the practical roadmap for ${website}.`,
          'I will focus on priorities, pages to fix and the commercial improvements that can lift inquiries and conversion.',
          '',
          'Within 24 hours I will send you a clean proposal covering:',
          '- main issues',
          '- recommended improvements',
          '- expected business impact',
          '- timing and investment',
          '',
          'If there is one service you want to push first, send it over and I will make it priority number one.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - pricing and proposal`,
        body: [
          `Hi ${contact},`,
          '',
          `here is the most realistic pricing direction for ${business}.`,
          packagePrice ? `Based on the site I reviewed, the strongest fit is ${packagePrice} for the ${packageName} package.` : `I will prepare the most accurate pricing range for the ${packageName} package.`,
          '',
          'In the proposal I will keep it simple:',
          '- what we fix',
          '- what it can improve commercially',
          '- timing',
          '- optional ongoing management',
          '',
          'If useful, I can send the full quote today by email.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - fastest next step`,
        body: [
          `Hi ${contact},`,
          '',
          'we can do a call, but the fastest route is to send you a clear written proposal first.',
          `That gives you the numbers, priorities and scope for ${website} immediately.`,
          '',
          'I will send the written plan within 24 hours and, if it makes sense after that, we can schedule a short call to close details.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Hi ${contact},`,
          '',
          'understood, no problem.',
          'I will close the follow-up here for now.',
          '',
          'If later you want to improve the site to generate more qualified inquiries, I can prepare a focused proposal.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - more detail`,
        body: [
          `Hi ${contact},`,
          '',
          `happy to send more detail on how I would structure the work for ${website}.`,
          '',
          `The goal is to build a cleaner commercial path from visit to inquiry, with a delivery window around ${timeline}.`,
          packagePrice ? `As an initial benchmark, the strongest fit is ${packagePrice}.` : '',
          '',
          'If useful, my next email can contain the full breakdown point by point.'
        ].filter(Boolean)
      }
    },
    es: {
      interested: {
        subject: `Re: ${business} - hoja de ruta practica`,
        body: [
          `Hola ${contact},`,
          '',
          `perfecto, preparo la hoja de ruta practica para ${website}.`,
          'La enfocare en prioridades, paginas a corregir y mejoras comerciales para aumentar contactos y conversiones.',
          '',
          'En 24 horas te envio una propuesta clara con:',
          '- problemas prioritarios',
          '- mejoras recomendadas',
          '- impacto comercial esperado',
          '- tiempos e inversion',
          '',
          'Si hay un servicio que quieras empujar primero, dimelo y lo pongo como prioridad numero uno.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - inversion y propuesta`,
        body: [
          `Hola ${contact},`,
          '',
          `te doy ya la referencia economica mas realista para ${business}.`,
          packagePrice ? `Por el sitio que revise, lo que mas sentido tiene es ${packagePrice} para el paquete ${packageName}.` : `Te preparo la franja de inversion mas correcta para el paquete ${packageName}.`,
          '',
          'En la propuesta te lo dejare simple:',
          '- que corregimos',
          '- que mejora comercial puede traer',
          '- tiempos',
          '- gestion opcional',
          '',
          'Si quieres, hoy mismo te envio el presupuesto completo por email.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - siguiente paso rapido`,
        body: [
          `Hola ${contact},`,
          '',
          'podemos hablar, pero para ir mas rapido te conviene recibir primero una propuesta escrita y clara.',
          `Asi tienes enseguida numeros, prioridades y alcance para ${website}.`,
          '',
          'Te la envio en 24 horas y, si despues tiene sentido, hacemos una llamada corta para cerrar detalles.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Hola ${contact},`,
          '',
          'recibido, sin problema.',
          'Cierro aqui el seguimiento.',
          '',
          'Si mas adelante quieres mejorar el sitio para conseguir mas contactos cualificados, te preparo una propuesta concreta.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - mas detalle`,
        body: [
          `Hola ${contact},`,
          '',
          `con gusto te envio mas detalle sobre como estructuraria el trabajo para ${website}.`,
          '',
          `La idea es construir un recorrido comercial mas claro desde la visita hasta el contacto, con una entrega estimada en ${timeline}.`,
          packagePrice ? `Como referencia inicial, la mejor opcion hoy es ${packagePrice}.` : '',
          '',
          'Si quieres, en el siguiente email te mando el desglose completo punto por punto.'
        ].filter(Boolean)
      }
    },
    fr: {
      interested: {
        subject: `Re: ${business} - mini feuille de route`,
        body: [
          `Bonjour ${contact},`,
          '',
          `parfait, je prepare la feuille de route pratique pour ${website}.`,
          'Je vais me concentrer sur les priorites, les pages a corriger et les leviers commerciaux pour augmenter les demandes et conversions.',
          '',
          'Sous 24 heures, je vous envoie une proposition claire avec :',
          '- problemes prioritaires',
          '- actions recommandees',
          '- impact commercial attendu',
          '- delais et investissement',
          '',
          'Si un service doit passer en priorite absolue, dites-le-moi et je le mets en premier.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - budget et proposition`,
        body: [
          `Bonjour ${contact},`,
          '',
          `voici la reference budgetaire la plus coherente pour ${business}.`,
          packagePrice ? `Au vu du site analyse, la meilleure option est ${packagePrice} pour le pack ${packageName}.` : `Je prepare la fourchette budgetaire la plus pertinente pour le pack ${packageName}.`,
          '',
          'Dans la proposition, je vous detaille simplement :',
          '- ce que nous corrigeons',
          '- ce que cela peut apporter commercialement',
          '- les delais',
          '- la gestion optionnelle',
          '',
          'Si vous voulez, je vous envoie le devis complet aujourd hui.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - prochaine etape`,
        body: [
          `Bonjour ${contact},`,
          '',
          'Nous pouvons faire un call, mais le plus rapide est de vous envoyer d abord une proposition ecrite claire.',
          `Ainsi vous avez tout de suite les chiffres, les priorites et le perimetre pour ${website}.`,
          '',
          'Je vous l envoie sous 24 heures et, si cela a du sens ensuite, nous faisons un court call pour finaliser.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Bonjour ${contact},`,
          '',
          'bien recu, aucun probleme.',
          'Je clos le suivi ici pour le moment.',
          '',
          'Si plus tard vous souhaitez retravailler le site pour generer plus de demandes qualifiees, je pourrai vous preparer une proposition ciblee.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - plus de details`,
        body: [
          `Bonjour ${contact},`,
          '',
          `avec plaisir, je peux envoyer plus de details sur la facon dont je structurerais le travail pour ${website}.`,
          '',
          `L objectif est de construire un parcours commercial plus clair entre la visite et la demande, avec un delai estime a ${timeline}.`,
          packagePrice ? `Comme repere initial, le pack le plus adapte aujourd hui est ${packagePrice}.` : '',
          '',
          'Si vous voulez, mon prochain email peut contenir le detail complet point par point.'
        ].filter(Boolean)
      }
    },
    de: {
      interested: {
        subject: `Re: ${business} - praktische Roadmap`,
        body: [
          `Hallo ${contact},`,
          '',
          `perfekt, ich bereite die praktische Roadmap fuer ${website} vor.`,
          'Ich konzentriere mich auf Prioritaeten, die wichtigsten Seiten und die kommerziellen Hebel fuer mehr Anfragen und Conversion.',
          '',
          'Innerhalb von 24 Stunden sende ich Ihnen eine klare Proposal mit:',
          '- priorisierten Problemen',
          '- empfohlenen Massnahmen',
          '- erwartetem geschaeftlichem Effekt',
          '- Timing und Investition',
          '',
          'Wenn ein bestimmter Service fuer Sie Prioritaet hat, schicken Sie ihn mir und ich setze ihn auf Platz eins.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - Preis und Angebot`,
        body: [
          `Hallo ${contact},`,
          '',
          `hier ist die realistischste Preisrichtung fuer ${business}.`,
          packagePrice ? `Basierend auf der analysierten Website ist ${packagePrice} fuer das ${packageName} Paket die staerkste Option.` : `Ich bereite die passendste Preisrange fuer das ${packageName} Paket vor.`,
          '',
          'Im Angebot halte ich es bewusst einfach:',
          '- was wir verbessern',
          '- welchen geschaeftlichen Effekt das haben kann',
          '- Timing',
          '- optionale laufende Betreuung',
          '',
          'Wenn sinnvoll, sende ich das komplette Angebot noch heute per E-Mail.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - naechster Schritt`,
        body: [
          `Hallo ${contact},`,
          '',
          'Wir koennen telefonieren, aber der schnellste Weg ist zuerst ein klares schriftliches Angebot.',
          `So haben Sie sofort Zahlen, Prioritaeten und Umfang fuer ${website}.`,
          '',
          'Ich sende es innerhalb von 24 Stunden und wenn es danach sinnvoll ist, machen wir einen kurzen Call fuer die letzten Details.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Hallo ${contact},`,
          '',
          'verstanden, kein Problem.',
          'Ich schliesse den Follow-up hier erst einmal.',
          '',
          'Wenn Sie spaeter die Website fuer mehr qualifizierte Anfragen verbessern wollen, bereite ich gerne ein fokussiertes Angebot vor.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - mehr Details`,
        body: [
          `Hallo ${contact},`,
          '',
          `gern sende ich mehr Details dazu, wie ich die Arbeit fuer ${website} strukturieren wuerde.`,
          '',
          `Ziel ist ein klarerer kommerzieller Weg von der Website-Ansicht zur Anfrage, mit einer geschaetzten Umsetzung in ${timeline}.`,
          packagePrice ? `Als erste Orientierung passt aktuell ${packagePrice} am besten.` : '',
          '',
          'Wenn Sie moechten, enthaelt meine naechste E-Mail die komplette Aufschluesselung Punkt fuer Punkt.'
        ].filter(Boolean)
      }
    },
    ja: {
      interested: {
        subject: `Re: ${business} - 実行ロードマップ`,
        body: [
          `${contact} 様`,
          '',
          `${website} 向けの実行ロードマップをこちらで準備します。`,
          '優先順位、改善すべきページ、問い合わせと成約につながる導線を中心に整理します。',
          '',
          '24時間以内に以下をまとめてお送りします。',
          '- 優先課題',
          '- 推奨改善案',
          '- 想定できる事業効果',
          '- 期間と投資額',
          '',
          'もし最優先で伸ばしたいサービスがあれば、先に教えてください。'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - 費用感と提案`,
        body: [
          `${contact} 様`,
          '',
          `${business} に対して最も現実的な費用感を先にお伝えします。`,
          packagePrice ? `現在のサイト状況を見る限り、最も合うのは ${packageName} プランの ${packagePrice} です。` : `${packageName} プランを前提に、最適な費用帯を整理してお送りします。`,
          '',
          '提案書では次の点をシンプルにまとめます。',
          '- 何を改善するか',
          '- それが売上や問い合わせにどう効くか',
          '- 期間',
          '- 継続改善の有無',
          '',
          '必要であれば、本日中に正式な提案をメールします。'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - 次の進め方`,
        body: [
          `${contact} 様`,
          '',
          'お打ち合わせは可能ですが、先に書面で提案をお送りした方が早いです。',
          `${website} に対して何を優先し、どこに投資すべきかをすぐ確認できます。`,
          '',
          '24時間以内に提案を送り、その後必要であれば短い打ち合わせで最終確認しましょう。'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `${contact} 様`,
          '',
          '承知しました。問題ありません。',
          'この件のフォローはここで一度終了します。',
          '',
          '今後、サイト改善で問い合わせ数や成約率を上げたくなった際は、改めて個別提案をお送りします。'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - 詳細について`,
        body: [
          `${contact} 様`,
          '',
          `${website} に対してどのように進めるか、より詳しくお送りします。`,
          '',
          `目的は、訪問から問い合わせまでの流れをより明確にし、約 ${timeline} で実行可能な形にすることです。`,
          packagePrice ? `現時点で最も相性が良い目安は ${packagePrice} です。` : '',
          '',
          '必要であれば、次のメールで項目ごとの詳細な内訳を送ります。'
        ].filter(Boolean)
      }
    },
    ar: {
      interested: {
        subject: `Re: ${business} - خارطة طريق عملية`,
        body: [
          `مرحبا ${contact}،`,
          '',
          `ممتاز، سأقوم انا باعداد خارطة الطريق العملية الخاصة بـ ${website}.`,
          'سأركز على الاولويات والصفحات التي تحتاج تعديل والعناصر التجارية التي ترفع الطلبات والتحويل.',
          '',
          'خلال 24 ساعة ارسل لك مقترحا واضحا يشمل:',
          '- المشاكل الاولوية',
          '- التحسينات المقترحة',
          '- الاثر التجاري المتوقع',
          '- المدة والاستثمار',
          '',
          'اذا كان هناك خدمة معينة تريد دفعها اولا، ارسلها لي وساضعها كاولوية رقم واحد.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - السعر والمقترح`,
        body: [
          `مرحبا ${contact}،`,
          '',
          `هذا هو التوجيه السعري الاكثر واقعية حاليا لـ ${business}.`,
          packagePrice ? `بناء على الموقع الذي راجعته، الانسب هو ${packagePrice} ضمن باقة ${packageName}.` : `ساقوم بتجهيز النطاق السعري الانسب ضمن باقة ${packageName}.`,
          '',
          'في المقترح سأوضح ببساطة:',
          '- ما الذي سنقوم بتحسينه',
          '- ما الاثر التجاري المتوقع',
          '- المدة',
          '- خيار الادارة المستمرة',
          '',
          'اذا رغبت، ارسل لك العرض الكامل اليوم عبر البريد.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - الخطوة التالية`,
        body: [
          `مرحبا ${contact}،`,
          '',
          'يمكننا عمل مكالمة، لكن الاسرع ان ارسل لك اولا مقترحا مكتوبا وواضحا.',
          `بهذا تحصل مباشرة على الارقام والاولويات ونطاق العمل الخاص بـ ${website}.`,
          '',
          'سارسل المقترح خلال 24 ساعة، وبعدها اذا كان مناسبا نرتب مكالمة قصيرة لاغلاق التفاصيل.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `مرحبا ${contact}،`,
          '',
          'تم الاستلام، لا مشكلة.',
          'ساغلق المتابعة هنا حاليا.',
          '',
          'اذا رغبت لاحقا في تطوير الموقع لزيادة الطلبات او التحويل، يمكنني تجهيز عرض مركز ومناسب.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - تفاصيل اكثر`,
        body: [
          `مرحبا ${contact}،`,
          '',
          `يسعدني ان ارسل تفاصيل اكثر عن كيفية تنظيم العمل على ${website}.`,
          '',
          `الهدف هو بناء مسار تجاري اوضح من الزيارة حتى الطلب، مع مدة تنفيذ تقارب ${timeline}.`,
          packagePrice ? `كمرجع اولي، الخيار الانسب حاليا هو ${packagePrice}.` : '',
          '',
          'اذا رغبت، ارسل لك في الرسالة التالية التفصيل الكامل نقطة بنقطة.'
        ].filter(Boolean)
      }
    },
    zh: {
      interested: {
        subject: `Re: ${business} - 执行路线图`,
        body: [
          `${contact} 您好，`,
          '',
          `可以，我来为 ${website} 准备一份可执行路线图。`,
          '我会重点放在优先级、关键页面以及更能提升询盘和转化的商业改动上。',
          '',
          '24小时内我会发您一份清晰提案，包括：',
          '- 优先问题',
          '- 建议改动',
          '- 预期商业效果',
          '- 周期和投入',
          '',
          '如果您目前最想推动某个服务，也可以先告诉我，我会放在第一优先级。'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - 预算与方案`,
        body: [
          `${contact} 您好，`,
          '',
          `我先直接给您最现实的预算方向。`,
          packagePrice ? `基于我对网站的判断，目前最合适的是 ${packageName} 方案，预算约为 ${packagePrice}。` : `我会先整理 ${packageName} 方案最合适的预算区间。`,
          '',
          '在提案里我会简单说清楚：',
          '- 我们改什么',
          '- 会带来什么商业效果',
          '- 周期',
          '- 是否需要持续优化',
          '',
          '如果您愿意，我今天就可以把完整报价发给您。'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - 下一步建议`,
        body: [
          `${contact} 您好，`,
          '',
          '可以沟通，但最快的方式还是先给您一份清晰的书面方案。',
          `这样您马上就能看到 ${website} 的优先级、预算和执行范围。`,
          '',
          '我会在24小时内发出方案，如果之后还有必要，我们再安排一个简短沟通。'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `${contact} 您好，`,
          '',
          '收到，没有问题。',
          '我这边先结束这次跟进。',
          '',
          '如果之后您想通过网站提升有效询盘或转化，我可以再给您准备一份针对性的方案。'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - 详细说明`,
        body: [
          `${contact} 您好，`,
          '',
          `我可以把 ${website} 这次工作的结构和重点写得更详细一些。`,
          '',
          `目标是让访问到询盘的商业路径更清晰，预计交付周期约为 ${timeline}。`,
          packagePrice ? `从当前情况看，最合适的初步方案是 ${packagePrice}。` : '',
          '',
          '如果您愿意，下一封邮件我直接发完整拆解。'
        ].filter(Boolean)
      }
    },
    hi: {
      interested: {
        subject: `Re: ${business} - practical roadmap`,
        body: [
          `Namaste ${contact},`,
          '',
          `theek hai, main ${website} ke liye practical roadmap prepare karta hoon.`,
          'Main priorities, key pages aur un commercial improvements par focus karunga jo inquiries aur conversion badha sakte hain.',
          '',
          '24 ghante ke andar main aapko ek clear proposal bhejunga jisme hoga:',
          '- priority issues',
          '- recommended improvements',
          '- expected business impact',
          '- timeline aur investment',
          '',
          'Agar koi service sabse pehle push karni hai, mujhe bhej dijiye, main use priority number one bana dunga.'
        ]
      },
      asks_price: {
        subject: `Re: ${business} - pricing aur proposal`,
        body: [
          `Namaste ${contact},`,
          '',
          `main abhi sabse realistic pricing direction share karta hoon.`,
          packagePrice ? `Jo site maine dekhi uske hisab se ${packageName} package ke liye ${packagePrice} sabse sahi fit lagta hai.` : `Main ${packageName} package ke liye sabse relevant pricing range prepare karta hoon.`,
          '',
          'Proposal mein main simple tareeke se bataunga:',
          '- kya improve karna hai',
          '- iska business par kya asar hoga',
          '- timeline',
          '- optional monthly management',
          '',
          'Agar useful ho, main full quote aaj hi email se bhej sakta hoon.'
        ]
      },
      asks_call: {
        subject: `Re: ${business} - next step`,
        body: [
          `Namaste ${contact},`,
          '',
          'Call ho sakti hai, lekin sabse fast tareeka yeh hai ki main pehle ek clear written proposal bhej doon.',
          `Isse aapko turant ${website} ke numbers, priorities aur scope samajh aa jayenge.`,
          '',
          'Main 24 ghante ke andar proposal bhej deta hoon, aur agar uske baad zarurat ho to short call kar lete hain.'
        ]
      },
      not_interested: {
        subject: `Re: ${business}`,
        body: [
          `Namaste ${contact},`,
          '',
          'samajh gaya, koi problem nahi.',
          'Main abhi ke liye follow-up yahin close karta hoon.',
          '',
          'Agar baad mein site ko improve karke zyada qualified inquiries laani ho, main focused proposal bhej dunga.'
        ]
      },
      asks_details: {
        subject: `Re: ${business} - more detail`,
        body: [
          `Namaste ${contact},`,
          '',
          `main khushi se aur detail bhejta hoon ki ${website} ke liye kaam ko kaise structure karunga.`,
          '',
          `Goal yeh hai ki visit se inquiry tak ka commercial path zyada clear ho, aur estimated delivery ${timeline} ke andar rahe.`,
          packagePrice ? `Initial benchmark ke liye sabse sahi fit ${packagePrice} hai.` : '',
          '',
          'Agar useful ho to next email mein full breakdown point by point bhej deta hoon.'
        ].filter(Boolean)
      }
    }
  };

  const langMap = map[language] || map.en;
  return langMap[scenario];
}

async function run() {
  const leadId = getArgValue('--lead-id');
  const scenario = getArgValue('--scenario');

  if (!leadId) throw new Error('Use --lead-id <LEAD_ID>');
  if (!scenario || !scenarioConfig[scenario]) {
    throw new Error('Use --scenario interested|asks_price|asks_call|not_interested|asks_details');
  }

  const leads = await readLeadPipeline(csvFile);
  const row = leads.find((item) => item.lead_id === leadId);
  if (!row) throw new Error(`Lead not found: ${leadId}`);

  const language = resolveLanguage(row);
  const currency = resolveCurrency(row);
  const draft = buildDraft(language, scenario, row);
  const meta = scenarioConfig[scenario];

  await fs.mkdir(outDir, { recursive: true });
  const output = {
    lead_id: leadId,
    business_name: row.business_name || '',
    website: row.website || '',
    language,
    currency,
    scenario,
    lead_temperature: meta.temperature,
    recommended_crm_status: meta.crm_status,
    subject: draft.subject,
    body: draft.body.join('\n')
  };

  const file = path.join(outDir, `${slugify(row.business_name)}-${slugify(leadId)}-${slugify(scenario)}.json`);
  await fs.writeFile(file, JSON.stringify(output, null, 2), 'utf8');

  console.log(JSON.stringify({ ok: true, output: file, draft: output }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
