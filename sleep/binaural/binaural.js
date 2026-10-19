/* Générateur d'ondes binaurales : une fréquence dans chaque oreille, l'écart crée le battement. */
(function () {
  var T = {
    delta: 'Delta 2 Hz', theta: 'Theta 6 Hz', alpha: 'Alpha 10 Hz', gamma: 'Gamma 40 Hz',
    ready: 'Ready: {c}. Put on headphones, then press play.', playing: 'Playing {c}.',
    stops: '{c} · Stops in {t}, with a gentle fade', play: 'Play', pause: 'Pause',
    detail: 'Left ear {l} Hz, right ear {r} Hz', old: 'Your browser cannot play generated sound. Please update it.'
  };
  var BEATS = { delta: 2, theta: 6, alpha: 10, gamma: 40 };
  var CARRIER = 200;

  var root = document.getElementById('binaural');
  if (!root) return;
  try { var tr = JSON.parse(root.dataset.i18n || '{}'); for (var k in tr) T[k] = tr[k]; } catch (e) {}
  var playBtn = root.querySelector('[data-play]');
  var vol = root.querySelector('[data-vol]');
  var seg = root.querySelector('[data-timer]');
  var status = root.querySelector('[data-status]');
  var detail = root.querySelector('[data-detail]');
  var chips = root.querySelectorAll('[data-beat]');

  var ctx, gain, left, right, playing = false, beat = 'theta', timerMin = 30, endAt = 0, tick, fading = false;

  function setBeat(b) {
    beat = b;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.beat === b ? 'true' : 'false'); });
    if (right) right.frequency.setTargetAtTime(CARRIER + BEATS[b], ctx.currentTime, 0.3);
    render();
  }

  function level() { var v = vol.value / 100; return v * v * 0.35; }

  async function start() {
    if (!ctx) {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { status.textContent = T.old; return; }
      ctx = new AC();
      var merger = ctx.createChannelMerger(2);
      gain = ctx.createGain(); gain.gain.value = 0;
      left = ctx.createOscillator(); right = ctx.createOscillator();
      left.frequency.value = CARRIER; right.frequency.value = CARRIER + BEATS[beat];
      left.connect(merger, 0, 0); right.connect(merger, 0, 1);
      merger.connect(gain); gain.connect(ctx.destination);
      left.start(); right.start();
    }
    await ctx.resume();
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(level(), ctx.currentTime, 0.5);
    playing = true; armTimer(); render();
  }

  function stop(t) {
    if (!ctx) return;
    t = t || 0.3;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, t / 4);
    playing = false; endAt = 0; clearInterval(tick);
    setTimeout(function () { if (!playing) ctx.suspend(); }, t * 1000 + 200);
    render();
  }

  function armTimer() {
    clearInterval(tick); fading = false;
    endAt = timerMin ? Date.now() + timerMin * 60000 : 0;
    if (endAt) tick = setInterval(function () {
      var left = endAt - Date.now();
      if (left <= 60000 && left > 0 && !fading) { fading = true; gain.gain.setTargetAtTime(0, ctx.currentTime, 15); }
      if (left <= 0) stop(1);
      render();
    }, 1000);
  }

  function render() {
    playBtn.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    playBtn.setAttribute('aria-label', playing ? T.pause : T.play);
    root.classList.toggle('on', playing);
    var label = T[beat];
    if (!playing) status.textContent = T.ready.replace('{c}', label);
    else if (endAt) {
      var s = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      status.textContent = T.stops.replace('{c}', label).replace('{t}', Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
    } else status.textContent = T.playing.replace('{c}', label);
    detail.textContent = T.detail.replace('{l}', CARRIER).replace('{r}', CARRIER + BEATS[beat]);
  }

  chips.forEach(function (c) { c.addEventListener('click', function () { setBeat(c.dataset.beat); }); });
  playBtn.addEventListener('click', function () { playing ? stop() : start(); });
  function paintVol() { vol.style.setProperty('--v', vol.value + '%'); }
  vol.addEventListener('input', function () { paintVol(); if (gain && playing) gain.gain.setTargetAtTime(level(), ctx.currentTime, 0.05); });
  seg.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      timerMin = +b.dataset.min;
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (playing) { gain.gain.setTargetAtTime(level(), ctx.currentTime, 0.2); armTimer(); render(); }
    });
  });
  paintVol();
  setBeat('theta');
})();
