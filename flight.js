import { cities, cityById } from './lib/destinations.js';

export function setupFlight({ motionEnabled, onCityChange }) {
  const $ = selector => document.querySelector(selector);
  const scene = $('#globe-scene');
  const arrival = $('#arrival');
  const screen = $('.arrival-screen');
  const film = $('#arrival-video');
  const photo = $('#city-landmark');
  const replay = $('#replay');
  const replayLabel = replay.querySelector('.replay-label');
  const list = $('#city-buttons');
  const pathCity = () => cityById(location.pathname.match(/^\/city\/([^/]+)\/?$/)?.[1]);
  let globe;
  let selection;
  let autoLanding;
  let frame;
  let playing = false;
  let filmLoaded = false;
  let interacted = false;

  const buttons = cities.map(city => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'city-button';
    button.style.setProperty('--city-color', city.color);
    button.style.setProperty('--city-image', `url('/assets/cities/${city.id}.webp')`);
    button.innerHTML = '<strong></strong><span aria-hidden="true"></span><small></small>';
    button.children[0].textContent = city.name;
    button.children[1].textContent = city.code;
    button.children[2].textContent = city.country;
    button.addEventListener('click', () => pick(city.id));
    list.append(button);
    return button;
  });

  function populate(city) {
    $('#flight-hud-destination').textContent = `GAU → ${city.code} · ${city.name}`;
    $('#arrival-title').textContent = city.name;
    $('#arrival-landmark-label').textContent = city.landmark;
    $('#arrival-route').textContent = `Guwahati → ${city.name}`;
    $('#arrival-coordinates').textContent = city.coordinates;
    $('#city-guide-title').textContent = `Study in ${city.name}`;
    $('#guide-country').textContent = city.country;
    $('#city-intro').textContent = city.intro;
    $('#city-life').textContent = city.life;
    $('#city-first').textContent = city.first;
    arrival.style.setProperty('--arrival-accent', city.color);
    photo.alt = city.landmark;
    photo.loading = 'lazy';
    photo.src = '/assets/cities/' + city.id + '.webp';

    const credit = $('#photo-credit');
    credit.replaceChildren();
    if (city.photoCredit) {
      const link = document.createElement('a');
      link.href = city.photoCredit.url;
      link.textContent = city.photoCredit.label;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      credit.append('Photo ', link);
    }

    const opportunities = $('#city-opportunities');
    opportunities.replaceChildren(...city.opportunities.map(opportunity => {
      const card = document.createElement('article');
      card.className = 'city-opportunity';
      card.innerHTML = '<p class="eyebrow"></p><h3></h3><p></p><a target="_blank" rel="noopener noreferrer">Official information <span class="symbol symbol-arrow" aria-hidden="true"></span></a>';
      card.children[0].textContent = `${opportunity.level} · ${opportunity.type}`;
      card.children[1].textContent = opportunity.title;
      card.children[2].textContent = opportunity.detail;
      card.children[3].href = opportunity.url;
      card.children[3].setAttribute('aria-label', 'Official information for ' + opportunity.title);
      return card;
    }));
  }

  function ensureFilm() {
    if (filmLoaded) return;
    filmLoaded = true;
    film.preload = 'auto';
    film.src = '/assets/cities/' + selection.id + '.mp4';
  }

  function setCity(city, markSelected) {
    if (selection?.id !== city.id) {
      selection = city;
      playing = false;
      film.pause();
      film.removeAttribute('src');
      film.load();
      filmLoaded = false;
      arrival.classList.remove('video-ready', 'is-playing');
      replayLabel.textContent = 'Play 3D approach';
      replay.disabled = false;
      film.poster = '/assets/cities/' + city.id + '-render.webp';
      populate(city);
    }
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(cities[index] === city)));
    if (markSelected) globe?.select(city);
    onCityChange(city);
    // Photo galleries replace the generated approach footage.
    update();
  }

  function pick(id) {
    const city = cityById(id);
    if (!city) return;
    interacted = true;
    clearTimeout(autoLanding);
    setCity(city, true);
    if (location.pathname !== '/city/' + city.id) history.pushState({ city:city.id }, '', '/city/' + city.id);
    const globeVisible = scene.getBoundingClientRect().bottom > 115;
    autoLanding = setTimeout(() => {
      const heading = $('#arrival-title');
      heading.focus({preventScroll:true});
      arrival.scrollIntoView({behavior:motionEnabled() ? 'smooth' : 'instant'});
    }, motionEnabled() && globe && globeVisible ? 850 : 0);
  }

  function update() {
    const bounds = arrival.getBoundingClientRect();
    const top = Number.parseFloat(getComputedStyle(screen).top) || 0;
    const distance = Math.max(1, bounds.height - screen.offsetHeight);
    const progress = Math.max(0, Math.min(1, (top - bounds.top) / distance));
    const motion = motionEnabled();
    const blend = motion ? Math.max(.10, Math.min(1, (progress - .42) / .54)) : 1;
    arrival.style.setProperty('--arrival-progress', progress);
    arrival.style.setProperty('--arrival-photo', blend);
    arrival.style.setProperty('--arrival-scale', motion ? 1.11 - .08 * progress : 1);
    if (!playing && motion && film.readyState >= 2 && Number.isFinite(film.duration)) {
      const time = Math.min(film.duration - .04, Math.max(0, progress * film.duration / .8));
      if (Math.abs(film.currentTime - time) > .075 && !film.seeking) film.currentTime = time;
    }
    if (bounds.top > -innerHeight && bounds.top < innerHeight * 1.6) globe?.scroll(progress);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  }

  function stopReplay() {
    playing = false;
    film.pause();
    arrival.classList.remove('is-playing');
    replayLabel.textContent = 'Play 3D approach';
    update();
  }

  replay.addEventListener('click', async () => {
    if (playing) {
      stopReplay();
      return;
    }
    ensureFilm();
    playing = true;
    film.currentTime = 0;
    arrival.classList.add('is-playing');
    replayLabel.textContent = 'Pause 3D approach';
    try {
      await film.play();
    } catch {
      if (playing) stopReplay();
    }
  });
  film.addEventListener('ended', stopReplay);
  film.addEventListener('loadeddata', () => {
    arrival.classList.add('video-ready');
    update();
  });
  film.addEventListener('seeked', schedule);
  film.addEventListener('error', () => {
    arrival.classList.remove('video-ready');
    stopReplay();
    replayLabel.textContent = '3D approach unavailable';
    replay.disabled = true;
  });

  photo.addEventListener('error', () => {
    photo.removeAttribute('src');
    photo.alt = '';
  });
  new IntersectionObserver(([entry]) => {
    // Media remains deferred; the photo is lazy loaded.
    if (!entry.isIntersecting && playing) stopReplay();
  }, { rootMargin:'100px' }).observe(screen);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  window.addEventListener('popstate', () => {
    const city = pathCity();
    setCity(city ?? cities[0], Boolean(city));
  });

  const sharedCity = pathCity();
  setCity(sharedCity ?? cities[0], false);
  async function initializeGlobe() {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', {alpha:true, antialias:true, powerPreference:'high-performance'});
      if (context) {
        const { createGlobe } = await import('./globe-3d.js');
        globe = createGlobe(scene, pick, motionEnabled, canvas, context);
      }
    } catch {
      scene.querySelectorAll('canvas, .globe-marker').forEach(element => element.remove());
    }
    if (!globe) {
      const { createCanvasGlobe } = await import('./globe-2d.js');
      globe = createCanvasGlobe(scene, pick, motionEnabled);
    }
    scene.classList.add('has-globe');
    $('#globe-instruction').textContent = 'Drag to rotate · tap a pin';
    if (sharedCity || interacted) globe.select(selection);
  }
  const globeObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    globeObserver.disconnect();
    initializeGlobe().catch(() => {
      $('#globe-instruction').textContent = 'Select a city below';
    });
  }, {rootMargin:'220px'});
  globeObserver.observe(scene);
  if (sharedCity && !location.hash) requestAnimationFrame(() => arrival.scrollIntoView({behavior:'instant'}));

  return {
    current: () => selection,
    choose: id => pick(id),
    tour: id => { if (interacted) return; const city = cityById(id); if (city) setCity(city, true); },
    manual: () => interacted,
    takeControl: () => {interacted=true;clearTimeout(autoLanding);},
    resume: () => { interacted = false; },
    refresh() {
      globe?.refresh();
      if (!motionEnabled() && playing) stopReplay();
      update();
    },
  };
}
