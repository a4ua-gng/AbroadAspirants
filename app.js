/* ============================================================
   Abroad Aspirants — app
   ============================================================ */

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

function readPref(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function writePref(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ---------- Data ---------- */
const routes = [
  { code: 'JPN', name: 'Japan · MEXT Scholarship',  program: 'mext', lat: 35.68, lon: 139.69 },
  { code: 'DEU', name: 'Germany · DAAD scholarships', program: 'daad', lat: 50.74, lon: 7.10 },
  { code: 'GBR', name: 'United Kingdom · UWC pathway', program: 'uwc', lat: 51.40, lon: -3.53 },
];

const programs = [
  { id: 'mext', name: 'MEXT Undergraduate Scholarship', cat: 'scholarship', tag: 'Japan / Undergraduate', symbol: 'JPN', copy: 'Explore the Japanese Government scholarship route for undergraduate study. Eligibility and timelines depend on the annual call.', url: 'https://www.in.emb-japan.go.jp/Education/Undergraduate_Student.html' },
  { id: 'afs-innovators', name: 'AFS Global STEM Innovators — India', cat: 'stem', tag: 'India / STEM + Impact', symbol: 'AFS', copy: 'A scholarship-based STEM and intercultural learning pathway for eligible teens. Check the organizer for future cycles.', url: 'https://afs.org/global-stem/innovators/ind/' },
  { id: 'uwc', name: 'United World Colleges (UWC)', cat: 'scholarship exchange', tag: 'Global / Education', symbol: 'UWC', copy: 'Explore a global education at UWC through the India National Committee. Funding can vary by applicant and placement.', url: 'https://in.uwc.org/how-to-apply/' },
  { id: 'afs-academies', name: 'AFS Global STEM Academies', cat: 'stem exchange', tag: 'Global / STEM', symbol: 'STEM', copy: 'Investigate immersive international STEM experiences and scholarship opportunities through AFS.', url: 'https://afs.org/global-stem/' },
  { id: 'erasmus', name: 'Erasmus+ Youth Opportunities', cat: 'exchange leadership', tag: 'Europe / Youth', symbol: 'EU', copy: 'Discover youth exchanges and mobility opportunities. Geographic, age and organizational requirements vary.', url: 'https://erasmus-plus.ec.europa.eu/' },
  { id: 'daad', name: 'DAAD Scholarship Database', cat: 'scholarship', tag: 'Germany / Study', symbol: 'DE', copy: 'Search official scholarship listings for relevant study and research routes in Germany. Many are for higher study levels.', url: 'https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarship-database/' },
];

const documents = [
  { id: 'academic-lor', title: 'Academic recommendation letter', short: 'Academic LOR', desc: 'A teacher-focused example showing specific academic qualities and observable classroom evidence.', text: `[School / Institution Letterhead]\n[Date]\n\nTo the Selection Committee,\n\nI am pleased to recommend [Student Full Name] for [Program / Scholarship Name]. I have taught [Student First Name] in [Subject] at [School Name] for [Length of Time], and have had the opportunity to observe [their] academic approach and development.\n\nWhat distinguishes [Student First Name] is [specific intellectual quality]. During [class, project or assignment], [they] demonstrated this by [concrete example with a measurable or observable result]. Rather than settling for a familiar answer, [Student First Name] [describe what the student did and why it mattered].\n\n[Student First Name] also contributes meaningfully to the classroom. For example, [specific example of collaboration, initiative, integrity or leadership observed directly by the recommender]. This experience showed me [genuine assessment of character or growth].\n\nI believe [Student First Name] would contribute positively to [Program Name] through [relevant strengths], while benefiting from [specific aspect of program]. I recommend [them] with confidence.\n\nSincerely,\n[Recommender's Name]\n[Title / Subject]\n[School / Institution]\n[Official Contact Information]\n\n[The recommender should review, personalize and approve every statement before signing.]` },
  { id: 'leadership-lor', title: 'Leadership & community LOR', short: 'Leadership LOR', desc: 'For supervisors or community mentors who can describe leadership with evidence, rather than adjectives alone.', text: `[Organization Letterhead]\n[Date]\n\nDear Selection Committee,\n\nI am writing in support of [Student Full Name]'s application to [Program Name]. I worked with [Student First Name] as [Your Role] at [Organization] from [Dates].\n\nIn [project or activity], [Student First Name] took responsibility for [specific role]. One challenge the team faced was [clear challenge]. I observed [Student First Name] respond by [specific actions], resulting in [verifiable outcome or learning].\n\nEqually important was the way [they] worked with other people. When [short example of teamwork or conflict resolution], [they] demonstrated [quality] through [behavior]. This is the kind of initiative that builds trust in a team.\n\nBased on my direct experience, I believe [Student First Name] would bring [two strengths relevant to the program] to your cohort. I strongly support [their] application and would be glad to provide more details if helpful.\n\nSincerely,\n[Recommender Name]\n[Role and Organization]\n[Verified Contact Information]\n\n[Use only observed, truthful accomplishments. The recommender controls the final letter.]` },
  { id: 'stem-lor', title: 'STEM project recommendation', short: 'STEM LOR', desc: 'For science mentors, lab supervisors and project guides who can describe evidence of problem solving.', text: `[Institution / Lab]\n[Date]\n\nTo the Review Committee,\n\nI recommend [Student Name] for [Opportunity]. I supervised [their] work on [Project Name] over [Time Period], meeting [frequency / context].\n\nThe objective of the project was [problem the project addressed]. [Student Name] contributed by [specific technical or research responsibilities]. During [a real challenge], [they] tested [approach], revised [method], and documented [result]. What impressed me most was not merely the outcome, but [specific example of rigorous thinking or resilience].\n\n[Student Name] also demonstrated [collaboration / communication / responsible research practice] when [specific incident]. In my view, this indicates readiness to learn from unfamiliar technical problems and contribute actively to a new cohort.\n\nI support [their] application to [Program] and would be happy to clarify my observations.\n\nSincerely,\n[Supervisor Name]\n[Position / Institution]\n[Institutional Email]\n\n[Replace every placeholder with directly observed facts. Avoid unsupported claims of exceptional achievement.]` },
  { id: 'sop', title: 'Statement of purpose framework', short: 'SOP / Motivation', desc: 'A narrative structure that connects past curiosity, genuine action and future fit.', text: `STATEMENT OF PURPOSE — WORKING OUTLINE\n\n1. OPEN WITH A SPECIFIC MOMENT\nInstead of "I have always been passionate," explain one real problem, observation, class or experience that made you curious about [Field]. What did you notice? Why did it stay with you?\n\n2. SHOW WHAT YOU DID NEXT\nDescribe one or two relevant actions: [project, reading, volunteering, class work, club, experiment]. State your responsibility, the challenge and what changed in your understanding.\n\n3. EXPLAIN THE CONNECTION\nHow did these experiences lead you toward [Program / University / Opportunity]? Name concrete aspects of the program you have researched, such as [course, method, project format, community value].\n\n4. DEFINE YOUR CONTRIBUTION\nDescribe what perspectives, skills or experiences you would bring. Make it credible and specific, not a list of superlatives.\n\n5. CLOSE WITH DIRECTION\nExplain what you want to learn next and one possible way you might use it. You do not need to predict your entire future.\n\nEDITING CHECKLIST\n□ Is the opening mine, not generic?\n□ Can I support every claim?\n□ Does this answer the actual prompt?\n□ Have I checked the word limit and program requirements?\n□ Did someone review clarity without replacing my voice?` },
  { id: 'scholarship-essay', title: 'Scholarship essay guide', short: 'Scholarship Essay', desc: 'A structure for values, contribution and growth, adaptable to the actual question.', text: `SCHOLARSHIP ESSAY — PLANNING SHEET\n\nPROMPT: [Paste the exact official scholarship prompt]\nWORD LIMIT: [Insert confirmed word limit]\n\nYOUR CENTRAL IDEA\nOne sentence answering the prompt directly: [Your idea]\n\nPARAGRAPH 1 — CONTEXT\nOpen with a specific, authentic experience that introduces the challenge or question. Avoid making claims you cannot explain.\n\nPARAGRAPH 2 — ACTION\nShow what YOU did, the decisions you made, and how you interacted with others. Use one clear example rather than ten vague activities.\n\nPARAGRAPH 3 — REFLECTION\nWhat did you learn or change your mind about? Where did your approach fall short, and how did you grow?\n\nPARAGRAPH 4 — FUTURE CONTRIBUTION\nConnect your values and skills to the scholarship's stated mission. Explain what you hope to learn and contribute.\n\nFINAL REVIEW\n□ Addresses all parts of the prompt\n□ Uses accurate names and dates\n□ Avoids claims of guaranteed impact\n□ Has your authentic voice\n□ Fits the requested length\n□ Proofread and reviewed with care` },
  { id: 'teacher-email', title: 'Email requesting a recommendation', short: 'Request an LOR', desc: 'A respectful email you can adapt when asking a teacher, mentor or supervisor for a genuine recommendation.', text: `Subject: Request for a Recommendation — [Your Name] / [Opportunity]\n\nDear [Teacher / Mentor Name],\n\nI hope you are doing well. I am applying to [Program / Scholarship Name], which focuses on [brief reason the opportunity interests you]. I have valued learning [subject / project] with you, especially [specific experience].\n\nWould you feel comfortable writing a recommendation letter for my application? The submission deadline is [Date], and the letter is due through [Official Submission Method]. I understand if your schedule does not allow it.\n\nIf helpful, I can share my resume, the program description, the specific criteria, and a short summary of the work I completed under your guidance. I would also be happy to answer any questions.\n\nThank you for considering this request and for your guidance.\n\nBest regards,\n[Your Full Name]\n[Class / Year]\n[Contact Email]\n\nNOTE: Ask early, share the official requirements and thank the recommender whether or not they can help.` },
];

const answers = {
  lor: 'A strong LOR is specific and truthful. Ask someone who has actually taught or supervised you. Give them a clear deadline, program details, your CV and a few reminders of projects you worked on together. Ask politely and early.\n\nUse the "Request an LOR" email in the resource lab. The final recommendation must be the recommender\'s genuine assessment, not a fabricated endorsement.',
  sop: 'An SOP or motivation statement usually answers three things: Why this field? Why this particular program? And what will you contribute or learn?\n\nUse one real moment to open, show what you did next, connect your experiences to specific program features, and finish with a credible direction. The Resource Lab has a detailed SOP framework.',
  scholarship: 'Start with the organizers\' official pages, then filter for age, nationality, education level, funding and deadlines. Our opportunity board points to MEXT, AFS, UWC and other routes. These are not verified as open right now.\n\nKeep a simple spreadsheet of eligibility, documents and dates. Never pay an unknown person who promises a scholarship.',
  cv: 'A student CV can be one page with education, activities, projects, skills and awards relevant to the opportunity. For each bullet, say what you did and what changed, without exaggerating.\n\nExample: "Coordinated a four-person team to organize a school STEM workshop for 35 participants." Use numbers only if accurate.',
  interview: 'For interviews, prepare a clear answer about your motivation, one challenge, a team experience and what you hope to learn. Practice explaining your own projects simply.\n\nKnow the program\'s mission, listen carefully, and say when you do not know an answer instead of inventing one.',
  email: 'A recommendation request should mention the program, exact deadline, why you are asking that person, and what supporting material you can provide. Give your teacher an easy way to decline.\n\nOpen the "Request an LOR" example in the resource lab to copy and personalize it.',
  deadline: 'Always treat the official program page as the source of truth for eligibility and deadlines. Our opportunity cards are guides, not live application-status trackers.\n\nMake a checklist and set your own internal deadline several days ahead of the official one.',
  privacy: 'Please keep personal data such as addresses, ID numbers, gradesheets, passwords and unredacted application files out of public group chats. Share sensitive documents only through an approved secure process with people you trust.',
  default: 'I can help with the basics of recommendation letters (LORs), statements of purpose (SOPs), scholarship research, CVs, interviews and application deadlines.\n\nTry asking "How do I request an LOR?" or "What goes in an SOP?" For personalized discussion with students, use the WhatsApp community link.',
};

const answerTopics = [
  [/\b(private|privacy|password|passport|identity)\b/i, 'privacy'],
  [/\b(lor|lors|recommendation|recommendations|referee|reference letter)\b/i, 'lor'],
  [/\b(sop|statement of purpose|motivation|personal statement|essay)\b/i, 'sop'],
  [/\b(cv|resume|résumé|portfolio)\b/i, 'cv'],
  [/\b(interview|interviews)\b/i, 'interview'],
  [/\b(email|mail|teacher)\b/i, 'email'],
  [/\b(deadline|deadlines|eligibility|due date|close)\b/i, 'deadline'],
  [/\b(scholarship|scholarships|funding|mext|uwc|afs|exchange)\b/i, 'scholarship'],
];

// motion preference
const motionButton = $('#motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPref = readPref('aa-motion', null);
const motionEnabled = () => motionPref ?? !reducedMotion.matches;

function syncMotion() {
  const enabled = motionEnabled();
  document.documentElement.classList.toggle('motion-paused', !enabled);
  motionButton.setAttribute('aria-pressed', String(!enabled));
  motionButton.setAttribute('aria-label', enabled ? 'Pause motion' : 'Resume motion');
  motionButton.firstElementChild.textContent = enabled ? 'Ⅱ' : '▶';
}
motionButton.addEventListener('click', () => {
  motionPref = !motionEnabled();
  writePref('aa-motion', motionPref);
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
syncMotion();

// globe
let globeApi = null;
let pendingRoute = 0;

function lonLatToVec(THREE, lon, lat, r = 1) {
  const rad = Math.PI / 180;
  const phi = (90 - lat) * rad;
  const theta = (lon + 180) * rad;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function createGlobe(canvas, THREE, topojson) {
  const R = 1;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    canvas.closest('.globe-stage')?.classList.add('globe-failed');
    return { select() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 3.9);

  const root = new THREE.Group();
  scene.add(root);

  // invisible-ish sphere 
  root.add(new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x0b0b0b })
  ));

  // lat/long grid
  const gridPositions = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    for (let lon = -180; lon < 180; lon += 4) {
      const a = lonLatToVec(THREE, lon, lat);
      const b = lonLatToVec(THREE, lon + 4, lat);
      gridPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  for (let lon = -180; lon < 180; lon += 30) {
    for (let lat = -90; lat < 90; lat += 4) {
      const a = lonLatToVec(THREE, lon, lat);
      const b = lonLatToVec(THREE, lon, lat + 4);
      gridPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
  root.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0x242424 })));

  const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 });
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(res => res.json())
    .then(world => {
      const geo = topojson.feature(world, world.objects.countries);
      const positions = [];
      for (const f of geo.features) {
        const g = f.geometry;
        if (!g) continue;
        const polygons = g.type === 'Polygon' ? [g.coordinates]
          : g.type === 'MultiPolygon' ? g.coordinates : [];
        for (const polygon of polygons) {
          for (const ring of polygon) {
            for (let i = 0; i < ring.length - 1; i++) {
              const a = lonLatToVec(THREE, ring[i][0], ring[i][1], R * 1.002);
              const b = lonLatToVec(THREE, ring[i + 1][0], ring[i + 1][1], R * 1.002);
              positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
          }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      root.add(new THREE.LineSegments(g, borderMat));
    })
    .catch(() => {});

  const origin = { lat: 26.14, lon: 91.74 };
  const markerGeo = new THREE.SphereGeometry(R * 0.014, 12, 12);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const originMarker = new THREE.Mesh(markerGeo, markerMat);
  originMarker.position.copy(lonLatToVec(THREE, origin.lon, origin.lat, R * 1.01));
  root.add(originMarker);

  const destMarker = new THREE.Mesh(markerGeo, markerMat);
  root.add(destMarker);

  const arcMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
  let arc = null;

  const currentQ = new THREE.Quaternion();
  const targetQ = new THREE.Quaternion();

  function buildRoute(dest) {
    if (arc) { root.remove(arc); arc.geometry.dispose(); }
    const a = lonLatToVec(THREE, origin.lon, origin.lat, R);
    const b = lonLatToVec(THREE, dest.lon, dest.lat, R);
    const pts = [];
    const segs = 80;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = new THREE.Vector3().lerpVectors(a, b, t).normalize();
      p.multiplyScalar(R * (1 + Math.sin(t * Math.PI) * 0.22));
      pts.push(p);
    }
    arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat);
    root.add(arc);
    destMarker.position.copy(lonLatToVec(THREE, dest.lon, dest.lat, R * 1.01));

    const mid = new THREE.Vector3().addVectors(a, b).normalize();
    targetQ.copy(new THREE.Quaternion().setFromUnitVectors(mid, new THREE.Vector3(0, 0, 1)));
  }

  // drag
  let drag = null;
  function onDown(e) {
    if (!e.isPrimary || e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  }
  function onMove(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(dy * 0.006, dx * 0.006, 0, 'XYZ')
    );
    currentQ.premultiply(q);
    targetQ.copy(currentQ);
  }
  function onUp(e) {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    canvas.classList.remove('dragging');
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // Resize.
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Render loop.
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (motionEnabled() && !drag) {
      const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.07);
      currentQ.premultiply(spin);
      targetQ.premultiply(spin);
    }
    const k = motionEnabled() ? Math.min(1, dt * 5) : 1;
    currentQ.slerp(targetQ, k);
    root.quaternion.copy(currentQ);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  buildRoute(routes[0]);

  return {
    select(index) { buildRoute(routes[index]); }
  };
}

async function initGlobe() {
  const canvas = $('#globe');
  if (!canvas) return;
  let THREE, topojson;
  try {
    THREE = await import('three');
    topojson = await import('topojson-client');
  } catch {
    canvas.closest('.globe-stage')?.classList.add('globe-failed');
    return;
  }
  globeApi = createGlobe(canvas, THREE, topojson);
  globeApi.select(pendingRoute);
}

// menu
const menuBtn = $('#menu-toggle');
const nav = $('#nav');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') === 'false'));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    menuBtn.focus();
  }
});

// route
const routeButtons = $$('[data-route]');
const routeCode = $('#route-code');
const routeLink = $('#route-link');

function applyRoute(index) {
  pendingRoute = index;
  const route = routes[index];
  routeCode.textContent = `IND → ${route.code}`;
  routeLink.firstChild.nodeValue = route.name + ' ';
  routeLink.hash = 'program-' + route.program;
  routeButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
  globeApi?.select(index);
}
routeButtons.forEach(button => {
  button.addEventListener('click', () => applyRoute(Number(button.dataset.route)));
});
routeLink.hash = 'program-' + routes[0].program;

const programList = $('#programs');
const resultCount = $('#result-count');
const search = $('#program-search');
const filterButtons = $$('[data-filter]');
const saved = new Set(readPref('aa-saved-programs', []) || []);
let filter = 'all';

function renderPrograms() {
  const term = search.value.trim().toLowerCase();
  const matches = programs.filter(p => {
    const catMatch = filter === 'all'
      || p.cat.split(' ').includes(filter)
      || (filter === 'saved' && saved.has(p.id));
    return catMatch && `${p.name} ${p.tag} ${p.copy}`.toLowerCase().includes(term);
  });

  programList.replaceChildren();
  resultCount.textContent = `${matches.length} ${matches.length === 1 ? 'program' : 'programs'}`;

  if (!matches.length) {
    const msg = document.createElement('p');
    msg.className = 'empty';
    msg.textContent = filter === 'saved' && !saved.size
      ? 'Save a program using the star beside its official link.'
      : 'No programs match this search.';
    programList.append(msg);
  }

  for (const p of matches) {
    const row = document.createElement('article');
    row.className = 'program';
    row.id = 'program-' + p.id;
    row.tabIndex = -1;
    row.innerHTML = '<span class="code"></span><div><h3></h3><p></p></div><a target="_blank" rel="noopener noreferrer">Official site ↗</a><button class="save" type="button"></button>';
    row.querySelector('.code').textContent = p.symbol;
    row.querySelector('h3').textContent = p.name;
    row.querySelector('p').textContent = p.copy;

    const link = row.querySelector('a');
    link.href = p.url;
    link.setAttribute('aria-label', 'Official site for ' + p.name);

    const save = row.querySelector('.save');
    function syncSave() {
      const isSaved = saved.has(p.id);
      save.textContent = isSaved ? '★' : '☆';
      save.setAttribute('aria-label', 'Save ' + p.name);
      save.setAttribute('aria-pressed', String(isSaved));
    }
    syncSave();
    save.addEventListener('click', () => {
      if (saved.has(p.id)) saved.delete(p.id);
      else saved.add(p.id);
      writePref('aa-saved-programs', [...saved]);
      if (filter === 'saved') {
        renderPrograms();
        (programList.querySelector('.save') ?? filterButtons.at(-1)).focus();
      } else {
        syncSave();
      }
    });
    programList.append(row);
  }
}

function setFilter(value) {
  filter = value;
  filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
  renderPrograms();
}
filterButtons.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
search.addEventListener('input', renderPrograms);
routeLink.addEventListener('click', () => {
  search.value = '';
  setFilter('all');
  document.getElementById(routeLink.hash.slice(1))?.focus({ preventScroll: true });
});
renderPrograms();

// documents
const docPanel = $('#document');
const docText = $('#doc-text');
const docStatus = $('#doc-status');
const docTabs = $('#doc-tabs');
let currentDoc = 0;

const tabs = documents.map((doc, index) => {
  const tab = document.createElement('button');
  tab.id = 'tab-' + doc.id;
  tab.type = 'button';
  tab.textContent = doc.short;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', docPanel.id);
  tab.addEventListener('click', () => showDocument(index));
  docTabs.append(tab);
  return tab;
});

function showDocument(index) {
  currentDoc = index;
  const doc = documents[index];
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  docPanel.setAttribute('aria-labelledby', tabs[index].id);
  $('#doc-title').textContent = doc.title;
  $('#doc-description').textContent = doc.desc;
  docText.textContent = doc.text;
  docText.scrollTop = 0;
  docStatus.textContent = '';
}

docTabs.addEventListener('keydown', event => {
  const dirs = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
  let index;
  if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = tabs.length - 1;
  else if (dirs[event.key] !== undefined) index = (currentDoc + dirs[event.key] + tabs.length) % tabs.length;
  else return;
  event.preventDefault();
  showDocument(index);
  tabs[index].focus();
});

$('#copy-doc').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(documents[currentDoc].text);
    docStatus.textContent = 'Copied.';
  } catch {
    const selection = getSelection();
    const range = document.createRange();
    range.selectNodeContents(docText);
    selection.removeAllRanges();
    selection.addRange(range);
    docStatus.textContent = 'Text selected. Use your device\'s copy command.';
  }
});

$('#download-doc').addEventListener('click', () => {
  const doc = documents[currentDoc];
  const blob = new Blob([doc.title + '\n\n' + doc.text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'abroad-aspirants-' + doc.id + '.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  docStatus.textContent = 'Download started.';
});

showDocument(0);

// chat
const messages = $('#messages');
const question = $('#question');

function ask(text) {
  const clean = text.trim();
  if (!clean) return;
  const topic = answerTopics.find(([pattern]) => pattern.test(clean))?.[1] ?? 'default';
  for (const [name, role, message] of [['You', 'you', clean], ['Guide', 'guide', answers[topic]]]) {
    const bubble = document.createElement('p');
    bubble.className = 'bubble ' + role;
    const speaker = document.createElement('span');
    speaker.className = 'sr-only';
    speaker.textContent = name + ': ';
    bubble.append(speaker, message);
    messages.append(bubble);
  }
  messages.scrollTop = messages.scrollHeight;
}

$('.chat-form').addEventListener('submit', event => {
  event.preventDefault();
  ask(question.value);
  question.value = '';
  question.focus();
});
$$('.chat-prompts button').forEach(b => b.addEventListener('click', () => ask(b.textContent)));

// dialog
const invite = $('#join-dialog');
$$('[data-join]').forEach(btn => btn.addEventListener('click', () => invite.showModal()));
invite.addEventListener('click', event => {
  if (event.target === invite) invite.close();
});

// initGlobe();
initGlobe();
