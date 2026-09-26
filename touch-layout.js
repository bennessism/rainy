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

// Keep the location chooser as the next card in the weather stack.
(() => {
  const weatherPanel = document.getElementById('weatherPanel');
  const weatherToggle = document.getElementById('weatherToggle');
  const weatherLocationButton = document.getElementById('weatherLocationButton');
  const placeButton = document.getElementById('placeButton');
  const placePanel = document.getElementById('placePanel');
  if (!weatherPanel || !placePanel) return;

  // Make it a real child of the weather panel instead of a separately positioned overlay.
  weatherPanel.appendChild(placePanel);

  const style = document.createElement('style');
  style.textContent = `
    .weather-panel{
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    .weather-panel[hidden]{display:none}
    .weather-panel .place-panel{
      position:static!important;
      inset:auto!important;
      z-index:auto!important;
      display:block!important;
      width:100%!important;
      padding:0!important;
      margin:0!important;
      background:transparent!important;
      backdrop-filter:none!important;
    }
    .weather-panel .place-panel[hidden]{display:none!important}
    .weather-panel .place-card{
      width:100%!important;
      padding:14px!important;
      border-radius:16px!important;
      background:rgba(17,21,26,.94)!important;
      backdrop-filter:blur(16px);
      box-shadow:0 18px 44px rgba(0,0,0,.32)!important;
      max-height:min(42vh,330px);
      overflow:auto;
    }
    .weather-panel .place-head{margin-bottom:8px!important}
    .weather-panel .place-head strong{font-size:13px!important}
    .weather-panel .place-head button{width:28px!important;height:28px!important;font-size:19px!important}
    .weather-panel .place-card label{margin-top:9px!important;font-size:10px!important}
    .weather-panel .place-card select{padding:9px 10px!important;border-radius:10px!important}
    .weather-panel .weather-meta{margin-top:10px!important;font-size:10px!important}
    @media(max-height:700px){
      .weather-panel .place-card{max-height:34vh}
    }
  `;
  document.head.appendChild(style);

  const title = placePanel.querySelector('.place-head strong');
  if (title) title.textContent = 'Location';

  const openPicker = event => {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    weatherPanel.hidden = false;
    weatherToggle?.setAttribute('aria-expanded','true');
    placePanel.hidden = false;
  };

  // Capture prevents the older app.js handlers from closing the master card first.
  weatherLocationButton?.addEventListener('click', openPicker, true);
  placeButton?.addEventListener('click', openPicker, true);

  weatherToggle?.addEventListener('click', () => {
    requestAnimationFrame(() => {
      if (weatherPanel.hidden) placePanel.hidden = true;
    });
  });
})();
