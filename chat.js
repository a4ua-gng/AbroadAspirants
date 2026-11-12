import { answers, programs } from './content.js';
import { cities } from './lib/destinations.js';

const topics = [
  [/\b(private|privacy|password|passport|identity)\b/i, 'privacy'],
  [/\b(lor|lors|recommendation|recommendations|referee|reference letter)\b/i, 'lor'],
  [/\b(sop|statement of purpose|motivation|personal statement|essay)\b/i, 'sop'],
  [/\b(cv|resume|résumé|portfolio)\b/i, 'cv'],
  [/\b(interview|interviews)\b/i, 'interview'],
  [/\b(email|mail|teacher)\b/i, 'email'],
  [/\b(deadlines?|eligibility|due date|close)\b/i, 'deadline'],
  [/\b(scholarship|scholarships|funding|mext|uwc|afs|exchange)\b/i, 'scholarship'],
];

const allowedHosts = new Set([...programs.map(program => program.url), ...cities.flatMap(city => city.opportunities.map(opp => opp.url))]
  .map(url => new URL(url).hostname));

export function setupChat() {
  const $ = selector => document.querySelector(selector);
  const messages = $('#messages');
  const question = $('#question');
  const send = $('#send-question');
  const prompts = $('#chat-prompts');
  const modeButtons = [...document.querySelectorAll('[data-chat-mode]')];
  const transcripts = {ai:[], guide:[]};
  let mode = 'guide';
  let city;
  let request;

  function bubble(role, text, error = false) {
    const element = document.createElement('p');
    element.className = 'bubble ' + (role === 'user' ? 'you' : 'guide') + (error ? ' error' : '');
    const speaker = document.createElement('span');
    speaker.className = 'sr-only';
    speaker.textContent = role === 'user' ? 'You: ' : 'Advisor: ';
    const content = document.createElement('span');
    content.textContent = text;
    element.append(speaker, content);
    messages.append(element);
    messages.scrollTop = messages.scrollHeight;
    return content;
  }

  function linkReply(node, text) {
    node.replaceChildren();
    const urlPattern = /\[([^\]\n]{1,100})\]\((https:\/\/[^\s)]+)\)|(https:\/\/[^\s<>)]+[^\s<>)!.,;])/g;
    let last = 0;
    for (const match of text.matchAll(urlPattern)) {
      node.append(text.slice(last, match.index));
      const url = match[2] ?? match[3];
      let host;
      try { host = new URL(url).hostname; } catch { /* Malformed links stay plain text. */ }
      if (allowedHosts.has(host)) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.textContent = match[1] ?? url;
        anchor.className = 'bubble-link';
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        node.append(anchor);
      } else node.append(match[0]);
      last = match.index + match[0].length;
    }
    node.append(text.slice(last));
  }

  function show() {
    messages.replaceChildren();
    if (!transcripts[mode].length) bubble('assistant', mode === 'ai'
      ? 'Tell me your study level, interests and where you’re considering. I can help you shortlist options, work through an application or practise an interview.'
      : 'I can give quick tips about recommendation letters, essays, interviews, CVs and funding research.');
    for (const item of transcripts[mode]) {
      const node = bubble(item.role, item.text, item.error);
      if (item.role === 'assistant' && !item.error) linkReply(node, item.text);
    }
  }

  function renderPrompts() {
    const name = city?.name ?? 'a destination';
    const examples = mode === 'ai' ? [
      ['Funding options', `Show me undergraduate funding options for ${name}. Ask what you need to know about me.`],
      ['Find an exchange', 'I’m in Class 11 in India. Which exchanges or STEM programmes should I research?'],
      ['Compare cities', `Compare ${name} with another city for studying engineering. Focus on how I should research fit and cost.`],
      ['Request an LOR', 'Help me ask my teacher for a recommendation letter. Give me an email I can personalise.'],
      ['Mock interview', 'Start a mock scholarship interview. Ask one question at a time and give feedback after I answer.'],
      ['Application checklist', `Help me build a checklist to research and apply to universities in ${name}.`],
      ['SOP feedback', 'I want feedback on an SOP outline. Ask me for the programme and the outline, then help me improve it.'],
    ] : [
      ['Request an LOR', 'How do I ask for an LOR?'],
      ['Start an SOP', 'How do I start my SOP?'],
      ['Find scholarships', 'How do I find scholarships?'],
      ...(city ? [[`Study in ${city.name}`, `Where can I find study and funding opportunities in ${city.name}?`]] : []),
    ];
    prompts.replaceChildren(...examples.map(([label, text]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = Boolean(request);
      button.addEventListener('click', () => ask(text));
      return button;
    }));
  }

  function setBusy() {
    send.disabled = Boolean(request);
    renderPrompts();
  }

  function setMode(next) {
    request?.abort();
    request = undefined;
    mode = next;
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chatMode === mode)));
    show();
    setBusy();
  }

  async function ask(value) {
    const text = value.trim();
    if (!text || request || text.length > 1200) return;
    const transcript = transcripts[mode];
    transcript.push({role:'user',text});
    bubble('user', text);
    if (mode === 'guide') {
      const key = topics.find(([pattern]) => pattern.test(text))?.[1] ?? 'default';
      const namedCity = cities.find(item => text.toLowerCase().includes(item.name.toLowerCase()));
      const destination = namedCity ?? (/\bthis city\b/i.test(text) ? city : undefined);
      const cityQuestion = destination && /\b(study|funding|universit(?:y|ies)|programmes?|programs?|opportunities|scholarships?)\b/i.test(text)
        && ['default', 'deadline', 'scholarship'].includes(key);
      const reply = cityQuestion
        ? [destination.intro, ...destination.opportunities.map(item => `[${item.title}](${item.url}) · ${item.level} · ${item.type}`),
          'Open the official pages to confirm eligibility, dates and funding.'].join('\n\n')
        : answers[key];
      transcript.push({role:'assistant',text:reply});
      linkReply(bubble('assistant', reply), reply);
      return;
    }

    const controller = new AbortController();
    request = controller;
    setBusy();
    const node = bubble('assistant','Thinking…');
    try {
      const response = await fetch('/api/chat', {
        method:'POST',
        signal:controller.signal,
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({city:city?.id,messages:transcript.filter(item => !item.error).slice(-10).map(item => ({role:item.role,content:item.text.slice(0,2400)}))}),
      });
      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? 'The AI advisor is unavailable. Try again or use Quick guide.');
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let reply = '';
      while (true) {
        const {done,value} = await reader.read();
        if (done) break;
        reply += value;
        node.textContent = reply;
        messages.scrollTop = messages.scrollHeight;
      }
      if (!reply.trim()) throw new Error('The AI advisor returned an empty reply. Try again or use Quick guide.');
      transcript.push({role:'assistant',text:reply});
      linkReply(node, reply);
    } catch (error) {
      if (controller.signal.aborted) return;
      const text = error instanceof Error && error.message !== 'Failed to fetch' ? error.message
        : 'Could not reach the AI advisor. Try again or use Quick guide.';
      transcript.push({role:'assistant',text,error:true});
      node.textContent = text;
      node.parentElement.classList.add('error');
    } finally {
      if (request === controller) {
        request = undefined;
        setBusy();
      }
    }
  }

  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.chatMode)));
  $('#clear-chat').addEventListener('click', () => {
    transcripts[mode].length = 0;
    setMode(mode);
    question.focus();
  });
  $('.chat-form').addEventListener('submit', event => {
    event.preventDefault();
    ask(question.value);
    question.value = '';
    question.focus();
  });
  show();

  function setCity(next) {
    city = next;
    $('#chat-context').textContent = 'Destination context · ' + next.name;
    renderPrompts();
  }

  return {
    setCity,
    startForCity(next) {
      setCity(next);
      question.value = `Where can I find study and funding opportunities in ${next.name}?`;
      $('#desk').scrollIntoView();
      question.focus({preventScroll:true});
    },
  };
}
