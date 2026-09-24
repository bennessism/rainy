const app = document.getElementById('app');
const rainCanvas = document.getElementById('rainCanvas');
const fogCanvas = document.getElementById('fogCanvas');
const rainCtx = rainCanvas.getContext('2d');
const fogCtx = fogCanvas.getContext('2d');
const hint = document.getElementById('hint');
const rainButton = document.getElementById('rainButton');
const lampButton = document.getElementById('lampButton');
const lampControl = document.getElementById('lampControl');
const clearButton = document.getElementById('clearButton');
const controlDock = document.getElementById('controlDock');
const dockToggle = document.getElementById('dockToggle');

const modes = [
  { name: 'Drizzle', count: 65, min: 2, max: 5 },
  { name: 'Normal', count: 120, min: 4, max: 8 },
  { name: 'Heavy', count: 190, min: 6, max: 11 }
];

let modeIndex = 1;
let drops = [];
let drawing = false;
let last = null;
let lampOn = true;
let dpr = 1;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function sizeCanvases() {
  const box = rainCanvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  [rainCanvas, fogCanvas].forEach(canvas => {
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
  });
  rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  makeRain();
  fogGlass();
}

function makeRain() {
  const box = rainCanvas.getBoundingClientRect();
  const mode = modes[modeIndex];
  drops = Array.from({ length: mode.count }, () => ({
    x: rand(0, box.width),
    y: rand(-box.height, box.height),
    speed: rand(mode.min, mode.max),
    length: rand(10, 30),
    alpha: rand(0.09, 0.28),
    drift: rand(-0.15, 0.15)
  }));
}

function animateRain() {
  const box = rainCanvas.getBoundingClientRect();
  rainCtx.clearRect(0, 0, box.width, box.height);
  rainCtx.lineCap = 'round';

  for (const drop of drops) {
    rainCtx.beginPath();
    rainCtx.strokeStyle = `rgba(195,220,238,${drop.alpha})`;
    rainCtx.lineWidth = 0.9;
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(drop.x + drop.drift * drop.length, drop.y + drop.length);
    rainCtx.stroke();

    drop.y += drop.speed;
    drop.x += drop.drift;

    if (drop.y > box.height + 35) {
      drop.y = rand(-150, -15);
      drop.x = rand(0, box.width);
    }
  }

  requestAnimationFrame(animateRain);
}

function fogGlass() {
  const box = fogCanvas.getBoundingClientRect();
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, box.width, box.height);

  const gradient = fogCtx.createLinearGradient(0, 0, box.width, box.height);
  gradient.addColorStop(0, 'rgba(223,234,238,.31)');
  gradient.addColorStop(0.5, 'rgba(203,219,225,.24)');
  gradient.addColorStop(1, 'rgba(184,204,212,.29)');
  fogCtx.fillStyle = gradient;
  fogCtx.fillRect(0, 0, box.width, box.height);
}

function pointerPosition(event) {
  const box = fogCanvas.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function drawClearLine(a, b) {
  fogCtx.save();
  fogCtx.globalCompositeOperation = 'destination-out';
  fogCtx.lineCap = 'round';
  fogCtx.lineJoin = 'round';
  fogCtx.lineWidth = 30;
  fogCtx.strokeStyle = 'rgba(0,0,0,.8)';
  fogCtx.beginPath();
  fogCtx.moveTo(a.x, a.y);
  fogCtx.lineTo(b.x, b.y);
  fogCtx.stroke();
  fogCtx.restore();
}

fogCanvas.addEventListener('pointerdown', event => {
  drawing = true;
  fogCanvas.setPointerCapture(event.pointerId);
  last = pointerPosition(event);
  drawClearLine(last, last);
  hint.style.opacity = '0';
});

fogCanvas.addEventListener('pointermove', event => {
  if (!drawing) return;
  const next = pointerPosition(event);
  drawClearLine(last, next);
  last = next;
});

function endDrawing() {
  drawing = false;
  last = null;
}

fogCanvas.addEventListener('pointerup', endDrawing);
fogCanvas.addEventListener('pointercancel', endDrawing);

rainButton.addEventListener('click', () => {
  modeIndex = (modeIndex + 1) % modes.length;
  rainButton.textContent = `Rain · ${modes[modeIndex].name}`;
  makeRain();
});

function changeLamp() {
  lampOn = !lampOn;
  app.classList.toggle('lamp-off', !lampOn);
  lampButton.setAttribute('aria-pressed', String(lampOn));
  lampControl.textContent = `Lamp · ${lampOn ? 'On' : 'Off'}`;
}

lampButton.addEventListener('click', changeLamp);
lampControl.addEventListener('click', changeLamp);
clearButton.addEventListener('click', () => {
  fogGlass();
  hint.style.opacity = '1';
  setTimeout(() => { hint.style.opacity = '0'; }, 1600);
});

dockToggle.addEventListener('click', () => {
  const isOpen = controlDock.classList.toggle('open');
  dockToggle.setAttribute('aria-expanded', String(isOpen));
  dockToggle.setAttribute('aria-label', isOpen ? 'Close controls' : 'Open controls');
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(sizeCanvases, 120);
});

sizeCanvases();
animateRain();
