// Home-page world-model hero: click (or press Enter/Space on) a part of the diagram to open its explanation bubble.
// A link to #wm-model, #wm-self, #wm-world, #wm-goals or #wm-tasks (as in the cards on the drawings beside the text)
// opens that part
(function () {
  var hero = document.querySelector('.wm-hero');
  if (!hero) return;
  // The colours in the brain, and everything else moving in it, hold still for people who ask for less motion
  var svg = hero.querySelector('svg');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (svg && still) svg.pauseAnimations();
  voxels(svg, still);
  var nodes = hero.querySelectorAll('.wm-node');
  var pops = hero.querySelectorAll('.wm-pop');
  function closeAll() {
    pops.forEach(function (p) { p.hidden = true; });
    nodes.forEach(function (n) { n.classList.remove('is-open'); });
  }
  nodes.forEach(function (node) {
    function toggle() {
      var pop = hero.querySelector('.wm-pop[data-for="' + node.getAttribute('data-wm') + '"]');
      var wasOpen = pop && !pop.hidden;
      closeAll();
      if (pop && !wasOpen) { pop.hidden = false; node.classList.add('is-open'); }
    }
    node.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  hero.querySelectorAll('.wm-close').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); closeAll(); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.wm-pop')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  function fromHash() {
    var m = location.hash.match(/^#wm-(model|self|world|goals|tasks)$/);
    if (!m) return;
    var pop = hero.querySelector('.wm-pop[data-for="' + m[1] + '"]');
    var node = hero.querySelector('.wm-node[data-wm="' + m[1] + '"]');
    closeAll();
    if (pop && node) { pop.hidden = false; node.classList.add('is-open'); }
    hero.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // Inside the brain, activation in voxels as in an fMRI scan: every voxel is coloured on a scale from dodger blue (low)
  // through medium sea green to light coral (high), blended through the hues between them so the colours stay clear,
  // its brightness varying a little. Over a low, uneven background,
  // clusters of activation rise and fall slowly (as blood flow does) and drift a little, each then rising somewhere
  // else. Drawn about 12 times a second while the brain is on screen; a single still frame for people who ask for less
  // motion
  function voxels(svg, still) {
    var layer = svg && svg.querySelector('.wm-voxels');
    var outline = svg && svg.querySelector('.wm-outline');
    if (!layer || !outline || !window.Path2D) return;
    var NS = 'http://www.w3.org/2000/svg';
    var SIZE = 24; // a voxel, in the graphic's units (it is 880 x 572, from x = 50)
    var SCALE = [[210, 100, 56], [147, 50, 47], [0, 79, 72]]; // dodger blue, medium sea green, light coral (hue, saturation, lightness)
    var CLUSTERS = 10;
    var shape = new Path2D(outline.getAttribute('d'));
    var g = document.createElement('canvas').getContext('2d');
    // The outline is drawn at translate(-11 -27) scale(4.6 4.1)
    function inside(x, y) {
      return g.isPointInPath(shape, (x + 11) / 4.6, (y + 27) / 4.1);
    }
    var cells = [];
    for (var y = 0; y < 572; y += SIZE) {
      for (var x = 50; x < 930; x += SIZE) {
        var c = SIZE / 2;
        if (!(inside(x + c, y + c) || inside(x + 2, y + 2) || inside(x + SIZE - 2, y + 2) || inside(x + 2, y + SIZE - 2) || inside(x + SIZE - 2, y + SIZE - 2))) continue;
        var r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', x);
        r.setAttribute('y', y);
        r.setAttribute('width', SIZE);
        r.setAttribute('height', SIZE);
        layer.appendChild(r);
        cells.push({ el: r, x: x + c, y: y + c, bias: (Math.random() - 0.5) * 0.1, phase: Math.random() * 6.3, glow: Math.random() * 6.3, fill: '' });
      }
    }
    if (!cells.length) return;
    // Activation v (0 to 1) on the colour scale, made lighter or darker by k
    function colour(v, k) {
      var i = v < 0.5 ? 0 : 1;
      var u = Math.min(1, v * 2 - i);
      var a = SCALE[i];
      var b = SCALE[i + 1];
      var h = Math.round(a[0] + (b[0] - a[0]) * u);
      var s = Math.round(a[1] + (b[1] - a[1]) * u);
      var l = Math.round(a[2] + (b[2] - a[2]) * u + k);
      return 'hsl(' + h + ',' + s + '%,' + l + '%)';
    }
    // A cluster: where it is, how wide and how strong, and when it rises and falls
    function spawn(b, t) {
      var at = cells[Math.floor(Math.random() * cells.length)];
      b.x = at.x;
      b.y = at.y;
      b.r = 34 + Math.random() * 40;
      b.amp = 0.6 + Math.random() * 0.4;
      b.t0 = t;
      b.dur = 5 + Math.random() * 4;
      b.vx = (Math.random() - 0.5) * 8;
      b.vy = (Math.random() - 0.5) * 8;
    }
    var blobs = [];
    for (var i = 0; i < CLUSTERS; i++) blobs.push({});
    function draw(t) {
      blobs.forEach(function (b) {
        // At first (or after time away), each cluster is caught at a random point in its rise and fall
        if (b.t0 === undefined || t - b.t0 > 2 * b.dur) {
          spawn(b, t);
          b.t0 = t - Math.random() * b.dur;
        } else if (t - b.t0 > b.dur) spawn(b, t);
        var u = (t - b.t0) / b.dur;
        b.e = b.amp * Math.pow(Math.sin(Math.PI * u), 1.5);
        b.cx = b.x + b.vx * (t - b.t0);
        b.cy = b.y + b.vy * (t - b.t0);
      });
      cells.forEach(function (cell) {
        var v = 0.16 + cell.bias + 0.06 * Math.sin(t * 0.9 + cell.phase);
        blobs.forEach(function (b) {
          var dx = cell.x - b.cx;
          var dy = cell.y - b.cy;
          v += b.e * Math.exp(-(dx * dx + dy * dy) / (2 * b.r * b.r));
        });
        v = Math.round(Math.max(0, Math.min(1, v)) * 40) / 40;
        var k = Math.round(5 * Math.sin(t * 0.7 + cell.glow));
        var f = colour(v, k);
        if (f !== cell.fill) {
          cell.el.setAttribute('fill', f);
          cell.fill = f;
        }
      });
    }
    if (still) {
      draw(3);
      return;
    }
    draw(performance.now() / 1000);
    var seen = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        seen = es[0].isIntersecting;
      }).observe(svg);
    }
    var last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!seen || document.hidden || now - last < 80) return;
      last = now;
      draw(now / 1000);
    }
    requestAnimationFrame(frame);
  }
})();
