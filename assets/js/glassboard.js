// Page backdrop: a pane of glass tinted the content boxes' light cyan, with reinforcement-learning notes written on it
// in wet marker, drawn once onto a fixed canvas behind the page and redrawn when the window is resized. The notes sit
// in the margins beside the content box, written neatly on straight lines, in the site's inks: dark slate, with teal,
// orange and fuchsia as in the lab logo. The logo is written on the glass too, where the side-logo link sits (the
// link's own image is then hidden but still clickable). Each mark is wet and glossy, with a darker rim where the ink
// pools, and casts a faint shadow on the wall behind the glass. A copy of the top of the canvas fills the strip
// behind the fixed header, so content scrolling up still disappears below the header bar.
(function () {
  'use strict';

  var FONT = '"Klee One", "Comic Sans MS", cursive';
  var GLASS = '#e0ffff'; // light cyan, as in the content boxes
  var SLATE = '#1f3333'; // dark slate, as the text in the content boxes
  var INKS = ['#008080', '#e2661b', '#c51f98']; // teal, orange, fuchsia: the lab logo's colours

  // Notes: lines of text (_{} subscript, ^{} superscript) or drawings, each with an optional highlight in a coloured ink
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
  var SEED = 628094209; // the same glass on every page

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

  var logo = document.querySelector('.side-logo');
  var logoImg = logo && logo.querySelector('img');
  if (logoImg && !logoImg.complete) logoImg.addEventListener('load', function () { draw(); });

  function rng(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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

  // Handwriting in marker: the letters thickened by tracing their outlines with the nib, on a straight line
  function write(g, str, x, y, size) {
    runs(str).forEach(function (r) {
      g.font = runFont(size, r.s);
      g.lineWidth = size * (r.s ? 0.05 : 0.065);
      var dy = r.s < 0 ? size * 0.28 : r.s > 0 ? -size * 0.4 : 0;
      g.strokeText(r.t, x, y + dy);
      g.fillText(r.t, x, y + dy);
      x += g.measureText(r.t).width;
    });
    return x;
  }

  // Marker lines: straight and even, with a little more ink where the nib first touched the glass
  function stroke(g, pts, closed) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (closed) g.closePath();
    g.stroke();
    g.beginPath();
    g.arc(pts[0][0], pts[0][1], g.lineWidth * 0.62, 0, Math.PI * 2);
    g.fill();
  }

  function ellipse(g, rand, cx, cy, rx, ry) {
    var start = rand() * Math.PI * 2;
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, start, start + Math.PI * 2.08); // just past a full turn, closing the loop
    g.stroke();
  }

  function arrow(g, x1, y1, x2, y2) {
    stroke(g, [[x1, y1], [x2, y2]]);
    var a = Math.atan2(y2 - y1, x2 - x1);
    var k = 8 + g.lineWidth;
    stroke(g, [[x2 - k * Math.cos(a - 0.5), y2 - k * Math.sin(a - 0.5)], [x2, y2], [x2 - k * Math.cos(a + 0.5), y2 - k * Math.sin(a + 0.5)]]);
  }

  // Drawings, each in a box of the given size (s scales them)
  var DRAW = {
    mdp: function (g, rand, s, size) {
      var w = 190 * s;
      var h = 90 * s;
      g.lineWidth = 2.6;
      ellipse(g, rand, 28 * s, 50 * s, 20 * s, 20 * s);
      ellipse(g, rand, 162 * s, 50 * s, 20 * s, 20 * s);
      write(g, 's', 23 * s, 56 * s, size);
      write(g, 's′', 154 * s, 56 * s, size);
      arrow(g, 52 * s, 42 * s, 138 * s, 42 * s);
      write(g, 'a, P(s′|s,a)', 52 * s, 30 * s, size * 0.7);
      g.beginPath();
      g.moveTo(150 * s, 72 * s);
      g.quadraticCurveTo(138 * s, 88 * s, 92 * s, 88 * s);
      g.stroke();
      write(g, 'r', 74 * s, 92 * s, size * 0.85);
      return [w, h + 8 * s];
    },
    grid: function (g, rand, s, size) {
      var c = 34 * s;
      g.lineWidth = 2.4;
      for (var i = 0; i <= 4; i++) stroke(g, [[i * c, 0], [i * c, 3 * c]]);
      for (var j = 0; j <= 3; j++) stroke(g, [[0, j * c], [4 * c, j * c]]);
      write(g, '+1', 3 * c + 5 * s, c * 0.68, size * 0.8);
      write(g, '−1', 3 * c + 5 * s, c * 1.68, size * 0.8);
      // A wall, hatched in
      g.save();
      g.beginPath();
      g.rect(c + 4 * s, c + 4 * s, c - 8 * s, c - 8 * s);
      g.clip();
      g.lineWidth = 2;
      for (var t = -c; t < c; t += 6 * s) stroke(g, [[c + t, 2 * c], [2 * c + t, c]]);
      g.restore();
      arrow(g, c * 0.5, c * 2.5, c * 0.5, c * 0.75);
      arrow(g, c * 0.5, c * 0.5, c * 2.4, c * 0.5);
      return [4 * c, 3 * c];
    },
    curve: function (g, rand, s, size) {
      var w = 170 * s;
      var h = 100 * s;
      g.lineWidth = 2.4;
      arrow(g, 14 * s, h - 14 * s, 14 * s, 4 * s);
      arrow(g, 14 * s, h - 14 * s, w, h - 14 * s);
      g.beginPath();
      for (var i = 0; i <= 40; i++) {
        var u = i / 40;
        var px = 18 * s + u * (w - 30 * s);
        var py = h - 18 * s - (h - 40 * s) * (1 - Math.exp(-4 * u));
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      }
      g.stroke();
      write(g, 'trials', w - 54 * s, h + 2 * s, size * 0.7);
      write(g, 'reward', 20 * s, 12 * s, size * 0.7);
      return [w, h + 6 * s];
    },
    tree: function (g, rand, s, size) {
      var w = 170 * s;
      var nodes = [[85, 10], [40, 50], [130, 50], [18, 92], [62, 92], [108, 92], [152, 92]];
      var edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      g.lineWidth = 2.4;
      edges.forEach(function (e) {
        stroke(g, [[nodes[e[0]][0] * s, nodes[e[0]][1] * s], [nodes[e[1]][0] * s, nodes[e[1]][1] * s]]);
      });
      nodes.forEach(function (n) {
        g.beginPath();
        g.arc(n[0] * s, n[1] * s, 4.5 * s, 0, Math.PI * 2);
        g.fill();
      });
      ['3', '−1', '0', '5'].forEach(function (v, i) {
        write(g, v, (nodes[3 + i][0] - 6) * s, 116 * s, size * 0.75);
      });
      return [w, 120 * s];
    },
    discount: function (g, rand, s, size) {
      var h = 90 * s;
      g.lineWidth = 2.4;
      stroke(g, [[0, h], [170 * s, h]]);
      for (var t = 0; t < 8; t++) {
        var bh = (h - 22 * s) * Math.pow(0.72, t);
        stroke(g, [[10 * s + t * 20 * s, h], [10 * s + t * 20 * s, h - bh], [24 * s + t * 20 * s, h - bh], [24 * s + t * 20 * s, h]]);
      }
      write(g, 'γ^{t}', 120 * s, 22 * s, size * 0.9);
      return [170 * s, h + 4 * s];
    },
    dyna: function (g, rand, s, size) {
      g.lineWidth = 2.4;
      write(g, 'experience', 0, 16 * s, size * 0.8);
      write(g, 'model', 116 * s, 16 * s, size * 0.8);
      write(g, 'Q', 76 * s, 86 * s, size * 0.9);
      arrow(g, 90 * s, 10 * s, 110 * s, 10 * s);
      arrow(g, 135 * s, 24 * s, 98 * s, 72 * s);
      arrow(g, 30 * s, 24 * s, 68 * s, 72 * s);
      write(g, 'plan', 128 * s, 60 * s, size * 0.65);
      return [172 * s, 92 * s];
    }
  };

  var W, H, dpr;

  function layerOf(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  // Lays a layer of ink (already in its colours) on the glass at device pixel (x, y): first its shadow on the wall
  // behind, then the ink, then a darker rim where the wet ink pools at the edges and a gloss along their upper left
  function ink(layer, x, y, rim, gloss) {
    var off = canvas.width + layer.width + 50; // the layer is drawn off the canvas so only its shadow lands
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(15, 70, 70, 0.2)';
    ctx.shadowBlur = 2.5 * dpr;
    ctx.shadowOffsetX = off + 3 * dpr;
    ctx.shadowOffsetY = 4 * dpr;
    ctx.drawImage(layer, x - off, y);
    ctx.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.94;
    ctx.drawImage(layer, x, y);
    ctx.globalAlpha = 1;

    // The ink pulled in from its edges by about a pixel
    var r = Math.max(1, Math.round(0.8 * dpr));
    var core = layerOf(layer.width, layer.height);
    var cg = core.getContext('2d');
    cg.drawImage(layer, 0, 0);
    cg.globalCompositeOperation = 'destination-in';
    [[r, 0], [-r, 0], [0, r], [0, -r]].forEach(function (o) { cg.drawImage(layer, o[0], o[1]); });

    if (rim) {
      var edge = layerOf(layer.width, layer.height);
      var eg = edge.getContext('2d');
      eg.drawImage(layer, 0, 0);
      eg.globalCompositeOperation = 'destination-out';
      eg.drawImage(core, 0, 0);
      eg.globalCompositeOperation = 'source-in';
      eg.fillStyle = 'rgba(0, 0, 0, ' + rim + ')';
      eg.fillRect(0, 0, edge.width, edge.height);
      ctx.drawImage(edge, x, y);
    }
    if (gloss) {
      var shine = layerOf(layer.width, layer.height);
      var sg = shine.getContext('2d');
      sg.drawImage(core, 0, 0);
      sg.globalCompositeOperation = 'destination-out';
      sg.drawImage(core, r, r);
      sg.globalCompositeOperation = 'source-in';
      sg.fillStyle = 'rgba(255, 255, 255, ' + gloss + ')';
      sg.fillRect(0, 0, shine.width, shine.height);
      ctx.drawImage(shine, x, y);
    }
    ctx.restore();
  }

  // The glass: the content boxes' light cyan, a little clearer at the top and deeper at the foot, where thick glass
  // shows more of its colour; long diagonal reflections; polished edges; and steel standoffs holding it to the wall
  function glass(rand) {
    var tint = ctx.createLinearGradient(0, 0, W * 0.25, H);
    tint.addColorStop(0, '#effffe');
    tint.addColorStop(0.5, GLASS);
    tint.addColorStop(1, '#ccf3f0');
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);

    // Reflections: pairs of bands, a broad soft one with a narrow bright one beside it, every so often across the pane
    var nx = Math.cos(0.52);
    var ny = Math.sin(0.52);
    var span = nx * W + ny * H;
    var shine = ctx.createLinearGradient(0, 0, nx * span, ny * span);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    var period = 560;
    for (var p = 140 + rand() * 200; p < span - 120; p += period * (0.85 + rand() * 0.3)) {
      var bw = 70 + rand() * 50;
      [[p - bw / 2, 0], [p - bw / 4, 0.16], [p, 0.3], [p + bw / 4, 0.16], [p + bw / 2, 0],
        [p + bw / 2 + 22, 0], [p + bw / 2 + 27, 0.5], [p + bw / 2 + 32, 0]].forEach(function (st) {
        shine.addColorStop(Math.min(1, Math.max(0, st[0] / span)), 'rgba(255,255,255,' + st[1] + ')');
      });
    }
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, W, H);

    // Polished edges: deeper cyan at the very edge of the pane with a bright line just inside it
    [[0, 0, 1, 0, W], [0, 0, 0, 1, H], [W, 0, -1, 0, W], [0, H, 0, -1, H]].forEach(function (e) {
      var d = 7;
      var x0 = e[0];
      var y0 = e[1];
      var gr = ctx.createLinearGradient(x0, y0, x0 + e[2] * d, y0 + e[3] * d);
      gr.addColorStop(0, 'rgba(0, 110, 110, 0.28)');
      gr.addColorStop(1, 'rgba(0, 110, 110, 0)');
      ctx.fillStyle = gr;
      if (e[2]) ctx.fillRect(e[2] > 0 ? 0 : W - d, 0, d, H);
      else ctx.fillRect(0, e[3] > 0 ? 0 : H - d, W, d);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      if (e[2]) ctx.fillRect(e[2] > 0 ? d : W - d - 1, 0, 1, H);
      else ctx.fillRect(0, e[3] > 0 ? d : H - d - 1, W, 1);
    });

    standoff(W - 24, 24);
    standoff(W - 24, H - 24);
  }

  function standoff(x, y) {
    var r = 9;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 40, 40, 0.3)';
    ctx.shadowBlur = 4 * dpr;
    ctx.shadowOffsetX = 1.5 * dpr;
    ctx.shadowOffsetY = 2.5 * dpr;
    var body = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    body.addColorStop(0, '#f6f8f8');
    body.addColorStop(0.55, '#b9c3c3');
    body.addColorStop(1, '#8a9696');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    var face = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, r - 2);
    face.addColorStop(0, '#ffffff');
    face.addColorStop(1, '#a9b4b4');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var rand = rng(SEED);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    glass(rand);

    // Where the notes go: the margins beside the content box when they are wide enough, otherwise anywhere
    var zones = [];
    var card = document.querySelector('.content-card');
    if (card) {
      var cr = card.getBoundingClientRect();
      if (cr.left >= 130) zones.push([12, cr.left - 14]);
      if (W - cr.right >= 130) zones.push([cr.right + 14, W - 12]);
    }
    if (!zones.length) zones.push([12, W - 12]);

    // The lab logo, written on the glass where the side-logo link is
    var logoBottom = 0;
    if (logo && logoImg && getComputedStyle(logo).display !== 'none') {
      var lr = logoImg.getBoundingClientRect();
      logoBottom = lr.bottom + 16;
      if (logoImg.complete && logoImg.naturalWidth && lr.width) {
        var ll = layerOf(lr.width * dpr, lr.height * dpr);
        ll.getContext('2d').drawImage(logoImg, 0, 0, ll.width, ll.height);
        ink(ll, Math.round(lr.left * dpr), Math.round(lr.top * dpr), 0.12, 0.25);
        logoImg.style.opacity = '0';
      }
    }

    var pad = 18; // room around a note for its highlight

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
      var y = 20 + (zi === zones.length - 1 && logoBottom ? logoBottom : 0);
      while (y < H - 50 && next < order.length) {
        var note = NOTES[order[next]];
        next++;
        var colour = INKS[(rand() * INKS.length) | 0];
        var text = rand() < 0.3 ? INKS[(rand() * INKS.length) | 0] : SLATE; // some notes in coloured ink
        if (text === colour) colour = SLATE;
        var w;
        var h;
        var paint;
        var mark = null;
        if (note.lines) {
          // Long lines are written smaller to fit the margin, down to a readable minimum
          var ns = size;
          var widest = 0;
          note.lines.forEach(function (line) { widest = Math.max(widest, measure(ctx, line, size)); });
          if (widest > zw - 24) ns = size * (zw - 24) / widest;
          if (ns < 12.5) continue;
          w = widest * ns / size;
          var lh = ns * 1.4;
          h = lh * note.lines.length + ns * 0.35;
          paint = (function (lines, lh, ns) {
            return function (g) {
              lines.forEach(function (line, li) { write(g, line, 0, ns + li * lh, ns); });
            };
          })(note.lines, lh, ns);
          if (note.mark) {
            mark = (function (kind, w, h) {
              return function (g) {
                g.lineWidth = 2.6;
                if (kind === 'underline') stroke(g, [[-2, h + 2], [w + 4, h + 2]]);
                if (kind === 'box') stroke(g, [[-8, -5], [w + 8, -5], [w + 8, h + 5], [-8, h + 5]], true);
                if (kind === 'circle') ellipse(g, rand, w / 2, h / 2, w / 2 + 12, h / 2 + 6);
              };
            })(note.mark, w, h);
          }
        } else {
          var probe = document.createElement('canvas').getContext('2d');
          var dims = DRAW[note.draw](probe, rng(1), 1, size);
          var s = Math.min(1, (zw - 24) / dims[0]);
          w = dims[0] * s;
          h = dims[1] * s;
          paint = (function (fn, s) {
            return function (g) { fn(g, rand, s, size); };
          })(DRAW[note.draw], s);
        }
        if (w > zw - 10) continue; // too wide for this margin
        var x = Math.round(z[0] + rand() * (zw - w - 10) + 5);
        [[paint, text], [mark, colour]].forEach(function (part) {
          if (!part[0]) return;
          var layer = layerOf((w + pad * 2) * dpr, (h + pad * 2) * dpr);
          var g = layer.getContext('2d');
          g.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
          g.lineCap = 'round';
          g.lineJoin = 'round';
          g.fillStyle = part[1];
          g.strokeStyle = part[1];
          part[0](g);
          ink(layer, Math.round((x - pad) * dpr), Math.round((y - pad) * dpr), 0.28, 0.4);
        });
        y += h + 30 + rand() * 36;
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
  // Redraw once the handwriting font (with its Greek and maths symbols) has loaded
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
