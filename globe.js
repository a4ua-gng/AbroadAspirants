const routes = [
  { code: 'JPN', name: 'Japan · MEXT Scholarship', program: 'mext', lat: 35.68, lon: 139.69, view: [103, 26] },
  { code: 'DEU', name: 'Germany · DAAD scholarships', program: 'daad', lat: 50.74, lon: 7.10, view: [42, 31] },
  { code: 'GBR', name: 'United Kingdom · UWC pathway', program: 'uwc', lat: 51.40, lon: -3.53, view: [33, 33] },
];

function setupGlobe(canvas, motionEnabled) {
  const ctx = canvas.getContext('2d');
  const radians = Math.PI / 180;
  const maxLatitude = 72;
  const clamp = (number, min, max) => Math.min(max, Math.max(min, number));
  let route = routes[0];
  let lon = route.view[0];
  let lat = route.view[1];
  let targetLon = lon;
  let targetLat = lat;
  let previousFrame = 0;
  let flightProgress = .25;
  let pointer = null;
  let frame = 0;
  let inView = true;
  let size = 0;
  let radius = 0;
  let cx = 0;
  let cy = 0;
  let atmosphere;
  let ocean;
  let shade;
  let flightPath;
  const origin = toPoint(26.14, 91.74);
  const points = [];
  const starPoints = Array.from({length: 145}, (_, i) => [
    ((i * 257 + 73) % 991) / 991,
    ((i * i * 53 + 131) % 983) / 983,
    .35 + ((i * 9) % 13) / 15,
  ]);

  if (!ctx) {
    canvas.hidden = true;
    canvas.nextElementSibling.style.display = 'block';
    return { select() {}, refresh() {} };
  }

  const mask = atob(landMask);
  for (let y = 1; y < 180; y += 2) {
    const latitude = 90 - y;
    const step = Math.max(2, Math.round(2 / Math.cos(latitude * radians)));
    for (let x = 0; x < 360; x += step) {
      if (mask.charCodeAt(y * 45 + (x >> 3)) & (128 >> (x & 7))) {
        points.push(toPoint(latitude, x - 180));
      }
    }
  }

  function toPoint(latitude, longitude) {
    const cosLat = Math.cos(latitude * radians);
    return [
      cosLat * Math.sin(longitude * radians),
      Math.sin(latitude * radians),
      cosLat * Math.cos(longitude * radians),
    ];
  }

  const grid = [];
  for (let parallel = -60; parallel <= 60; parallel += 20) {
    grid.push(Array.from({length: 121}, (_, i) => toPoint(parallel, i * 3)));
  }
  for (let meridian = 0; meridian < 360; meridian += 20) {
    grid.push(Array.from({length: 61}, (_, i) => toPoint(i * 3 - 90, meridian)));
  }

  function routePath(destination) {
    const end = toPoint(destination.lat, destination.lon);
    const angle = Math.acos(clamp(origin.reduce((sum, value, i) => sum + value * end[i], 0), -1, 1));
    const sinAngle = Math.sin(angle);
    return Array.from({length: 101}, (_, i) => {
      const t = i / 100;
      const startWeight = Math.sin((1 - t) * angle) / sinAngle;
      const endWeight = Math.sin(t * angle) / sinAngle;
      const altitude = 1 + Math.sin(Math.PI * t) * .18;
      return origin.map((value, axis) => (startWeight * value + endWeight * end[axis]) * altitude);
    });
  }

  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }

  function resize() {
    const width = canvas.clientWidth;
    if (!width) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = canvas.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    size = width;
    radius = size * .353;
    cx = size / 2;
    cy = size / 2;
    atmosphere = ctx.createRadialGradient(cx, cy, radius * .86, cx, cy, radius * 1.34);
    atmosphere.addColorStop(0, '#6586ff00');
    atmosphere.addColorStop(.3, '#497aff60');
    atmosphere.addColorStop(.65, '#6248e920');
    atmosphere.addColorStop(1, '#4f60ff00');
    ocean = ctx.createRadialGradient(cx - radius * .45, cy - radius * .55, 0, cx, cy, radius * 1.22);
    ocean.addColorStop(0, '#3858a9');
    ocean.addColorStop(.49, '#1a2b6b');
    ocean.addColorStop(1, '#090f31');
    shade = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    shade.addColorStop(.15, '#04082600');
    shade.addColorStop(.65, '#070c2914');
    shade.addColorStop(1, '#050922bf');
    draw();
  }

  function draw() {
    if (!size) return;
    const sinLon = Math.sin(lon * radians);
    const cosLon = Math.cos(lon * radians);
    const sinLat = Math.sin(lat * radians);
    const cosLat = Math.cos(lat * radians);

    function project([x, y, z]) {
      const front = z * cosLon + x * sinLon;
      return [
        cx + radius * (x * cosLon - z * sinLon),
        cy - radius * (y * cosLat - front * sinLat),
        front * cosLat + y * sinLat,
      ];
    }

    function trace(line) {
      ctx.beginPath();
      let visible = false;
      for (const point of line) {
        const [x, y, depth] = project(point);
        if (depth < .015) {
          visible = false;
          continue;
        }
        if (visible) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        visible = true;
      }
      ctx.stroke();
    }

    ctx.clearRect(0, 0, size, size);
    for (const [x, y, alpha] of starPoints) {
      ctx.fillStyle = `rgba(180,207,255,${alpha * .5})`;
      ctx.fillRect(x * size, y * size, 1, 1);
    }
    ctx.strokeStyle = '#9caffb46';
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 1.31, radius * .54, -.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    circle(cx, cy, radius * 1.34);
    ctx.fillStyle = atmosphere;
    ctx.fill();
    circle(cx, cy, radius);
    ctx.fillStyle = ocean;
    ctx.fill();
    ctx.strokeStyle = '#a2c8ff88';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#82a7ff35';
    ctx.lineWidth = .65;
    grid.forEach(trace);
    for (const point of points) {
      const [x, y, depth] = project(point);
      if (depth < 0) continue;
      const dot = .72 + depth * size / 288;
      ctx.fillStyle = `rgba(144,211,255,${.25 + depth * .48})`;
      ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }
    ctx.fillStyle = shade;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    const line = ctx.createLinearGradient(cx - radius, cy + radius / 2, cx + radius, cy - radius / 2);
    line.addColorStop(0, '#A981FF');
    line.addColorStop(.52, '#7FA8FF');
    line.addColorStop(1, '#8DEAFF');
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.9;
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 10;
    trace(flightPath);
    ctx.shadowBlur = 0;

    const planeIndex = Math.floor(flightProgress * 96) + 2;
    const [px, py, depth] = project(flightPath[planeIndex]);
    const [nx, ny] = project(flightPath[planeIndex + 1]);
    if (depth > .025) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(ny - py, nx - px));
      ctx.scale(size / 455, size / 455);
      ctx.fillStyle = '#edf8ff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(6, 2);
      ctx.lineTo(1, 2);
      ctx.lineTo(-4, 10);
      ctx.lineTo(-7, 10);
      ctx.lineTo(-4, 2);
      ctx.lineTo(-9, 2);
      ctx.lineTo(-12, 5);
      ctx.lineTo(-13, 5);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-13, -5);
      ctx.lineTo(-12, -5);
      ctx.lineTo(-9, -2);
      ctx.lineTo(-4, -2);
      ctx.lineTo(-7, -10);
      ctx.lineTo(-4, -10);
      ctx.lineTo(1, -2);
      ctx.lineTo(6, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const labelSize = Math.max(9, Math.round(size * .022));
    ctx.font = `600 ${labelSize}px monospace`;
    for (const [point, label, align] of [[origin, 'IND', -1], [flightPath[100], route.code, 1]]) {
      const [x, y, depth] = project(point);
      if (depth < .025) continue;
      circle(x, y, 8);
      ctx.strokeStyle = '#97d8ff70';
      ctx.lineWidth = 1;
      ctx.stroke();
      circle(x, y, 3.1);
      ctx.fillStyle = '#d3f3ff';
      ctx.fill();
      ctx.textAlign = align === -1 ? 'right' : 'left';
      ctx.shadowColor = '#0b1138';
      ctx.shadowBlur = 5;
      ctx.fillText(label, x + align * 12, y + 3.5);
      ctx.shadowBlur = 0;
    }
  }

  function refresh() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousFrame = 0;
    if (inView && !document.hidden && motionEnabled()) frame = requestAnimationFrame(tick);
    else {
      lon = targetLon;
      lat = targetLat;
      draw();
    }
  }

  function tick(now) {
    if (now - previousFrame >= 1000 / 35) {
      const seconds = previousFrame ? Math.min((now - previousFrame) / 1000, .1) : 0;
      previousFrame = now;
      lon += (targetLon - lon) * .19;
      lat += (targetLat - lat) * .19;
      flightProgress = (flightProgress + seconds * .10) % 1;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return;
    targetLon -= (event.clientX - pointer.x) * .46;
    targetLat = clamp(targetLat + (event.clientY - pointer.y) * .40, -maxLatitude, maxLatitude);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    lon = targetLon;
    lat = targetLat;
    draw();
  });

  canvas.addEventListener('lostpointercapture', () => {
    pointer = null;
    canvas.classList.remove('dragging');
  });

  flightPath = routePath(route);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    refresh();
  }).observe(canvas);
  document.addEventListener('visibilitychange', refresh);
  resize();
  refresh();

  return {
    select(index) {
      route = routes[index];
      targetLon = lon + ((((route.view[0] - lon) % 360) + 540) % 360 - 180);
      targetLat = route.view[1];
      flightPath = routePath(route);
      flightProgress = .18;
      refresh();
    },
    refresh,
  };
}
