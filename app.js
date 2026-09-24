const app = document.getElementById('app');
const rainCanvas = document.getElementById('rainCanvas');
const fogCanvas = document.getElementById('fogCanvas');
const rainCtx = rainCanvas.getContext('2d');
const fogCtx = fogCanvas.getContext('2d');
const hint = document.getElementById('hint');
const lightning = document.getElementById('lightning');
const lampButton = document.getElementById('lampButton');
const lampControl = document.getElementById('lampControl');
const clearButton = document.getElementById('clearButton');
const placeButton = document.getElementById('placeButton');
const placePanel = document.getElementById('placePanel');
const closePlace = document.getElementById('closePlace');
const countrySelect = document.getElementById('countrySelect');
const locationSelect = document.getElementById('locationSelect');
const weatherLabel = document.getElementById('weatherLabel');
const weatherMeta = document.getElementById('weatherMeta');
const controlDock = document.getElementById('controlDock');
const dockToggle = document.getElementById('dockToggle');

let catalog = null;
let currentWeather = null;
let drops = [];
let drawing = false;
let last = null;
let lampOn = true;
let dpr = 1;
let lightningTimer = null;

const fallbackWeather = {
  name: 'Sabah', city: 'Kota Kinabalu', temperature_c: 27,
  relative_humidity_pct: 78, precipitation_mm: 0.6, rain_mm: 0.6,
  showers_mm: 0, weather_code: 61, cloud_cover_pct: 76,
  wind_speed_kmh: 10, wind_gusts_kmh: 18, is_day: false,
  time: null
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => min + Math.random() * (max - min);

function weatherKind(code = 0, rain = 0) {
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    if (rain >= 4 || [65, 67, 82].includes(code)) return 'heavy-rain';
    return 'rain';
  }
  if ([1, 2].includes(code)) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  return 'clear';
}

function weatherName(kind) {
  return ({
    clear: 'Clear',
    'partly-cloudy': 'Partly cloudy',
    cloudy: 'Cloudy',
    drizzle: 'Drizzle',
    rain: 'Rain',
    'heavy-rain': 'Heavy rain',
    storm: 'Thunderstorm',
    fog: 'Mist / fog'
  })[kind] || 'Weather';
}

function scenePalette(isDay, kind, cloud) {
  if (!isDay) {
    if (kind === 'storm') return ['#080d16', '#121d2b'];
    if (kind === 'fog') return ['#17212c', '#293746'];
    if (cloud > 80) return ['#0d1520', '#1c2834'];
    return ['#101827', '#1a2635'];
  }
  if (kind === 'storm') return ['#4f5963', '#7a8791'];
  if (kind === 'fog') return ['#a9b7be', '#d0d8db'];
  if (cloud > 80) return ['#7e919e', '#a9b7bf'];
  if (cloud > 45) return ['#7092ad', '#b2c2cc'];
  return ['#5f99c6', '#b7d7e8'];
}

function applyWeather(weather) {
  currentWeather = weather || fallbackWeather;
  const rain = Number(currentWeather.rain_mm || 0) + Number(currentWeather.showers_mm || 0);
  const cloud = clamp(Number(currentWeather.cloud_cover_pct || 0), 0, 100);
  const humidity = clamp(Number(currentWeather.relative_humidity_pct || 60), 0, 100);
  const wind = Math.max(0, Number(currentWeather.wind_speed_kmh || 0));
  const gust = Math.max(wind, Number(currentWeather.wind_gusts_kmh || wind));
  const isDay = Boolean(currentWeather.is_day);
  const kind = weatherKind(Number(currentWeather.weather_code || 0), rain);
  const [skyTop, skyBottom] = scenePalette(isDay, kind, cloud);

  app.classList.toggle('is-night', !isDay);
  app.classList.toggle('is-day', isDay);
  app.dataset.weather = kind;
  app.style.setProperty('--sky-top', skyTop);
  app.style.setProperty('--sky-bottom', skyBottom);
  app.style.setProperty('--cloud', String(clamp((cloud - 8) / 92, 0.03, 1)));

  let haze = cloud / 520;
  if (kind === 'fog') haze = 0.72;
  if (kind === 'heavy-rain' || kind === 'storm') haze = Math.max(haze, 0.28);
  else if (kind === 'rain') haze = Math.max(haze, 0.16);
  app.style.setProperty('--haze', String(clamp(haze, 0.02, 0.82)));

  document.querySelector('.far').style.opacity = String(clamp(0.82 - haze * 0.7, 0.18, 0.8));
  document.querySelector('.mid').style.opacity = String(clamp(0.96 - haze * 0.45, 0.36, 0.96));

  const temp = Number(currentWeather.temperature_c);
  const tempText = Number.isFinite(temp) ? `${Math.round(temp)}°C` : '';
  weatherLabel.textContent = `${currentWeather.name || currentWeather.city || 'Location'} · ${weatherName(kind)}${tempText ? ` · ${tempText}` : ''}`;

  const cloudText = `${Math.round(cloud)}% cloud`;
  const windText = `${Math.round(wind)} km/h wind`;
  weatherMeta.textContent = `${currentWeather.city || currentWeather.name || ''} · ${cloudText} · ${windText}${currentWeather.time ? ` · ${currentWeather.time}` : ''}`;

  makeRain({ kind, rain, wind, gust });
  fogGlass(clamp((humidity - 45) / 100 + haze * 0.35 + (rain > 0 ? 0.08 : 0), 0.18, 0.52));
  scheduleLightning(kind === 'storm');
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
  applyWeather(currentWeather || fallbackWeather);
}

function makeRain({ kind, rain, wind, gust }) {
  const box = rainCanvas.getBoundingClientRect();
  let count = 0;
  if (kind === 'drizzle') count = 45;
  if (kind === 'rain') count = 90 + Math.round(rain * 16);
  if (kind === 'heavy-rain') count = 170 + Math.round(rain * 18);
  if (kind === 'storm') count = 210 + Math.round(rain * 20);
  count = clamp(count, 0, 330);

  const speedBase = 3.2 + clamp(rain * 0.9, 0, 7) + clamp(gust / 25, 0, 3);
  const slant = clamp(wind / 85, 0.02, 0.46);

  drops = Array.from({ length: count }, () => ({
    x: rand(-40, box.width + 40),
    y: rand(-box.height, box.height),
    speed: rand(speedBase * 0.72, speedBase * 1.28),
    length: rand(kind === 'drizzle' ? 6 : 12, kind === 'storm' ? 37 : 29),
    alpha: rand(0.08, kind === 'storm' ? 0.34 : 0.27),
    drift: slant * rand(0.68, 1.25)
  }));
}

function animateRain() {
  const box = rainCanvas.getBoundingClientRect();
  rainCtx.clearRect(0, 0, box.width, box.height);
  rainCtx.lineCap = 'round';
  for (const drop of drops) {
    rainCtx.beginPath();
    rainCtx.strokeStyle = `rgba(205,225,238,${drop.alpha})`;
    rainCtx.lineWidth = drop.length > 30 ? 1.15 : 0.85;
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(drop.x + drop.drift * drop.length, drop.y + drop.length);
    rainCtx.stroke();
    drop.y += drop.speed;
    drop.x += drop.drift * drop.speed * .22;
    if (drop.y > box.height + 45 || drop.x > box.width + 80) {
      drop.y = rand(-180, -20);
      drop.x = rand(-50, box.width + 10);
    }
  }
  requestAnimationFrame(animateRain);
}

function fogGlass(strength = .28) {
  const box = fogCanvas.getBoundingClientRect();
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, box.width, box.height);
  const gradient = fogCtx.createLinearGradient(0, 0, box.width, box.height);
  gradient.addColorStop(0, `rgba(228,237,240,${strength})`);
  gradient.addColorStop(.52, `rgba(205,220,226,${strength * .78})`);
  gradient.addColorStop(1, `rgba(188,207,214,${strength * .92})`);
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
  fogCtx.strokeStyle = 'rgba(0,0,0,.84)';
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
function endDrawing() { drawing = false; last = null; }
fogCanvas.addEventListener('pointerup', endDrawing);
fogCanvas.addEventListener('pointercancel', endDrawing);

function scheduleLightning(enabled) {
  clearTimeout(lightningTimer);
  if (!enabled) return;
  const strike = () => {
    lightning.classList.remove('flash');
    void lightning.offsetWidth;
    lightning.classList.add('flash');
    lightningTimer = setTimeout(strike, rand(7000, 18000));
  };
  lightningTimer = setTimeout(strike, rand(3500, 9000));
}

function changeLamp() {
  lampOn = !lampOn;
  app.classList.toggle('lamp-off', !lampOn);
  lampButton.setAttribute('aria-pressed', String(lampOn));
  lampControl.textContent = `Lamp · ${lampOn ? 'On' : 'Off'}`;
}
lampButton.addEventListener('click', changeLamp);
lampControl.addEventListener('click', changeLamp);
clearButton.addEventListener('click', () => {
  applyWeather(currentWeather || fallbackWeather);
  hint.style.opacity = '1';
  setTimeout(() => { hint.style.opacity = '0'; }, 1500);
});

dockToggle.addEventListener('click', () => {
  const open = controlDock.classList.toggle('open');
  dockToggle.setAttribute('aria-expanded', String(open));
  dockToggle.setAttribute('aria-label', open ? 'Close controls' : 'Open controls');
});
placeButton.addEventListener('click', () => { placePanel.hidden = false; });
closePlace.addEventListener('click', () => { placePanel.hidden = true; });
placePanel.addEventListener('click', event => { if (event.target === placePanel) placePanel.hidden = true; });

function fillCountries(selected) {
  countrySelect.innerHTML = '';
  Object.entries(catalog.countries).forEach(([code, country]) => {
    const option = new Option(country.name, code, false, code === selected);
    countrySelect.add(option);
  });
}

function fillLocations(countryCode, selected) {
  locationSelect.innerHTML = '';
  const country = catalog.countries[countryCode];
  country.locations.forEach(location => {
    const option = new Option(location.name, location.id, false, location.id === selected);
    locationSelect.add(option);
  });
}

async function loadWeather(countryCode, locationId) {
  try {
    weatherLabel.textContent = 'Loading weather…';
    const response = await fetch(`weather/data/${countryCode}.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Weather cache unavailable');
    const payload = await response.json();
    const weather = payload.locations?.[locationId];
    if (!weather) throw new Error('Location missing from weather cache');
    localStorage.setItem('window-country', countryCode);
    localStorage.setItem('window-location', locationId);
    applyWeather(weather);
  } catch (error) {
    const location = catalog?.countries?.[countryCode]?.locations?.find(item => item.id === locationId);
    applyWeather({ ...fallbackWeather, name: location?.name || 'Sabah', city: location?.city || 'Kota Kinabalu' });
    weatherMeta.textContent = 'Cached weather is not available yet. Showing the fallback scene.';
  }
}

countrySelect.addEventListener('change', () => {
  const countryCode = countrySelect.value;
  const first = catalog.countries[countryCode].locations[0];
  fillLocations(countryCode, first.id);
  loadWeather(countryCode, first.id);
});
locationSelect.addEventListener('change', () => loadWeather(countrySelect.value, locationSelect.value));

async function initWeather() {
  try {
    const response = await fetch('weather/catalog.json', { cache: 'no-store' });
    catalog = await response.json();
    let country = localStorage.getItem('window-country') || catalog.default.country;
    let location = localStorage.getItem('window-location') || catalog.default.location;
    if (!catalog.countries[country]) country = catalog.default.country;
    if (!catalog.countries[country].locations.some(item => item.id === location)) location = catalog.countries[country].locations[0].id;
    fillCountries(country);
    fillLocations(country, location);
    await loadWeather(country, location);
  } catch (error) {
    applyWeather(fallbackWeather);
  }
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(sizeCanvases, 120);
});

sizeCanvases();
animateRain();
initWeather();
