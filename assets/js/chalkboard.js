// Page backdrop: a chalkboard with reinforcement-learning notes in chalk, drawn once onto a fixed canvas behind the
// page and redrawn when the window is resized. The notes sit in the margins beside the content box, slightly tilted,
// over a grainy black board, in the site's colours: the content boxes' light cyan, with highlights in pale orange,
// the brain's pale fuchsia and the outlines' teal. A copy of the top of the canvas fills the strip behind the fixed
// header, so content scrolling up still disappears below the header bar.
(function () {
  'use strict';

  var FONT = '"Klee One", "Comic Sans MS", cursive';
  var BOARD = '#1c1e1d'; // blackboard
  var WHITE = '#e0ffff'; // light cyan, as in the content boxes
  var COLOURS = ['#ffe2cc', '#ffebfb', '#008080']; // pale orange, the brain's pale fuchsia, outline teal

  // Notes: lines of text (_{} subscript, ^{} superscript) or drawings, each with an optional chalk highlight
  var NOTES = [
    { lines: ['V(s) = max_{a} { r(s,a)', '   + γ Σ_{s′} P(s′|s,a) V(s′) }'], mark: 'box' },
    { lines: ['δ_{t} = r_{t+1} + γV(s_{t+1}) − V(s_{t})'], mark: 'underline' },
    { lines: ['Q(s,a) ← Q(s,a) + α δ'] },
    { draw: 'mdp' },
    { lines: ['π(a|s) ∝ e^{β Q(s,a)}'], mark: 'underline' },
    { draw: 'grid' },
    { lines: ['G_{t} = Σ_{k} γ^{k} r_{t+k+1}'] },
    { draw: 'curve' },
    { lines: ['TD(λ)'], mark: 'circle' },
    { draw: 'tree' },
    { lines: ['ε-greedy:', '  explore w.p. ε', '  exploit w.p. 1 − ε'] },
    { lines: ['Q*(s,a) = r + γ max_{a′} Q*(s′,a′)'] },
    { draw: 'discount' },
    { lines: ['P(s′ | s, a)'], mark: 'box' },
    { lines: ['model-based', 'vs. model-free?'], mark: 'underline' },
    { draw: 'dyna' },
    { lines: ['V^{π}(s) = Σ_{a} π(a|s) Q(s,a)'] },
    { lines: ['α = learning rate'], mark: 'underline' }
  ];
  var SEED = 628094209; // the same board on every page

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

  // Speckle tiles: one lightens and darkens the board, the other knocks holes in the chalk
  function speckles(rand, size, fn) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var img = g.createImageData(size, size);
    for (var i = 0; i < img.data.length; i += 4) fn(img.data, i, rand());
    g.putImageData(img, 0, 0);
    return c;
  }

  // Text runs: "max_{a}" -> max with a subscript a; "γ^{k}" -> γ with a superscript k
  function runs(str) {
    var out = [];
    var re = /([_^])\{([^}]*)\}/g;
    var last = 0;
    var m;
    while ((m = re.exec(str))) {
      if (m.index > last) out.push({ t: str.slice(last, m.index), s: 0 });
      out.push({ t: m[2], s: m[1] === '_' ? -1 : 1 });
      last = re.lastIndex;
    }
    if (last < str.length) out.push({ t: str.slice(last), s: 0 });
    return out;
  }

  function runFont(size, s) {
    return '600 ' + (s ? size * 0.62 : size).toFixed(1) + 'px ' + FONT;
  }

  function measure(g, str, size) {
    var w = 0;
    runs(str).forEach(function (r) {
      g.font = runFont(size, r.s);
      w += g.measureText(r.t).width;
    });
    return w;
  }

  // Handwriting: each character is set slightly off the line and slightly turned
  function write(g, rand, str, x, y, size) {
    runs(str).forEach(function (r) {
      g.font = runFont(size, r.s);
      var dy = r.s < 0 ? size * 0.28 : r.s > 0 ? -size * 0.4 : 0;
      for (var i = 0; i < r.t.length; i++) {
        var ch = r.t[i];
        var w = g.measureText(ch).width;
        g.save();
        g.translate(x + w / 2, y + dy + (rand() - 0.5) * 1.4);
        g.rotate((rand() - 0.5) * 0.07);
        g.fillText(ch, -w / 2, 0);
        g.restore();
        x += w;
      }
    });
    return x;
  }

  // Chalk lines wobble a little
  function stroke(g, rand, pts, closed) {
    g.beginPath();
    for (var i = 0; i < pts.length - (closed ? 0 : 1); i++) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      var n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 7));
      if (i === 0) g.moveTo(a[0], a[1]);
      for (var k = 1; k <= n; k++) {
        var f = k / n;
        g.lineTo(a[0] + (b[0] - a[0]) * f + (rand() - 0.5) * 1.2, a[1] + (b[1] - a[1]) * f + (rand() - 0.5) * 1.2);
      }
    }
    g.stroke();
  }

  function ellipse(g, rand, cx, cy, rx, ry) {
    var pts = [];
    var start = rand() * Math.PI * 2;
    for (var i = 0; i <= 26; i++) {
      var t = start + (i / 24) * Math.PI * 2; // a little past a full turn, as when circling by hand
      pts.push([cx + Math.cos(t) * rx * (1 + (rand() - 0.5) * 0.05), cy + Math.sin(t) * ry * (1 + (rand() - 0.5) * 0.05)]);
    }
    stroke(g, rand, pts, false);
  }

  function arrow(g, rand, x1, y1, x2, y2) {
    stroke(g, rand, [[x1, y1], [x2, y2]]);
    var a = Math.atan2(y2 - y1, x2 - x1);
    stroke(g, rand, [[x2 - 9 * Math.cos(a - 0.45), y2 - 9 * Math.sin(a - 0.45)], [x2, y2], [x2 - 9 * Math.cos(a + 0.45), y2 - 9 * Math.sin(a + 0.45)]]);
  }

  // Drawings, each in a box of the given size (s scales them)
  var DRAW = {
    mdp: function (g, rand, s, size) {
      var w = 190 * s;
      var h = 90 * s;
      g.lineWidth = 2.4;
      ellipse(g, rand, 28 * s, 50 * s, 20 * s, 20 * s);
      ellipse(g, rand, 162 * s, 50 * s, 20 * s, 20 * s);
      write(g, rand, 's', 22 * s, 56 * s, size);
      write(g, rand, 's′', 153 * s, 56 * s, size);
      arrow(g, rand, 52 * s, 42 * s, 138 * s, 42 * s);
      write(g, rand, 'a, P(s′|s,a)', 52 * s, 30 * s, size * 0.7);
      g.beginPath();
      stroke(g, rand, [[150 * s, 72 * s], [135 * s, 86 * s], [92 * s, 88 * s]]);
      write(g, rand, 'r', 74 * s, 92 * s, size * 0.85);
      return [w, h + 8 * s];
    },
    grid: function (g, rand, s, size) {
      var c = 34 * s;
      g.lineWidth = 2.2;
      for (var i = 0; i <= 4; i++) stroke(g, rand, [[i * c, 0], [i * c, 3 * c]]);
      for (var j = 0; j <= 3; j++) stroke(g, rand, [[0, j * c], [4 * c, j * c]]);
      write(g, rand, '+1', 3 * c + 5 * s, c * 0.68, size * 0.8);
      write(g, rand, '−1', 3 * c + 5 * s, c * 1.68, size * 0.8);
      g.fillRect(c + 4 * s, c + 4 * s, c - 8 * s, c - 8 * s); // a wall, filled in
      arrow(g, rand, c * 0.5, c * 2.5, c * 0.5, c * 0.75);
      arrow(g, rand, c * 0.5, c * 0.5, c * 2.4, c * 0.5);
      return [4 * c, 3 * c];
    },
    curve: function (g, rand, s, size) {
      var w = 170 * s;
      var h = 100 * s;
      g.lineWidth = 2.2;
      arrow(g, rand, 14 * s, h - 14 * s, 14 * s, 4 * s);
      arrow(g, rand, 14 * s, h - 14 * s, w, h - 14 * s);
      var pts = [];
      for (var i = 0; i <= 20; i++) {
        var u = i / 20;
        pts.push([18 * s + u * (w - 30 * s), h - 18 * s - (h - 40 * s) * (1 - Math.exp(-4 * u)) + (rand() - 0.5) * 3]);
      }
      stroke(g, rand, pts);
      write(g, rand, 'trials', w - 54 * s, h + 2 * s, size * 0.7);
      write(g, rand, 'reward', 20 * s, 12 * s, size * 0.7);
      return [w, h + 6 * s];
    },
    tree: function (g, rand, s, size) {
      var w = 170 * s;
      var nodes = [[85, 10], [40, 50], [130, 50], [18, 92], [62, 92], [108, 92], [152, 92]];
      var edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      g.lineWidth = 2.2;
      edges.forEach(function (e) {
        stroke(g, rand, [[nodes[e[0]][0] * s, nodes[e[0]][1] * s], [nodes[e[1]][0] * s, nodes[e[1]][1] * s]]);
      });
      nodes.forEach(function (n) {
        g.beginPath();
        g.arc(n[0] * s, n[1] * s, 4.5 * s, 0, Math.PI * 2);
        g.fill();
      });
      ['3', '−1', '0', '5'].forEach(function (v, i) {
        write(g, rand, v, (nodes[3 + i][0] - 6) * s, 116 * s, size * 0.75);
      });
      return [w, 120 * s];
    },
    discount: function (g, rand, s, size) {
      var h = 90 * s;
      g.lineWidth = 2.2;
      stroke(g, rand, [[0, h], [170 * s, h]]);
      for (var t = 0; t < 8; t++) {
        var bh = (h - 22 * s) * Math.pow(0.72, t);
        stroke(g, rand, [[10 * s + t * 20 * s, h], [10 * s + t * 20 * s, h - bh], [24 * s + t * 20 * s, h - bh], [24 * s + t * 20 * s, h]]);
      }
      write(g, rand, 'γ^{t}', 120 * s, 22 * s, size * 0.9);
      return [170 * s, h + 4 * s];
    },
    dyna: function (g, rand, s, size) {
      g.lineWidth = 2.2;
      write(g, rand, 'experience', 0, 16 * s, size * 0.8);
      write(g, rand, 'model', 116 * s, 16 * s, size * 0.8);
      write(g, rand, 'Q', 76 * s, 86 * s, size * 0.9);
      arrow(g, rand, 90 * s, 10 * s, 110 * s, 10 * s);
      arrow(g, rand, 135 * s, 24 * s, 98 * s, 72 * s);
      arrow(g, rand, 30 * s, 24 * s, 68 * s, 72 * s);
      write(g, rand, 'plan', 128 * s, 60 * s, size * 0.65);
      return [172 * s, 92 * s];
    }
  };

  var W, H, dpr;

  function draw() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var rand = rng(SEED);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Board: black, a little uneven, with a fine grain and darker edges
    ctx.fillStyle = BOARD;
    ctx.fillRect(0, 0, W, H);
    for (var b = 0; b < 14; b++) {
      var bx = rand() * W;
      var by = rand() * H;
      var br = 120 + rand() * 360;
      var gr = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      gr.addColorStop(0, 'rgba(0,0,0,0.08)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    var grain = speckles(rand, 256, function (d, i, u) {
      var v = u < 0.5 ? 0 : 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = Math.floor(Math.pow(Math.abs(u - 0.5) * 2, 3) * 26);
    });
    ctx.fillStyle = ctx.createPattern(grain, 'repeat');
    ctx.fillRect(0, 0, W, H);
    var vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Where the notes go: the margins beside the content box when they are wide enough, otherwise anywhere
    var zones = [];
    var card = document.querySelector('.content-card');
    if (card) {
      var r = card.getBoundingClientRect();
      if (r.left >= 130) zones.push([12, r.left - 14]);
      if (W - r.right >= 130) zones.push([r.right + 14, W - 12]);
    }
    if (!zones.length) zones.push([12, W - 12]);
    var logo = document.querySelector('.side-logo');
    var logoBottom = logo && getComputedStyle(logo).display !== 'none' ? logo.getBoundingClientRect().bottom + 10 : 0;

    var holes = speckles(rand, 128, function (d, i, u) {
      d[i] = d[i + 1] = d[i + 2] = 0;
      d[i + 3] = u < 0.38 ? Math.floor(120 + u * 340) : 0;
    });

    // A note is drawn on its own layer, roughened with the hole pattern, then laid on the board slightly turned
    function chalk(width, height, paint, x, y, angle, alpha, dust) {
      var pad = 12;
      var layer = document.createElement('canvas');
      layer.width = Math.ceil((width + pad * 2) * dpr);
      layer.height = Math.ceil((height + pad * 2) * dpr);
      var g = layer.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      paint(g);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = g.createPattern(holes, 'repeat');
      g.fillRect(0, 0, layer.width, layer.height);
      // Uneven pressure: soft patches where the chalk went on lighter
      var press = speckles(rand, 10, function (d, i, u) {
        d[i] = d[i + 1] = d[i + 2] = 0;
        d[i + 3] = Math.floor(u * u * 170);
      });
      g.imageSmoothingEnabled = true;
      g.drawImage(press, 0, 0, layer.width, layer.height);
      ctx.save();
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      if (dust) {
        ctx.shadowColor = 'rgba(240,240,232,0.35)';
        ctx.shadowBlur = 4;
      }
      ctx.drawImage(layer, -width / 2 - pad, -height / 2 - pad, layer.width / dpr, layer.height / dpr);
      ctx.restore();
    }

    // The notes, stacked down each margin
    var order = NOTES.map(function (n, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    var next = 0;
    zones.forEach(function (z, zi) {
      var zw = z[1] - z[0];
      var size = Math.max(15, Math.min(24, zw / 10));
      var y = 18 + (zi === zones.length - 1 && logoBottom ? logoBottom : 0);
      while (y < H - 40 && next < order.length) {
        var note = NOTES[order[next]];
        next++;
        var colour = COLOURS[(rand() * COLOURS.length) | 0];
        var ink = rand() < 0.3 ? COLOURS[(rand() * COLOURS.length) | 0] : WHITE; // some notes in coloured chalk
        var w;
        var h;
        var paint;
        if (note.lines) {
          // Long lines are written smaller to fit the margin, down to a readable minimum
          var ns = size;
          var widest = 0;
          note.lines.forEach(function (line) { widest = Math.max(widest, measure(ctx, line, size)); });
          if (widest > zw - 20) ns = size * (zw - 20) / widest;
          if (ns < 12.5) continue;
          w = widest * ns / size;
          var lh = ns * 1.35;
          h = lh * note.lines.length + ns * 0.35;
          paint = (function (lines, lh, w, h, mark, colour, ns, ink) {
            return function (g) {
              g.fillStyle = ink;
              g.strokeStyle = ink;
              lines.forEach(function (line, li) { write(g, rand, line, 0, ns + li * lh, ns); });
              g.strokeStyle = colour;
              g.fillStyle = colour;
              g.lineWidth = 2.4;
              if (mark === 'underline') stroke(g, rand, [[-2, h + 1], [w * 0.5, h + 3], [w + 4, h]]);
              if (mark === 'box') stroke(g, rand, [[-7, -4], [w + 8, -6], [w + 7, h + 4], [-6, h + 5]], true);
              if (mark === 'circle') ellipse(g, rand, w / 2, h / 2, w / 2 + 12, h / 2 + 6);
            };
          })(note.lines, lh, w, h, note.mark, colour, ns, ink);
        } else {
          var probe = document.createElement('canvas').getContext('2d');
          var dims = DRAW[note.draw](probe, rng(1), 1, size);
          var s = Math.min(1, (zw - 20) / dims[0]);
          w = dims[0] * s;
          h = dims[1] * s;
          paint = (function (fn, s, ink) {
            return function (g) {
              g.fillStyle = ink;
              g.strokeStyle = ink;
              fn(g, rand, s, size);
            };
          })(DRAW[note.draw], s, ink);
        }
        if (w > zw - 10) continue; // too wide for this margin
        var x = z[0] + rand() * (zw - w - 10) + 5;
        chalk(w, h, paint, x, y, (rand() - 0.5) * 0.07, 0.9, true);
        y += h + 26 + rand() * 40;
      }
    });

    copyStrip();
  }

  function copyStrip() {
    if (!strip) return;
    var bh = Math.min(Math.round(nav.offsetHeight * dpr), canvas.height);
    strip.width = canvas.width;
    strip.height = bh;
    if (bh > 0) sctx.drawImage(canvas, 0, 0, canvas.width, bh, 0, 0, canvas.width, bh);
  }

  draw();
  // Redraw once the chalk font (with its Greek and maths symbols) has loaded
  if (document.fonts && document.fonts.load) {
    document.fonts.load('600 20px "Klee One"', 'Vγδπαβθλε∇∝←′≈Σ').then(draw);
  }
  if (nav && window.ResizeObserver) new ResizeObserver(copyStrip).observe(nav);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });
})();
