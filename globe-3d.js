import * as THREE from 'three';
import { launchPoint } from './lib/destinations.js';
import { createGlobeMarkers, landSampler } from './globe-support.js';

const RADIUS = 1.46;
const RAD = Math.PI / 180;
const clamp = THREE.MathUtils.clamp;

function direction(lat, lon) {
  const polar = (lon + 180) * RAD;
  const horizontal = Math.cos(lat * RAD);
  return new THREE.Vector3(-Math.cos(polar) * horizontal, Math.sin(lat * RAD), Math.sin(polar) * horizontal);
}

function texture() {
  const map = document.createElement('canvas');
  map.width = 1440;
  map.height = 720;
  const ctx = map.getContext('2d');
  const isLand = landSampler();
  const ocean = ctx.createLinearGradient(0, 0, map.width, map.height);
  ocean.addColorStop(0, '#121215');
  ocean.addColorStop(.39, '#1a1a20');
  ocean.addColorStop(.72, '#17171c');
  ocean.addColorStop(1, '#0e0e12');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, map.width, map.height);
  for (let y = 0; y < 180; y++) {
    for (let x = 0; x < 360; x++) {
      if (!isLand(x, y)) continue;
      const noise = ((x * 43 + y * 29 + x * y * 7) % 19) / 19;
      const coast = !isLand((x + 1) % 360, y) || !isLand((x + 359) % 360, y) || !isLand(x, y + 1) || !isLand(x, y - 1);
      ctx.fillStyle = `hsl(245 8% ${coast ? 45 + noise * 9 : 16 + noise * 5}%)`;
      ctx.fillRect(x * 4, y * 4, 4, 4);
      if (!coast && x % 4 === 0 && y % 3 === 0) {
        ctx.fillStyle = '#cbc8d3a1';
        ctx.fillRect(x * 4 + 1, y * 4 + 1, 1, 1);
      }
    }
  }
  ctx.strokeStyle = '#c8c5d64f';
  ctx.lineWidth = 1;
  for (let x = 0; x < map.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, map.height);
    ctx.stroke();
  }
  for (let y = 60; y < map.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(map.width, y);
    ctx.stroke();
  }
  const result = new THREE.CanvasTexture(map);
  result.colorSpace = THREE.SRGBColorSpace;
  result.anisotropy = 4;
  return result;
}

function atmosphere() {
  return new THREE.ShaderMaterial({
    uniforms: { glow: { value: new THREE.Color('#79b9e8') } },
    vertexShader: `
      varying vec3 outward;
      varying vec3 directionToCamera;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        directionToCamera = normalize(-view.xyz);
        outward = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      uniform vec3 glow;
      varying vec3 outward;
      varying vec3 directionToCamera;
      void main() {
        float intensity = pow(1.0 - abs(dot(normalize(outward), normalize(directionToCamera))), 3.4);
        gl_FragColor = vec4(glow, intensity * 0.37);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
}

function makeStars() {
  const values = new Float32Array(155 * 3);
  let seed = 23;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < values.length; i += 3) {
    const point = direction(random() * 180 - 90, random() * 360 - 180).multiplyScalar(7 + random() * 5);
    point.toArray(values, i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(values, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({color: '#d3cbdc', size: .02, opacity: .52, transparent: true}));
}

function routeCurve(from, to) {
  const points = [];
  const angle = from.angleTo(to);
  const denom = Math.sin(angle);
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const point = from.clone().multiplyScalar(Math.sin((1 - t) * angle) / denom)
      .addScaledVector(to, Math.sin(t * angle) / denom);
    points.push(point.multiplyScalar(RADIUS + .04 + .45 * Math.sin(Math.PI * t)));
  }
  return new THREE.CatmullRomCurve3(points);
}

export function createGlobe(container, onSelect, motionEnabled, canvas, context) {
  const renderer = new THREE.WebGLRenderer({canvas, context, alpha:true, antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x080a1d, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .03, 45);
  const earthGeometry = new THREE.SphereGeometry(RADIUS, 92, 64);
  const earth = new THREE.Mesh(earthGeometry, new THREE.MeshPhongMaterial({
    map: texture(),
    shininess: 16,
    specular: new THREE.Color('#284d6a'),
    emissive: new THREE.Color('#081b30'),
    emissiveIntensity: .22,
  }));
  scene.add(earth, makeStars());
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.065, 64, 48), atmosphere()));
  scene.add(new THREE.HemisphereLight('#e3e0ed', '#3c3944', 1.8));
  const key = new THREE.DirectionalLight('#eee8f3', 1.9);
  key.position.set(4, 3, -1);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#8ecbff', .88);
  rim.position.set(-3, -2, 3);
  scene.add(rim);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, .004, 8, 128), new THREE.MeshBasicMaterial({color:'#b5e1ff',transparent:true,opacity:.44}));
  ring.rotation.set(.92, -.38, .18);
  const crossOrbit = new THREE.Mesh(ring.geometry, new THREE.MeshBasicMaterial({color:'#7dbccf',transparent:true,opacity:.34}));
  crossOrbit.rotation.set(.85, .6, -.43);
  scene.add(ring, crossOrbit);

  const shipShape = new THREE.Shape();
  shipShape.moveTo(0, .15);
  shipShape.lineTo(.025, .025);
  shipShape.lineTo(.125, -.05);
  shipShape.lineTo(.125, -.077);
  shipShape.lineTo(.022, -.04);
  shipShape.lineTo(.02, -.095);
  shipShape.lineTo(.047, -.12);
  shipShape.lineTo(0, -.102);
  shipShape.lineTo(-.047, -.12);
  shipShape.lineTo(-.02, -.095);
  shipShape.lineTo(-.022, -.04);
  shipShape.lineTo(-.125, -.077);
  shipShape.lineTo(-.125, -.05);
  shipShape.lineTo(-.025, .025);
  shipShape.closePath();
  const plane = new THREE.Mesh(new THREE.ShapeGeometry(shipShape), new THREE.MeshBasicMaterial({color:'#fff6ff',side:THREE.DoubleSide}));
  plane.scale.setScalar(.8);
  plane.visible = false;
  scene.add(plane);
  const projection = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const markers = createGlobeMarkers(container, onSelect).map(marker => ({
    ...marker, point:direction(marker.city.lat, marker.city.lon),
  }));
  const from = direction(launchPoint.lat, launchPoint.lon);
  const origin = new THREE.Mesh(new THREE.SphereGeometry(.028, 12, 8), new THREE.MeshBasicMaterial({color:'#86fff0'}));
  origin.position.copy(from).multiplyScalar(RADIUS + .018);
  scene.add(origin);

  let active;
  let route;
  let line;
  let lat = 25;
  let lon = 95;
  let targetLat = lat;
  let targetLon = lon;
  let distance = 6.1;
  let scroll = 0;
  let inView = true;
  let animation = 0;
  let started = performance.now();
  let drag;
  const cameraDirection = new THREE.Vector3();

  function draw(now = performance.now()) {
    animation = 0;
    const motion = motionEnabled();
    const ease = motion ? .085 : 1;
    lat += (targetLat - lat) * ease;
    lon += (targetLon - lon) * ease;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    const base = camera.aspect < .86 ? 6.45 / Math.max(.76, camera.aspect + .12) : 5.95;
    const elapsed = (now - started) / 1500;
    const zoom = active ? Math.min(1, elapsed) * .55 + scroll * 1.4 : 0;
    distance += (base - zoom - distance) * ease;
    cameraDirection.copy(direction(lat, lon));
    camera.position.copy(cameraDirection).multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    for (const item of markers) {
      projection.copy(item.point).multiplyScalar(RADIUS + .02).project(camera);
      const face = item.point.dot(cameraDirection);
      const visible = face > .26 && Math.abs(projection.x) < 1 && Math.abs(projection.y) < 1;
      item.button.hidden = !visible;
      item.button.style.left = `${(projection.x * .5 + .5) * width}px`;
      item.button.style.top = `${(-projection.y * .5 + .5) * height}px`;
      item.button.classList.toggle('active', item.city === active);
    }
    if (route) {
      const progress = motion ? clamp(elapsed, 0, 1) : 1;
      const point = route.getPointAt(progress);
      const tangent = route.getTangentAt(progress);
      projection.copy(point).project(camera);
      normal.copy(point).addScaledVector(tangent, .08).project(camera);
      plane.position.copy(point);
      plane.quaternion.copy(camera.quaternion);
      plane.rotateZ(Math.atan2(normal.y - projection.y, normal.x - projection.x) - Math.PI / 2);
      const vertices = line.geometry.attributes.position.count;
      line.geometry.setDrawRange(0, Math.max(2, Math.ceil(progress * vertices)));
    }
    ring.rotation.z = .18 + (motion ? Math.sin(now / 3600) * .10 : 0);
    renderer.render(scene, camera);
    if (inView && !document.hidden && motion) animation = requestAnimationFrame(draw);
  }

  function refresh() {
    if (animation) cancelAnimationFrame(animation);
    draw();
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    refresh();
  }

  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView || animation) refresh();
  }).observe(container);
  document.addEventListener('visibilitychange', refresh);

  renderer.domElement.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = {x:event.clientX, y:event.clientY};
    renderer.domElement.setPointerCapture(event.pointerId);
    container.classList.add('dragging');
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!drag) return;
    targetLon -= (event.clientX - drag.x) * .36;
    targetLat = clamp(targetLat + (event.clientY - drag.y) * .35, -70, 70);
    drag = {x:event.clientX, y:event.clientY};
    if (!animation) refresh();
  });
  renderer.domElement.addEventListener('lostpointercapture', () => {
    drag = null;
    container.classList.remove('dragging');
  });
  resize();

  return {
    select(city) {
      active = city;
      targetLat = city.lat;
      const longitude = city.lon + (city.id === 'london' ? 5 : city.id === 'berlin' ? -4 : 0);
      targetLon = lon + ((((longitude - lon) % 360) + 540) % 360 - 180);
      if (line) {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      }
      route = routeCurve(from, direction(city.lat, city.lon));
      line = new THREE.Line(
        (() => {
          const geometry = new THREE.BufferGeometry().setFromPoints(route.getPoints(96));
          const colors = [];
          const start = new THREE.Color('#79dcf1'), middle = new THREE.Color('#ac8afb'), end = new THREE.Color('#ed90c7');
          for (let i=0;i<=96;i++) {
            const t=i/96; const color=t<.5?start.clone().lerp(middle,t*2):middle.clone().lerp(end,(t-.5)*2);
            colors.push(color.r,color.g,color.b);
          }
          geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
          return geometry;
        })(),
        new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95})
      );
      scene.add(line);
      plane.visible = true;
      started = performance.now();
      refresh();
    },
    scroll(progress) {
      scroll = progress;
      if (!animation) refresh();
    },
    refresh,
  };
}
