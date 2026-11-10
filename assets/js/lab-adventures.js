// Lab Adventures (team page): a string of Christmas lights hung down either side of the box (on windows with room
// there), looping from hook to hook, with "Lab Adventures" written into the left one's cable at the top and a tiny light
// for each photo. Nothing moves. A click on a light shows its photo above it; the photo opens large when clicked, and
// the ×, a click elsewhere or Escape puts it away. In the box (narrower windows) the lights are a row and open their
// photos large straight away. Large, the arrows (or the arrow keys) step through the photos, and a click beside the
// photo, the close button or Escape closes it
(function () {
  'use strict';

  var lights = Array.prototype.slice.call(document.querySelectorAll('.adv-light'));
  if (!lights.length) return;
  var cols = Array.prototype.slice.call(document.querySelectorAll('.adventure-col'));

  // The same test as $side-cols in _sass/_base.scss: whether the lights hang either side of the box
  var wide = window.matchMedia('(min-width: 1240px) and (min-height: 560px)');
  var NS = 'http://www.w3.org/2000/svg';

  function label(i) {
    return lights[i].getAttribute('data-label');
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
    at = (i + lights.length) % lights.length;
    big.src = lights[at].getAttribute('data-src');
    big.alt = lights[at].getAttribute('data-alt');
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
    e.stopPropagation(); // (so it does not also close the photo out of a light)
    if (e.target.closest('.pv-prev')) show(at - 1);
    else if (e.target.closest('.pv-next')) show(at + 1);
    else if (e.target !== big) closeLarge();
  });

  // ---- The cable and its lights ----

  function add(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  // A steady pseudo-random number for a seed, so the lights hang the same way each time
  function rnd(n) {
    var x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // A loop of cable hanging between two hooks: a curve that sags below the line between them
  function loop(a, b, sag) {
    var mx = (a[0] + b[0]) / 2;
    var my = (a[1] + b[1]) / 2 + sag;
    return { a: a, q: [mx, 2 * my - (a[1] + b[1]) / 2], b: b };
  }

  function point(l, t) {
    var u = 1 - t;
    return [u * u * l.a[0] + 2 * u * t * l.q[0] + t * t * l.b[0], u * u * l.a[1] + 2 * u * t * l.q[1] + t * t * l.b[1]];
  }

  // Hangs column col's cable (k: 0 on the left, 1 on the right, mirrored) and its lights along it
  function hang(col, k) {
    var old = col.querySelector('.adv-cable');
    if (old) old.remove();
    var mine = Array.prototype.slice.call(col.querySelectorAll('.adv-light'));
    if (!wide.matches) {
      mine.forEach(function (l) {
        l.style.left = l.style.top = l.style.transform = '';
      });
      return;
    }
    var W = col.clientWidth;
    var H = col.clientHeight;
    if (!W || !H) return;
    var near = k ? W - 26 : 26; // the hooks on the side away from the box first
    var far = k ? 26 : W - 26;
    var top = 34;
    var words = col.getAttribute('data-cable-label');
    // The hooks: two level at the top (the loop with the words in it), then zigzagging down
    var rows = 3;
    var step = (H - 40 - top) / rows;
    var hooks = [[near, top], [far, top]];
    for (var r = 1; r <= rows; r++) hooks.push([r % 2 ? near : far, top + r * step]);
    var loops = [];
    for (var h = 0; h < hooks.length - 1; h++) loops.push(loop(hooks[h], hooks[h + 1], h === 0 ? 22 : 30));

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'adv-cable');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-hidden', 'true');
    var d = loops
      .map(function (l, n) {
        return (n ? '' : 'M' + l.a[0] + ' ' + l.a[1]) + ' Q' + l.q[0].toFixed(1) + ' ' + l.q[1].toFixed(1) + ' ' + l.b[0] + ' ' + l.b[1];
      })
      .join('');
    // the cable: two wires twisted together
    add('path', { d: d, fill: 'none', stroke: '#06142e', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    add('path', { d: d, fill: 'none', stroke: '#2f5fa6', 'stroke-width': 1.2, 'stroke-dasharray': '2.6 3.2', 'stroke-linecap': 'round' }, svg);
    // the hooks it hangs from
    hooks.forEach(function (p) {
      add('circle', { cx: p[0], cy: p[1] - 1, r: 3.2, fill: '#dbe6f7', stroke: '#06142e', 'stroke-width': 1.2 }, svg);
    });
    // the words, written into the top loop (the cable's colour cut away behind the letters)
    if (words) {
      var l0 = loops[0];
      var id = 'adv-cable-words-' + k;
      add('path', { id: id, d: 'M' + l0.a[0] + ' ' + l0.a[1] + ' Q' + l0.q[0] + ' ' + l0.q[1] + ' ' + l0.b[0] + ' ' + l0.b[1], fill: 'none' }, svg);
      var text = add('text', { class: 'adv-cable-words', dy: '4.5' }, svg);
      var tp = add('textPath', { href: '#' + id, startOffset: '50%', 'text-anchor': 'middle' }, text);
      tp.textContent = words;
    }
    col.insertBefore(svg, col.firstChild);

    // The lights, spaced evenly along the loops below the words (along all of them where there are none)
    var from = words ? 1 : 0;
    var pts = [];
    var total = 0;
    for (var n = from; n < loops.length; n++) {
      var prev = point(loops[n], 0);
      for (var s = 1; s <= 60; s++) {
        var p = point(loops[n], s / 60);
        total += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        pts.push({ x: p[0], y: p[1], at: total });
        prev = p;
      }
    }
    mine.forEach(function (light, j) {
      var want = ((j + 0.5) / mine.length) * total;
      var q = pts[0];
      for (var m = 0; m < pts.length && pts[m].at < want; m++) q = pts[m];
      light.style.left = q.x.toFixed(1) + 'px';
      light.style.top = q.y.toFixed(1) + 'px';
      light.style.transform = 'rotate(' + ((rnd(j * 3.1 + k * 7) - 0.5) * 24).toFixed(1) + 'deg)';
    });
  }

  function hangAll() {
    hide();
    cols.forEach(hang);
  }

  // ---- The photo out of a light, above it ----

  var out = null; // { i, light, fig }

  function reveal(i, keyed) {
    var light = lights[i];
    var r = light.getBoundingClientRect();
    var pw = +light.getAttribute('data-w');
    var ph = +light.getAttribute('data-h');
    var fig = document.createElement('figure');
    fig.className = 'adv-reveal';
    fig.setAttribute('role', 'dialog');
    fig.setAttribute('aria-label', label(i));
    fig.innerHTML =
      '<button type="button" class="adv-close" aria-label="Close the photo">×</button>' +
      '<a title="Show it large"><img alt=""></a>';
    var link = fig.querySelector('a');
    link.href = light.getAttribute('data-src');
    var img = fig.querySelector('img');
    img.src = light.getAttribute('data-src');
    img.alt = light.getAttribute('data-alt');
    img.width = pw;
    img.height = ph;

    // As wide as the column and a little more, and no taller than the window leaves room for
    var col = light.parentNode.getBoundingClientRect();
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
    // Its bottom just above the light, over the light's column
    var cx = r.left + r.width / 2;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, cx - w / 2));
    var top = Math.max(top0, Math.min(window.innerHeight - h - 10, r.top - h - 6));
    fig.style.left = left + 'px';
    fig.style.top = top + 'px';
    fig.style.visibility = '';
    light.classList.add('is-on');

    out = { i: i, light: light, fig: fig };
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

  function hide(focus) {
    if (!out) return;
    var o = out;
    out = null;
    o.fig.remove();
    o.light.classList.remove('is-on');
    if (focus) o.light.focus({ preventScroll: true });
  }

  lights.forEach(function (light, i) {
    light.addEventListener('click', function (e) {
      e.stopPropagation();
      var again = out && out.i === i;
      hide(false);
      if (again) return; // a second click on the light puts its photo away
      if (wide.matches) reveal(i, e.detail === 0);
      else openLarge(i, light);
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
    timer = setTimeout(hangAll, 150);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hangAll);
  else hangAll();
})();
