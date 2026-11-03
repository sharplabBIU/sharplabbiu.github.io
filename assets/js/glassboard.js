// Page backdrop: a pane of glass, white with a hint of cyan, with reinforcement-learning figures written on it in wet
// marker, drawn once onto a fixed canvas behind the page and redrawn when the window is resized. The lab logo and five
// figures stand in one column centred in the margin to the right of the content box, in the same order at any window
// size, scaled to fit: the successor vs. predecessor representation, a decision tree, TD learning vs. Rescorla-Wagner,
// a transition replayed in offline memory, and resource rationality. Where that margin is too narrow the glass is
// left clear. The marker strokes are neat and straight, wet and glossy, with a darker rim where the ink pools, and
// each casts a faint shadow on the wall behind the glass. The logo is written on the glass the same way, where the
// side-logo link sits (the link is centred in the margin and its own image hidden, but it stays clickable). A copy of
// the top of the canvas fills the strip behind the fixed header, so content scrolling up still disappears below the
// header bar.
(function () {
  'use strict';

  var FONT = '"Klee One", "Comic Sans MS", cursive';
  var SLATE = '#1f3333'; // dark slate, as the text in the content boxes
  var TEAL = '#008080'; // teal, orange and fuchsia: the lab logo's colours
  var ORANGE = '#e2661b';
  var FUCHSIA = '#c51f98';
  var COLUMN = 180; // the figures' width before scaling

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
    return '600 ' + (s ? size * 0.62 : size).toFixed(2) + 'px ' + FONT;
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
    g.save();
    runs(str).forEach(function (r) {
      g.font = runFont(size, r.s);
      g.lineWidth = size * (r.s ? 0.05 : 0.065);
      var dy = r.s < 0 ? size * 0.28 : r.s > 0 ? -size * 0.4 : 0;
      g.strokeText(r.t, x, y + dy);
      g.fillText(r.t, x, y + dy);
      x += g.measureText(r.t).width;
    });
    g.restore();
    return x;
  }

  function writeC(g, str, cx, y, size) {
    return write(g, str, cx - measure(g, str, size) / 2, y, size);
  }

  function writeR(g, str, right, y, size) {
    return write(g, str, right - measure(g, str, size), y, size);
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

  function circle(g, x, y, r) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
  }

  function dot(g, x, y, r) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  function head(g, x, y, angle, k) {
    stroke(g, [[x - k * Math.cos(angle - 0.5), y - k * Math.sin(angle - 0.5)], [x, y], [x - k * Math.cos(angle + 0.5), y - k * Math.sin(angle + 0.5)]]);
  }

  function arrow(g, x1, y1, x2, y2) {
    stroke(g, [[x1, y1], [x2, y2]]);
    head(g, x2, y2, Math.atan2(y2 - y1, x2 - x1), Math.min(9, Math.hypot(x2 - x1, y2 - y1) * 0.4));
  }

  // A curved arrow from (x1, y1) to (x2, y2), bent towards (cx, cy)
  function bend(g, x1, y1, cx, cy, x2, y2) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.quadraticCurveTo(cx, cy, x2, y2);
    g.stroke();
    head(g, x2, y2, Math.atan2(y2 - cy, x2 - cx), 8);
  }

  function dashes(g, x1, y1, x2, y2) {
    g.save();
    g.lineWidth = 1.8;
    g.setLineDash([4, 6]);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.restore();
  }

  // A thought bubble: an ellipse of scallops
  function cloud(g, cx, cy, rx, ry, bumps) {
    g.beginPath();
    for (var i = 0; i <= bumps; i++) {
      var t = (i / bumps) * Math.PI * 2;
      var px = cx + rx * Math.cos(t);
      var py = cy + ry * Math.sin(t);
      if (!i) {
        g.moveTo(px, py);
        continue;
      }
      var tm = ((i - 0.5) / bumps) * Math.PI * 2;
      g.quadraticCurveTo(cx + rx * 1.3 * Math.cos(tm), cy + ry * 1.3 * Math.sin(tm), px, py);
    }
    g.closePath();
    g.stroke();
  }

  // The figures, top to bottom, each COLUMN wide at most and h tall before scaling, written in one or more inks
  var FIGURES = [
    // Successor vs. predecessor representation: from state s, the states expected to follow it and those expected to lead to it
    {
      w: 180,
      h: 110,
      inks: [
        [SLATE, function (g) {
          var xs = [14, 52, 90, 128, 166];
          xs.forEach(function (x, i) {
            circle(g, x, 58, i === 2 ? 12 : 7);
            if (i < 4) arrow(g, x + (i === 2 ? 12 : 7) + 3, 58, xs[i + 1] - (i === 1 ? 12 : 7) - 3, 58);
          });
          writeC(g, 's', 90, 63, 15);
        }],
        [TEAL, function (g) {
          bend(g, 98.5, 49.5, 132, 18, 164, 49);
          writeR(g, 'SR: successors', 180, 14, 13);
        }],
        [ORANGE, function (g) {
          bend(g, 81.5, 66.5, 48, 98, 16, 67);
          write(g, 'PR: predecessors', 0, 106, 13);
        }]
      ]
    },
    // A decision tree, with the best path through it picked out
    {
      w: 180,
      h: 116,
      inks: [
        [SLATE, function (g) {
          circle(g, 90, 10, 7);
          circle(g, 45, 52, 6);
          circle(g, 135, 52, 6);
          stroke(g, [[85, 15], [49.5, 47.5]]);
          stroke(g, [[41.5, 57], [21, 88]]);
          stroke(g, [[48.5, 57], [69, 88]]);
          stroke(g, [[131.5, 57], [111, 88]]);
          [20, 70, 110].forEach(function (x) { dot(g, x, 92, 3.5); });
          write(g, 'a_{1}', 48, 28, 13);
          write(g, 'a_{2}', 117, 28, 13);
          [['+3', 20], ['−1', 70], ['0', 110]].forEach(function (v) { writeC(g, v[0], v[1], 112, 14); });
        }],
        [FUCHSIA, function (g) {
          stroke(g, [[95, 15], [130.5, 47.5]]);
          stroke(g, [[138.5, 57], [159, 88]]);
          dot(g, 160, 92, 3.5);
          writeC(g, '+5', 160, 112, 14);
        }]
      ]
    },
    // TD learning vs. Rescorla-Wagner: TD adds the discounted value of the next state to the prediction error
    {
      w: 180,
      h: 54,
      inks: [
        [SLATE, function (g) {
          var fs = tdSize(g);
          write(g, 'TD:', 0, 18, 15);
          write(g, 'ΔV = α(r + γV′ − V)', 36, 18, fs);
          write(g, 'RW:', 0, 46, 15);
          write(g, 'ΔV = α(r − V)', 36, 46, fs);
        }],
        [TEAL, function (g) {
          var fs = tdSize(g);
          var x0 = 36 + measure(g, 'ΔV = α(r ', fs);
          stroke(g, [[x0 - 1, 24], [x0 + measure(g, '+ γV′', fs) + 1, 24]]);
        }]
      ]
    },
    // A transition s -> s′ replayed offline, in a thought bubble
    {
      w: 180,
      h: 128,
      inks: [
        [SLATE, function (g) {
          circle(g, 56, 74, 13);
          circle(g, 130, 74, 13);
          writeC(g, 's', 56, 79, 15);
          writeC(g, 's′', 131, 79, 15);
          arrow(g, 73, 74, 113, 74);
          writeC(g, 'a', 93, 67, 12);
          writeC(g, 'r', 93, 91, 12);
        }],
        [ORANGE, function (g) {
          cloud(g, 93, 66, 74, 44, 12);
          writeC(g, 'offline memory', 93, 45, 13);
          circle(g, 19, 115, 5);
          circle(g, 7, 124, 3);
        }]
      ]
    },
    // Resource rationality: computing pays until its cost outweighs what it adds, so the best amount is in between
    {
      w: 180,
      h: 130,
      inks: [
        [SLATE, function (g) {
          writeC(g, 'resource rationality', 90, 14, 14);
          arrow(g, 12, 112, 12, 28);
          arrow(g, 12, 112, 178, 112);
          write(g, 'net value', 19, 34, 11);
          writeR(g, 'computation', 178, 127, 11);
          var p = rrPeak();
          dashes(g, p[0], p[1] + 6, p[0], 110);
        }],
        [FUCHSIA, function (g) {
          g.beginPath();
          for (var i = 0; i <= 50; i++) {
            var pt = rrPoint(i / 50);
            if (i) g.lineTo(pt[0], pt[1]);
            else g.moveTo(pt[0], pt[1]);
          }
          g.stroke();
          var p = rrPeak();
          dot(g, p[0], p[1], 4);
        }]
      ]
    }
  ];

  // The TD and RW equations' size: as large as fits beside their labels
  function tdSize(g) {
    return Math.min(15, 15 * 140 / measure(g, 'ΔV = α(r + γV′ − V)', 15));
  }

  // Net value of computing an amount u (0 to 1): a benefit that saturates, less a cost that keeps growing
  function rrPoint(u) {
    var net = 1 - Math.exp(-4 * u) - 0.75 * u;
    return [16 + u * 150, 106 - (net / 0.5) * 60];
  }

  function rrPeak() {
    return rrPoint(Math.log(4 / 0.75) / 4);
  }

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

  function draw() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = document.documentElement.clientWidth;
    H = document.documentElement.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The glass: nearly white with a hint of cyan, a touch clearer at the top and a touch more cyan at the foot
    var tint = ctx.createLinearGradient(0, 0, W * 0.2, H);
    tint.addColorStop(0, '#fbffff');
    tint.addColorStop(1, '#eefafa');
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);

    // The column: the margin to the right of the content box, when it is wide enough
    var card = document.querySelector('.content-card');
    var col = null;
    if (card) {
      var cr = card.getBoundingClientRect();
      if (W - cr.right >= 110) col = [cr.right, W];
    }
    if (!col) {
      copyStrip();
      return;
    }
    var cx = (col[0] + col[1]) / 2;

    // The lab logo at the top of the column, centred in it
    var top = 24;
    var ls = logo && getComputedStyle(logo);
    if (logoImg && ls.display !== 'none') {
      var lw = parseFloat(ls.width);
      var lh = logoImg.naturalWidth ? (lw * logoImg.naturalHeight) / logoImg.naturalWidth : logoImg.offsetHeight;
      var lx = Math.round(cx - lw / 2);
      var ly = parseFloat(ls.top) || 0;
      logo.style.left = lx + 'px';
      logo.style.right = 'auto';
      top = ly + lh + 22;
      if (logoImg.complete && logoImg.naturalWidth) {
        var ll = layerOf(lw * dpr, lh * dpr);
        ll.getContext('2d').drawImage(logoImg, 0, 0, ll.width, ll.height);
        ink(ll, Math.round(lx * dpr), Math.round(ly * dpr), 0.12, 0.25);
        logoImg.style.opacity = '0';
      }
    }

    // The figures below it, as large as fits the margin's width and the height left (up to a little over their size),
    // spaced evenly; on a short window the last ones are left off rather than written too small to read
    var figs = FIGURES.slice();
    var avail = H - 18 - top;
    var minGap = 18;
    var s;
    for (;;) {
      var total = figs.reduce(function (t, f) { return t + f.h; }, 0);
      s = Math.min(1.25, (col[1] - col[0] - 28) / COLUMN, (avail - minGap * (figs.length - 1)) / total);
      if (s >= 0.5 || figs.length === 1) break;
      figs.pop();
    }
    var used = figs.reduce(function (t, f) { return t + f.h * s; }, 0);
    var gap = figs.length > 1 ? Math.min(56, Math.max(minGap, (avail - used) / (figs.length - 1))) : 0;
    var pad = 14;
    var y = top;
    figs.forEach(function (f) {
      var x = cx - (f.w * s) / 2;
      f.inks.forEach(function (part) {
        var layer = layerOf((f.w * s + pad * 2) * dpr, (f.h * s + pad * 2) * dpr);
        var g = layer.getContext('2d');
        g.setTransform(dpr * s, 0, 0, dpr * s, pad * dpr, pad * dpr);
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.lineWidth = 2.4;
        g.fillStyle = part[0];
        g.strokeStyle = part[0];
        part[1](g);
        ink(layer, Math.round((x - pad) * dpr), Math.round((y - pad) * dpr), 0.28, 0.4);
      });
      y += f.h * s + gap;
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
    document.fonts.load('600 20px "Klee One"', 'VΔγδπαβθλε∇∝←′≈Σ').then(draw);
  }
  if (nav && window.ResizeObserver) new ResizeObserver(copyStrip).observe(nav);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });
})();
