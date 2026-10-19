/* Générateur de bruit blanc, rose, brun et vert. Tout est calculé dans le navigateur. */
(function () {
  var WORKLET = [
    'class Noise extends AudioWorkletProcessor{',
    ' constructor(){super();this.c="brown";this.b=[0,0,0,0,0,0,0];this.l=0;',
    '  this.port.onmessage=e=>{this.c=e.data};}',
    ' process(i,o){var out=o[0],ch0=out[0],n=ch0.length,b=this.b;',
    '  for(var k=0;k<n;k++){var w=Math.random()*2-1,v;',
    '   if(this.c==="pink"){',
    '    b[0]=0.99886*b[0]+w*0.0555179;b[1]=0.99332*b[1]+w*0.0750759;b[2]=0.96900*b[2]+w*0.1538520;',
    '    b[3]=0.86650*b[3]+w*0.3104856;b[4]=0.55000*b[4]+w*0.5329522;b[5]=-0.7616*b[5]-w*0.0168980;',
    '    v=(b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]+w*0.5362)*0.11;b[6]=w*0.115926;',
    '   }else if(this.c==="brown"){this.l=(this.l+0.02*w)/1.02;v=this.l*3.5;}',
    '   else{v=w*0.5;}',
    '   for(var c=0;c<out.length;c++)out[c][k]=v;}',
    '  return true;}}',
    'registerProcessor("noise",Noise);'
  ].join('\n');

  var COLORS = {
    white: { label: 'White' }, pink: { label: 'Pink' },
    brown: { label: 'Brown' }, green: { label: 'Green' }
  };

  var root = document.getElementById('noise');
  if (!root) return;
  var playBtn = root.querySelector('[data-play]');
  var vol = root.querySelector('[data-vol]');
  var timerSel = root.querySelector('[data-timer]');
  var status = root.querySelector('[data-status]');
  var colorBtns = root.querySelectorAll('[data-color]');

  var ctx, node, filter, gain, playing = false, color = 'brown', endAt = 0, tick;

  function setColor(c) {
    color = c;
    colorBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.color === c ? 'true' : 'false'); });
    root.style.setProperty('--accent', 'var(--' + c + ')');
    if (node) route();
  }

  function route() {
    node.port.postMessage(color === 'green' ? 'white' : color);
    node.disconnect();
    if (color === 'green') { node.connect(filter); filter.connect(gain); }
    else { try { filter.disconnect(); } catch (e) {} node.connect(gain); }
  }

  function level() { var v = vol.value / 100; return v * v * 0.9; }

  async function start() {
    if (!ctx) {
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || !('audioWorklet' in AC.prototype)) {
        status.textContent = 'Your browser cannot play generated sound. Please update it.';
        return;
      }
      ctx = new AC();
      var url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url);
      node = new AudioWorkletNode(ctx, 'noise', { outputChannelCount: [2] });
      filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 500; filter.Q.value = 0.6;
      gain = ctx.createGain(); gain.gain.value = 0;
      gain.connect(ctx.destination);
      route();
    }
    await ctx.resume();
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(level(), ctx.currentTime, 0.4);
    playing = true;
    armTimer();
    render();
  }

  function stop(fadeSeconds) {
    if (!ctx) return;
    var t = fadeSeconds || 0.3;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, t / 4);
    playing = false; endAt = 0; clearInterval(tick);
    setTimeout(function () { if (!playing) ctx.suspend(); }, t * 1000 + 200);
    render();
  }

  function armTimer() {
    clearInterval(tick);
    var min = +timerSel.value;
    endAt = min ? Date.now() + min * 60000 : 0;
    if (endAt) tick = setInterval(function () {
      var left = endAt - Date.now();
      if (left <= 60000 && left > 0 && !gain._fading) {
        gain._fading = true;
        gain.gain.setTargetAtTime(0, ctx.currentTime, 15);
      }
      if (left <= 0) { gain._fading = false; stop(1); }
      render();
    }, 1000);
    if (gain) gain._fading = false;
  }

  function render() {
    playBtn.innerHTML = (playing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>Pause'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>Play');
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    root.classList.toggle('on', playing);
    var label = COLORS[color].label + ' noise';
    if (!playing) status.textContent = 'Ready: ' + label + '. Free, no ads, nothing to install.';
    else if (endAt) {
      var s = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      status.textContent = 'Playing ' + label + '. Stops in ' + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s, with a gentle fade.';
    } else status.textContent = 'Playing ' + label + '.';
  }

  colorBtns.forEach(function (b) {
    b.addEventListener('click', function () { setColor(b.dataset.color); if (!playing) start(); render(); });
  });
  playBtn.addEventListener('click', function () { playing ? stop() : start(); });
  vol.addEventListener('input', function () {
    if (gain && playing) gain.gain.setTargetAtTime(level(), ctx.currentTime, 0.05);
  });
  timerSel.addEventListener('change', function () { if (playing) { gain.gain.setTargetAtTime(level(), ctx.currentTime, 0.2); armTimer(); render(); } });

  setColor('brown');
  render();
})();
