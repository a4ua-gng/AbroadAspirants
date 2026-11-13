const stages = [
  ['researching', 'Researching'],
  ['preparing', 'Preparing'],
  ['submitted', 'Submitted'],
];

function nextDay(date) {
  const day = new Date(date + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

function escapeCalendar(text) {
  return text.replaceAll('\\', '\\\\').replace(/[\r\n]+/g, '\\n')
    .replaceAll(',', '\\,').replaceAll(';', '\\;');
}

export function setupPlanner({ programs, saved, readPreference, writePreference, onRemove }) {
  const list = document.querySelector('#planner-items');
  const count = document.querySelector('#planner-count');
  const exportButton = document.querySelector('#export-calendar');
  const stored = readPreference('aa-application-plans', {});
  const plans = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const shortlist = () => [...saved].map(id => programs.get(id)).filter(Boolean);
  const deadline = id => {
    const value = plans[id]?.date;
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      && Number.isFinite(new Date(value + 'T00:00:00Z').getTime()) ? value : '';
  };

  function syncSummary(entries) {
    count.textContent = entries.length === 1 ? '1 saved opportunity' : entries.length + ' saved opportunities';
    exportButton.disabled = !entries.some(program => deadline(program.id));
  }

  function render() {
    const entries = shortlist();
    list.replaceChildren();
    syncSummary(entries);
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'planner-empty';
      empty.innerHTML = 'Save an opportunity on the <a href="#opportunities">opportunity board</a> to start a plan.';
      list.append(empty);
    }
    for (const program of entries) {
      const row = document.createElement('article');
      row.className = 'planner-row';
      row.innerHTML = '<div><h3></h3><a target="_blank" rel="noopener noreferrer">Check official details <span class="symbol symbol-arrow" aria-hidden="true"></span></a></div><label>Application status<select></select></label><label>Confirmed date<input type="date" min="2000-01-01" max="9998-12-31"></label><button type="button">Remove</button>';
      row.querySelector('h3').textContent = program.name;
      row.querySelector('a').href = program.url;
      const status = row.querySelector('select');
      const date = row.querySelector('input');
      const remove = row.querySelector('button');
      for (const [value, label] of stages) status.add(new Option(label, value));
      status.value = stages.some(([value]) => value === plans[program.id]?.stage) ? plans[program.id].stage : stages[0][0];
      date.value = deadline(program.id);
      status.setAttribute('aria-label', 'Application status for ' + program.name);
      date.setAttribute('aria-label', 'Confirmed date for ' + program.name);
      remove.setAttribute('aria-label', 'Remove ' + program.name + ' from my plan');
      function update() {
        if (!date.validity.valid) {
          date.reportValidity();
          return;
        }
        plans[program.id] = { stage: status.value, date: date.value };
        writePreference('aa-application-plans', plans);
        syncSummary(entries);
      }
      status.addEventListener('change', update);
      date.addEventListener('change', update);
      remove.addEventListener('click', () => {
        onRemove(program.id);
        (list.querySelector('button, a') ?? document.querySelector('.board-summary a')).focus();
      });
      list.append(row);
    }
  }

  exportButton.addEventListener('click', () => {
    const items = shortlist().filter(program => deadline(program.id));
    if (!items.length) return;
    const now = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Abroad Aspirants//Application Plan//EN', 'CALSCALE:GREGORIAN'];
    for (const program of items) {
      const date = deadline(program.id);
      lines.push(
        'BEGIN:VEVENT',
        'UID:' + program.id + '-' + date + '@abroadaspirant.in',
        'DTSTAMP:' + now,
        'DTSTART;VALUE=DATE:' + date.replaceAll('-', ''),
        'DTEND;VALUE=DATE:' + nextDay(date).replaceAll('-', ''),
        'SUMMARY:' + escapeCalendar('Application deadline · ' + program.name),
        'URL:' + program.url,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR', '');
    const calendar = new Blob([lines.join('\r\n')], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(calendar);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'abroad-aspirants-application-plan.ics';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  return { render, replace(next) { for(const key of Object.keys(plans)) delete plans[key]; Object.assign(plans,next); render(); } };
}
