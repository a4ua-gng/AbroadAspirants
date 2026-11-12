import { cities } from './lib/destinations.js';
import { landMask } from './globe-data.js';

export function landSampler() {
  const data = atob(landMask);
  return (x, y) => y >= 0 && y < 180 && Boolean(data.charCodeAt(y * 45 + (x >> 3)) & (128 >> (x & 7)));
}

export function createGlobeMarkers(container, onSelect) {
  return cities.map(city => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'globe-marker';
    button.tabIndex = -1;
    button.hidden = true;
    button.setAttribute('aria-label', 'Fly to ' + city.name);
    button.style.setProperty('--pin', city.color);
    button.innerHTML = '<span></span><b></b>';
    button.lastElementChild.textContent = city.code;
    button.addEventListener('click', () => onSelect(city.id));
    container.append(button);
    return {button, city};
  });
}
