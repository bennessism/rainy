(() => {
  const roomTrack = document.getElementById('roomTrack');
  const roomDots = Array.from(document.querySelectorAll('.room-dot'));
  if (!roomTrack) return;

  const coarseTouch = () =>
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches;

  const touchLike = () => coarseTouch() || window.innerWidth <= 900;
  const desktopTouchView = () => coarseTouch() && window.innerWidth > 900;

  const style = document.createElement('style');
  style.textContent = `
    html.touch-desktop-view .room-track{
      --sill-line:12vh;
      display:flex;
      align-items:stretch;
      gap:0;
      padding:0;
      overflow-x:auto;
      overflow-y:hidden;
      scroll-snap-type:x mandatory;
      scroll-behavior:smooth;
      scrollbar-width:none;
    }
    html.touch-desktop-view .room-track::-webkit-scrollbar{display:none}
    html.touch-desktop-view .room-track.drawing-fog{
      overflow-x:hidden;
      scroll-snap-type:none;
    }
    html.touch-desktop-view .room-zone{
      flex:0 0 100%;
      width:100%;
      height:100%;
      min-width:100%;
      scroll-snap-align:start;
      padding:8vh 4vw 6vh;
    }
    html.touch-desktop-view .left-zone,
    html.touch-desktop-view .right-zone{justify-content:center}
    html.touch-desktop-view .main-zone{padding-top:10vh}
    html.touch-desktop-view .room-dots{display:flex}
    html.touch-desktop-view .music-corner{width:min(72vw,440px);height:100%}
    html.touch-desktop-view .side-table{left:2%;right:2%}
    html.touch-desktop-view .table-books{left:6%}
    html.touch-desktop-view .music-box{right:6%}
    html.touch-desktop-view .photo-frame{width:min(42vw,350px);max-height:68vh}
    html.touch-desktop-view .window-recess{max-height:76vh}
  `;
  document.head.appendChild(style);

  const syncMode = () => {
    document.documentElement.classList.toggle('touch-desktop-view', desktopTouchView());
  };

  const setDot = index => {
    roomDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  };

  const goTo = (index, smooth = true) => {
    if (!touchLike()) return;
    roomTrack.scrollTo({
      left: roomTrack.clientWidth * index,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setDot(index);
  };

  roomDots.forEach((dot, index) => {
    dot.addEventListener('click', event => {
      if (!touchLike()) return;
      event.preventDefault();
      goTo(index);
    });
  });

  roomTrack.addEventListener('scroll', () => {
    if (!touchLike()) return;
    setDot(Math.round(roomTrack.scrollLeft / Math.max(1, roomTrack.clientWidth)));
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncMode();
      if (touchLike()) goTo(1, false);
    }, 140);
  });

  syncMode();
  requestAnimationFrame(() => {
    syncMode();
    if (touchLike()) goTo(1, false);
  });
})();

// Keep the location chooser visually attached to the weather detail card.
(() => {
  const app = document.getElementById('app');
  const weatherPanel = document.getElementById('weatherPanel');
  const weatherToggle = document.getElementById('weatherToggle');
  const weatherClose = document.getElementById('weatherClose');
  const weatherLocationButton = document.getElementById('weatherLocationButton');
  const placeButton = document.getElementById('placeButton');
  const placePanel = document.getElementById('placePanel');
  const closePlace = document.getElementById('closePlace');
  if (!app || !weatherPanel || !placePanel) return;

  const style = document.createElement('style');
  style.textContent = `
    .place-panel{
      position:absolute!important;
      z-index:46!important;
      inset:auto!important;
      display:block!important;
      place-items:initial!important;
      width:min(92vw,360px)!important;
      padding:0!important;
      background:transparent!important;
      backdrop-filter:none!important;
    }
    .place-panel[hidden]{display:none!important}
    .place-card{
      width:100%!important;
      padding:14px!important;
      border-radius:16px!important;
      background:rgba(17,21,26,.94)!important;
      backdrop-filter:blur(16px);
      box-shadow:0 18px 44px rgba(0,0,0,.32)!important;
      overflow:auto;
    }
    .place-head{margin-bottom:8px!important}
    .place-head strong{font-size:13px!important}
    .place-head button{width:28px!important;height:28px!important;font-size:19px!important}
    .place-card label{margin-top:9px!important;font-size:10px!important}
    .place-card select{padding:9px 10px!important;border-radius:10px!important}
    .weather-meta{margin-top:10px!important;font-size:10px!important}
    @media(max-width:760px){
      .place-panel{width:min(calc(100vw - 28px),360px)!important}
    }
  `;
  document.head.appendChild(style);

  const title = placePanel.querySelector('.place-head strong');
  if (title) title.textContent = 'Location';

  function positionPlacePanel(){
    if (weatherPanel.hidden || placePanel.hidden) return;
    const appRect = app.getBoundingClientRect();
    const weatherRect = weatherPanel.getBoundingClientRect();
    const gap = 8;
    placePanel.style.left = `${Math.round(weatherRect.left - appRect.left)}px`;
    placePanel.style.top = `${Math.round(weatherRect.bottom - appRect.top + gap)}px`;
    placePanel.style.width = `${Math.round(weatherRect.width)}px`;
    const available = Math.max(150, window.innerHeight - weatherRect.bottom - gap - 12);
    const card = placePanel.querySelector('.place-card');
    if (card) card.style.maxHeight = `${available}px`;
  }

  function openPicker(){
    weatherPanel.hidden = false;
    weatherToggle?.setAttribute('aria-expanded','true');
    placePanel.hidden = false;
    requestAnimationFrame(positionPlacePanel);
  }

  weatherLocationButton?.addEventListener('click', () => openPicker());
  placeButton?.addEventListener('click', () => openPicker());

  weatherToggle?.addEventListener('click', () => {
    if (weatherPanel.hidden) placePanel.hidden = true;
    else if (!placePanel.hidden) requestAnimationFrame(positionPlacePanel);
  });

  weatherClose?.addEventListener('click', () => { placePanel.hidden = true; });
  closePlace?.addEventListener('click', () => { placePanel.hidden = true; });

  window.addEventListener('resize', () => {
    if (!placePanel.hidden && !weatherPanel.hidden) requestAnimationFrame(positionPlacePanel);
  });
})();
