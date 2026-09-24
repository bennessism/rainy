(() => {
  const roomTrack = document.getElementById('roomTrack');
  const roomDots = Array.from(document.querySelectorAll('.room-dot'));
  if (!roomTrack) return;

  const touchLike = () =>
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    window.innerWidth <= 900;

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
      if (touchLike()) goTo(1, false);
    }, 140);
  });

  requestAnimationFrame(() => {
    if (touchLike()) goTo(1, false);
  });
})();
