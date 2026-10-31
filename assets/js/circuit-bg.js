// Page backdrop: an animated circuit board on black. Traces and chips are laid out on a grid; the chips are
// labelled with reinforcement-learning quantities, and signal pulses run along the traces into and out of them.
// Traces and chips are teal, neon fuchsia or neon orange, and pulses glow in their trace's colour
// (orange "+1" pulses carry reward). A copy of the top of the canvas fills the strip behind the fixed header, so
// content scrolling up still disappears below the header bar.
(function () {
  'use strict';

  var G = 22; // grid spacing (px)
  var DX = [1, 1, 0, -1, -1, -1, 0, 1];
  var DY = [0, 1, 1, 1, 0, -1, -1, -1];
  // Colour families: pulse glow (rgb), trace core and halo, pads, chip outline and pins, chip label, chip readout
  var PAL = {
    c: { rgb: '77,255,240', core: '#1b6a62', halo: '#0b2f2c', pad: '#2c9a8e', chip: '#2a8f84', label: '#5fe3d2', val: '#c4fff7' },
    f: { rgb: '255,46,214', core: '#82206f', halo: '#2e0a28', pad: '#c0349f', chip: '#b0318f', label: '#ff6fe2', val: '#ffd1f5' },
    o: { rgb: '255,122,26', core: '#83420f', halo: '#2e1606', pad: '#c8621c', chip: '#b8581a', label: '#ff9a4a', val: '#ffe0c2' }
  };
  var FONT = 'Roboto, "Helvetica Neue", Arial, sans-serif';
  var CHIP_DEFS = [
    { label: 'V(s)', kind: 'value' },
    { label: 'R(s,a)', kind: 'reward' },
    { label: 'P(s,a,s′)', kind: 'prob' },
    { label: 'Q(s,a)', kind: 'value' },
    { label: 'π(a|s)', kind: 'prob' },
    { label: 'δ', kind: 'td' },
    { label: 'γ', kind: 'const', text: '0.95' },
    { label: 'argmax a', kind: 'action' },
    { label: 'E[G]', kind: 'value' },
    { label: 'α', kind: 'const', text: '0.10' },
    { label: 'max Q', kind: 'value' }
  ];
  var SILK = ['s', 'a', 's′', 'r', 'γ', 'α', 'β', 'λ', 'V1', 'Q2', 'R3', 'P4', 'π5', 'δ6', 's₀', 'aₜ', 'rₜ₊₁', 'G₇'];

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block;';
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');

  var nav = document.getElementById('navbar');
  var strip = null;
  var sctx = null;
  if (nav) {
    strip = document.createElement('canvas');
    strip.setAttribute('aria-hidden', 'true');
    strip.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block;';
    nav.insertBefore(strip, nav.firstChild);
    sctx = strip.getContext('2d');
  }

  function rng(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function glow(rgb) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.15, 'rgba(' + rgb + ',0.95)');
    gr.addColorStop(0.45, 'rgba(' + rgb + ',0.25)');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  }
  var GLOW = { c: glow(PAL.c.rgb), f: glow(PAL.f.rgb), o: glow(PAL.o.rgb) };

  var W, H, dpr, layer, traces, chips, pulses, sparks, target;
  var last = 0;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var rand = rng(20261031);
    var cols = Math.ceil(W / G);
    var rows = Math.ceil(H / G);
    var occ = new Int32Array(cols * rows); // 0 free, -1 chip, n > 0 trace n
    var silk = [];
    traces = [];
    chips = [];
    pulses = [];
    sparks = [];

    function free(x, y, id) {
      if (x < 0 || y < 0 || x >= cols || y >= rows || occ[y * cols + x] !== 0) return false;
      for (var j = -1; j <= 1; j++) {
        for (var i = -1; i <= 1; i++) {
          var nx = x + i;
          var ny = y + j;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          var n = occ[ny * cols + nx];
          if (n > 0 && n !== id) return false;
        }
      }
      return true;
    }

    function clearArea(x, y, w, h) {
      for (var j = Math.max(0, y); j < Math.min(rows, y + h); j++) {
        for (var i = Math.max(0, x); i < Math.min(cols, x + w); i++) if (occ[j * cols + i] === -1) return false;
      }
      return true;
    }

    // A trace walks the grid mostly straight, with 45-degree chamfered turns, keeping a cell clear of other traces
    function walk(sx, sy, d, id, maxLen) {
      if (!free(sx, sy, id)) return null;
      var cells = [sx, sy];
      var verts = [[sx, sy]];
      var x = sx;
      var y = sy;
      var pending = 0;
      var n = 0;
      occ[sy * cols + sx] = id;
      while (n < maxLen) {
        var nd = d;
        if (pending) {
          nd = (d + pending + 8) % 8;
          pending = 0;
        } else if (n > 1 && rand() < 0.16) {
          var s = rand() < 0.5 ? 1 : -1;
          nd = (d + s + 8) % 8;
          if (nd & 1 && rand() < 0.75) pending = s;
        }
        if (!free(x + DX[nd], y + DY[nd], id)) {
          var alts = [d, (d + 1) % 8, (d + 7) % 8];
          nd = -1;
          pending = 0;
          for (var a = 0; a < 3; a++) {
            if (free(x + DX[alts[a]], y + DY[alts[a]], id)) {
              nd = alts[a];
              break;
            }
          }
          if (nd < 0) break;
        }
        if (nd !== d) verts.push([x, y]);
        d = nd;
        x += DX[d];
        y += DY[d];
        occ[y * cols + x] = id;
        cells.push(x, y);
        n++;
      }
      verts.push([x, y]);
      if (n < 3) {
        for (var c = 0; c < cells.length; c += 2) occ[cells[c + 1] * cols + cells[c]] = 0;
        return null;
      }
      return verts;
    }

    function pickFam() {
      var u = rand();
      return u < 0.5 ? 'c' : u < 0.75 ? 'f' : 'o';
    }

    function px(v) {
      return [v[0] * G + G / 2, v[1] * G + G / 2];
    }

    function addTrace(pts, chip, fam) {
      var cum = [0];
      for (var i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      }
      var t = { pts: pts, cum: cum, len: cum[cum.length - 1], chip: chip, fam: fam, w: rand() < 0.1 ? 3 : 1.6 };
      traces.push(t);
      if (chip >= 0) chips[chip].traces.push(t);
      var e = pts[pts.length - 1];
      if (rand() < (chip >= 0 ? 0.25 : 0.1)) silk.push([e[0] + 7, e[1] - 8, SILK[(rand() * SILK.length) | 0], fam]);
      return t;
    }

    // Chips: in the side margins beside the content box when they are wide enough, anywhere otherwise
    var zones = [];
    var card = document.querySelector('.content-card');
    if (card) {
      var r = card.getBoundingClientRect();
      var lm = Math.floor(r.left / G) - 1;
      var rm = Math.ceil(r.right / G) + 1;
      if (lm >= 7) zones.push([1, lm]);
      if (cols - 1 - rm >= 7) zones.push([rm, cols - 1]);
    }
    if (!zones.length) zones.push([1, cols - 1]);
    var zoneCells = zones.reduce(function (s, z) { return s + (z[1] - z[0]); }, 0) * rows;
    var maxChips = Math.max(3, Math.floor(zoneCells / 85));

    ctx.font = '500 13px ' + FONT;
    for (var k = 0; k < CHIP_DEFS.length && chips.length < maxChips; k++) {
      var def = CHIP_DEFS[k];
      var cw = Math.max(4, Math.ceil((ctx.measureText(def.label).width + 18) / G));
      var ch = 3;
      for (var tries = 0; tries < 80; tries++) {
        var z = zones[(k + tries) % zones.length];
        if (z[1] - z[0] < cw) continue;
        var cx = z[0] + Math.floor(rand() * (z[1] - z[0] - cw + 1));
        var cy = 2 + Math.floor(rand() * Math.max(1, rows - ch - 4));
        if (!clearArea(cx - 3, cy - 3, cw + 6, ch + 6)) continue;
        for (var j = cy; j < cy + ch; j++) for (var i = cx; i < cx + cw; i++) occ[j * cols + i] = -1;
        var chip = {
          def: def, x: cx, y: cy, w: cw, h: ch,
          px: cx * G + 2, py: cy * G + 2, pw: cw * G - 4, ph: ch * G - 4,
          fam: pickFam(), traces: [], pins: [], flash: 0, flashRgb: '', val: 0, text: ''
        };
        if (def.kind === 'value') { chip.val = rand() * 2 - 1; chip.text = fmt(chip.val); }
        else if (def.kind === 'prob') { chip.val = 0.2 + rand() * 0.6; chip.text = chip.val.toFixed(2); }
        else if (def.kind === 'td') chip.text = fmt(0);
        else if (def.kind === 'reward') chip.text = '0';
        else if (def.kind === 'action') chip.text = 'a₁';
        else chip.text = def.text;
        chips.push(chip);
        break;
      }
    }

    // Pins on every side of each chip, each with a trace leading away
    chips.forEach(function (c, ci) {
      var pins = [];
      for (var x = c.x + 1; x < c.x + c.w - 1; x += 2) {
        pins.push([x, c.y - 1, 6, (x + 0.5) * G, c.py]);
        pins.push([x, c.y + c.h, 2, (x + 0.5) * G, c.py + c.ph]);
      }
      pins.push([c.x - 1, c.y + 1, 4, c.px, (c.y + 1.5) * G]);
      pins.push([c.x + c.w, c.y + 1, 0, c.px + c.pw, (c.y + 1.5) * G]);
      pins.forEach(function (p) {
        c.pins.push([p[3], p[4], p[2]]);
        if (rand() < 0.15) return;
        var v = walk(p[0], p[1], p[2], traces.length + 1, 5 + Math.floor(rand() * 18));
        if (v) addTrace([[p[3], p[4]]].concat(v.map(px)), ci, rand() < 0.8 ? c.fam : pickFam());
      });
    });

    // Free-standing traces filling the rest of the board, via to pad
    var nFree = Math.floor((cols * rows) / 40);
    for (var f = 0; f < nFree; f++) {
      var v = walk((rand() * cols) | 0, (rand() * rows) | 0, ((rand() * 4) | 0) * 2, traces.length + 1, 4 + Math.floor(rand() * 22));
      if (v) addTrace(v.map(px), -1, pickFam());
    }

    // The static board, drawn once
    layer = document.createElement('canvas');
    layer.width = canvas.width;
    layer.height = canvas.height;
    var g = layer.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);

    g.fillStyle = 'rgba(70,190,170,0.13)';
    for (var yy = 0; yy < rows; yy++) {
      for (var xx = (yy & 1); xx < cols; xx += 2) {
        if (occ[yy * cols + xx] === 0) g.fillRect(xx * G + G / 2 - 0.5, yy * G + G / 2 - 0.5, 1, 1);
      }
    }

    g.lineJoin = 'round';
    g.lineCap = 'round';
    traces.forEach(function (t) {
      g.beginPath();
      g.moveTo(t.pts[0][0], t.pts[0][1]);
      for (var i = 1; i < t.pts.length; i++) g.lineTo(t.pts[i][0], t.pts[i][1]);
      g.strokeStyle = PAL[t.fam].halo;
      g.lineWidth = t.w + 2.5;
      g.stroke();
      g.strokeStyle = PAL[t.fam].core;
      g.lineWidth = t.w;
      g.stroke();
    });

    function pad(x, y, rad, col) {
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fillStyle = '#000';
      g.fill();
      g.lineWidth = 1.6;
      g.strokeStyle = col;
      g.stroke();
    }
    traces.forEach(function (t) {
      var e = t.pts[t.pts.length - 1];
      pad(e[0], e[1], 3.6, PAL[t.fam].pad);
      if (t.chip < 0) pad(t.pts[0][0], t.pts[0][1], 2.8, PAL[t.fam].pad);
    });

    chips.forEach(function (c) {
      var pal = PAL[c.fam];
      g.fillStyle = pal.chip;
      c.pins.forEach(function (p) {
        var dx = DX[p[2]];
        var dy = DY[p[2]];
        if (dx) g.fillRect(dx > 0 ? p[0] : p[0] - 5, p[1] - 1.5, 5, 3);
        else g.fillRect(p[0] - 1.5, dy > 0 ? p[1] : p[1] - 5, 3, 5);
      });
      g.fillStyle = '#061110';
      g.fillRect(c.px, c.py, c.pw, c.ph);
      g.strokeStyle = pal.chip;
      g.lineWidth = 1.2;
      g.strokeRect(c.px + 0.5, c.py + 0.5, c.pw - 1, c.ph - 1);
      g.beginPath();
      g.arc(c.px + 6, c.py + 6, 1.8, 0, Math.PI * 2); // pin-1 dot
      g.fillStyle = pal.chip;
      g.fill();
      g.fillStyle = pal.label;
      g.font = '500 13px ' + FONT;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(c.def.label, c.px + c.pw / 2, c.py + c.ph * 0.33);
    });

    g.font = '9px ' + FONT;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.globalAlpha = 0.45;
    silk.forEach(function (s) {
      g.fillStyle = PAL[s[3]].label;
      g.fillText(s[2], s[0], s[1]);
    });
    g.globalAlpha = 1;

    target = Math.max(10, Math.min(70, Math.round(traces.length * 0.3)));
    for (var p = 0; p < target; p++) spawn();
    if (reduce) pulses.forEach(function (q) { q.wait = 0; q.d = Math.random() * q.t.len; });
  }

  function fmt(v) {
    return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2);
  }

  function spawn() {
    var t = traces[(Math.random() * traces.length) | 0];
    if (!t) return;
    var inward = t.chip >= 0 && Math.random() < 0.65;
    var reward = Math.random() < 0.15;
    pulses.push({
      t: t, d: 0, dir: inward ? -1 : 1, v: 45 + Math.random() * 80,
      reward: reward, col: reward ? 'o' : t.fam, wait: Math.random() * 2
    });
  }

  function at(t, s) {
    if (s <= 0) return t.pts[0];
    if (s >= t.len) return t.pts[t.pts.length - 1];
    var i = 1;
    while (t.cum[i] < s) i++;
    var a = t.pts[i - 1];
    var b = t.pts[i];
    var f = (s - t.cum[i - 1]) / (t.cum[i] - t.cum[i - 1]);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  function path(t, a, b) {
    if (a > b) { var tmp = a; a = b; b = tmp; }
    var p = at(t, a);
    ctx.moveTo(p[0], p[1]);
    for (var i = 1; i < t.pts.length - 1; i++) if (t.cum[i] > a && t.cum[i] < b) ctx.lineTo(t.pts[i][0], t.pts[i][1]);
    p = at(t, b);
    ctx.lineTo(p[0], p[1]);
  }

  // A chip receiving a pulse flashes, updates its readout and sends a pulse out along another of its traces
  function arrive(p) {
    var t = p.t;
    if (p.dir < 0 && t.chip >= 0) {
      var c = chips[t.chip];
      var k = c.def.kind;
      c.flash = 1;
      c.flashRgb = PAL[p.col].rgb;
      if (k === 'value') { c.val += 0.3 * (Math.random() * 2 - 1 - c.val); c.text = fmt(c.val); }
      else if (k === 'reward') c.text = p.reward ? '+1' : '0';
      else if (k === 'prob') { c.val = Math.min(0.99, Math.max(0.01, c.val + (Math.random() - 0.5) * 0.3)); c.text = c.val.toFixed(2); }
      else if (k === 'td') c.text = fmt((Math.random() * 2 - 1) * 0.6);
      else if (k === 'action') c.text = 'a' + ['₁', '₂', '₃', '₄'][(Math.random() * 4) | 0];
      if (c.traces.length > 1 && pulses.length < target * 1.4) {
        var out = c.traces[(Math.random() * c.traces.length) | 0];
        if (out !== t) {
          var rw = k === 'reward' && Math.random() < 0.6;
          pulses.push({
            t: out, d: 0, dir: 1, v: 70 + Math.random() * 60,
            reward: rw, col: rw ? 'o' : out.fam, wait: 0.08 + Math.random() * 0.2
          });
        }
      }
    } else {
      var e = p.dir > 0 ? t.pts[t.pts.length - 1] : t.pts[0];
      sparks.push({ x: e[0], y: e[1], life: 1, col: p.col });
    }
  }

  function drawPulse(p) {
    var t = p.t;
    var rgb = PAL[p.col].rgb;
    var spr = GLOW[p.col];
    var head = p.dir > 0 ? p.d : t.len - p.d;
    var tail = Math.min(46, p.d);
    ctx.beginPath();
    path(t, head - p.dir * tail, head);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(' + rgb + ',0.35)';
    ctx.lineWidth = t.w + 1;
    ctx.stroke();
    for (var k = 5; k >= 1; k--) {
      if (p.d - k * 7 < 0) continue;
      var q = at(t, head - p.dir * k * 7);
      var sz = 14 - k * 1.5;
      ctx.globalAlpha = 0.35 * (1 - k / 6);
      ctx.drawImage(spr, q[0] - sz / 2, q[1] - sz / 2, sz, sz);
    }
    var h = at(t, head);
    ctx.globalAlpha = 1;
    ctx.drawImage(spr, h[0] - 11, h[1] - 11, 22, 22);
    if (p.reward) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(' + rgb + ',0.95)';
      ctx.font = '600 10px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('+1', h[0] + 7, h[1] - 8);
      ctx.globalCompositeOperation = 'lighter';
    }
  }

  function draw(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chips.forEach(function (c) {
      if (c.flash > 0) {
        ctx.globalAlpha = c.flash;
        ctx.strokeStyle = 'rgba(' + c.flashRgb + ',0.95)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(' + c.flashRgb + ',0.9)';
        ctx.shadowBlur = 14;
        ctx.strokeRect(c.px + 0.5, c.py + 0.5, c.pw - 1, c.ph - 1);
        ctx.shadowBlur = 0;
        c.flash = Math.max(0, c.flash - dt * 1.6);
      }
      ctx.globalAlpha = 0.65 + 0.35 * c.flash;
      ctx.fillStyle = PAL[c.fam].val;
      ctx.font = '500 11px ' + FONT;
      ctx.fillText(c.text, c.px + c.pw / 2, c.py + c.ph * 0.7);
    });

    ctx.globalCompositeOperation = 'lighter';
    ctx.textBaseline = 'middle';
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      if (p.wait > 0) { p.wait -= dt; continue; }
      p.d += p.v * dt;
      if (p.d >= p.t.len) {
        arrive(p);
        pulses.splice(i, 1);
        continue;
      }
      drawPulse(p);
    }
    for (var s = sparks.length - 1; s >= 0; s--) {
      var sp = sparks[s];
      var size = 10 + 18 * (1 - sp.life);
      ctx.globalAlpha = sp.life * 0.8;
      ctx.drawImage(GLOW[sp.col], sp.x - size / 2, sp.y - size / 2, size, size);
      sp.life -= dt * 2.2;
      if (sp.life <= 0) sparks.splice(s, 1);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    while (pulses.length < target) {
      spawn();
      pulses[pulses.length - 1].wait = Math.random() * 1.2;
    }

    if (strip) {
      var bh = Math.min(Math.round(nav.offsetHeight * dpr), canvas.height);
      if (strip.width !== canvas.width || strip.height !== bh) {
        strip.width = canvas.width;
        strip.height = bh;
      }
      if (bh > 0) sctx.drawImage(canvas, 0, 0, canvas.width, bh, 0, 0, canvas.width, bh);
    }
  }

  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    draw(dt);
    if (!reduce) requestAnimationFrame(frame);
  }

  function rebuild() {
    build();
    if (reduce) requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);

  // Redraw the board once the web font has loaded, so the chip labels are set in it
  if (document.fonts && document.fonts.load) document.fonts.load('500 13px Roboto').then(rebuild);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 150);
  });
})();
