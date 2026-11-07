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
  // An open bubble goes over the footer: the page content is raised above it while one is open
  var page = hero.closest('.main-content');
  function raise(on) { if (page) page.classList.toggle('wm-raised', on); }
  function closeAll() {
    pops.forEach(function (p) { p.hidden = true; });
    nodes.forEach(function (n) { n.classList.remove('is-open'); });
    raise(false);
  }
  nodes.forEach(function (node) {
    function toggle() {
      var pop = hero.querySelector('.wm-pop[data-for="' + node.getAttribute('data-wm') + '"]');
      var wasOpen = pop && !pop.hidden;
      closeAll();
      if (pop && !wasOpen) { pop.hidden = false; node.classList.add('is-open'); raise(true); }
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
    if (pop && node) { pop.hidden = false; node.classList.add('is-open'); raise(true); }
    hero.scrollIntoView({ block: 'center' });
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // Inside the brain, activation in voxels as in an fMRI scan: clusters of voxels light up in dodger blue, light coral or
  // medium sea green, rising and falling slowly (as blood flow does) and drifting a little, each then lighting up
  // somewhere else. Each voxel shows the strongest cluster over it, above a threshold, a little unevenly, as real maps
  // are. Drawn about 12 times a second while the brain is on screen; a single still frame for people who ask for less
  // motion
  function voxels(svg, still) {
    var layer = svg && svg.querySelector('.wm-voxels');
    var outline = svg && svg.querySelector('.wm-outline');
    if (!layer || !outline || !window.Path2D) return;
    var NS = 'http://www.w3.org/2000/svg';
    var SIZE = 20; // a voxel, in the graphic's units (it is 880 x 572, from x = 50)
    var COLOURS = ['#1e90ff', '#f08080', '#3cb371']; // dodger blue, light coral, medium sea green
    var CLUSTERS = 9;
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
        r.setAttribute('x', x + 1);
        r.setAttribute('y', y + 1);
        r.setAttribute('width', SIZE - 2);
        r.setAttribute('height', SIZE - 2);
        r.setAttribute('fill-opacity', 0);
        layer.appendChild(r);
        cells.push({ el: r, x: x + c, y: y + c, bias: (Math.random() - 0.5) * 0.3, phase: Math.random() * 6.3, k: -1, a: 0 });
      }
    }
    if (!cells.length) return;
    // A cluster: where it is, how wide, its colour, and when it rises and falls
    function spawn(b, t) {
      var at = cells[Math.floor(Math.random() * cells.length)];
      b.x = at.x;
      b.y = at.y;
      b.r = 30 + Math.random() * 36;
      b.k = Math.floor(Math.random() * COLOURS.length);
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
        b.e = Math.pow(Math.sin(Math.PI * u), 1.5);
        b.cx = b.x + b.vx * (t - b.t0);
        b.cy = b.y + b.vy * (t - b.t0);
      });
      cells.forEach(function (cell) {
        var best = 0;
        var k = -1;
        blobs.forEach(function (b) {
          var dx = cell.x - b.cx;
          var dy = cell.y - b.cy;
          var v = b.e * Math.exp(-(dx * dx + dy * dy) / (2 * b.r * b.r));
          if (v > best) {
            best = v;
            k = b.k;
          }
        });
        var v = best * (1 + cell.bias) + 0.05 * Math.sin(t * 2.2 + cell.phase);
        var a = v < 0.18 ? 0 : Math.round((0.4 + 0.6 * Math.min(1, (v - 0.18) / 0.5)) * 20) / 20;
        if (a !== cell.a) {
          cell.el.setAttribute('fill-opacity', a);
          cell.a = a;
        }
        if (a && k !== cell.k) {
          cell.el.setAttribute('fill', COLOURS[k]);
          cell.k = k;
        }
      });
    }
    if (still) {
      draw(3);
      return;
    }
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
