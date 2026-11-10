// Lab Adventures (team page): a thin branch of blue bark down either side of the box (on windows with room there), the
// root of the left one labelled "Lab Adventures", with a tiny leaf for each photo falling slowly from its twigs, over and
// over. A leaf holds still under the pointer; a click on it plucks it, and its photo springs out above where it was. The
// photo opens large when clicked, and closing it (the ×, a click elsewhere or Escape) sends the leaf back to its twig to
// fall again. In the box (narrower windows) the leaves are a row and open their photos large straight away. Large, the
// arrows (or the arrow keys) step through the photos, and a click beside the photo, the close button or Escape closes it
(function () {
  'use strict';

  var leaves = Array.prototype.slice.call(document.querySelectorAll('.adv-leaf'));
  if (!leaves.length) return;
  var cols = Array.prototype.slice.call(document.querySelectorAll('.adventure-col'));

  // The same test as $side-cols in _sass/_base.scss: whether the branches are either side of the box
  var wide = window.matchMedia('(min-width: 1240px) and (min-height: 560px)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';

  function label(i) {
    return leaves[i].getAttribute('data-label');
  }

  // ---- A photo large over the page ----

  var view = document.createElement('div');
  view.className = 'photo-viewer';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-label', 'Photo');
  view.hidden = true;
  view.innerHTML =
    '<figure><img alt=""></figure>' +
    '<button type="button" class="pv-close" aria-label="Close">×</button>' +
    '<button type="button" class="pv-prev" aria-label="Previous photo">‹</button>' +
    '<button type="button" class="pv-next" aria-label="Next photo">›</button>';
  document.body.appendChild(view);

  var big = view.querySelector('img');
  var at = 0;
  var opener = null;

  function show(i) {
    at = (i + leaves.length) % leaves.length;
    big.src = leaves[at].getAttribute('data-src');
    big.alt = leaves[at].getAttribute('data-alt');
  }

  function openLarge(i, from) {
    opener = from;
    show(i);
    view.hidden = false;
    document.body.classList.add('pv-open');
    view.querySelector('.pv-close').focus();
  }

  function closeLarge() {
    view.hidden = true;
    document.body.classList.remove('pv-open');
    big.removeAttribute('src');
    if (opener && document.body.contains(opener)) opener.focus({ preventScroll: true });
  }

  view.addEventListener('click', function (e) {
    e.stopPropagation(); // (so it does not also close the photo out of a leaf)
    if (e.target.closest('.pv-prev')) show(at - 1);
    else if (e.target.closest('.pv-next')) show(at + 1);
    else if (e.target !== big) closeLarge();
  });

  // ---- The branches ----

  // A steady pseudo-random number for a seed, so a branch looks the same each time it is drawn
  function rnd(n) {
    var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // A point on a cubic curve [[x, y] x 4], and its direction there (a unit vector)
  function bez(P, t) {
    var u = 1 - t;
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
    ];
  }

  function dir(P, t) {
    var u = 1 - t;
    var dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
    var dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
    var l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }

  // A limb (the branch, a twig or a root) along a curve: points down its middle, each with its width there, tapering
  // from w0 to w1, a little uneven, flaring out at its foot by flare, and waving from side to side by wave
  function limbAlong(P, n, w0, w1, seed, flare, wave) {
    var C = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var p = bez(P, t);
      var d = dir(P, t);
      var w = w0 + (w1 - w0) * Math.pow(t, 0.85);
      if (flare && t < 0.1) w += ((0.1 - t) / 0.1) * flare;
      w *= 1 + (rnd(seed + i * 1.3) - 0.5) * 0.14;
      var o = wave ? wave * (Math.sin(t * Math.PI * 3.2 + seed) * 0.7 + Math.sin(t * Math.PI * 7.1 + seed * 2) * 0.3) * Math.min(1, t * 6) : 0;
      C.push({ x: p[0] - d[1] * o, y: p[1] + d[0] * o, tx: d[0], ty: d[1], nx: -d[1], ny: d[0], w: w });
    }
    return C;
  }

  function line(list) {
    return list
      .map(function (p) {
        return p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      })
      .join(' L');
  }

  // The outline of a limb, or of a strip of it: the part from offset a to offset b across it (-0.5 to 0.5 is all of it)
  function strip(C, a, b) {
    var one = C.map(function (c) {
      return [c.x + c.nx * c.w * a, c.y + c.ny * c.w * a];
    });
    var two = C.map(function (c) {
      return [c.x + c.nx * c.w * b, c.y + c.ny * c.w * b];
    }).reverse();
    return 'M' + line(one) + ' L' + line(two) + ' Z';
  }

  // A line down a limb at offset f across it, wandering a little: the bark's furrows and ridges
  function furrow(C, f, seed, wander) {
    return (
      'M' +
      line(
        C.map(function (c, i) {
          var o = c.w * (f + (rnd(seed + i * 0.37) - 0.5) * wander);
          return [c.x + c.nx * o, c.y + c.ny * o];
        })
      )
    );
  }

  function add(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  // A small leaf, still on the branch (the same shape as the ones that fall, darker and not clickable)
  var LEAF = 'M-9 0 C-6 -4.6 2 -5.6 9 0 C2 5.6 -6 4.6 -9 0 Z';

  // Draws column col's branch (k: 0 on the left, 1 on the right, mirrored) and gives back the tips of its twigs, where
  // the leaves fall from
  function grow(col, k) {
    var old = col.querySelector('.adv-branch');
    if (old) old.remove();
    var W = col.clientWidth;
    var H = col.clientHeight;
    if (!W || !H) return [];
    var side = k ? -1 : 1;
    var root = H - (col.hasAttribute('data-root-label') ? 50 : 12);
    var top = 16;
    var x0 = W * 0.5;
    var main = [
      [x0, root],
      [x0 + side * W * 0.16, root - (root - top) * 0.38],
      [x0 - side * W * 0.18, root - (root - top) * 0.7],
      [x0 + side * W * 0.06, top],
    ];
    var N = 90;
    var trunk = limbAlong(main, N, 13, 2.6, 17 + k * 50, 9, W * 0.035);
    var limbs = [trunk];
    var tips = [];
    var leafSpots = [];

    // Twigs, on alternate sides, reaching up and out
    // a twig from point c, heading at angle a (radians, from c's direction), len long: its curve
    function shoot(c, a, len, s) {
      var dx = c.tx * Math.cos(a) - c.ty * Math.sin(a);
      var dy = c.tx * Math.sin(a) + c.ty * Math.cos(a);
      var bend = -s * len * 0.14; // curving up toward the light
      return [
        [c.x, c.y],
        [c.x + dx * len * 0.35, c.y + dy * len * 0.35],
        [c.x + dx * len * 0.7 - dy * bend, c.y + dy * len * 0.7 + dx * bend],
        [c.x + dx * len, c.y + dy * len + bend * 0.3],
      ];
    }
    function inside(P) {
      return P[3][0] > 12 && P[3][0] < W - 12;
    }
    // a leaf on a twig at t along it, angled off it toward side s
    function leafOn(P, t, s, j) {
      var m = bez(P, t);
      var md = dir(P, t);
      leafSpots.push({ x: m[0], y: m[1], a: (Math.atan2(md[1], md[0]) * 180) / Math.PI - s * (40 + rnd(j * 3.7) * 30) });
    }
    [0.16, 0.28, 0.4, 0.52, 0.63, 0.74, 0.84, 0.93].forEach(function (t, j) {
      var c = trunk[Math.round(t * N)];
      var s = (j % 2 ? -1 : 1) * side;
      var len = (38 + rnd(j * 3.3 + k * 5) * 30) * (1 - t * 0.45);
      var a = 0.85 + rnd(j * 7.1 + k) * 0.35;
      var twig = shoot(c, s * a, len, s);
      for (var tries = 0; !inside(twig) && tries < 6; tries++) {
        if (tries === 0) s = -s; // no room on this side: the other
        else len *= 0.8;
        twig = shoot(c, s * a, len, s);
      }
      var C = limbAlong(twig, 16, Math.max(1.8, c.w * 0.5), 0.8, j * 13 + k * 7, 0, 0);
      limbs.push(C);
      tips.push({ x: twig[3][0], y: twig[3][1] });
      leafOn(twig, 0.5, s, j + k * 20);
      leafOn(twig, 0.8, -s, j + k * 20 + 5);
      // every other twig forks
      if (j % 2 === 0 && len > 26) {
        var f = C[10];
        var fork = shoot(f, -s * 0.6, len * 0.45, -s);
        if (inside(fork)) {
          limbs.push(limbAlong(fork, 10, Math.max(1.2, f.w * 0.7), 0.6, j * 17 + k * 3, 0, 0));
          leafOn(fork, 0.95, s, j + k * 20 + 9);
        }
      }
    });
    // and leaves at the top
    var tt = trunk[N];
    leafSpots.push({ x: tt.x, y: tt.y, a: -90 + side * 20 });
    leafSpots.push({ x: tt.x, y: tt.y + 6, a: -90 - side * 50 });

    // Roots, spreading out at its foot
    [-1, 1].forEach(function (s, j) {
      var b = trunk[0];
      var rootCurve = [
        [b.x, b.y - 3],
        [b.x + s * 7, b.y + 1],
        [b.x + s * 16, b.y + 4],
        [b.x + s * (24 + j * 5), b.y + 7],
      ];
      limbs.push(limbAlong(rootCurve, 10, 6, 0.8, 300 + j + k * 3, 0, 0));
    });

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'adv-branch');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-hidden', 'true');
    var id = 'adv-bark-' + k;
    var clip = add('clipPath', { id: id }, add('defs', {}, svg));
    limbs.forEach(function (C) {
      add('path', { d: strip(C, -0.5, 0.5) }, clip);
    });
    // a dark edge all round, then the wood over it
    limbs.forEach(function (C) {
      add('path', { d: strip(C, -0.5, 0.5), fill: 'none', stroke: '#03122e', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, svg);
    });
    limbs.forEach(function (C) {
      add('path', { d: strip(C, -0.5, 0.5), fill: '#103d84' }, svg);
    });
    // the bark: lit down one side, shaded down the other, with furrows, ridges and knots
    var bark = add('g', { 'clip-path': 'url(#' + id + ')' }, svg);
    limbs.forEach(function (C) {
      add('path', { d: strip(C, -0.44, -0.04), fill: '#4a92ea', opacity: 0.6 }, bark);
      add('path', { d: strip(C, -0.32, -0.16), fill: '#a6d1ff', opacity: 0.4 }, bark);
      add('path', { d: strip(C, 0.16, 0.5), fill: '#041638', opacity: 0.65 }, bark);
    });
    [-0.38, -0.24, -0.1, 0.04, 0.18, 0.32].forEach(function (f, j) {
      var dash = [];
      for (var q = 0; q < 14; q++) dash.push((4 + rnd(j * 5 + q + k * 11) * 20).toFixed(1), (1.5 + rnd(j * 7 + q * 3 + k) * 5).toFixed(1));
      add(
        'path',
        {
          d: furrow(trunk, f, j * 31 + k * 17, 0.12),
          fill: 'none',
          stroke: '#03122e',
          'stroke-width': j % 2 ? 0.7 : 1.1,
          'stroke-opacity': 0.85,
          'stroke-dasharray': dash.join(' '),
          'stroke-linecap': 'round',
        },
        bark
      );
    });
    [-0.26, -0.08, 0.08].forEach(function (f, j) {
      add(
        'path',
        {
          d: furrow(trunk, f, j * 53 + k * 29, 0.1),
          fill: 'none',
          stroke: '#9cccff',
          'stroke-width': 0.6,
          'stroke-opacity': 0.4,
          'stroke-dasharray': '9 6 3 8 14 5',
          'stroke-linecap': 'round',
        },
        bark
      );
    });
    [0.26, 0.52, 0.75].forEach(function (t, j) {
      var c = trunk[Math.round(t * N)];
      var o = (rnd(j * 9 + k) - 0.5) * 0.3 * c.w;
      var cx = c.x + c.nx * o;
      var cy = c.y + c.ny * o;
      var a = (Math.atan2(c.ty, c.tx) * 180) / Math.PI;
      add(
        'ellipse',
        {
          cx: cx.toFixed(1),
          cy: cy.toFixed(1),
          rx: (c.w * 0.34).toFixed(1),
          ry: (c.w * 0.2).toFixed(1),
          transform: 'rotate(' + a.toFixed(1) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')',
          fill: '#03122e',
          stroke: '#6aa6f0',
          'stroke-width': 0.6,
          'stroke-opacity': 0.55,
        },
        bark
      );
    });
    // leaves still on the branch
    leafSpots.forEach(function (l, j) {
      var g = add(
        'g',
        { transform: 'translate(' + l.x.toFixed(1) + ' ' + l.y.toFixed(1) + ') rotate(' + l.a.toFixed(1) + ') translate(8 0) scale(' + (0.75 + rnd(j + k * 9) * 0.3).toFixed(2) + ')' },
        svg
      );
      add('path', { d: LEAF, fill: ['#3d86e4', '#4f97ee', '#3577d6'][j % 3], stroke: '#0a2f6e', 'stroke-width': 0.7 }, g);
      add('path', { d: 'M-9 0 Q0 -0.8 8 0', fill: 'none', stroke: '#0f3f8c', 'stroke-width': 0.6 }, g);
    });

    col.insertBefore(svg, col.firstChild);
    return tips;
  }

  // ---- The leaves, falling ----

  var falling = []; // for each leaf: where it falls from and how, and whether it is held still or plucked
  var running = false;

  function setup() {
    var now = performance.now();
    falling = [];
    cols.forEach(function (col, k) {
      var tips = grow(col, k);
      if (!tips.length) return;
      var mine = Array.prototype.slice.call(col.querySelectorAll('.adv-leaf'));
      mine.forEach(function (leaf, j) {
        var i = leaves.indexOf(leaf);
        var T = 13000 + rnd(i * 4.7 + 3) * 6000; // a fall takes 13 to 19 seconds
        falling[i] = {
          leaf: leaf,
          svg: leaf.querySelector('svg'),
          W: col.clientWidth,
          from: tips[(j * 2 + k) % tips.length],
          to: col.clientHeight - 16,
          T: T,
          start: now - (j / mine.length + rnd(i * 2.9) * 0.12) * T, // spread down the fall
          rest: (j + 0.5) / mine.length, // where it rests, when nothing moves
          amp: 10 + rnd(i * 2.1) * 12,
          freq: 1.3 + rnd(i * 5.3) * 1.1,
          phase: rnd(i * 8.9) * 6.28,
          drift: (rnd(i * 3.9) - 0.5) * 34,
          turn: -30 + rnd(i * 6.1) * 60,
          held: 0,
        };
      });
    });
  }

  function place(f, now) {
    var p;
    if (still.matches) p = 0.08 + f.rest * 0.8;
    else {
      p = ((f.held || now) - f.start) / f.T;
      p -= Math.floor(p);
    }
    var swing = Math.sin(2 * Math.PI * f.freq * p + f.phase);
    var off = Math.min(1, p * 8); // the swaying grows as it leaves the twig
    var x = f.from.x + (f.amp * swing + f.drift * p) * off;
    x = Math.max(12, Math.min(f.W - 12, x));
    var y = f.from.y + p * (f.to - f.from.y);
    var turn = f.turn + 40 * Math.sin(2 * Math.PI * f.freq * p + f.phase + 0.8) * off;
    var fade = still.matches ? 1 : p < 0.04 ? p / 0.04 : p > 0.93 ? (1 - p) / 0.07 : 1;
    f.leaf.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    f.leaf.style.opacity = fade.toFixed(2);
    f.svg.style.transform = 'rotate(' + turn.toFixed(1) + 'deg)';
  }

  function frame(now) {
    if (!wide.matches) {
      running = false;
      return;
    }
    falling.forEach(function (f) {
      if (f) place(f, now);
    });
    requestAnimationFrame(frame);
  }

  function start() {
    hide(false);
    if (wide.matches) {
      setup();
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    } else {
      // in the box: a row, as they are in the page
      cols.forEach(function (col) {
        var b = col.querySelector('.adv-branch');
        if (b) b.remove();
      });
      leaves.forEach(function (leaf) {
        leaf.style.transform = '';
        leaf.style.opacity = '';
        leaf.querySelector('svg').style.transform = '';
      });
      falling = [];
    }
  }

  // Held still under the pointer, or with the focus
  function hold(i) {
    var f = falling[i];
    if (f && !f.held) f.held = performance.now();
  }

  function release(i) {
    var f = falling[i];
    if (f && f.held) {
      f.start += performance.now() - f.held;
      f.held = 0;
    }
  }

  // ---- The photo out of a leaf, above where it was ----

  var out = null; // { i, leaf, fig }

  function reveal(i, r, keyed) {
    var leaf = leaves[i];
    var pw = +leaf.getAttribute('data-w');
    var ph = +leaf.getAttribute('data-h');
    var fig = document.createElement('figure');
    fig.className = 'adv-reveal';
    fig.setAttribute('role', 'dialog');
    fig.setAttribute('aria-label', label(i));
    fig.innerHTML =
      '<button type="button" class="adv-close" aria-label="Close the photo">×</button>' +
      '<a title="Show it large"><img alt=""></a>';
    var link = fig.querySelector('a');
    link.href = leaf.getAttribute('data-src');
    var img = fig.querySelector('img');
    img.src = leaf.getAttribute('data-src');
    img.alt = leaf.getAttribute('data-alt');
    img.width = pw;
    img.height = ph;

    // As wide as the column and a little more, and no taller than the window leaves room for
    var col = leaf.parentNode.getBoundingClientRect();
    var nav = document.getElementById('navbar');
    var top0 = (nav ? nav.getBoundingClientRect().bottom : 0) + 10;
    var room = window.innerHeight - top0 - 10;
    var w = Math.round(Math.min(330, Math.max(210, col.width + 70)));
    fig.style.width = w + 'px';
    fig.style.visibility = 'hidden';
    document.body.appendChild(fig);
    var h = fig.offsetHeight;
    if (h > room) {
      var extra = h - (w - 14) * (ph / pw); // the padding
      w = Math.max(150, Math.floor(((room - extra) * pw) / ph + 14));
      fig.style.width = w + 'px';
      h = fig.offsetHeight;
    }
    // Its bottom where the leaf was, and over the leaf's column
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
    var top = Math.max(top0, Math.min(window.innerHeight - h - 10, cy - h));
    fig.style.left = left + 'px';
    fig.style.top = top + 'px';
    fig.style.transformOrigin = cx - left + 'px ' + (cy - top) + 'px';
    fig.style.visibility = '';

    out = { i: i, leaf: leaf, fig: fig };
    fig.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.adv-close')) {
        hide(true);
      } else if (e.target.closest('a')) {
        e.preventDefault();
        openLarge(i, link);
      }
    });
    if (keyed) link.focus({ preventScroll: true });
  }

  // Puts the photo away, and sends its leaf back to its twig to fall again
  function hide(focus) {
    if (!out) return;
    var o = out;
    out = null;
    var gone = function () {
      if (o.fig.parentNode) o.fig.remove();
    };
    if (still.matches) gone();
    else {
      o.fig.classList.add('is-closing');
      setTimeout(gone, 240);
    }
    o.leaf.classList.remove('is-plucked');
    var f = falling[o.i];
    if (f) {
      f.held = 0;
      f.start = performance.now();
    }
    if (focus) o.leaf.focus({ preventScroll: true });
  }

  leaves.forEach(function (leaf, i) {
    leaf.addEventListener('pointerenter', function () {
      hold(i);
    });
    leaf.addEventListener('pointerleave', function () {
      if (document.activeElement !== leaf) release(i);
    });
    leaf.addEventListener('focus', function () {
      hold(i);
    });
    leaf.addEventListener('blur', function () {
      release(i);
    });
    leaf.addEventListener('click', function (e) {
      e.stopPropagation();
      if (leaf.classList.contains('is-plucked')) return;
      var keyed = e.detail === 0; // from the keyboard
      hide(false);
      var r = leaf.getBoundingClientRect();
      if (wide.matches) {
        leaf.classList.add('is-plucked');
        leaf.blur();
        reveal(i, r, keyed);
      } else {
        openLarge(i, leaf);
      }
    });
  });

  document.addEventListener('click', function () {
    hide(false);
  });

  document.addEventListener('keydown', function (e) {
    if (!view.hidden) {
      if (e.key === 'Escape') closeLarge();
      else if (e.key === 'ArrowLeft') show(at - 1);
      else if (e.key === 'ArrowRight') show(at + 1);
    } else if (e.key === 'Escape' && out) {
      hide(true);
    }
  });

  var timer;
  window.addEventListener('resize', function () {
    hide(false);
    clearTimeout(timer);
    timer = setTimeout(start, 150);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else start();
})();
