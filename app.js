const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function readPreference(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Current-tab interactions work when storage is unavailable.
  }
}

const menuButton = $('#menu-toggle');
const navigation = $('#navigation');

function setMenu(open) {
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') === 'false'));
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !navigation.classList.contains('open')) return;
  setMenu(false);
  menuButton.focus();
});

const motionButton = $('#motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPreference = readPreference('aa-motion', null);
const motionEnabled = () => motionPreference ?? !reducedMotion.matches;
const globe = setupGlobe($('#globe'), motionEnabled);

function syncMotion() {
  const enabled = motionEnabled();
  document.documentElement.classList.toggle('motion-paused', !enabled);
  motionButton.setAttribute('aria-pressed', String(!enabled));
  motionButton.setAttribute('aria-label', enabled ? 'Pause animation' : 'Resume animation');
  motionButton.firstElementChild.textContent = enabled ? 'Ⅱ' : '▶';
  globe.refresh();
  updateJourney();
}

motionButton.addEventListener('click', () => {
  motionPreference = !motionEnabled();
  writePreference('aa-motion', motionPreference);
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);

const routeButtons = $$('[data-route]');
const routeLink = $('#route-link');

routeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.route);
    const route = routes[index];
    globe.select(index);
    for (const option of routeButtons) option.setAttribute('aria-pressed', String(option === button));
    $('#route-code').textContent = `IND → ${route.code}`;
    routeLink.firstChild.nodeValue = route.name + ' ';
    routeLink.hash = 'program-' + route.program;
  });
});
routeLink.hash = 'program-' + routes[0].program;

const progressBar = $('.progress');
const journey = $('.journey-body');
const stops = $$('.stop');
const journeyPlane = $('#journey-plane');
let scrollFrame = 0;

function updateJourney() {
  scrollFrame = 0;
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${scrollable > 0 ? scrollY / scrollable : 0})`;
  const bounds = journey.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (innerHeight * .59 - bounds.top) / (bounds.height * .83)));
  const current = Math.min(stops.length - 1, Math.floor(progress * stops.length));
  stops.forEach((stop, index) => stop.classList.toggle('active', index === current));
  const position = motionEnabled() ? progress : current / (stops.length - 1);
  const x = 18 + position * 66;
  const y = 78 - position * 58 - Math.sin(position * Math.PI) * 13;
  journeyPlane.style.left = `${x}%`;
  journeyPlane.style.top = `${y}%`;
  journeyPlane.style.transform = `translate(-50%, -50%) rotate(${-23 + position * 26}deg)`;
}

function queueJourneyUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateJourney);
}

window.addEventListener('scroll', queueJourneyUpdate, {passive: true});
window.addEventListener('resize', queueJourneyUpdate);
syncMotion();

const programList = $('#programs');
const resultCount = $('#result-count');
const search = $('#program-search');
const filterButtons = $$('[data-filter]');
const storedPrograms = readPreference('aa-saved-programs', []);
const saved = new Set(Array.isArray(storedPrograms) ? storedPrograms : []);
let filter = 'all';

function renderPrograms() {
  const searchTerm = search.value.trim().toLowerCase();
  const matches = programs.filter(program => {
    const categoryMatch = filter === 'all' || program.cat.split(' ').includes(filter)
      || (filter === 'saved' && saved.has(program.id));
    return categoryMatch && `${program.name} ${program.tag} ${program.copy}`.toLowerCase().includes(searchTerm);
  });

  programList.replaceChildren();
  resultCount.textContent = `${matches.length} ${matches.length === 1 ? 'program' : 'programs'}`;
  if (!matches.length) {
    const message = document.createElement('p');
    message.className = 'empty';
    message.textContent = filter === 'saved' && !saved.size ? 'Save a program using the star beside its official link.' : 'No programs match this search.';
    programList.append(message);
  }
  for (const program of matches) {
    const row = document.createElement('article');
    row.className = 'program';
    row.id = 'program-' + program.id;
    row.tabIndex = -1;
    row.innerHTML = '<span class="code"></span><div><h3></h3><p></p></div><a target="_blank" rel="noopener noreferrer">Official site ↗</a><button class="save" type="button"></button>';
    row.querySelector('.code').textContent = program.symbol;
    row.querySelector('h3').textContent = program.name;
    row.querySelector('p').textContent = program.copy;
    const link = row.querySelector('a');
    link.href = program.url;
    link.setAttribute('aria-label', 'Official site for ' + program.name);
    const save = row.querySelector('.save');

    function syncSave() {
      const isSaved = saved.has(program.id);
      save.textContent = isSaved ? '★' : '☆';
      save.setAttribute('aria-label', 'Save ' + program.name);
      save.setAttribute('aria-pressed', String(isSaved));
    }

    syncSave();
    save.addEventListener('click', () => {
      if (saved.has(program.id)) saved.delete(program.id);
      else saved.add(program.id);
      writePreference('aa-saved-programs', [...saved]);
      if (filter === 'saved') {
        renderPrograms();
        (programList.querySelector('.save') ?? filterButtons.at(-1)).focus();
      } else syncSave();
    });
    programList.append(row);
  }
}

function setFilter(value) {
  filter = value;
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === value)));
  renderPrograms();
}

filterButtons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
search.addEventListener('input', renderPrograms);
routeLink.addEventListener('click', () => {
  search.value = '';
  setFilter('all');
  document.getElementById(routeLink.hash.slice(1))?.focus({preventScroll: true});
});
renderPrograms();

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
  const directions = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1};
  let index;
  if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = tabs.length - 1;
  else if (Object.hasOwn(directions, event.key)) index = (currentDoc + directions[event.key] + tabs.length) % tabs.length;
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
    docStatus.textContent = 'Text selected. Use your device’s copy command.';
  }
});

$('#download-doc').addEventListener('click', () => {
  const doc = documents[currentDoc];
  const file = new Blob([doc.title + '\n\n' + doc.text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(file);
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

const answerTopics = [
  [/\b(private|privacy|password|passport|identity)\b/i, 'privacy'],
  [/\b(lor|lors|recommendation|recommendations|referee|reference letter)\b/i, 'lor'],
  [/\b(sop|statement of purpose|motivation|personal statement|essay)\b/i, 'sop'],
  [/\b(cv|resume|résumé|portfolio)\b/i, 'cv'],
  [/\b(interview|interviews)\b/i, 'interview'],
  [/\b(email|mail|teacher)\b/i, 'email'],
  [/\b(deadline|deadline[s]?|eligibility|due date|close)\b/i, 'deadline'],
  [/\b(scholarship|scholarships|funding|mext|uwc|afs|exchange)\b/i, 'scholarship'],
];
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
$$('.chat-prompts button').forEach(button => button.addEventListener('click', () => ask(button.textContent)));

const invite = $('#join-dialog');
$$('[data-join]').forEach(button => button.addEventListener('click', () => invite.showModal()));
invite.addEventListener('click', event => {
  if (event.target === invite) invite.close();
});
