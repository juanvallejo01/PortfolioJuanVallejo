'use strict';

// Spanish copy; English is read from the HTML itself so it stays the single source.
const ES = {
  'nav.work': 'Proyectos', 'nav.exp': 'Experiencia', 'nav.proof': 'Credenciales', 'nav.contact': 'Contacto', 'nav.cta': 'Hablemos',
  'hero.eyebrow': '<span class="pulse"></span> Disponible para trabajo remoto · UTC−5',
  'hero.title': 'Construyo backends y sistemas on-chain <span class="grad">que no se rompen.</span>',
  'hero.sub': 'Ingeniero backend y Web3. Llevo a producción APIs con <b>Node.js, Prisma y PostgreSQL</b>, y flujos DeFi atómicos con <b>1inch Aqua, Lido y viem</b> — diseñados para el momento en que algo falla, no solo para el caso ideal.',
  'hero.cta1': 'Ver casos de estudio <span aria-hidden="true">→</span>', 'hero.cta2': 'Descargar CV',
  'stat1': 'Llevando backends a producción desde', 'stat2': 'Transacciones reducidas en SwipeFi', 'stat3': 'Proyectos Web3 en ETHGlobal y ETH Cali, 2026',
  'work.kicker': '01 — Proyectos destacados', 'work.title': 'Problemas resueltos, no tecnologías listadas.',
  'work.sub': 'Tres casos de estudio. En cada uno: el problema, la decisión técnica difícil y lo que logró.',
  'case.p': 'Problema', 'case.d': 'Decisión técnica', 'case.r': 'Resultado', 'case.code': 'Ver código',
  'sw.lede': 'Swap y stake en un solo deslizamiento — una Telegram Mini App sobre 1inch Aqua + Lido.',
  'sw.p': 'Hacer staking desde una stablecoin exige tres transacciones separadas — swap, approve y stake. En móvil, esa fricción mata la conversión.',
  'sw.d': 'Lo reduje a una sola transacción atómica: USDC → ETH con liquidez de 1inch Aqua, depositado directo en Lido mediante <code>executeAtomic()</code>, con calldata codificado en ABI con viem sobre el <code>@1inch/aqua-sdk</code> oficial.',
  'sw.r': 'Un solo deslizamiento en lugar de tres transacciones, validado de punta a punta en un fork local de Ethereum mainnet (Hardhat) antes de tocar fondos reales.',
  'sw.cert': 'Certificado de ETHGlobal',
  'ca.badge': 'Ingeniería de riesgo · Python', 'ca.lede': 'Una plataforma de trading autónoma diseñada en torno al fallo, no al optimismo.',
  'ca.p': 'La mayoría de los bots de trading asumen que las órdenes se ejecutan — y vacían cuentas cuando el exchange dice lo contrario.',
  'ca.d': 'Reconciliación de ejecución que nunca confía en una orden hasta que el exchange la confirma, stop-loss / take-profit obligatorios, un circuit breaker por pérdidas consecutivas y un kill switch por pérdida diaria. Las API keys no permiten retiros y se cifran con Fernet por usuario.',
  'ca.r': 'Una plataforma multiusuario en Flask donde cada usuario ejecuta un bot aislado de Binance Spot (cruce de medias + RSI, filtrado con scikit-learn) con dashboard en vivo y alertas por Telegram.',
  'ur.badge': 'Backend SaaS · TechNova', 'ur.lede': 'Un SaaS de administración residencial: del papel y los grupos de chat a una sola plataforma.',
  'ur.p': 'Los conjuntos residenciales gestionan visitantes, residentes, reservas y documentos en papel y grupos de chat — sin trazabilidad ni una única fuente de verdad.',
  'ur.d': 'Una API REST modular (Node.js, Express, Prisma) sobre PostgreSQL con sesiones protegidas por JWT, para que cada módulo — visitantes, residentes, zonas comunes, documentos, notificaciones — evolucione de forma independiente.',
  'ur.r': 'Un SaaS full-stack (React + Tailwind) que cubre la operación diaria de un conjunto residencial sobre un modelo de datos consistente.',
  'demos.kicker': '02 — Demos', 'demos.title': 'Míralo funcionando.',
  'exp.kicker': '03 — Experiencia', 'exp.title': 'Dónde he entregado.',
  'exp.w1': 'Feb 2025 — Actualidad', 'exp.d1': 'Sistematizo y automatizo flujos administrativos y documentales — convirtiendo procesos manuales en servicios backend confiables.',
  'exp.w2': 'Abr — Nov 2024', 'exp.d2': 'Diseñé APIs RESTful con Node.js, Express y Prisma, administré bases de datos PostgreSQL para un SaaS de gestión residencial, automaticé procesos internos con Python e integré flujos con Google Workspace. Participé en decisiones de arquitectura y despliegues.',
  'exp.w3': '2026 — Actualidad', 'exp.d3': 'Construyendo sobre Ethereum en ETHGlobal ETHOnline y el EAG Global Buildathon.',
  'exp.t4': 'Vicepresidente · <span class="org">IEEE Computer Society USC</span>', 'exp.d4': 'Lideré el capítulo estudiantil de la Universidad Santiago de Cali, organizando actividades técnicas para la comunidad de ingeniería.',
  'exp.w5': '2023 — Actualidad', 'exp.t5': 'Ingeniería de Sistemas · <span class="org">Universidad Santiago de Cali</span>', 'exp.d5': 'Miembro de la Incubadora de Investigación y Desarrollo Comba.',
  'proof.kicker': '04 — Credenciales', 'proof.title': 'Verificables, no decorativas.', 'proof.sub': 'Cada credencial enlaza al documento original o a su emisor.',
  'proof.eth': 'Construí SwipeFi', 'proof.cisco': 'Cisco · verificado en Credly', 'proof.intro': 'Introducción a la Ciberseguridad', 'proof.more': 'Más certificaciones',
  'c.sena': 'Certificado SENA', 'c.py': 'Diploma de Python', 'c.cs': 'Diploma de C#', 'c.x1': 'Excel — Intermedio', 'c.x2': 'Excel — Interés simple y compuesto',
  'ct.kicker': '05 — Contacto', 'ct.title': '¿Tienes un problema de backend o Web3 que no puede fallar?<br><span class="grad">Hablemos.</span>',
  'ct.sub': 'Abierto a roles remotos full-stack, backend y Web3. Inglés B2 · horario compatible con EE. UU.',
  'ct.copy': 'Copiar', 'ct.send': 'Enviar correo', 'foot': 'Hecho a mano · sin plantillas',
};
const META = {
  en: { title: document.title, desc: document.querySelector('meta[name="description"]').content, toggle: 'Cambiar a español' },
  es: {
    title: 'Juan Vallejo — Ingeniero Backend y Web3',
    desc: 'Juan Vallejo construye backends en producción (Node.js, Prisma, PostgreSQL) y sistemas on-chain (1inch Aqua, Lido, viem). Casos de estudio, experiencia y credenciales verificables. Disponible para trabajo remoto.',
    toggle: 'Switch to English',
  },
};

const nodes = document.querySelectorAll('[data-i18n]');
const EN = {};
nodes.forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });

function setLang(lang) {
  const dict = lang === 'es' ? ES : EN;
  nodes.forEach((el) => { const v = dict[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
  document.documentElement.lang = lang;
  document.title = META[lang].title;
  document.querySelector('meta[name="description"]').content = META[lang].desc;
  document.querySelector('[data-lang-toggle]').setAttribute('aria-label', META[lang].toggle);
  try { localStorage.setItem('lang', lang); } catch {}
}

let initial = 'en';
try { initial = localStorage.getItem('lang') || (navigator.language || '').slice(0, 2); } catch {}
setLang(initial === 'es' ? 'es' : 'en');

document.querySelector('[data-lang-toggle]').addEventListener('click', () => {
  setLang(document.documentElement.lang === 'es' ? 'en' : 'es');
});
