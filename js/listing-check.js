// Free listing check: scores pasted AWS Marketplace listing copy in the browser on the
// 7 teardown dimensions (10 points each), then ranks it against the Discovery API
// snapshot in js/listing-benchmark.js. Deterministic checks only; nothing is sent or stored.
// Dimension 7 (Protocol & category fit) only counts for agent-facing products: otherwise the
// score is out of the 60 points that apply, so no product loses points for what it doesn't need.
// Word lists adapted from the teardown engine's config/wordlists.yaml.
// The same score() runs in Node (tools/build-benchmark.js) to build that snapshot.
(function (root) {
  const W = {
    hype: ['leading', 'innovative', 'seamless', 'seamlessly', 'cutting-edge', 'world-class', 'best-in-class', 'revolutionary',
      'next-generation', 'robust', 'powerful', 'best', 'fastest', 'ultimate', 'unparalleled', 'unmatched', 'premier',
      'industry-leading', 'market-leading', 'state-of-the-art', 'game-changing', 'transform', 'transforms', 'revolutionize',
      'revolutionizes', 'enterprise-grade', 'ai-powered'],
    time: ['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'day', 'days', 'week', 'weeks', 'month', 'months', 'ms'],
    integrations: ['Salesforce', 'Slack', 'Microsoft Teams', 'ServiceNow', 'Jira', 'Confluence', 'Zendesk', 'HubSpot', 'Snowflake',
      'Databricks', 'SAP', 'Workday', 'Okta', 'GitHub', 'GitLab', 'Google Drive', 'SharePoint', 'Microsoft 365', 'Splunk', 'Datadog',
      'PagerDuty', 'Twilio', 'Zoom', 'Oracle', 'MongoDB', 'PostgreSQL', 'MySQL', 'Kafka', 'Kubernetes', 'Terraform'],
    aws: {
      'Amazon Bedrock': ['Bedrock'], 'Bedrock AgentCore': ['AgentCore'], 'SageMaker': ['SageMaker'], 'Amazon Q': ['Amazon Q'],
      'Amazon S3': ['S3'], 'Amazon EC2': ['EC2'], 'AWS Lambda': ['Lambda'], 'Amazon EKS': ['EKS'], 'Amazon ECS': ['ECS'],
      'Fargate': ['Fargate'], 'DynamoDB': ['DynamoDB'], 'Amazon RDS': ['RDS'], 'Aurora': ['Aurora'], 'Redshift': ['Redshift'],
      'Athena': ['Athena'], 'AWS Glue': ['Glue'], 'Kinesis': ['Kinesis'], 'OpenSearch': ['OpenSearch'], 'CloudWatch': ['CloudWatch'],
      'CloudTrail': ['CloudTrail'], 'IAM': ['IAM'], 'Cognito': ['Cognito'], 'AWS KMS': ['KMS'], 'Secrets Manager': ['Secrets Manager'],
      'PrivateLink': ['PrivateLink'], 'VPC': ['VPC'], 'API Gateway': ['API Gateway'], 'EventBridge': ['EventBridge'], 'SQS': ['SQS'],
      'SNS': ['SNS'], 'Step Functions': ['Step Functions'], 'Amazon Connect': ['Amazon Connect'], 'Textract': ['Textract'],
      'Comprehend': ['Comprehend'], 'Kendra': ['Kendra'], 'Transcribe': ['Transcribe'], 'Rekognition': ['Rekognition'],
      'Security Hub': ['Security Hub'], 'GuardDuty': ['GuardDuty'], 'AWS WAF': ['WAF'], 'Control Tower': ['Control Tower'],
      'CloudFormation': ['CloudFormation'], 'AWS CDK': ['CDK'], 'QuickSight': ['QuickSight']
    },
    compliance: { 'SOC 2': ['SOC 2', 'SOC2', 'SOC-2'], 'ISO 27001': ['ISO 27001', 'ISO/IEC 27001', 'ISO27001'], 'HIPAA': ['HIPAA'],
      'GDPR': ['GDPR'], 'PCI DSS': ['PCI DSS', 'PCI-DSS', 'PCI'], 'FedRAMP': ['FedRAMP'], 'ISO 42001': ['ISO 42001'],
      'data residency': ['data residency', 'data sovereignty', 'data stays in', 'data remains in'] },
    security: {
      encryption: ['encryption', 'encrypted', 'encrypts', 'encrypt', 'AES-256', 'TLS', 'KMS'],
      access: ['SSO', 'single sign-on', 'SAML', 'OIDC', 'OpenID Connect', 'RBAC', 'role-based access', 'least privilege', 'least-privilege', 'MFA'],
      audit: ['audit log', 'audit logs', 'audit logging', 'audit trail', 'audit trails'],
      data: ['data retention', 'retention policy', 'retention period', 'zero data retention', 'data deletion', 'deleted after',
        'not used for training', 'never used for training', 'your region', 'your AWS account', 'your VPC', 'never leaves']
    },
    deploy: ['onboarding', 'setup', 'set up', 'get started', 'getting started', 'time-to-value', 'time to value', 'in minutes',
      'within minutes', 'no-code', 'one-click', 'deploy', 'deploys', 'deployment', 'implementation', 'quick start', 'quickstart',
      'first query', 'go live', 'go-live', 'install', 'connect'],
    audience: ['teams', 'team', 'engineers', 'developers', 'security', 'finance', 'IT', 'marketing', 'sales', 'operations', 'ops',
      'analysts', 'admins', 'administrators', 'support', 'HR', 'legal', 'procurement', 'data', 'platform', 'SRE', 'DevOps',
      'enterprises', 'companies', 'organizations', 'organisations', 'businesses', 'agencies', 'banks', 'insurers', 'hospitals', 'retailers'],
    jobs: ['automates', 'automate', 'detects', 'detect', 'generates', 'generate', 'monitors', 'monitor', 'analyzes', 'analyses', 'analyze',
      'converts', 'convert', 'routes', 'summarizes', 'summarises', 'extracts', 'extract', 'answers', 'schedules', 'reconciles', 'scans',
      'blocks', 'finds', 'tracks', 'track', 'predicts', 'classifies', 'translates', 'transcribes', 'searches', 'tests', 'reviews',
      'protects', 'secures', 'migrates', 'queries', 'ask', 'asks', 'forecasts', 'triages', 'resolves', 'drafts', 'writes', 'build', 'builds',
      'manage', 'manages', 'reduce', 'reduces', 'cut', 'cuts'],
    contact: ['contact us', 'contact sales', 'custom pricing', 'custom quote', 'request a quote', 'pricing on request', 'tailored pricing'],
    agentStack: ['Bedrock', 'AgentCore', 'Amazon Q', 'LangChain', 'LangGraph', 'CrewAI', 'LlamaIndex', 'AutoGen', 'OpenAI Agents',
      'function calling', 'tool calling', 'tool use']
  };

  // Six dimensions, each attributed to the reader it serves. The free check and the paid
  // audit use the same four readers, so a score here maps straight onto the audit.
  // [key, name, reader, max]. 'agent' only applies when AI agents call the product.
  const DIMS = [
    ['sec', 'Security evidence', 'Security reviewer', 10],
    ['price', 'Pricing & terms', 'Procurement', 10],
    ['tech', 'Technical fit', 'Technical evaluator', 10],
    ['deploy', 'Deployment path', 'Technical evaluator', 10],
    ['ai', 'Buyer clarity', 'AI search', 10],
    ['agent', 'Agent readiness', 'Agent builders', 10]
  ];
  const READERS = ['Security reviewer', 'Procurement', 'Technical evaluator', 'AI search', 'Agent builders'];

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasWord = (text, w) => new RegExp(`(^|[^\\w-])${esc(w)}(?=$|[^\\w-])`, 'i').test(text);
  const countWords = (text, list) => list.filter((w) => hasWord(text, w)).length;
  const countGroups = (text, groups) => Object.values(groups).filter((al) => al.some((a) => hasWord(text, a))).length;
  const sentences = (t) => t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

  // input: { title, short, highlights (newline list), long, unit, dimDesc, model, privateOffer, agent }
  // Pricing inputs may instead arrive pre-judged from the snapshot: unitNamed, dimDescribed (0-1).
  function score(input) {
    const title = (input.title || '').trim();
    const short = (input.short || '').trim();
    const highlights = (input.highlights || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const long = (input.long || '').trim();
    const unit = (input.unit || '').trim();
    const dimDesc = (input.dimDesc || '').trim();
    const model = input.model || '';
    const body = [short, highlights.join('. '), long].join('\n');
    const all = [title, body].join('\n');
    const hasBody = /\S/.test(body);
    const d = { ai: 0, tech: 0, deploy: 0, sec: 0, price: 0, agent: 0 };
    const fixes = [];
    const check = (dim, got, max, text) => { d[dim] += got; if (max - got > 0) fixes.push({ lost: max - got, dim, text }); };

    // 1. AI discoverability: can a summariser tell who it is for and what job it does?
    const words = title.split(/\s+/).filter(Boolean).length;
    check('ai', words >= 4 && title.length <= 110 ? 2 : words >= 2 ? 1 : 0, 2,
      'Put the job in the title, not just the brand: "Brand: natural-language analytics for Amazon Redshift".');
    const hypeOpen = countWords(sentences(short)[0] || '', W.hype) > 0;
    check('ai', short && !hypeOpen ? 2 : 0, 2, short
      ? 'Your short description opens with hype. Open with the buyer and the result they get.'
      : 'Write a short description. It is the first text AI search and buyers read.');
    check('ai', /\b(for|helps|lets|enables)\b/i.test(short) && countWords(short, W.audience) > 0 ? 2 : 0, 2,
      'Name the buyer in the short description ("lets finance teams…", "for platform engineers…"). AI search matches on who and what.');
    check('ai', countWords(short, W.jobs) > 0 ? 2 : 0, 2,
      'State the literal job in plain verbs ("reconciles invoices", "detects prompt injection"), not a metaphor.');
    check('ai', highlights.length >= 3 && new Set(highlights.map((h) => h.toLowerCase())).size === highlights.length ? 1 : 0, 1,
      'Fill all three highlights, each with a different, specific benefit.');
    const hypeCount = countWords(all, W.hype);
    check('ai', hasBody && hypeCount === 0 ? 1 : 0, 1,
      `Cut the hype words (${hypeCount} found, like "${W.hype.find((w) => hasWord(all, w)) || 'leading'}"). Replace each with a fact a buyer can check.`);

    // 2. Technical clarity: could an engineer judge fit without a call?
    const awsCount = countGroups(all, W.aws);
    check('tech', awsCount >= 2 ? 5 : awsCount === 1 ? 3 : 0, 5,
      'Name the AWS services you run on or connect to (Amazon Redshift, S3, Bedrock). Engineers filter on them.');
    const intCount = countWords(all, W.integrations);
    check('tech', intCount >= 2 ? 2 : intCount, 2,
      'List integrations by name (Slack, Snowflake, Okta), not "integrates with your stack".');
    const checkable = sentences(body).filter((s) => /\d|%/.test(s) || countWords(s, W.time) > 0).length;
    check('tech', checkable >= 3 ? 3 : checkable >= 1 ? 2 : 0, 3,
      'Add numbers a buyer can verify: setup time, latency, limits, scale.');

    // 3. Deployment clarity: path, prerequisites, time-to-value.
    const deployCount = countWords(body, W.deploy);
    check('deploy', deployCount >= 2 ? 5 : deployCount === 1 ? 3 : 0, 5,
      'Spell out the deployment path: what happens after the buyer clicks Subscribe.');
    check('deploy', /\b(in|within|under|less than|about)\s+(\d+|a|an|one|two|few)\s*-?\s*(seconds?|minutes?|hours?|days?|weeks?)\b/i.test(body) ? 3 : 0, 3,
      'State time-to-value as a number: "first query within 30 minutes".');
    check('deploy', /(prerequisite|requires?|required|IAM role|step \d|steps|subscribe|sign in|sign up|create an? account|API key|CloudFormation template)/i.test(body) ? 2 : 0, 2,
      'List the prerequisites: accounts, roles or keys the buyer needs before day one.');

    // 4. Security signals: anything a reviewer can act on?
    const compCount = countGroups(all, W.compliance);
    check('sec', compCount >= 2 ? 4 : compCount === 1 ? 3 : 0, 4,
      'Name the certifications you hold (SOC 2 Type II, ISO 27001). Reviewers look for them first.');
    const secGroups = countGroups(all, W.security);
    check('sec', secGroups * 1.5, 6,
      'Say where customer data lives, how it is encrypted, who can access it, how long you keep it, and whether it trains any model.');

    // 5. Pricing clarity: can procurement tell what one unit buys?
    const unitNamed = 'unitNamed' in input ? input.unitNamed : unit && !/^units?$/i.test(unit) ? 1 : unit ? 0.34 : 0;
    check('price', Math.round(unitNamed * 3), 3, unit || 'unitNamed' in input
      ? 'Your pricing unit is "Units". Switch to what the buyer counts: users, requests, hosts, GB.'
      : 'Set a pricing unit. Procurement cannot compare vendors without one.');
    const defined = /\b(per|each|1)\s+(unit|user|seat|request|month|year|gb|tb|workspace|tenant|credit|host|query|api call)s?\b/i.test(body) || /\$\s?\d/.test(body);
    check('price', defined ? 2 : 0, 2, 'Define the unit in the copy: "Each unit is one named user per month."');
    const described = 'dimDescribed' in input ? input.dimDescribed
      : dimDesc.length >= 20 && dimDesc.toLowerCase() !== unit.toLowerCase() ? 1 : 0;
    check('price', Math.round(described * 2), 2,
      'Describe every pricing dimension in a full sentence. A dimension named "Tier 1" with no description stalls approval.');
    check('price', hasBody && countWords(body.replace(/private (offer|contract)s?/gi, ''), W.contact) === 0 ? 1 : 0, 1,
      '"Contact us for pricing" stalls procurement. Show a starting price, or point to private offers.');
    // Folded in from the old private-offer dimension: the part that is actually checkable.
    const termsStated = /(private offers?|annual|multi-year|multi year|(12|24|36)[- ]month|volume (discount|pricing|tier)|tiered|enterprise agreement|committed spend|EDP)/i.test(body);
    check('price', /contract/i.test(model) || termsStated ? 2 : /usage/i.test(model) ? 1 : 0, 2,
      'Say which commercial terms you support: contract pricing, annual or multi-year, volume tiers.');

    // 6. Agent readiness: only scored when AI agents call the product.
    const mcp = /\bMCP\b|Model Context Protocol/i.test(all), a2a = /\bA2A\b|Agent2Agent|agent-to-agent/i.test(all);
    check('agent', mcp && a2a ? 6 : mcp || a2a ? 5 : 0, 6,
      'If you ship an MCP server or A2A endpoint, declare it by name. Agent builders search for it, and 9 in 10 listings stay silent.');
    check('agent', /\b(APIs?|SDKs?|webhooks?|CLI|REST|GraphQL|connectors?|plugins?)\b/.test(all) ? 2 : 0, 2,
      'Name the interfaces you expose: REST API, SDK, webhooks, CLI.');
    check('agent', countWords(all, W.agentStack) > 0 ? 2 : 0, 2,
      'Name the agent stack you plug into: Amazon Bedrock, AgentCore, Amazon Q, LangChain.');

    const agent = !!input.agent;
    const dims = DIMS.map(([k, name, reader, max]) => ({ key: k, name, reader, max, score: d[k], applies: agent || k !== 'agent' }));
    const raw = dims.reduce((s, x) => s + (x.applies ? x.score : 0), 0);
    const max = agent ? 60 : 50;
    const open = fixes.filter((f) => agent || f.dim !== 'agent').sort((a, b) => b.lost - a.lost);
    return { raw, max, agent, total: Math.round((raw / max) * 100), dims, fixes: open.slice(0, 3).map((f) => ({ ...f, dim: DIMS.find(([k]) => k === f.dim)[1] })) };
  }

  const api = { score, DIMS, READERS, W, countGroups };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.ListingCheck = api;

  // ---------- Rank against the Discovery API snapshot ----------
  // Two distributions of the same listings: core (6 dimensions, /60) and agent (all 7, /70),
  // so a score is always ranked against listings scored the same way. hist[i] = listings scoring i/100.
  const B = root.LC_BENCH;
  const dist = (agent) => (B && (agent ? B.agent : B.core)) || null;
  const percentile = (res) => {
    const D = dist(res.agent);
    if (!D) return null;
    let below = 0;
    for (let i = 0; i < res.total; i++) below += D.hist[i] || 0;
    return Math.round(((below + (D.hist[res.total] || 0) / 2) / B.n) * 100);
  };
  const higherThan = (res) => { // listings that score strictly higher
    const D = dist(res.agent);
    let n = 0;
    for (let i = res.total + 1; i < D.hist.length; i++) n += D.hist[i] || 0;
    return n;
  };
  // Where one dimension sits against the same capped SaaS set, so a bar is never a bare number.
  const dimPlace = (res, i) => {
    const D = dist(res.agent);
    if (!D || !D.dims || !D.dims[i]) return null;
    const dd = D.dims[i], v = Math.max(0, Math.min(dd.max, Math.round(res.dims[i].score)));
    let below = 0;
    for (let k = 0; k < v; k++) below += dd.hist[k] || 0;
    const pct = Math.round(((below + (dd.hist[v] || 0) / 2) / B.n) * 100);
    const zeroShare = Math.round(((dd.hist[0] || 0) / B.n) * 100);
    return { pct, median: dd.median, p90: dd.p90, zeroShare, isZero: v === 0 };
  };

  const ord = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

  const rankText = (p) => (p >= 99 ? 'Top 1%' : p <= 1 ? 'Bottom 1%' : `Better than ${p}%`);
  const band = (p) => (p <= 1 ? 'Bottom 1%' : p >= 99 ? 'Top 1%' : p >= 90 ? 'Top 10%' : p >= 75 ? 'Top quarter' : p >= 50 ? 'Above average' : p >= 25 ? 'Below average' : 'Bottom quarter');
  const benchCount = () => (B ? `${(Math.floor(B.n / 100) * 100).toLocaleString('en-US')}+` : '');

  // Market distribution: listings per 5-point band of the /100 score, with an optional "you" marker.
  const bandsOf = (D) => {
    const bands = new Array(20).fill(0);
    D.hist.forEach((c, i) => { bands[Math.min(19, Math.floor(i / 5))] += c; });
    return bands;
  };
  function marketChart(el, you, agent) {
    const D = dist(agent);
    if (!D || !el) return;
    const BANDS = bandsOf(D);
    // Drawn at the container's real pixel width so labels stay 10px on any screen.
    const W = Math.max(280, Math.round(el.clientWidth || 400)), H = el.hasAttribute('data-mini') ? 84 : 150;
    const top = Math.max(...BANDS), bw = W / 20;
    const x = (t) => (t / 100) * W;
    const bars = BANDS.map((c, i) => {
      const h = c ? Math.max(2, (c / top) * (H - 28)) : 0;
      const on = you !== undefined && Math.floor(Math.min(99, you) / 5) === i;
      return `<rect class="mc-bar${on ? ' mc-on' : ''}" x="${i * bw + 1}" y="${H - 16 - h}" width="${bw - 2}" height="${h}" rx="2"><title>Score ${i * 5} to ${i * 5 + 4}: ${c} listings</title></rect>`;
    }).join('');
    const med = `<line class="mc-med" x1="${x(D.median)}" x2="${x(D.median)}" y1="6" y2="${H - 16}"/><text class="mc-lbl" x="${x(D.median) + 4}" y="14">typical ${D.median}</text>`;
    const me = you === undefined ? '' : `<line class="mc-you" x1="${x(you)}" x2="${x(you)}" y1="6" y2="${H - 16}"/><text class="mc-lbl mc-you-lbl" x="${Math.min(x(you) + 4, W - 50)}" y="28">yours ${you}</text>`;
    const axis = [0, 25, 50, 75, 100].map((t) => `<text class="mc-axis" x="${x(t)}" y="${H - 2}" text-anchor="${t === 0 ? 'start' : t === 100 ? 'end' : 'middle'}">${t}</text>`).join('');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scores of ${benchCount()} live listings${you === undefined ? '' : `, yours at ${you}`}">${bars}${med}${me}${axis}</svg>`;
  }

  // ---------- Samples (fictional product) ----------
  const SAMPLES = {
    before: {
      title: 'Northwind AI Platform',
      short: 'Northwind is the leading, most powerful AI platform that transforms how enterprises work with data.',
      highlights: 'Revolutionary AI-powered insights\nSeamless integration with your stack\nEnterprise-grade security',
      long: 'Northwind delivers cutting-edge analytics for every team. Our innovative platform is robust, scalable and secure. Contact us for custom pricing.',
      unit: 'Units', dimDesc: '', model: 'contract', privateOffer: false
    },
    after: {
      title: 'Northwind Data Cloud: plain-English analytics for Amazon Redshift',
      short: 'Lets finance and operations teams ask questions of their Amazon Redshift data in plain English and get a chart in under 10 seconds, with no SQL.',
      highlights: 'Connects to Amazon Redshift in about 15 minutes\nSOC 2 Type II; data stays in your AWS region\nPriced per user per month: 1 unit = 1 named user',
      long: 'Setup: subscribe on AWS Marketplace, connect a read-only IAM role, and invite your team. Most teams run their first query within 30 minutes. Security: data is encrypted in transit (TLS 1.2) and at rest with AWS KMS. Pricing: each unit is one named user per month. Agents and apps can query Northwind through its REST API, including from Amazon Bedrock.',
      unit: 'Users', dimDesc: 'One named user with full query and dashboard access, billed monthly', model: 'contract', privateOffer: false
    }
  };

  // ---------- UI ----------
  const form = document.getElementById('check-form');
  if (!form) return;
  const input = document.getElementById('check-input');
  const out = document.getElementById('check-result');
  const fields = ['title', 'short', 'highlights', 'long', 'unit', 'dimDesc', 'model'];
  const get = () => ({ ...Object.fromEntries(fields.map((f) => [f, form.elements[f].value])), privateOffer: form.elements.privateOffer.checked, agent: form.elements.agent.checked });
  const set = (d) => {
    fields.forEach((f) => { form.elements[f].value = d[f] || ''; });
    form.elements.privateOffer.checked = !!d.privateOffer;
    form.elements.agent.checked = !!d.agent;
    form.querySelector('.field-more').open = !!(d.long || d.unit || d.model);
  };

  let lastYou, lastAgent = false;
  function render(res, source) {
    const p = percentile(res);
    const D = dist(res.agent);
    // Bars grouped under the reader each dimension serves, with where that score sits.
    const shown = res.dims.map((x, i) => ({ ...x, i })).filter((x) => x.applies);
    const byReader = READERS.filter((r) => shown.some((x) => x.reader === r)).map((r) => {
      const group = shown.filter((x) => x.reader === r);
      const rows = group.map((x) => {
        const pl = dimPlace(res, x.i);
        // A zero is common on some dimensions, so a percentile there flatters it. Say the
        // real thing instead: how many listings also score nothing.
        const place = pl === null ? ''
          : pl.isZero
            ? `<span class="bar-place">nothing found &middot; ${pl.zeroShare}% of listings also score zero &middot; top 10% reach ${pl.p90}</span>`
            : `<span class="bar-place">${ord(pl.pct)} percentile &middot; median ${pl.median} &middot; top 10% ${pl.p90}</span>`;
        return `<li><span class="bar-name">${x.name}</span><span class="bar-track"><span class="bar-fill" style="width:${(x.score / x.max) * 100}%"></span></span><span class="bar-val">${Math.round(x.score)}/${x.max}</span>${place}</li>`;
      }).join('');
      return `<div class="reader-group"><p class="reader-name">${r}</p><ul class="score-bars">${rows}</ul></div>`;
    }).join('');
    const naDims = res.dims.filter((x) => !x.applies);
    const naNote = naDims.length
      ? `<p class="bar-na-note">${naDims.map((x) => x.name).join(', ')} not scored: tick the agent box if AI agents call your product.</p>` : '';
    const bars = byReader + naNote;
    const f = res.fixes.length
      ? res.fixes.map((x, i) => `<li><span class="fix-n">${i + 1}</span><div><span class="fix-reader">${x.dim} · +${x.lost} points</span><p>${x.text}</p></div></li>`).join('')
      : '<li><div><p>Nothing left for the automatic audit to find. The hand-done audit in the optimize goes deeper.</p></div></li>';
    const worst = shown.slice().sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];
    const verdictWord = res.total >= 70 ? 'Strong listing' : res.total >= 50 ? 'Above average' : res.total >= 35 ? 'Middle of the pack' : 'Weak listing';
    const verdict = `<p class="score-verdict"><strong>${verdictWord}.</strong> ${worst ? `${worst.name} is the biggest gap, and it is what the ${worst.reader.toLowerCase()} reads first.` : ''}</p>`;
    const rank = p === null ? '' : `<p class="score-rank"><strong>${rankText(p)} of ${benchCount()} live listings</strong>All scored the same way. Typical listing: ${D.median}. Best: ${D.max}.</p>`;
    const basis = res.agent
      ? `All 6 dimensions apply: ${Math.round(res.raw)} of ${res.max} points, shown out of 100`
      : `5 dimensions apply: ${Math.round(res.raw)} of ${res.max} points, shown out of 100`;
    out.innerHTML = `
      ${source ? `<p class="score-source">${source}</p>` : ''}
      <div class="score-head">
        <p class="score-num"><strong>${res.total}</strong><span>/100</span></p>
        <p class="score-band">${p === null ? 'Your score' : band(p)}<span>${basis}</span></p>
      </div>
      ${verdict}
      ${rank}
      <div class="score-market" data-mini></div>
      ${bars}
      <h3 class="fix-title">Your top 3 fixes</h3>
      <ol class="fix-list">${f}</ol>
      <div class="score-cta">
        <a class="btn btn-primary" href="#offers">Get it fixed</a>
        <button class="btn btn-outline" type="button" data-edit>Edit and rescore</button>
      </div>
      <p class="score-disclaimer">Scored on the listing text you pasted, across the dimensions the four readers check. Structure and wording only: backlinks, AI visibility and media are not measured here. It is not an AWS rating and does not predict AWS approval, search placement or sales.</p>`;
    input.hidden = true;
    out.hidden = false;
    marketChart(out.querySelector('[data-mini]'), res.total, res.agent);
    lastYou = res.total;
    lastAgent = res.agent;
    marketChart(document.getElementById('market-chart'), res.total, res.agent);
    out.querySelector('[data-edit]').addEventListener('click', () => { out.hidden = true; input.hidden = false; form.elements.title.focus(); });
    out.focus();
  }

  let source = '';
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = get();
    if (!d.title.trim() && !d.short.trim()) {
      form.querySelector('.check-error').textContent = 'Add at least a title and a short description to score.';
      form.elements.title.focus();
      return;
    }
    form.querySelector('.check-error').textContent = '';
    render(score(d), source);
  });
  // Once the copy is edited, the score is of the edited text, not the example.
  form.addEventListener('input', () => { source = ''; });

  const loadSample = (key, run) => {
    set(SAMPLES[key]);
    source = `Example: the ${key === 'before' ? 'weak' : 'rewritten'} Northwind listing, a made-up product. Every field it scores is loaded.`;
    if (run) { document.getElementById('check').scrollIntoView({ behavior: 'smooth' }); form.requestSubmit(); }
    else form.elements.title.focus();
  };
  document.querySelectorAll('[data-example]').forEach((b) => b.addEventListener('click', () => loadSample(b.dataset.example, b.hasAttribute('data-run'))));

  const drawMarket = () => marketChart(document.getElementById('market-chart'), lastYou, lastAgent);
  drawMarket();
  addEventListener('resize', () => { clearTimeout(drawMarket.t); drawMarket.t = setTimeout(drawMarket, 150); });

  // Before/after section: scored live by the same function, facts computed from the benchmark
  document.querySelectorAll('[data-sample-score]').forEach((el) => {
    el.textContent = String(score(SAMPLES[el.dataset.sampleScore]).total);
  });
  const fact = document.querySelector('[data-sample-fact]');
  if (fact && B) {
    const r = score(SAMPLES.after), n = higherThan(r);
    fact.textContent = n === 0
      ? `${r.total} is higher than every one of the ${B.n.toLocaleString('en-US')} live listings.`
      : `${r.total} is higher than all but ${n} of the ${B.n.toLocaleString('en-US')} live listings.`;
  }
})(typeof window !== 'undefined' ? window : globalThis);
