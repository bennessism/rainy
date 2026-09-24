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
