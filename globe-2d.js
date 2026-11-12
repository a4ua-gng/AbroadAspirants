import { launchPoint } from './lib/destinations.js';
import { createGlobeMarkers, landSampler } from './globe-support.js';

const RAD = Math.PI / 180;
const TURN = Math.PI * 2;
const SIZE = 224;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function coordinate(lat, lon, height = 0) {
  return { lat, lon, sinLat:Math.sin(lat), cosLat:Math.cos(lat), height };
}

function flightPath(from, to) {
  const vector = point => [point.cosLat * Math.cos(point.lon), point.sinLat, point.cosLat * Math.sin(point.lon)];
  const start = vector(from);
  const end = vector(to);
  const angle = Math.acos(clamp(start.reduce((sum, value, axis) => sum + value * end[axis], 0), -1, 1));
  const arc = Math.sin(angle);
  return Array.from({ length:49 }, (_, index) => {
    const t = index / 48;
    const a = Math.sin((1 - t) * angle) / arc;
    const b = Math.sin(t * angle) / arc;
    const [x, y, z] = start.map((value, axis) => value * a + end[axis] * b);
    return coordinate(Math.asin(clamp(y, -1, 1)), Math.atan2(z, x), .17 * Math.sin(Math.PI * t));
  });
}

function earthSurface() {
  const surface = document.createElement('canvas');
  surface.width = SIZE;
  surface.height = SIZE;
  const ctx = surface.getContext('2d');
  const image = ctx.createImageData(SIZE, SIZE);
  const pixels = image.data;
  const isLand = landSampler();
  const samples = [];
  for (let row = 0; row < SIZE; row++) {
    const y = 1 - (row + .5) * 2 / SIZE;
    for (let column = 0; column < SIZE; column++) {
      const x = (column + .5) * 2 / SIZE - 1;
      const distance = x * x + y * y;
      if (distance >= 1) continue;
      const z = Math.sqrt(1 - distance);
      const light = .42 + .59 * clamp(.9 * z - .45 * x + .42 * y, 0, 1);
      samples.push({ offset:(row * SIZE + column) * 4, x, y, z, light });
    }
  }
  let lastLatitude = Infinity;
  let lastLongitude = Infinity;

  return (lat, lon, sinLat, cosLat) => {
    if (Math.abs(lat - lastLatitude) + Math.abs(lon - lastLongitude) < .0014) return surface;
    lastLatitude = lat;
    lastLongitude = lon;
    for (const {offset, x, y, z, light} of samples) {
      const latitude = Math.asin(clamp(y * cosLat + z * sinLat, -1, 1));
      const longitude = lon + Math.atan2(x, z * cosLat - y * sinLat);
      const mapX = ((Math.floor(longitude / RAD + 180) % 360) + 360) % 360;
      const mapY = clamp(Math.floor(90 - latitude / RAD), 0, 179);
      const land = isLand(mapX, mapY);
      const grid = mapX % 15 === 0 || mapY % 15 === 0 ? 12 : 0;
      const latitudeTint = Math.abs(latitude) * 10;
      pixels[offset] = (land ? 98 + latitudeTint : 34 + latitudeTint) * light + grid;
      pixels[offset + 1] = (land ? 184 - latitudeTint : 94 - latitudeTint) * light + grid;
      pixels[offset + 2] = (land ? 172 : 177) * light + grid;
      pixels[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return surface;
  };
}

export function createCanvasGlobe(container, onSelect, motionEnabled) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw Error('Canvas drawing is unavailable');
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);
  const surface = earthSurface();
  const markers = createGlobeMarkers(container, onSelect).map(marker => ({
    ...marker, location:coordinate(marker.city.lat * RAD, marker.city.lon * RAD),
  }));
  const origin = coordinate(launchPoint.lat * RAD, launchPoint.lon * RAD);
  let width = 0;
  let height = 0;
  let lat = 25 * RAD;
  let lon = 95 * RAD;
  let targetLat = lat;
  let targetLon = lon;
  let frame = 0;
  let visible = true;
  let selected;
  let route = [];
  let started = 0;
  let scroll = 0;
  let drag;

  function draw(now) {
    frame = 0;
    if (!width || !height) return;
    const motion = motionEnabled();
    const ease = motion ? .16 : 1;
    lat += (targetLat - lat) * ease;
    lon += (targetLon - lon) * ease;
    const progress = selected && motion ? clamp((now - started) / 820, 0, 1) : 1;
    const radius = Math.min(width, height) * .36 * (selected ? 1 + (.18 + scroll * .12) * progress : 1);
    const cx = width / 2;
    const cy = height / 2;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    function project(point) {
      const delta = point.lon - lon;
      const local = point.cosLat * Math.cos(delta);
      const scale = radius * (1 + point.height);
      return {
        x:cx + point.cosLat * Math.sin(delta) * scale,
        y:cy - (point.sinLat * cosLat - local * sinLat) * scale,
        depth:point.sinLat * sinLat + local * cosLat,
      };
    }

    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(cx, cy, radius * .86, cx, cy, radius * 1.24);
    glow.addColorStop(0, '#c6a3fc74');
    glow.addColorStop(.54, '#8278f239');
    glow.addColorStop(1, '#7a8afa00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d6bafa68';
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.22, radius * .36, -.25, 0, TURN);
    ctx.stroke();
    ctx.drawImage(surface(lat, lon, sinLat, cosLat), cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.strokeStyle = '#aedbff9f';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TURN);
    ctx.stroke();

    const departure = project(origin);
    if (departure.depth > .03) {
      ctx.fillStyle = '#d3fff6';
      ctx.beginPath();
      ctx.arc(departure.x, departure.y, 3.5, 0, TURN);
      ctx.fill();
    }

    if (selected) {
      const visiblePoints = Math.ceil(route.length * progress);
      let previous;
      ctx.strokeStyle = selected.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const point of route.slice(0, visiblePoints)) {
        const current = project(point);
        if (current.depth > -.03) {
          if (previous?.depth > -.03) ctx.lineTo(current.x, current.y);
          else ctx.moveTo(current.x, current.y);
        }
        previous = current;
      }
      ctx.stroke();
    }

    for (const {button, city, location} of markers) {
      const point = project(location);
      button.hidden = point.depth < .22 || point.x < 15 || point.x > width - 15 || point.y < 15 || point.y > height - 15;
      button.style.left = point.x + 'px';
      button.style.top = point.y + 'px';
      button.classList.toggle('active', selected === city);
    }
    const moving = Math.abs(targetLat - lat) + Math.abs(targetLon - lon) > .0015;
    if (visible && !document.hidden && motion && (moving || progress < 1)) frame = requestAnimationFrame(draw);
  }

  function refresh() {
    if (frame) cancelAnimationFrame(frame);
    draw(performance.now());
  }

  new ResizeObserver(() => {
    width = container.clientWidth;
    height = container.clientHeight;
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    refresh();
  }).observe(container);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible || frame) refresh();
  }).observe(container);
  document.addEventListener('visibilitychange', refresh);

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { x:event.clientX, y:event.clientY };
    canvas.setPointerCapture(event.pointerId);
    container.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    targetLon -= (event.clientX - drag.x) * .36 * RAD;
    targetLat = clamp(targetLat + (event.clientY - drag.y) * .35 * RAD, -70 * RAD, 70 * RAD);
    drag = { x:event.clientX, y:event.clientY };
    if (!frame) refresh();
  });
  canvas.addEventListener('lostpointercapture', () => {
    drag = undefined;
    container.classList.remove('dragging');
  });

  return {
    select(city) {
      selected = city;
      targetLat = city.lat * RAD;
      targetLon = lon + ((((city.lon * RAD - lon) % TURN) + 3 * Math.PI) % TURN - Math.PI);
      route = flightPath(origin, coordinate(city.lat * RAD, city.lon * RAD));
      started = performance.now();
      refresh();
    },
    scroll(progress) {
      if (scroll === progress) return;
      scroll = progress;
      if (!frame) refresh();
    },
    refresh,
  };
}
